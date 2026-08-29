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


# Status is `sources` · `criteria` · `run` · `output`, then the name of whatever
# filler ran. Filler names are an open set by design (AGENTS.md -> Step order), and
# one may run before `fillers/<name>.md` exists, so a post-run status is checked for
# shape rather than against a list.
PRE_RUN_STATUSES = {"sources", "criteria"}
FIXED_STATUSES = PRE_RUN_STATUSES | {"run", "output"}
STATUS_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")
VALID_SOURCE_STATUSES = {"ok", "blocked", "error", "untested"}
VALID_METHODS = {"feed", "page", "blocked"}
VALID_MANUAL = {"checked", "partial", "unavailable", "—", "-", ""}
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
LINK_RE = re.compile(r"\[[^\]]+\]\((https?://[^)]+)\)")
SHAPE_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")
# A `page` source is read by hand, so nothing in the pipeline proves it happened: the
# row still says `ok` and listings.md simply has no rows from it. The evidence is one
# of two shapes, and this is what the check looks for (workflows/03-run.md -> 1).
PAGE_MARKER = "## page sources"
PAGE_NOT_READ = "page not read"

# ponytail: filed, not built — tick counting.
# A tick is `^- \[[ x]\] ` at the start of a line in shortlist.md (AGENTS.md -> Ticks),
# so ticked-vs-total is a count, and anything countable belongs in a script rather
# than in a claim an agent makes about a file. This is the deterministic check on the
# exact failure that produced the rule: a contacts run reporting "all 38 orgs ticked"
# against a shortlist holding zero `- [x]`.
# Shape when built: count ticked and total rows, print them in the report, and error
# when a filler has run and shortlist.md holds no tick at all.


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
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        audit.error("MEMORY.md has no opening frontmatter delimiter")
        return {}
    values: dict[str, str] = {}
    for line in lines[1:]:
        if line.strip() == "---":
            return values
        if ":" not in line:
            audit.error(f"malformed MEMORY.md frontmatter line: {line!r}")
            continue
        key, value = line.split(":", 1)
        values[key.strip()] = value.strip()
    audit.error("MEMORY.md has no closing frontmatter delimiter")
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


def shape_form(repo: Path, shape: str) -> str:
    """`form:` out of examples/<shape>.md — the shape's own account of how it reads."""
    if not SHAPE_RE.fullmatch(shape or ""):
        return ""
    path = repo / "examples" / (shape + ".md")
    if not path.is_file():
        return ""
    for line in path.read_text(encoding="utf-8").splitlines()[1:]:
        if line.strip() == "---":
            break
        if line.startswith("form:"):
            return line.split(":", 1)[1].strip()
    return ""


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
    post_run = status not in FIXED_STATUSES or status == "output"
    if not memory.get("shape"):
        audit.error("MEMORY.md has no shape")
    last_run = memory.get("last run", "")
    if not date_or_dash(last_run):
        audit.error(f"invalid MEMORY.md last run date {last_run!r}")

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
        form = shape_form(repo, memory.get("shape", ""))
        if form == "brief":
            audit_result_links(results_text, source_hosts, audit)
        elif form == "ledger":
            audit_page_coverage(folder, page_ok, results_text, audit)

    if status == "output":
        audit.notes.append("step 4 is pending; the human has not picked what to make yet")
    elif status == "contacts" and not (folder / "contacts.md").is_file():
        audit.notes.append("contacts filler is pending; contacts.md does not exist yet")

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
        (session / "results.md").write_text(
            "# brief — demo\n\nPrepared 2026-01-02 · 1 source checked, 0 browser-dependent\n\n"
            "A claim. ([Example](https://example.com/page))\n",
            encoding="utf-8",
        )

        examples = repo / "examples"
        examples.mkdir()
        (examples / "company-research.md").write_text(
            "---\nshape: company-research\nform: brief\ncardinality: one\nfillers: []\n---\n",
            encoding="utf-8",
        )
        (examples / "widgets.md").write_text(
            "---\nshape: widgets\nform: ledger\ncardinality: many\nfillers: []\n---\n",
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
        results_path.write_text(clean_results, encoding="utf-8")
        (session / "MEMORY.md").write_text(original, encoding="utf-8")

        memory_path = session / "MEMORY.md"
        original_memory = memory_path.read_text(encoding="utf-8")
        for open_status in ("output", "resume"):
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
