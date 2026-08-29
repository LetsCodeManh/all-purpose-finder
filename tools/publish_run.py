#!/usr/bin/env python3
"""Begin or publish one finder run without allowing a half-run to look current."""

from __future__ import annotations

import argparse
import datetime as dt
import re
import sys
from pathlib import Path

from memory import frontmatter as read_frontmatter
from session_audit import audit_session, find_repo_root
from shape import owes_listings, shape


DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def frontmatter(text: str) -> dict[str, str]:
    """The repo's one reader (tools/memory.py); here a bad block is fatal."""
    values, errors, _ = read_frontmatter(text)
    if errors:
        raise ValueError(errors[0])
    return values


def set_fields(text: str, updates: dict[str, str | None], next_line: str) -> str:
    lines = text.splitlines()
    end = next(i for i, line in enumerate(lines[1:], 1) if line.strip() == "---")
    seen: set[str] = set()
    out = [lines[0]]
    for line in lines[1:end]:
        key = line.split(":", 1)[0].strip() if ":" in line else ""
        if key in updates:
            seen.add(key)
            if updates[key] is not None:
                out.append(f"{key}: {updates[key]}")
        else:
            out.append(line)
    for key, value in updates.items():
        if key not in seen and value is not None:
            out.append(f"{key}: {value}")
    out.extend(lines[end:])
    replaced = False
    for index, line in enumerate(out):
        if line.startswith("next:"):
            out[index] = f"next: {next_line}"
            replaced = True
            break
    if not replaced:
        out.extend(["", f"next: {next_line}"])
    return "\n".join(out).rstrip() + "\n"


def atomic_write(path: Path, text: str) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(text, encoding="utf-8")
    temporary.replace(path)


def file_date(path: Path, pattern: str) -> str:
    if not path.is_file():
        return ""
    match = re.search(pattern, path.read_text(encoding="utf-8", errors="replace"), re.MULTILINE)
    return match.group(1) if match else ""


def artifact_dates(folder: Path) -> dict[str, str]:
    return {
        "listings.md": file_date(folder / "listings.md", r"^# listings\s+—\s+fetched\s+(\d{4}-\d{2}-\d{2})"),
        "results.md": file_date(folder / "results.md", r"^(?:Run|Prepared)\s+(\d{4}-\d{2}-\d{2})\b"),
        "shortlist.md": file_date(folder / "shortlist.md", r"^Run\s+(\d{4}-\d{2}-\d{2})\b"),
    }


def readiness(repo: Path, slug: str) -> tuple[list[str], str, dict[str, str]]:
    folder = repo / "sessions" / slug
    memory_path = folder / "MEMORY.md"
    if not memory_path.is_file():
        return ["missing MEMORY.md"], "", {}
    memory = frontmatter(memory_path.read_text(encoding="utf-8"))
    pending = memory.get("pending run", "")
    errors: list[str] = []
    if memory.get("status") != "run":
        errors.append("MEMORY.md status must be run while publication is pending")
    if not DATE.fullmatch(pending):
        errors.append("MEMORY.md has no valid pending run date")
    dates = artifact_dates(folder)
    # One shape reader, one rule. This used to key on `selection` while
    # session_audit keyed on `cardinality`, so a `many`+`artifact` shape published
    # clean and then failed the audit a second later.
    fields = shape(repo, memory.get("shape", ""))
    required = ["results.md"]
    if owes_listings(fields):
        required.append("listings.md")
    if fields.get("selection") == "rows":
        required.append("shortlist.md")
    for name in required:
        if dates.get(name) != pending:
            errors.append(f"{name} run date is {dates.get(name) or 'missing'}, expected {pending or 'pending date'}")
    return errors, pending, dates


def begin(repo: Path, slug: str, run_date: str) -> int:
    if not DATE.fullmatch(run_date):
        print(f"invalid run date: {run_date}", file=sys.stderr)
        return 2
    memory_path = repo / "sessions" / slug / "MEMORY.md"
    if not memory_path.is_file():
        print(f"missing session: {slug}", file=sys.stderr)
        return 2
    text = memory_path.read_text(encoding="utf-8")
    memory = frontmatter(text)
    if memory.get("status") in {"sources", "criteria"}:
        print(f"cannot begin a run while status is {memory.get('status')}", file=sys.stderr)
        return 2
    existing = memory.get("pending run", "")
    if DATE.fullmatch(existing):
        if existing == run_date and memory.get("status") == "run":
            print(f"{slug}: run {run_date} is already pending")
            return 0
        print(f"cannot replace pending run {existing} with {run_date}; finish it first", file=sys.stderr)
        return 2
    updated = set_fields(
        text,
        {"status": "run", "pending run": run_date},
        f"finish and publish the {run_date} run; previous results remain read-only",
    )
    atomic_write(memory_path, updated)
    print(f"{slug}: run {run_date} begun; previous results are not current")
    return 0


def finish(repo: Path, slug: str, check_only: bool) -> int:
    errors, pending, dates = readiness(repo, slug)
    audit = audit_session(repo, slug)
    errors.extend(audit.errors)
    if errors:
        print(f"{slug}: NOT READY")
        for error in dict.fromkeys(errors):
            print(f"  error: {error}")
        print("  dates: " + " · ".join(f"{name}={value or 'missing'}" for name, value in dates.items()))
        return 1
    if check_only:
        print(f"{slug}: ready to publish {pending}")
        return 0
    memory_path = repo / "sessions" / slug / "MEMORY.md"
    text = memory_path.read_text(encoding="utf-8")
    updated = set_fields(
        text,
        {"status": "output", "last run": pending, "pending run": None},
        "decide what, if anything, to make",
    )
    atomic_write(memory_path, updated)
    print(f"{slug}: published {pending}; GATE 4 Next Steps is ready")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("slug")
    sub = parser.add_subparsers(dest="command", required=True)
    start = sub.add_parser("begin")
    start.add_argument("--date", default=dt.date.today().isoformat())
    sub.add_parser("check")
    sub.add_parser("finish")
    args = parser.parse_args()
    repo = find_repo_root(Path(__file__))
    if args.command == "begin":
        return begin(repo, args.slug, args.date)
    return finish(repo, args.slug, check_only=args.command == "check")


if __name__ == "__main__":
    raise SystemExit(main())
