#!/usr/bin/env python3
"""Read-only, topic-neutral consistency checks for finder sessions."""

from __future__ import annotations

import argparse
import re
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlparse

from memory import frontmatter as read_frontmatter
from shape import owes_listings, shape


# Status is `sources` · `criteria` · `run` · `next-steps` · `done`, then
# the name of whatever next-step output ran. Output names are an open set by design,
# so a post-run status is checked for shape rather than against a list.
PRE_RUN_STATUSES = {"sources", "criteria"}
FIXED_STATUSES = PRE_RUN_STATUSES | {"run", "next-steps", "done"}
STATUS_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")
VALID_SOURCE_STATUSES = {"ok", "blocked", "error", "untested"}
VALID_METHODS = {"feed", "page", "blocked"}
VALID_MANUAL = {"checked", "partial", "unavailable", "—", "-", ""}
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
LINK_RE = re.compile(r"\[[^\]]+\]\((https?://[^)]+)\)")
TICK_RE = re.compile(r"^- \[([ x])\] .+<!--\s*identity:\s*(.+?)\s*-->\s*$")
# A `page` source is read by hand, so nothing in the pipeline proves it happened: the
# row still says `ok` and listings.md simply has no rows from it. The evidence is one
# of two shapes, and this is what the check looks for (workflows/03-run.md -> 1).
PAGE_MARKER = "## page sources"
PAGE_NOT_READ = "page not read"

# Tick accounting is deterministic here: validate the hidden identities, compare
# the header counts with the actual task-list rows, and refuse a row-based next step
# that ran against zero selected inputs.


@dataclass
class Audit:
    slug: str
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    def error(self, message: str) -> None:
        self.errors.append(message)

    def warn(self, message: str) -> None:
        self.warnings.append(message)


def find_repo_root(start: Path) -> Path:
    current = start.resolve()
    for candidate in (current, *current.parents):
        if (candidate / "AGENTS.md").is_file():
            return candidate
    raise FileNotFoundError("could not find AGENTS.md while searching upward")


def read_text(path: Path, audit: Audit, required: bool = True) -> str:
    if not path.is_file():
        if required:
            audit.error(f"missing {path.name}")
        return ""
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        audit.error(f"{path.name} is not valid UTF-8")
        return ""


def parse_frontmatter(text: str, audit: Audit) -> dict[str, str]:
    """The repo's one reader (tools/memory.py); here a bad block is an audit error."""
    values, errors, _ = read_frontmatter(text)
    for message in errors:
        audit.error(message)
    return values


def split_table_row(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def is_separator(cells: list[str]) -> bool:
    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells)


def parse_source_table(text: str, audit: Audit) -> tuple[list[dict[str, str]], list[str]]:
    lines = text.splitlines()
    for index, line in enumerate(lines):
        if not line.lstrip().startswith("|"):
            continue
        headers = [cell.lower() for cell in split_table_row(line)]
        if "name" not in headers or "url" not in headers or "method" not in headers:
            continue
        rows: list[dict[str, str]] = []
        for row_line in lines[index + 1 :]:
            if not row_line.lstrip().startswith("|"):
                if rows:
                    break
                continue
            cells = split_table_row(row_line)
            if is_separator(cells):
                continue
            if len(cells) != len(headers):
                audit.error(
                    f"sources.md row has {len(cells)} cells; expected {len(headers)}: {row_line}"
                )
                continue
            rows.append(dict(zip(headers, cells)))
        return rows, headers
    audit.error("sources.md has no recognizable source table")
    return [], []


def normalized_host(url: str) -> str:
    host = (urlparse(url).hostname or "").lower()
    return host[4:] if host.startswith("www.") else host


def date_or_dash(value: str) -> bool:
    return value in {"", "—", "-"} or bool(DATE_RE.fullmatch(value))


def artifact_run_date(path: Path, pattern: str) -> str:
    if not path.is_file():
        return ""
    text = path.read_text(encoding="utf-8", errors="replace")
    match = re.search(pattern, text, re.MULTILINE)
    return match.group(1) if match else ""


def audit_sources(text: str, audit: Audit) -> tuple[int, int, set[str]]:
    rows, headers = parse_source_table(text, audit)
    required = {"name", "type", "url", "method", "status", "last checked", "why"}
    missing = sorted(required - set(headers))
    if missing:
        audit.error(f"sources.md is missing columns: {', '.join(missing)}")

    has_manual = {"manual status", "manual checked"}.issubset(headers)
    if not has_manual:
        audit.warn("sources.md uses the legacy table without manual-check columns")

    seen_urls: set[str] = set()
    hosts: set[str] = set()
    page_ok: list[str] = []
    blocked = 0
    for row_number, row in enumerate(rows, start=1):
        label = row.get("name") or f"row {row_number}"
        method = row.get("method", "").split(" ", 1)[0].lower()
        status = row.get("status", "").lower()
        url = row.get("url", "")
        checked = row.get("last checked", "")

        if method not in VALID_METHODS:
            audit.error(f"{label}: unknown method {row.get('method')!r}")
        if status not in VALID_SOURCE_STATUSES:
            audit.error(f"{label}: unknown status {status!r}")
        if method == "blocked":
            blocked += 1
            if status != "blocked":
                audit.error(f"{label}: blocked method must keep blocked status")
        if method == "page" and status == "ok":
            page_ok.append(label)
        if not date_or_dash(checked):
            audit.error(f"{label}: invalid last checked date {checked!r}")
        if urlparse(url).scheme not in {"http", "https"}:
            audit.error(f"{label}: source URL must be HTTP(S): {url!r}")
        host = normalized_host(url)
        if host:
            hosts.add(host)
        if url in seen_urls:
            audit.warn(f"{label}: duplicate source URL {url}")
        seen_urls.add(url)

        if has_manual:
            manual = row.get("manual status", "")
            manual_date = row.get("manual checked", "")
            if manual not in VALID_MANUAL:
                audit.error(f"{label}: unknown manual status {manual!r}")
            if not date_or_dash(manual_date):
                audit.error(f"{label}: invalid manual checked date {manual_date!r}")
            if manual in {"checked", "partial", "unavailable"} and not DATE_RE.fullmatch(
                manual_date
            ):
                audit.error(f"{label}: manual status {manual!r} needs a manual checked date")
            if method != "blocked" and manual not in {"", "—", "-"}:
                audit.warn(f"{label}: manual status is normally only used for blocked sources")

    audit.notes.append(f"{len(rows)} sources · {blocked} blocked")
    return len(rows), blocked, hosts, page_ok


def audit_result_links(text: str, source_hosts: set[str], audit: Audit) -> None:
    """Only meaningful for a brief.

    A brief attributes every claim to a source, so a domain it cites and the table
    does not list is a real hole. A ledger's links are the *items'* urls, not the
    sources' — a hosted board hands back its own apply domain, and an aggregated row
    links wherever the employer wrote. Warning on those fired on every ledger run, and
    a warning that always fires is one nobody reads.
    """
    result_hosts = {normalized_host(url) for url in LINK_RE.findall(text)}
    result_hosts.discard("")
    uncovered = sorted(result_hosts - source_hosts)
    if uncovered:
        audit.warn("results.md cites domains absent from sources.md: " + ", ".join(uncovered))


def audit_shortlist(text: str, audit: Audit) -> tuple[int, int]:
    total = ticked = 0
    identities: set[str] = set()
    for line in text.splitlines():
        if not line.startswith("- ["):
            continue
        total += 1
        match = TICK_RE.fullmatch(line)
        if not match:
            audit.error("shortlist.md tick has no valid hidden identity marker: " + line)
            continue
        ticked += match.group(1) == "x"
        identity = match.group(2)
        if identity in identities:
            audit.error(f"shortlist.md has duplicate identity {identity!r}")
        identities.add(identity)
    header = re.search(r"^Run\s+\S+\s+·\s+(\d+) rows(?:\s+·\s+\d+ ticked)?", text, re.MULTILINE)
    if not header:
        audit.error("shortlist.md has no recognizable Run date · N rows header")
    elif int(header.group(1)) != total:
        audit.error(f"shortlist.md header reports {header.group(1)} rows; file has {total}")
    audit.notes.append(f"{total} shortlist rows · {ticked} ticked")
    return total, ticked


def audit_shortlist_covers_results(results_text: str, shortlist_text: str, audit: Audit) -> None:
    """Every shortlist row points at a row that is really in results.md.

    Section-blind on purpose. This replaced a check that compared the Run header's
    `N new · N changed · …` against cards counted per section, which hardcoded four
    section names — while workflows/03-run.md explicitly lets a shape rename or drop
    any of them. `tenders` leads with `## closing soon` and `prices` uses `## new
    this week`, so both were told their own header was a lie and neither could
    publish. What that check bought was a stale number in a header; what it cost was
    half the shapes in the repo.

    Identities are the stable thing, so this compares those instead: it catches
    shortlist.py inventing or losing a row, and it cannot care what the headings say.
    `gone` rows legitimately leave the shortlist, so only the one direction is an
    error — a shortlist row with nothing behind it.
    """
    in_results = set(re.findall(r"<!--\s*identity:\s*(.+?)\s*-->", results_text))
    in_shortlist = {
        match.group(2)
        for match in (TICK_RE.fullmatch(line) for line in shortlist_text.splitlines())
        if match
    }
    orphans = sorted(in_shortlist - in_results)
    if orphans:
        shown = ", ".join(orphans[:5]) + ("…" if len(orphans) > 5 else "")
        audit.error(
            f"{len(orphans)} shortlist rows have no row in results.md: {shown}"
        )


def audit_page_coverage(
    folder: Path, page_ok: list[str], results_text: str, audit: Audit
) -> None:
    """Every `page`+`ok` source was either read, or said out loud to be unread.

    Ledger shapes only -- a brief has no listings.md and no pre-filter to sit beside,
    and its own coverage check is audit_result_links.

    This is the one step in a run with no artifact of its own. The script handles
    feeds; a page source is read by hand and its survivors appended to listings.md
    under PAGE_MARKER. Skip that and nothing anywhere changes -- which is how six of
    them went unread in a run that otherwise passed every check here.
    """
    if not page_ok:
        return
    listings = folder / "listings.md"
    block = ""
    if listings.is_file():
        text = listings.read_text(encoding="utf-8", errors="replace")
        _, marker, tail = text.partition(PAGE_MARKER)
        block = tail if marker else ""
    excused = "\n".join(
        line for line in results_text.splitlines() if PAGE_NOT_READ in line.lower()
    )
    if not block and not excused:
        audit.error(
            f"{len(page_ok)} page sources are ok and none was read: no {PAGE_MARKER!r} in "
            f"listings.md and no {PAGE_NOT_READ!r} line in results.md — " + ", ".join(page_ok)
        )
        return
    unaccounted = [n for n in page_ok if n not in block and n not in excused]
    if unaccounted:
        audit.error(
            "page sources neither read nor declared unread: " + ", ".join(unaccounted)
        )


def audit_session(repo: Path, slug: str) -> Audit:
    audit = Audit(slug)
    folder = repo / "sessions" / slug
    if not folder.is_dir():
        audit.error("session folder does not exist")
        return audit
    if slug.startswith("_"):
        audit.error("skeleton folders are not sessions")
        return audit

    memory_text = read_text(folder / "MEMORY.md", audit)
    memory = parse_frontmatter(memory_text, audit) if memory_text else {}
    if memory.get("slug") != slug:
        audit.error(f"MEMORY.md slug is {memory.get('slug')!r}, expected {slug!r}")
    status = memory.get("status", "")
    if not STATUS_RE.fullmatch(status):
        audit.error(f"unknown MEMORY.md status {status!r}")
    if status == "review":
        audit.error("deprecated MEMORY.md status 'review'; published runs move directly to next-steps")
    post_run = status not in FIXED_STATUSES or status in {"next-steps", "done"}
    if not memory.get("shape"):
        audit.error("MEMORY.md has no shape")
    last_run = memory.get("last run", "")
    if not date_or_dash(last_run):
        audit.error(f"invalid MEMORY.md last run date {last_run!r}")
    pending_run = memory.get("pending run", "")
    pending_active = bool(DATE_RE.fullmatch(pending_run))
    if pending_run not in {"", "—", "-"} and not pending_active:
        audit.error(f"invalid MEMORY.md pending run date {pending_run!r}")
    if pending_active and status != "run":
        audit.error("MEMORY.md pending run is only valid while status is run")
    if status == "run" and pending_active:
        audit.notes.append(f"run {pending_run} is in progress; existing results are previous")

    sources_text = read_text(folder / "sources.md", audit, required=status != "sources")
    source_count = blocked_count = 0
    source_hosts: set[str] = set()
    page_ok: list[str] = []
    if sources_text:
        source_count, blocked_count, source_hosts, page_ok = audit_sources(sources_text, audit)
        updated = re.search(r"^Last updated:\s*(\S+)", sources_text, re.MULTILINE)
        if not updated or not DATE_RE.fullmatch(updated.group(1)):
            audit.error("sources.md has no valid Last updated date")

    criteria_required = status not in PRE_RUN_STATUSES
    criteria_text = read_text(folder / "criteria.md", audit, required=criteria_required)
    if criteria_text:
        approved = re.search(r"^Approved:\s*(\S+)", criteria_text, re.MULTILINE)
        if not approved or not DATE_RE.fullmatch(approved.group(1)):
            audit.error("criteria.md has no valid Approved date")
        if not re.search(r"^Last amended:", criteria_text, re.MULTILINE):
            audit.warn("criteria.md predates the Last amended field")

    results_required = DATE_RE.fullmatch(last_run or "") is not None or post_run
    results_text = read_text(folder / "results.md", audit, required=results_required)
    if results_text:
        first_lines = "\n".join(results_text.splitlines()[:12])
        if DATE_RE.fullmatch(last_run or "") and last_run not in first_lines:
            audit.warn("MEMORY.md last run date is not visible near the top of results.md")

        source_match = re.search(
            r"(\d+)\s+(?:approved\s+)?sources\s+(?:checked|read)", first_lines
        )
        if source_match and int(source_match.group(1)) != source_count:
            audit.error(
                f"results.md reports {source_match.group(1)} sources; sources.md has {source_count}"
            )
        blocked_match = re.search(
            r"(\d+)\s+(?:browser-dependent|blocked to automation)", first_lines
        )
        if blocked_match and int(blocked_match.group(1)) != blocked_count:
            audit.error(
                f"results.md reports {blocked_match.group(1)} browser-dependent sources; "
                f"sources.md has {blocked_count} blocked"
            )
        # One coverage check per form, and they are not interchangeable. A brief
        # attributes every claim, so its check is the cited domains. A ledger's rows
        # come from listings.md, so its check is that the hand-read sources reached it.
        # One shape reader for the whole repo: tools/shape.py. A shape whose example
        # is not written yet gets documented defaults rather than three different
        # failures, because AGENTS.md calls that state normal, not a blocker.
        fields = shape(repo, memory.get("shape", ""))
        form = fields["form"]
        if form == "brief":
            audit_result_links(results_text, source_hosts, audit)
        elif form == "ledger":
            audit_page_coverage(folder, page_ok, results_text, audit)

        selection = fields["selection"]
        shortlist_path = folder / "shortlist.md"
        if selection == "rows":
            if not (folder / "tools" / "shortlist.py").is_file():
                audit.error("selection: rows requires tools/shortlist.py")
            shortlist_text = read_text(shortlist_path, audit, required=True)
            _, ticked = audit_shortlist(shortlist_text, audit) if shortlist_text else (0, 0)
            if shortlist_text:
                audit_shortlist_covers_results(results_text, shortlist_text, audit)
            if status not in FIXED_STATUSES and ticked == 0:
                audit.error("a row-based next step ran with zero ticked shortlist rows")
        elif selection == "artifact" and shortlist_path.is_file():
            audit.error("selection: artifact must not write shortlist.md")

        result_date = artifact_run_date(
            folder / "results.md", r"^(?:Run|Prepared)\s+(\d{4}-\d{2}-\d{2})\b"
        )
        listing_date = artifact_run_date(
            folder / "listings.md", r"^# listings\s+—\s+fetched\s+(\d{4}-\d{2}-\d{2})"
        )
        shortlist_date = artifact_run_date(
            shortlist_path, r"^Run\s+(\d{4}-\d{2}-\d{2})\b"
        )
        if post_run and DATE_RE.fullmatch(last_run or ""):
            if result_date != last_run:
                audit.error(
                    f"results.md run date is {result_date or 'missing'}, MEMORY.md last run is {last_run}"
                )
            if owes_listings(fields) and listing_date != last_run:
                audit.error(
                    f"listings.md run date is {listing_date or 'missing'}, MEMORY.md last run is {last_run}"
                )
            if selection == "rows" and shortlist_date != last_run:
                audit.error(
                    f"shortlist.md run date is {shortlist_date or 'missing'}, MEMORY.md last run is {last_run}"
                )

    if status == "next-steps":
        audit.notes.append("GATE 4 is pending; the human has not picked what to make yet")
    elif status == "done":
        audit.notes.append("GATE 4 was answered with nothing to make")
    elif status == "contacts" and not (folder / "contacts.md").is_file():
        audit.notes.append("contacts output is pending; contacts.md does not exist yet")

    return audit


def print_audit(audit: Audit) -> None:
    state = "FAIL" if audit.errors else "OK"
    print(f"{audit.slug}: {state}")
    for note in audit.notes:
        print(f"  note: {note}")
    for warning in audit.warnings:
        print(f"  warning: {warning}")
    for error in audit.errors:
        print(f"  error: {error}")


def selfcheck() -> int:
    with tempfile.TemporaryDirectory() as temp:
        repo = Path(temp)
        (repo / "AGENTS.md").write_text("# rules\n", encoding="utf-8")

        # GATE 1 is a complete, resumable state with only the pointer on disk.
        early = repo / "sessions" / "approved"
        early.mkdir(parents=True)
        (early / "MEMORY.md").write_text(
            "---\nslug: approved\nshape: widgets\nstatus: sources\n"
            "last run: —\n---\n\nnext: propose sources\n",
            encoding="utf-8",
        )
        gate_one = audit_session(repo, "approved")
        if gate_one.errors:
            print_audit(gate_one)
            print("selfcheck: a GATE 1 MEMORY-only session should pass", file=sys.stderr)
            return 1

        # The skeleton documents its status values in a trailing comment, and
        # workflows/00-session.md says to copy it exactly. It used to cost four errors.
        (early / "MEMORY.md").write_text(
            "---\nslug: approved\nshape: widgets\n"
            "status: sources          # sources | criteria | run | next-steps | done | <output-name>\n"
            "last run: —\n---\n\nnext: propose sources\n",
            encoding="utf-8",
        )
        commented = audit_session(repo, "approved")
        if commented.errors:
            print_audit(commented)
            print("selfcheck: a documented status comment must not fail", file=sys.stderr)
            return 1

        shortlist_audit = Audit("shortlist")
        audit_shortlist(
            "# shortlist — demo\n\nRun 2026-01-02 · 2 rows\n\n"
            "- [x] A — One · 2/2 <!-- identity: one -->\n"
            "- [ ] B — Two · 1/2 <!-- identity: two -->\n",
            shortlist_audit,
        )
        if shortlist_audit.errors:
            print_audit(shortlist_audit)
            print("selfcheck: a scripted shortlist should pass", file=sys.stderr)
            return 1
        # A shortlist row with nothing behind it is an error; a shape that renamed
        # its sections is not. Both assertions matter — the second is the whole
        # reason the old per-section counter went.
        orphan_audit = Audit("orphan")
        audit_shortlist_covers_results(
            "## closing soon\n\n### One\n<!-- identity: one -->\n",
            "- [x] A — One · 2/2 <!-- identity: one -->\n"
            "- [ ] B — Two · 1/2 <!-- identity: two -->\n",
            orphan_audit,
        )
        if not any("no row in results.md" in error for error in orphan_audit.errors):
            print_audit(orphan_audit)
            print("selfcheck: an orphan shortlist row should fail", file=sys.stderr)
            return 1
        renamed_audit = Audit("renamed")
        audit_shortlist_covers_results(
            "## closing soon\n\n### One\n<!-- identity: one -->\n\n"
            "## new this week\n\n### Two\n<!-- identity: two -->\n",
            "- [ ] A — One · 2/2 <!-- identity: one -->\n"
            "- [ ] B — Two · 1/2 <!-- identity: two -->\n",
            renamed_audit,
        )
        if renamed_audit.errors:
            print_audit(renamed_audit)
            print("selfcheck: renamed sections must not fail the check", file=sys.stderr)
            return 1
        malformed_shortlist = Audit("shortlist-bad")
        audit_shortlist("- [ ] A — One · 2/2\n", malformed_shortlist)
        if not any("identity marker" in error for error in malformed_shortlist.errors):
            print_audit(malformed_shortlist)
            print("selfcheck: a shortlist without identity should fail", file=sys.stderr)
            return 1

        session = repo / "sessions" / "demo"
        session.mkdir(parents=True)
        (session / "MEMORY.md").write_text(
            "---\nslug: demo\nshape: company-research\nstatus: run\n"
            "last run: 2026-01-02\n---\n\nnext: refresh\n",
            encoding="utf-8",
        )
        (session / "sources.md").write_text(
            "# sources — demo\n\nLast updated: 2026-01-02\n\n"
            "| name | type | url | method | status | last checked | manual status | manual checked | why |\n"
            "|------|------|-----|--------|--------|--------------|---------------|----------------|-----|\n"
            "| Example | subject | https://example.com/ | page | ok | 2026-01-02 | — | — | primary |\n",
            encoding="utf-8",
        )
        (session / "criteria.md").write_text(
            "# criteria — demo\n\nApproved: 2026-01-02\nLast amended: —\n",
            encoding="utf-8",
        )
        # Carries an identity marker so the same fixture serves the ledger phase
        # below, where shortlist rows must point at a row that really exists.
        (session / "results.md").write_text(
            "# brief — demo\n\nPrepared 2026-01-02 · 1 source checked, 0 browser-dependent\n\n"
            "### Example — a thing\n<!-- identity: example -->\n"
            "A claim. ([Example](https://example.com/page))\n",
            encoding="utf-8",
        )

        examples = repo / "examples"
        examples.mkdir()
        (examples / "company-research.md").write_text(
            "---\nshape: company-research\nform: brief\ncardinality: one\n"
            "selection: artifact\n---\n",
            encoding="utf-8",
        )
        (examples / "widgets.md").write_text(
            "---\nshape: widgets\nform: ledger\ncardinality: many\n"
            "selection: rows\n---\n",
            encoding="utf-8",
        )

        good = audit_session(repo, "demo")
        if good.errors:
            print_audit(good)
            print("selfcheck: expected valid fixture to pass", file=sys.stderr)
            return 1
        results_path = session / "results.md"
        clean_results = results_path.read_text(encoding="utf-8")
        stray = clean_results + "\nAnother claim. ([Elsewhere](https://elsewhere.test/x))\n"
        results_path.write_text(stray, encoding="utf-8")
        brief = audit_session(repo, "demo")
        if not any("absent from sources.md" in w for w in brief.warnings):
            print_audit(brief)
            print("selfcheck: a brief should warn on an uncited domain", file=sys.stderr)
            return 1

        # The same uncovered domain on a ledger is the item's url, not a missing source.
        ledger_memory = original = (session / "MEMORY.md").read_text(encoding="utf-8")
        ledger_memory = ledger_memory.replace("shape: company-research", "shape: widgets")
        (session / "MEMORY.md").write_text(ledger_memory, encoding="utf-8")
        (session / "tools").mkdir()
        (session / "tools" / "shortlist.py").write_text("# fixture\n", encoding="utf-8")
        (session / "shortlist.md").write_text(
            "# shortlist — demo\n\nRun 2026-01-02 · 1 rows\n\n"
            "- [ ] Example — a thing · 1/1 <!-- identity: example -->\n",
            encoding="utf-8",
        )
        ledger = audit_session(repo, "demo")
        if any("absent from sources.md" in w for w in ledger.warnings):
            print_audit(ledger)
            print("selfcheck: a ledger must not warn on item urls", file=sys.stderr)
            return 1
        # ...but a ledger owes an account of its hand-read page sources.
        if not any("page sources are ok and none was read" in e for e in ledger.errors):
            print_audit(ledger)
            print("selfcheck: an unread page source should fail", file=sys.stderr)
            return 1

        listings = session / "listings.md"
        listings.write_text(
            "# listings — demo\n\n## page sources\n\n| issuer | item |\n|---|---|\n"
            "| Example | a thing |\n",
            encoding="utf-8",
        )
        read_by_hand = audit_session(repo, "demo")
        if read_by_hand.errors:
            print_audit(read_by_hand)
            print("selfcheck: a page source under the marker is accounted for", file=sys.stderr)
            return 1
        listings.unlink()

        results_path.write_text(
            stray + "\n## gaps this run\n\npage not read: Example — no time\n",
            encoding="utf-8",
        )
        declared = audit_session(repo, "demo")
        if declared.errors:
            print_audit(declared)
            print("selfcheck: a page source declared unread is accounted for", file=sys.stderr)
            return 1
        (session / "MEMORY.md").write_text(
            ledger_memory.replace("status: run", "status: resume"), encoding="utf-8"
        )
        empty_output = audit_session(repo, "demo")
        if not any("zero ticked" in error for error in empty_output.errors):
            print_audit(empty_output)
            print("selfcheck: a row next step with no ticks should fail", file=sys.stderr)
            return 1
        results_path.write_text(clean_results, encoding="utf-8")
        (session / "MEMORY.md").write_text(original, encoding="utf-8")
        (session / "shortlist.md").unlink()
        (session / "tools" / "shortlist.py").unlink()
        (session / "tools").rmdir()

        memory_path = session / "MEMORY.md"
        original_memory = memory_path.read_text(encoding="utf-8")
        for open_status in ("next-steps", "done", "resume"):
            memory_path.write_text(
                original_memory.replace("status: run", f"status: {open_status}"),
                encoding="utf-8",
            )
            named = audit_session(repo, "demo")
            if named.errors:
                print_audit(named)
                print(f"selfcheck: expected status {open_status!r} to pass", file=sys.stderr)
                return 1
        memory_path.write_text(
            original_memory.replace("status: run", "status: review"),
            encoding="utf-8",
        )
        deprecated = audit_session(repo, "demo")
        if not any("deprecated" in error for error in deprecated.errors):
            print_audit(deprecated)
            print("selfcheck: deprecated review status should fail", file=sys.stderr)
            return 1
        memory_path.write_text(
            original_memory.replace("status: run", "status: Not A Status"),
            encoding="utf-8",
        )
        bad_status = audit_session(repo, "demo")
        if not any("unknown MEMORY.md status" in error for error in bad_status.errors):
            print_audit(bad_status)
            print("selfcheck: expected a malformed status to fail", file=sys.stderr)
            return 1
        memory_path.write_text(original_memory, encoding="utf-8")

        original_results = (session / "results.md").read_text(encoding="utf-8")
        (session / "results.md").write_text(
            original_results.replace("1 source checked", "2 sources checked"),
            encoding="utf-8",
        )
        bad_count = audit_session(repo, "demo")
        if not any("reports 2 sources" in error for error in bad_count.errors):
            print_audit(bad_count)
            print("selfcheck: expected source-count mismatch to fail", file=sys.stderr)
            return 1
        (session / "results.md").write_text(original_results, encoding="utf-8")

        (session / "MEMORY.md").write_text(
            (session / "MEMORY.md").read_text(encoding="utf-8").replace(
                "slug: demo", "slug: wrong"
            ),
            encoding="utf-8",
        )
        bad = audit_session(repo, "demo")
        if not any("expected 'demo'" in error for error in bad.errors):
            print_audit(bad)
            print("selfcheck: expected slug mismatch to fail", file=sys.stderr)
            return 1

    print("selfcheck: ok")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("slugs", nargs="*", help="session slugs; defaults to every session")
    parser.add_argument("--selfcheck", action="store_true", help="run offline fixture checks")
    args = parser.parse_args()

    if args.selfcheck:
        return selfcheck()

    try:
        repo = find_repo_root(Path.cwd())
    except FileNotFoundError as error:
        print(f"session_audit: {error}", file=sys.stderr)
        return 2

    slugs = args.slugs or sorted(
        path.name
        for path in (repo / "sessions").iterdir()
        if path.is_dir() and not path.name.startswith("_")
    )
    audits = [audit_session(repo, slug) for slug in slugs]
    for audit in audits:
        print_audit(audit)
    return 1 if any(audit.errors for audit in audits) else 0


if __name__ == "__main__":
    raise SystemExit(main())
