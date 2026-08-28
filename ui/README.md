# ui — optional

**Delete this folder and nothing changes.** No workflow, no `AGENTS.md` rule and no
session file references it. Every session runs in a bare terminal exactly as it always
has; this is a second way in, never the way in.

## Run

```
brew install ttyd                # once
ttyd -p 7681 -W claude           # optional terminal drawer
python3 ui/server.py             # dashboard, stdlib only
open http://localhost:8420
```

Two processes, no npm, no build step, no database. Files are the contract between the
dashboard and terminal: the dashboard listens to `sessions/`, not to terminal output.

## What it does

Renders the session files and lets you tick a shortlist row. That is all of v1.

Anything you cannot click, you say in the terminal — *"drop NoFluffJobs"* — and the left
pane updates as the agent writes the file.

- **Session switcher** — `ls sessions/` minus `_template`, available from the header or
  with `⌘K`. The active shape and its output form remain visible beside it; the form is
  the `form:` in `examples/<shape>.md`, never a guess from which files exist.
- **Stage track** — `sources · criteria · run`, then one stage per entry in that shape's
  `fillers:`. A shape with `fillers: []` ends at the run and grows no fourth stage; a
  filler this page has never heard of still gets a stage, because filler names are an
  open set. `✓` has output on disk · `●` where `status` says you are · `○` nothing
  written yet.
- **Source gaps** — blocked rows stay visible in a dedicated rail on the sources view;
  every other view gives the document the full width.
- **Ticking** writes `- [ ]` → `- [x]` on one line of `shortlist.md`, and that is the
  only file the server will write. Same edit you would make by hand in Obsidian or VS
  Code, where these checkboxes are also clickable. `results.md` renders read-only and
  offers no checkbox at all: the ticks left it, and a dead checkbox on screen is worse
  than none.
- **Live reload** — SSE. Edit a file in the terminal, the pane follows.
- **Terminal drawer** — optional and detached at the bottom. Nothing in the dashboard
  approves a gate: each stage says what it is waiting for, and you confirm it in the
  terminal, where the approval and the next step are written to the session files.

`listings.md` is never rendered. Its 3718 rows are not for reading; the header stat line
is, and that is what the box at the top of the run screen shows.

## Rules this code is built against

- **The UI is optional, permanently.** Deleting `ui/` changes nothing about how the
  repo works — no workflow, no rule and no session file may ever come to depend on it.
- **Every UI action is a file edit a human could type by hand.** No UI-only gesture.
- **No UI-only state.** No settings, no layout, no preferences stored beside a session.
  If the UI knew something the files did not, the terminal user would be running blind.
- **Every rendered element knows its address in the source file.** `parse()` returns
  blocks carrying their line number; nothing is rendered to an HTML blob. That is what
  makes deleting a source row later a new write function rather than a rewrite.
- **Row-ops, not a save button.** The page never holds its own copy of a file. It sends
  one instruction, the server reads → mutates one line → writes. A tick carries the line
  it expects to find; if the agent moved it, the write is refused and the pane reloads.

## Not in v1

Deferred, drawn in the plan, same architecture: delete a source · paste a URL ·
add/remove a criterion · the stale-warning dialog.

Never: filters, sort, select-all, editing `why`/`method`/`status`, editing the prefilter
block, auto-rerun, locking, a framework.

## Tests

```
python3 ui/test_server.py    # the tick write path, incl. refusing a moved line
node ui/test_parse.mjs       # the addressing constraint, against the real sessions
```
