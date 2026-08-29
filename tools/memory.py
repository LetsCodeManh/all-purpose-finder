#!/usr/bin/env python3
"""The one reader of a session MEMORY.md frontmatter. Every consumer imports this.

There used to be three: `publish_run.frontmatter`, `session_audit.parse_frontmatter`
and `ui/server.frontmatter`. They read the same block and disagreed about comments —
publish_run stripped a trailing `# ...`, the UI skipped whole comment lines, and the
audit did neither. `sessions/_template/MEMORY.md` documents the status values in a
trailing comment, so a session copied exactly as `workflows/00-session.md` instructs
published fine and then failed its first audit with four errors.

One rule now, and it lives here:

    a line whose first non-space character is `#`   is a comment, and is skipped
    a trailing ` # ...` after a value                is a comment, and is stripped
    anything else without a `:`                      is malformed, and is reported

Errors are returned, never raised and never printed: the audit wants them as its own
errors, publish_run wants them fatal, and the UI wants them ignored.
"""

from __future__ import annotations

from pathlib import Path


def frontmatter(text: str) -> tuple[dict[str, str], list[str], str]:
    """Return (values, errors, the `next:` line) for one MEMORY.md."""
    values: dict[str, str] = {}
    errors: list[str] = []
    lines = text.splitlines()
    next_line = ""
    for line in lines:
        if line.startswith("next:"):
            next_line = line[5:].strip()
            break
    if not lines or lines[0].strip() != "---":
        errors.append("MEMORY.md has no opening frontmatter delimiter")
        return values, errors, next_line
    for line in lines[1:]:
        if line.strip() == "---":
            return values, errors, next_line
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            errors.append(f"malformed MEMORY.md frontmatter line: {line!r}")
            continue
        key, value = line.split(":", 1)
        values[key.strip()] = value.split("#", 1)[0].strip()
    errors.append("MEMORY.md has no closing frontmatter delimiter")
    return values, errors, next_line


def read(path: Path) -> tuple[dict[str, str], list[str], str]:
    """Same, from a file. A missing file is empty, not an exception."""
    if not path.is_file():
        return {}, [], ""
    return frontmatter(path.read_text(encoding="utf-8", errors="replace"))


def demo() -> None:
    # The skeleton, copied exactly. This is the case that used to cost four errors.
    values, errors, nxt = frontmatter(
        "---\nslug: demo\nshape: jobs\n"
        "status: sources          # sources | criteria | run | next-steps | done | <output-name>\n"
        "last run: —\n---\n\nnext: propose sources\n"
    )
    assert not errors, errors
    assert values["status"] == "sources", values
    assert values["last run"] == "—"
    assert nxt == "propose sources"

    values, errors, _ = frontmatter("---\n# a whole-line comment\nslug: demo\n---\n")
    assert not errors and values == {"slug": "demo"}, (values, errors)

    _, errors, _ = frontmatter("---\nslug: demo\nnonsense\n---\n")
    assert any("malformed" in e for e in errors), errors

    _, errors, _ = frontmatter("no frontmatter\n")
    assert errors == ["MEMORY.md has no opening frontmatter delimiter"], errors

    _, errors, _ = frontmatter("---\nslug: demo\n")
    assert errors == ["MEMORY.md has no closing frontmatter delimiter"], errors

    # `next:` lives below the block and keeps its own `#`.
    _, _, nxt = frontmatter("---\nslug: d\n---\n\nnext: chase ref #12\n")
    assert nxt == "chase ref #12", nxt
    print("memory.py: ok")


if __name__ == "__main__":
    demo()
