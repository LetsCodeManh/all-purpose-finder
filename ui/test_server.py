#!/usr/bin/env python3
"""The smallest check that fails if the tick write breaks.  python3 ui/test_server.py"""

import tempfile
from pathlib import Path

import server

CARD = """# results — t

## new

### Acme — Widget Engineer
- [ ] chase
Berlin

### Beta — Other
- [x] chase

## unchanged

- [x] Gamma — Thing · 4/6
"""


def tmp(text):
    p = Path(tempfile.mkdtemp()) / "results.md"
    p.write_text(text, encoding="utf-8")
    return p


def test_flip():
    p = tmp(CARD)
    ok, line = server.flip_tick(p, 6, "- [ ] chase", True)
    assert ok, line
    assert p.read_text().split("\n")[5] == "- [x] chase"
    # and back
    ok, _ = server.flip_tick(p, 6, "- [x] chase", False)
    assert ok and p.read_text().split("\n")[5] == "- [ ] chase"


def test_refuses_when_the_line_moved():
    """The whole concurrency design: the agent inserted a card, our line number is stale."""
    p = tmp(CARD)
    ok, why = server.flip_tick(p, 6, "- [ ] some other card", True)
    assert not ok and "changed under us" in why
    assert p.read_text() == CARD, "a refused tick must not touch the file"


def test_refuses_a_non_tick_line():
    p = tmp(CARD)
    ok, why = server.flip_tick(p, 7, "Berlin", True)
    assert not ok and "not a tick" in why
    assert p.read_text() == CARD


def test_refuses_past_eof():
    p = tmp(CARD)
    ok, why = server.flip_tick(p, 9999, "- [ ] chase", True)
    assert not ok and "past the end" in why


def test_label_survives_the_flip():
    """A collapsed-row tick carries its whole label — flipping must not eat it."""
    p = tmp(CARD)
    ok, line = server.flip_tick(p, 14, "- [x] Gamma — Thing · 4/6", False)
    assert ok and line == "- [ ] Gamma — Thing · 4/6", line


def test_path_traversal_is_refused():
    assert server.safe("../../etc", "passwd", server.READABLE) is None
    assert server.safe("eu-ai-jobs", "../../AGENTS.md", server.READABLE) is None
    assert server.safe("eu-ai-jobs", "listings.md", server.READABLE) is None, "3718 rows are never served"
    assert server.safe("eu-ai-jobs", "sources.md", server.WRITABLE) is None, "v1 writes only results.md"


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
    print("all good")
