#!/usr/bin/env python3
"""finder ui — stdlib only. Serves the page, watches sessions/, pushes SSE, flips one tick.

The UI is optional, permanently. Deleting ui/ changes nothing: no workflow, no AGENTS.md
rule and no session file references it. Every write this server makes is a line edit a
human could have typed by hand — a tick is `- [ ]` -> `- [x]`, nothing more.

Run:  python3 ui/server.py        (then, separately:  ttyd -p 7681 -W claude)
"""

import json
import os
import re
import socket
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from itertools import islice
from pathlib import Path
from urllib.parse import urlparse

REPO = Path(__file__).resolve().parent.parent
# The shape's own account of itself is read by one file for the whole repo. The UI
# used to keep a fourth copy of that parser and silently rendered an unwritten shape
# as artifact selection, so a rows shape came up with nothing to tick and no error.
sys.path.insert(0, str(REPO / "tools"))
from memory import read as read_memory  # noqa: E402
from shape import shape as shape_fields  # noqa: E402
SESSIONS = REPO / "sessions"
UI = REPO / "ui"
PORT = int(os.environ.get("FINDER_UI_PORT", "8420"))
TTYD_PORT = int(os.environ.get("FINDER_TTYD_PORT", "7681"))

# Fixed artifacts live at the session root. Chosen outputs have one canonical entry
# under outputs/<name>/README.md; supporting files stay local but are not rendered.
ROOT_NAME_RE = re.compile(r"^(MEMORY|sources|criteria|results|shortlist|listings)\.md$")
OUTPUT_ENTRY_RE = re.compile(r"^outputs/[a-z0-9][a-z0-9-]*/README\.md$")
RESERVED_OUTPUT_NAMES = {"sources", "criteria", "run", "next-steps", "done"}
# listings.md is watched but never served whole: 3718 rows nobody reads. Its stat line goes
# out through /api/listings instead, which reads only the file's head.
NEVER_SERVED = {"listings.md"}
# v1 still writes exactly one thing: a tick. Which file holds the tick changed — it left
# results.md, which is now a pure step-3 artifact no later step edits, so the server must
# refuse to write it at all. The write surface stays one file; it is a different file.
WRITABLE = {"shortlist.md"}
# The second write, and the last one: a hand check of a source is a fact about the world
# that only the human has, so the page records it in the row it belongs to. Same shape as
# a tick — one line, read-modify-write, `expect` guarding the line number.
MANUAL_WRITABLE = {"sources.md"}
MANUAL_VALUES = {"checked", "partial", "unavailable", "\u2014"}
SLUG = re.compile(r"^[a-z0-9][a-z0-9-]*$")
TICK = re.compile(r"^- \[[ x]\] ")

# Three fixed steps and one open Next Steps slot. Outputs belong inside that slot;
# they never extend the lifecycle track.
FIXED_STAGES = ["sources", "criteria", "run"]


def output_entry(name):
    return bool(OUTPUT_ENTRY_RE.fullmatch(name or "")) and name.split("/")[1] not in RESERVED_OUTPUT_NAMES


def readable(name):
    """A root artifact or canonical output README, except a full listings cache."""
    return bool(ROOT_NAME_RE.fullmatch(name or "") or output_entry(name)) \
        and name not in NEVER_SERVED


def session_files(d):
    """Root artifacts and canonical output entries, keyed by session-relative path."""
    files = {
        f.name: f.stat().st_mtime
        for f in d.glob("*.md")
        if ROOT_NAME_RE.fullmatch(f.name)
    }
    for f in d.glob("outputs/*/README.md"):
        name = f.relative_to(d).as_posix()
        if output_entry(name):
            files[name] = f.stat().st_mtime
    return files


def artifact_run_dates(d):
    """Semantic dates written by the workflow, never filesystem mtimes."""
    specs = {
        "listings": ("listings.md", r"^# listings\s+—\s+fetched\s+(\d{4}-\d{2}-\d{2})"),
        "results": ("results.md", r"^(?:Run|Prepared)\s+(\d{4}-\d{2}-\d{2})\b"),
        "shortlist": ("shortlist.md", r"^Run\s+(\d{4}-\d{2}-\d{2})\b"),
    }
    dates = {}
    for key, (name, pattern) in specs.items():
        path = d / name
        if not path.is_file():
            dates[key] = ""
            continue
        match = re.search(pattern, path.read_text(encoding="utf-8", errors="replace"), re.MULTILINE)
        dates[key] = match.group(1) if match else ""
    return dates


def sessions():
    """Every session on disk, with the facts the chips are derived from.

    The four-stage lifecycle is fixed. Shape frontmatter decides result form and
    selection; canonical output files are listed separately under Next Steps. A
    session that never fetched has no listings.md and says so. The bundled
    `example-*` sessions are a tutorial: they are listed only while there is
    nothing real to list.
    """
    out = []
    if not SESSIONS.is_dir():
        return out
    for d in sorted(SESSIONS.iterdir()):
        if not d.is_dir() or d.name.startswith("_"):
            continue
        memory = d / "MEMORY.md"
        # A session begins when GATE 1 writes its durable pointer. Older versions
        # allowed a probe-only tools directory before that point; it is work in
        # progress, not a session the dashboard can route, so keep it out of the UI.
        if not memory.is_file():
            continue
        meta = frontmatter(memory)
        files = session_files(d)
        outputs = sorted(
            name.split("/")[1]
            for name in files
            if output_entry(name)
        )
        dates = artifact_run_dates(d)
        out.append({
            "slug": d.name,
            "shape": meta.get("shape", ""),
            "status": meta.get("status", ""),
            "last_run": meta.get("last run", ""),
            "pending_run": meta.get("pending run", ""),
            "run_dates": dates,
            "stages": stages_for(meta.get("shape", ""), meta.get("status", ""), outputs),
            "outputs": outputs,
            # `form` is the shape's, not the session's: ledger or brief is decided when the
            # shape is written, and the page used to infer it from which files existed.
            "form": shape_meta(meta.get("shape", "")).get("form", ""),
            "selection": shape_meta(meta.get("shape", "")).get("selection", ""),
            "next": meta.get("_next", ""),
            "files": files,
        })
    # Placeholders step aside once there is real work. The folders stay on disk —
    # this hides them from the switcher, it does not delete anything.
    return [s for s in out if not s["slug"].startswith("example-")] or out


def frontmatter(path):
    """`--- key: value ---` at the top of a session MEMORY.md, plus the `next:` line.

    The repo's one reader (tools/memory.py). A malformed block is not the page's
    problem to report — session_audit says so, loudly; the dashboard just draws
    what it could read.
    """
    meta, _, next_line = read_memory(path)
    meta["_next"] = next_line
    return meta


def shape_meta(shape):
    """The shape's own account of itself, via the repo's one reader (tools/shape.py)."""
    return shape_fields(REPO, shape)


def stages_for(shape, status, outputs=()):
    """The lifecycle is fixed; outputs are children of Next Steps, not stages."""
    return list(FIXED_STAGES)


def listings_stats(slug):
    """The header of listings.md and nothing else.

    ponytail: reads the first 12 lines, never the 3738. The only perf question in the
    build is 'what if we render every row', and it disappears by not doing it.
    """
    f = SESSIONS / slug / "listings.md"
    if not f.exists():
        return None
    with f.open(encoding="utf-8") as fh:
        head = [ln.rstrip("\n") for ln in islice(fh, 12)]
    stats = {"fetched": "", "counts": [], "line": ""}
    for ln in head:
        heading = re.match(r"^# listings\s+—\s+fetched\s+(\d{4}-\d{2}-\d{2})", ln)
        if heading:
            stats["fetched"] = heading.group(1)
        elif ln.startswith("Fetched:"):
            stats["fetched"] = ln[8:].strip()
        # `3718 rows · 204 kept · 414 new · 76 changed · 2836 unchanged · 392 gone`
        elif re.match(r"^\d[\d,]* rows", ln):
            stats["line"] = ln
            for part in ln.split("·"):
                m = re.match(r"\s*([\d,]+)\s+(\w+)", part)
                if m:
                    stats["counts"].append({"n": int(m.group(1).replace(",", "")), "label": m.group(2)})
    return stats


def blocked_sources(slug):
    """Sources whose status column reads `blocked`, named — never counted into silence.

    A gap you can see beats a list that looks clean, so these are reported by name.
    """
    f = SESSIONS / slug / "sources.md"
    if not f.exists():
        return []
    out = []
    for ln in f.read_text(encoding="utf-8").split("\n"):
        if not ln.startswith("|"):
            continue
        cells = [c.strip() for c in ln.strip().strip("|").split("|")]
        if len(cells) >= 5 and cells[4] == "blocked":
            out.append(cells[0])
    return out


def safe(slug, name, ok):
    """`ok` is a predicate, not a list: reads are shape-checked, writes are still the one
    file. Widening what may be read never widens what may be written."""
    if not SLUG.match(slug or "") or not ok(name):
        return None
    p = (SESSIONS / slug / name).resolve()
    if not str(p).startswith(str(SESSIONS.resolve()) + os.sep) or not p.exists():
        return None
    return p


def table_head(lines):
    """The header cells of the first markdown table in the file, lowercased, with its index."""
    for i, ln in enumerate(lines):
        if ln.startswith("|"):
            return i, [c.strip().lower() for c in ln.strip().strip("|").split("|")]
    return None, []


def set_manual(path, line_no, expect, value):
    """Write `manual status` / `manual checked` on one source row.

    The columns are found by name in the table header, never by a hardcoded index: a
    sources.md without those columns is not a file this can write, and says so.
    """
    if value not in MANUAL_VALUES:
        return False, "%r is not a manual status" % value
    lines = path.read_text(encoding="utf-8").split("\n")
    i = line_no - 1
    if not (0 <= i < len(lines)):
        return False, "line %d is past the end of the file" % line_no
    if lines[i] != expect:
        return False, "line %d changed under us \u2014 reloading" % line_no
    _, head = table_head(lines)
    if "manual status" not in head or "manual checked" not in head:
        return False, "this sources.md has no manual status columns"
    if not lines[i].startswith("|"):
        return False, "line %d is not a table row" % line_no
    cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
    if len(cells) != len(head):
        return False, "line %d has %d cells, the header has %d" % (line_no, len(cells), len(head))
    cells[head.index("manual status")] = value
    cells[head.index("manual checked")] = time.strftime("%Y-%m-%d") if value != "\u2014" else "\u2014"
    lines[i] = "| " + " | ".join(cells) + " |"
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text("\n".join(lines), encoding="utf-8")
    os.replace(tmp, path)
    return True, lines[i]


def snapshot():
    out = {}
    for d in SESSIONS.iterdir() if SESSIONS.is_dir() else []:
        if not d.is_dir() or d.name.startswith("_"):
            continue
        for n, mtime in session_files(d).items():
            out[f"{d.name}/{n}"] = mtime
    return out


def ttyd_up():
    with socket.socket() as s:
        s.settimeout(0.15)
        return s.connect_ex(("127.0.0.1", TTYD_PORT)) == 0


def flip_tick(path, line_no, expect, checked):
    """Read -> mutate one line -> write. The whole concurrency design.

    A buffered save would write a two-minute-old copy over whatever the agent added in
    those two minutes, silently. A row-op shrinks that window to the ~1 ms between read
    and write, and `expect` closes it: if the line moved, the client reloads instead.
    """
    text = path.read_text(encoding="utf-8")
    lines = text.split("\n")
    i = line_no - 1
    if not (0 <= i < len(lines)):
        return False, "line %d is past the end of the file" % line_no
    if lines[i] != expect:
        return False, "line %d changed under us — reloading" % line_no
    if not TICK.match(lines[i]):
        return False, "line %d is not a tick" % line_no
    lines[i] = ("- [x] " if checked else "- [ ] ") + lines[i][6:]
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text("\n".join(lines), encoding="utf-8")
    os.replace(tmp, path)  # atomic: the agent never reads a half-written file
    return True, lines[i]


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        pass

    def handle_one_request(self):
        # ponytail: browser closing a keep-alive socket is normal, not an error worth a traceback
        try:
            super().handle_one_request()
        except (ConnectionResetError, BrokenPipeError):
            self.close_connection = True

    def send_json(self, obj, code=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def send_file(self, path, ctype):
        body = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urlparse(self.path)
        p = u.path
        parts = [x for x in p.split("/") if x]

        if p in ("/", "/index.html"):
            return self.send_file(UI / "index.html", "text/html; charset=utf-8")
        if p == "/app.js":
            return self.send_file(UI / "app.js", "text/javascript; charset=utf-8")

        if p == "/api/sessions":
            return self.send_json({"sessions": sessions(), "ttyd": ttyd_up(), "ttyd_port": TTYD_PORT})

        # /api/file/<slug>/<relative-path> — root artifacts and canonical output READMEs.
        if len(parts) >= 4 and parts[:2] == ["api", "file"]:
            f = safe(parts[2], "/".join(parts[3:]), readable)
            if not f:
                return self.send_json({"error": "no such file"}, 404)
            return self.send_json({"text": f.read_text(encoding="utf-8"), "mtime": f.stat().st_mtime})

        if len(parts) == 3 and parts[:2] == ["api", "listings"]:
            if not SLUG.match(parts[2]):
                return self.send_json({"error": "bad slug"}, 400)
            return self.send_json({
                "stats": listings_stats(parts[2]),
                "blocked": blocked_sources(parts[2]),
            })

        if p == "/events":
            return self.sse()

        self.send_response(404)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def sse(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.end_headers()
        prev = snapshot()
        try:
            self.wfile.write(b": open\n\n")
            self.wfile.flush()
            while True:
                # ponytail: mtime poll, not inotify/FSEvents. ~20 stats every 500 ms on
                # a handful of files. Swap for a real watcher if sessions/ ever gets big.
                time.sleep(0.5)
                cur = snapshot()
                if cur != prev:
                    changed = sorted(set(cur) ^ set(prev) | {k for k in cur if k in prev and cur[k] != prev[k]})
                    prev = cur
                    msg = "data: %s\n\n" % json.dumps({"changed": changed})
                    self.wfile.write(msg.encode("utf-8"))
                else:
                    self.wfile.write(b": ping\n\n")
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            return

    def do_POST(self):
        path = urlparse(self.path).path
        if path not in ("/api/tick", "/api/manual"):
            return self.send_json({"error": "no such endpoint"}, 404)
        try:
            n = int(self.headers.get("Content-Length", "0"))
            req = json.loads(self.rfile.read(n) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return self.send_json({"error": "bad request"}, 400)
        # Each endpoint carries its own writable set: the hand check may write sources.md
        # and nothing else, the tick may write shortlist.md and nothing else.
        allowed = WRITABLE if path == "/api/tick" else MANUAL_WRITABLE
        f = safe(req.get("slug"), req.get("file"), allowed.__contains__)
        if not f:
            return self.send_json({"error": "not writable"}, 400)
        if not isinstance(req.get("line"), int) or not isinstance(req.get("expect"), str):
            return self.send_json({"error": "bad request"}, 400)
        if path == "/api/tick":
            ok, detail = flip_tick(f, req["line"], req["expect"], bool(req.get("checked")))
        else:
            ok, detail = set_manual(f, req["line"], req["expect"], req.get("value"))
        return self.send_json({"ok": ok, "detail": detail}, 200 if ok else 409)


if __name__ == "__main__":
    print("finder ui   http://localhost:%d" % PORT)
    print("terminal    %s" % ("ttyd is up on :%d" % TTYD_PORT if ttyd_up()
                              else "ttyd is NOT running — `ttyd -p %d -W claude`" % TTYD_PORT))
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
