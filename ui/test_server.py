#!/usr/bin/env python3
"""The smallest check that fails if the tick write breaks.  python3 ui/test_server.py"""

import tempfile
from pathlib import Path

import server

LIST = """# shortlist — t

- [ ] Acme — Widget Engineer · 5/6
- [x] Beta — Other · 4/6
Kept because it is the only one in Berlin
- [x] Gamma — Thing · 4/6
"""


def tmp(text):
    p = Path(tempfile.mkdtemp()) / "shortlist.md"
    p.write_text(text, encoding="utf-8")
    return p


def test_flip():
    p = tmp(LIST)
    ok, line = server.flip_tick(p, 3, "- [ ] Acme — Widget Engineer · 5/6", True)
    assert ok, line
    assert p.read_text().split("\n")[2] == "- [x] Acme — Widget Engineer · 5/6"
    # and back
    ok, _ = server.flip_tick(p, 3, "- [x] Acme — Widget Engineer · 5/6", False)
    assert ok and p.read_text().split("\n")[2] == "- [ ] Acme — Widget Engineer · 5/6"


def test_refuses_when_the_line_moved():
    """The whole concurrency design: the agent rewrote the list, our line number is stale."""
    p = tmp(LIST)
    ok, why = server.flip_tick(p, 3, "- [ ] some other row", True)
    assert not ok and "changed under us" in why
    assert p.read_text() == LIST, "a refused tick must not touch the file"


def test_refuses_a_non_tick_line():
    p = tmp(LIST)
    ok, why = server.flip_tick(p, 5, "Kept because it is the only one in Berlin", True)
    assert not ok and "not a tick" in why
    assert p.read_text() == LIST


def test_refuses_past_eof():
    p = tmp(LIST)
    ok, why = server.flip_tick(p, 9999, "- [ ] Acme — Widget Engineer · 5/6", True)
    assert not ok and "past the end" in why


def test_label_survives_the_flip():
    """A row's tick carries its whole label — flipping must not eat it."""
    p = tmp(LIST)
    ok, line = server.flip_tick(p, 6, "- [x] Gamma — Thing · 4/6", False)
    assert ok and line == "- [ ] Gamma — Thing · 4/6", line


def test_path_traversal_is_refused():
    assert server.safe("../../etc", "passwd", server.READABLE) is None
    assert server.safe("eu-ai-jobs", "../../AGENTS.md", server.READABLE) is None
    assert server.safe("eu-ai-jobs", "listings.md", server.READABLE) is None, "3718 rows are never served"
    assert server.safe("eu-ai-jobs", "sources.md", server.WRITABLE) is None, "v1 writes only the tick"
    assert server.safe("eu-ai-jobs", "results.md", server.WRITABLE) is None, "results.md is a step-3 artifact, never written by a later step"


def test_stages_come_from_the_shape():
    assert server.stages_for("jobs", "run") == ["sources", "criteria", "run", "contacts"]
    # `fillers: []` — the shape ends at run and grows no step-4 stage
    assert server.stages_for("company-research", "run") == ["sources", "criteria", "run"]
    # step 4 pending: the human has not picked what to make, so nothing is named yet
    assert server.stages_for("company-research", "output") == ["sources", "criteria", "run"]
    # an unknown shape is not a crash and is not a guess
    assert server.stages_for("no-such-shape", "criteria") == ["sources", "criteria", "run"]
    # filler names are an open set: a session sitting at one the menu never listed still
    # shows where it is
    assert server.stages_for("jobs", "letter") == ["sources", "criteria", "run", "contacts", "letter"]
    assert server.fillers_for("company-research") == [], "empty is not the same as unknown"
    assert server.fillers_for("no-such-shape") is None
    assert server.fillers_for("../../AGENTS") is None


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
    print("all good")
