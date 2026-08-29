#!/usr/bin/env python3
"""The one reader of a shape's frontmatter. Every consumer imports this.

There used to be three: `session_audit.shape_fields`, `publish_run.selection_for`
and `ui/server.shape_meta`. They read the same four fields out of the same file
and each failed differently when it was missing — a traceback, an empty dict, and
a silent downgrade to artifact selection. A shape with no `examples/<shape>.md`
yet is normal, not a blocker (AGENTS.md -> Shapes), so that case is the common
one, not the edge one.

They also disagreed about which field decides what a run owes. One rule now, and
it lives here:

    `cardinality` decides what a run owes.
        many -> there was a fetch to cache, so listings.md exists
        one  -> the sources are read straight into the brief, no listings

    `selection` decides GATE 4's input surface, and nothing else.
    `form`      decides how the result reads, and nothing else.
"""

from __future__ import annotations

from pathlib import Path

# ponytail: defaults live here. If a new shape ever needs to *deviate* before its
# example is written, record the three fields in the session's MEMORY.md at GATE 1
# — the agent already asks the cardinality question there — and read them from
# there first. That is the upgrade path, not more branches in this file.
DEFAULTS = {"form": "ledger", "cardinality": "many", "selection": "rows"}
VALUES = {
    "form": {"ledger", "brief"},
    "cardinality": {"one", "many"},
    "selection": {"rows", "artifact"},
}


def shape(repo: Path, name: str) -> dict[str, str]:
    """Three fields, always. A missing or malformed example never raises."""
    fields = dict(DEFAULTS)
    if not name or "/" in name or name.startswith("."):
        return fields
    path = repo / "examples" / f"{name}.md"
    if not path.is_file():
        return fields
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    if not lines or lines[0].strip() != "---":
        return fields
    for line in lines[1:]:
        if line.strip() == "---":
            break
        key, _, value = line.partition(":")
        key, value = key.strip(), value.strip()
        if key in VALUES and value in VALUES[key]:
            fields[key] = value
    return fields


def owes_listings(fields: dict[str, str]) -> bool:
    """The one rule, asked once. A fetch that was cached leaves a cache behind."""
    return fields.get("cardinality") == "many"


def demo() -> None:
    import tempfile

    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        (repo / "examples").mkdir()
        assert shape(repo, "nope") == DEFAULTS, "a missing example must not raise"
        assert shape(repo, "") == DEFAULTS
        assert shape(repo, "../../etc/passwd") == DEFAULTS, "no path escape"

        (repo / "examples" / "b.md").write_text(
            "---\nshape: b\nform: brief\ncardinality: one\nselection: artifact\n---\n",
            encoding="utf-8",
        )
        assert shape(repo, "b") == {
            "form": "brief",
            "cardinality": "one",
            "selection": "artifact",
        }
        assert not owes_listings(shape(repo, "b")), "a brief writes no listings"

        (repo / "examples" / "junk.md").write_text(
            "---\nform: nonsense\ncardinality: many\n---\n", encoding="utf-8"
        )
        assert shape(repo, "junk")["form"] == "ledger", "a bad value falls back"
        assert owes_listings(shape(repo, "junk"))

        (repo / "examples" / "noyaml.md").write_text("# no frontmatter\n", encoding="utf-8")
        assert shape(repo, "noyaml") == DEFAULTS
    print("shape.py: ok")


if __name__ == "__main__":
    demo()
