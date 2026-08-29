#!/usr/bin/env python3
"""The smallest check that fails if the tick write breaks.  python3 ui/test_server.py"""

import tempfile
import time
from pathlib import Path

import server

LIST = """# shortlist — t

- [ ] Acme — Widget Engineer · 5/6
- [x] Beta — Other · 4/6
Kept because it is the only one in Berlin
- [x] Gamma — Thing · 4/6
"""


SOURCES = """# sources — t

| name | type | url | method | status | last checked | manual status | manual checked | why |
|------|------|-----|--------|--------|--------------|---------------|----------------|-----|
| Mistral | organisation | https://jobs.example/mistral | blocked (js) | blocked | 2026-08-28 | — | — | open by hand |
| Acme | organisation | https://jobs.example/acme | feed | ok | 2026-08-28 | — | — | fine |
"""

OLD_SOURCES = SOURCES.replace(" manual status | manual checked |", " ").replace(" — | — |", " ")


def tmp(text, name="shortlist.md"):
    p = Path(tempfile.mkdtemp()) / name
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


def test_manual_check_lands_in_the_row():
    p = tmp(SOURCES, "sources.md")
    row = SOURCES.split("\n")[4]
    ok, line = server.set_manual(p, 5, row, "checked")
    assert ok, line
    cells = [c.strip() for c in line.strip().strip("|").split("|")]
    assert cells[6] == "checked" and cells[7] == time.strftime("%Y-%m-%d"), cells
    assert cells[0] == "Mistral" and cells[8] == "open by hand", "the rest of the row is untouched"
    assert p.read_text().split("\n")[5] == SOURCES.split("\n")[5], "no other row moved"


def test_manual_check_is_reversible():
    p = tmp(SOURCES, "sources.md")
    ok, line = server.set_manual(p, 5, SOURCES.split("\n")[4], "checked")
    ok, line = server.set_manual(p, 5, line, "—")
    cells = [c.strip() for c in line.strip().strip("|").split("|")]
    assert ok and cells[6] == "—" and cells[7] == "—", cells


def test_manual_check_refuses_what_it_cannot_record():
    p = tmp(SOURCES, "sources.md")
    row = SOURCES.split("\n")[4]
    ok, why = server.set_manual(p, 5, row, "definitely")
    assert not ok and "not a manual status" in why
    ok, why = server.set_manual(p, 5, "| some other row |", "checked")
    assert not ok and "changed under us" in why
    ok, why = server.set_manual(p, 1, "# sources — t", "checked")
    assert not ok and "not a table row" in why
    assert p.read_text() == SOURCES, "a refused hand check must not touch the file"
    # a sources.md from before the columns existed has nowhere to put the answer
    old = tmp(OLD_SOURCES, "sources.md")
    ok, why = server.set_manual(old, 5, OLD_SOURCES.split("\n")[4], "checked")
    assert not ok and "no manual status columns" in why


def test_each_endpoint_has_its_own_writable_set():
    """Widening the write surface widened it by exactly one file, for exactly one write."""
    assert server.WRITABLE == {"shortlist.md"}
    assert server.MANUAL_WRITABLE == {"sources.md"}
    assert "results.md" not in server.WRITABLE | server.MANUAL_WRITABLE


def test_path_traversal_is_refused():
    """`safe()` ends in `p.exists()`, so this needs a session on disk.

    It builds its own. Pointing at a real one made a test in the tracked half of the
    repo depend on `sessions/`, which is gitignored: it passed here and could never
    have passed in a fresh clone, and it broke outright the day that session was
    deleted.
    """
    root = Path(tempfile.mkdtemp()) / "sessions"
    (root / "demo").mkdir(parents=True)
    for name in ("shortlist.md", "sources.md", "results.md", "listings.md"):
        (root / "demo" / name).write_text("x\n", encoding="utf-8")
    original, server.SESSIONS = server.SESSIONS, root
    try:
        w = server.WRITABLE.__contains__
        assert server.safe("../../etc", "passwd", server.readable) is None
        assert server.safe("demo", "../../AGENTS.md", server.readable) is None
        assert server.safe("demo", "listings.md", server.readable) is None, "3718 rows are never served"
        assert server.safe("demo", "sources.md", w) is None, "the tick endpoint writes only the tick"
        assert server.safe("demo", "results.md", w) is None, "results.md is a step-3 artifact, never written by a later step"
        assert server.safe("demo", "shortlist.md", w) is not None, "the tick's own file, where it exists"
        m = server.MANUAL_WRITABLE.__contains__
        assert server.safe("demo", "shortlist.md", m) is None, "the hand check writes only sources.md"
        assert server.safe("demo", "no-such-session", m) is None
    finally:
        server.SESSIONS = original


def test_readable_is_a_shape_not_a_list():
    """An output nobody has written before still gets its file served."""
    assert server.readable("letter.md") and server.readable("bid.md"), "output names are an open set"
    assert server.readable("MEMORY.md") and server.readable("shortlist.md")
    assert not server.readable("listings.md"), "never served whole"
    assert not server.readable("../AGENTS.md") and not server.readable("results.md.tmp")
    assert not server.readable("Results.md") and not server.readable("") and not server.readable(None)
    # widening reads never widens writes
    assert server.WRITABLE == {"shortlist.md"}


def test_stages_follow_actual_status():
    assert server.stages_for("jobs", "run") == ["sources", "criteria", "run"]
    # Gate states are not filenames or output stages.
    assert server.stages_for("company-research", "run") == ["sources", "criteria", "run"]
    assert server.stages_for("company-research", "next-steps") == ["sources", "criteria", "run"]
    assert server.stages_for("jobs", "done") == ["sources", "criteria", "run"]
    # an unknown shape is not a crash and is not a guess
    assert server.stages_for("no-such-shape", "criteria") == ["sources", "criteria", "run"]
    # Output names are open: a session sitting at one still shows where it is.
    assert server.stages_for("jobs", "letter") == ["sources", "criteria", "run", "letter"]


def test_artifact_dates_are_semantic_not_mtime():
    folder = Path(tempfile.mkdtemp())
    (folder / "listings.md").write_text("# listings — fetched 2026-08-29\n", encoding="utf-8")
    (folder / "results.md").write_text("Run 2026-08-28 · 1 new · 0 changed · 0 unchanged · 0 gone\n", encoding="utf-8")
    (folder / "shortlist.md").write_text("Run 2026-08-28 · 1 rows\n", encoding="utf-8")
    assert server.artifact_run_dates(folder) == {
        "listings": "2026-08-29", "results": "2026-08-28", "shortlist": "2026-08-28"
    }


def test_gate_one_session_is_listed_and_probe_only_folder_is_not():
    """GATE 1 is the first durable state; a directory without MEMORY is not a session."""
    root = Path(tempfile.mkdtemp())
    sessions = root / "sessions"
    examples = root / "examples"
    (sessions / "approved").mkdir(parents=True)
    (sessions / "approved" / "MEMORY.md").write_text(
        "---\nslug: approved\nshape: widgets\nstatus: sources\nlast run: —\n---\n\n"
        "next: propose sources\n",
        encoding="utf-8",
    )
    (sessions / "probe-only" / "tools").mkdir(parents=True)
    examples.mkdir()
    (examples / "widgets.md").write_text(
        "---\nshape: widgets\nform: ledger\ncardinality: many\n"
        "selection: rows\n---\n",
        encoding="utf-8",
    )
    # examples/ is resolved from REPO now, because tools/shape.py is the one reader
    # for the whole repo and takes the root rather than a per-consumer constant.
    old_sessions, old_repo = server.SESSIONS, server.REPO
    server.SESSIONS, server.REPO = sessions, root
    try:
        found = server.sessions()
        assert [s["slug"] for s in found] == ["approved"], found
        assert found[0]["status"] == "sources"
        assert found[0]["shape"] == "widgets"
        assert found[0]["selection"] == "rows"
        assert found[0]["next"] == "propose sources"
        assert found[0]["files"] == {"MEMORY.md": (sessions / "approved" / "MEMORY.md").stat().st_mtime}
    finally:
        server.SESSIONS, server.REPO = old_sessions, old_repo


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
    print("all good")
