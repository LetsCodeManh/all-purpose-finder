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
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from itertools import islice
from pathlib import Path
from urllib.parse import urlparse

REPO = Path(__file__).resolve().parent.parent
SESSIONS = REPO / "sessions"
UI = REPO / "ui"
PORT = int(os.environ.get("FINDER_UI_PORT", "8420"))
TTYD_PORT = int(os.environ.get("FINDER_TTYD_PORT", "7681"))

# What may be read is a shape, not a list. Filler names are an open set, so a whitelist
# here would be a third place that has to learn every new filler name — and the two layers
# above have already stopped doing that.
NAME_RE = re.compile(r"^(MEMORY|[a-z0-9][a-z0-9-]*)\.md$")
# listings.md is watched but never served whole: 3718 rows nobody reads. Its stat line goes
# out through /api/listings instead, which reads only the file's head.
NEVER_SERVED = {"listings.md"}
# v1 still writes exactly one thing: a tick. Which file holds the tick changed — it left
# results.md, which is now a pure step-3 artifact no later step edits, so the server must
# refuse to write it at all. The write surface stays one file; it is a different file.
WRITABLE = {"shortlist.md"}
SLUG = re.compile(r"^[a-z0-9][a-z0-9-]*$")
TICK = re.compile(r"^- \[[ x]\] ")

# Three fixed steps and one open slot. What fills the slot is per-shape, so the tail of
# the track is read from examples/<shape>.md and never hardcoded here.
FIXED_STAGES = ["sources", "criteria", "run"]
EXAMPLES = REPO / "examples"


def readable(name):
    """Any session markdown file, except the one that is never served whole."""
    return bool(NAME_RE.fullmatch(name or "")) and name not in NEVER_SERVED


def session_files(d):
    """The markdown in a session folder, by name and mtime — the page picks what it wants.

    Globbed rather than listed for the same reason `readable` is a shape: a filler writes
    `<name>.md` and the server must not need teaching that the name exists.
    """
    return {f.name: f.stat().st_mtime for f in d.glob("*.md") if NAME_RE.fullmatch(f.name)}


def sessions():
    """Every session on disk, with the facts the chips are derived from.

    Never a hardcoded four: which stages exist comes from `shape`, read out of that
    shape's frontmatter, plus which files are there. A session that never fetched has no
    listings.md and says so.
    """
    out = []
    if not SESSIONS.is_dir():
        return out
    for d in sorted(SESSIONS.iterdir()):
        if not d.is_dir() or d.name.startswith("_"):
            continue
        meta = frontmatter(d / "MEMORY.md")
        files = session_files(d)
        out.append({
            "slug": d.name,
            "shape": meta.get("shape", ""),
            "status": meta.get("status", ""),
            "last_run": meta.get("last run", ""),
            "stages": stages_for(meta.get("shape", ""), meta.get("status", "")),
            # `form` is the shape's, not the session's: ledger or brief is decided when the
            # shape is written, and the page used to infer it from which files existed.
            "form": shape_meta(meta.get("shape", "")).get("form", ""),
            "next": meta.get("_next", ""),
            "files": files,
        })
    return out


def frontmatter(path):
    """`--- key: value ---` at the top of a session MEMORY.md, plus the `next:` line."""
    meta = {}
    if not path.exists():
        return meta
    lines = path.read_text(encoding="utf-8").split("\n")
    if lines and lines[0].strip() == "---":
        for ln in lines[1:]:
            if ln.strip() == "---":
                break
            if ln.lstrip().startswith("#") or ":" not in ln:
                continue
            k, _, v = ln.partition(":")
            meta[k.strip()] = v.strip()
    for ln in lines:
        if ln.startswith("next:"):
            meta["_next"] = ln[5:].strip()
            break
    return meta


def shape_meta(shape):
    """The frontmatter of examples/<shape>.md — the shape's own account of itself."""
    if not SLUG.match(shape or ""):
        return {}
    return frontmatter(EXAMPLES / (shape + ".md"))


def fillers_for(shape):
    """The `fillers:` menu from examples/<shape>.md — or None when there is none to read.

    None is not []: `fillers: []` is a shape saying out loud that it ends at `run` and has
    no step 4, while a missing file or a missing key is the UI simply not knowing. Neither
    is a licence to guess a step 4 from the shape's name — that would be the UI knowing
    something the files do not.
    """
    raw = shape_meta(shape).get("fillers")
    if raw is None:
        return None
    return [x.strip() for x in raw.strip("[]").split(",") if x.strip()]


def stages_for(shape, status):
    """`sources · criteria · run`, then one stage per filler the shape offers.

    Filler names are an open set by design, and `fillers:` is a menu rather than a
    constraint, so a session can legitimately sit at a filler this shape never listed. An
    unrecognised status is appended instead of dropped: the track must still show where
    you are. `output` is step 4 pending — the human has not picked yet — so it names no
    stage of its own.
    """
    stages = FIXED_STAGES + (fillers_for(shape) or [])
    if status and status != "output" and status not in stages:
        stages.append(status)
    return stages


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
        if ln.startswith("Fetched:"):
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

        # /api/file/<slug>/<name> — the raw markdown. The client parses it, so every
        # rendered element keeps its line number in the source file.
        if len(parts) == 4 and parts[:2] == ["api", "file"]:
            f = safe(parts[2], parts[3], readable)
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
        if urlparse(self.path).path != "/api/tick":
            return self.send_json({"error": "no such endpoint"}, 404)
        try:
            n = int(self.headers.get("Content-Length", "0"))
            req = json.loads(self.rfile.read(n) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return self.send_json({"error": "bad request"}, 400)
        f = safe(req.get("slug"), req.get("file"), WRITABLE.__contains__)
        if not f:
            return self.send_json({"error": "not writable"}, 400)
        if not isinstance(req.get("line"), int) or not isinstance(req.get("expect"), str):
            return self.send_json({"error": "bad request"}, 400)
        ok, detail = flip_tick(f, req["line"], req["expect"], bool(req.get("checked")))
        return self.send_json({"ok": ok, "detail": detail}, 200 if ok else 409)


if __name__ == "__main__":
    print("finder ui   http://localhost:%d" % PORT)
    print("terminal    %s" % ("ttyd is up on :%d" % TTYD_PORT if ttyd_up()
                              else "ttyd is NOT running — `ttyd -p %d -W claude`" % TTYD_PORT))
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
