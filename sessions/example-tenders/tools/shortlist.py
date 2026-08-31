#!/usr/bin/env python3
"""Project actionable result identities into shortlist.md and preserve ticks."""

from __future__ import annotations

import argparse
import re
import tempfile
from pathlib import Path


IDENTITY = re.compile(r"<!--\s*identity:\s*(.+?)\s*-->")
TICK = re.compile(r"^- \[([ x])\] (.+?) <!--\s*identity:\s*(.+?)\s*-->\s*$")
SCORE = re.compile(r"^\d+/\d+ must\b.*must misses$")
ACTIVE = {"closing soon", "changed", "unchanged"}


def previous_ticks(text: str) -> dict[str, bool]:
    ticks: dict[str, bool] = {}
    for line in text.splitlines():
        match = TICK.fullmatch(line)
        if match:
            identity = match.group(3)
            if identity in ticks:
                raise ValueError(f"duplicate previous identity: {identity}")
            ticks[identity] = match.group(1) == "x"
    return ticks


def result_rows(text: str) -> tuple[str, list[tuple[str, str, str]]]:
    run = re.search(r"^Run\s+(\d{4}-\d{2}-\d{2})\b", text, re.MULTILINE)
    if not run:
        raise ValueError("results.md has no Run date")
    lines = text.splitlines()
    rows: list[tuple[str, str, str]] = []
    section = ""
    index = 0
    while index < len(lines):
        heading = re.match(r"^##\s+(.+?)\s*$", lines[index])
        if heading:
            section = heading.group(1).strip().lower()
            index += 1
            continue
        if section not in ACTIVE:
            index += 1
            continue
        if lines[index].startswith("### "):
            label = lines[index][4:].strip()
            end = index + 1
            while end < len(lines) and not re.match(r"^#{2,3}\s+", lines[end]):
                end += 1
            block = lines[index:end]
            identities = [m.group(1) for line in block for m in IDENTITY.finditer(line)]
            scores = [line.strip() for line in block if SCORE.fullmatch(line.strip())]
            if len(identities) != 1 or len(scores) != 1:
                raise ValueError(f"card {label!r} needs exactly one identity and score")
            rows.append((label, scores[0], identities[0]))
            index = end
            continue
        identity = IDENTITY.search(lines[index])
        if identity:
            visible = IDENTITY.sub("", lines[index]).strip().removeprefix("- ")
            label, score = visible.split(" · ", 1)
            if not SCORE.fullmatch(score):
                raise ValueError(f"collapsed row has no recognizable score: {lines[index]}")
            rows.append((label, score, identity.group(1)))
        index += 1
    identities = [row[2] for row in rows]
    if len(identities) != len(set(identities)):
        raise ValueError("results.md has duplicate active identities")
    return run.group(1), rows


def render(slug: str, date: str, rows: list[tuple[str, str, str]], ticks: dict[str, bool]) -> str:
    lines = [f"# shortlist — {slug}", "", f"Run {date} · {len(rows)} rows", ""]
    for label, score, identity in rows:
        mark = "x" if ticks.get(identity, False) else " "
        lines.append(f"- [{mark}] {label} · {score} <!-- identity: {identity} -->")
    return "\n".join(lines) + "\n"


def selfcheck() -> None:
    sample = """# results

Run 2026-01-02 · 1 new · 0 changed · 1 unchanged · 0 gone

## closing soon

### A — One
<!-- identity: one -->
1/1 must · 0 must misses

## unchanged

- B — Two · 1/1 must · 0 must misses <!-- identity: two -->

## withdrawn or closed

### C — Old
<!-- identity: old -->
1/1 must · 0 must misses
"""
    date, rows = result_rows(sample)
    assert date == "2026-01-02" and [row[2] for row in rows] == ["one", "two"]
    output = render("demo", date, rows, {"two": True})
    assert "- [x] B — Two" in output and "identity: old" not in output
    print("selfcheck ok")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--selfcheck", action="store_true")
    args = parser.parse_args()
    if args.selfcheck:
        selfcheck()
        return 0
    session = Path(__file__).resolve().parent.parent
    results = (session / "results.md").read_text(encoding="utf-8")
    shortlist = session / "shortlist.md"
    ticks = previous_ticks(shortlist.read_text(encoding="utf-8")) if shortlist.exists() else {}
    date, rows = result_rows(results)
    output = render(session.name, date, rows, ticks)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=session, delete=False) as handle:
        handle.write(output)
        temporary = Path(handle.name)
    temporary.replace(shortlist)
    print(f"wrote {len(rows)} rows")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
