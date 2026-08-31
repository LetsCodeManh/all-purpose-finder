# ui — optional

**Delete this folder and nothing changes.** No workflow, no `AGENTS.md` rule and no
session file references it. Every session runs in a bare terminal exactly as it always
has; this is a second way in, never the way in.

## Run

Two terminals, from the repo root. The dashboard is stdlib-only; ttyd is what puts a
live `claude` session in the drawer at the bottom of the page.

```
brew install ttyd                # once
```

Terminal 1 — the terminal drawer (optional; the dashboard says "detached" without it):

```
ttyd -p 7681 -W claude
```

Terminal 2 — the dashboard:

```
python3 ui/server.py
```

Then open <http://localhost:8420>. Stop either one with `Ctrl-C` in its terminal.

Ports come from the environment when you need them elsewhere: `FINDER_UI_PORT` (8420)
and `FINDER_TTYD_PORT` (7681). Both processes must agree on the ttyd port.

No npm, no build step, no database. Files are the contract between the
dashboard and terminal: the dashboard listens to `sessions/`, not to terminal output.

## What it does

Renders the session files and lets you tick a shortlist row. That is all of v1.

Anything you cannot click, you say in the terminal — *"drop NoFluffJobs"* — and the left
pane updates as the agent writes the file.

- **Session switcher** — session folders containing the `MEMORY.md` written after
  GATE 1, minus `_template`, available from the header or with `⌘K`. A leftover
  probe-only folder from an older run is not a session and is not listed. The active
  shape and its output form remain visible beside it; the form is the `form:` in
  `examples/<shape>.md`, never a guess from which files exist.
- **Stage track** — `sources · criteria · results`, and then **Next Steps** (GATE 4).
  A validated run publishes directly to `status: next-steps`: Results remains available
  for inspection or correction, while Next Steps shows the generated shortlist with
  writable ticks, or says the whole artifact is selected. It shows a few lightweight examples appropriate to
  rows or an artifact; these are prompts, not a fixed menu or end goal. Outputs do
  not become more stages: they appear as Markdown documents in the file tree inside
  Next Steps. `✓` is complete · `●` where `status` says you are · `○` not reached.
- **Results separates postings from cards.** Its badge shows the active posting count
  and, when grouped variants make it different, the number of visual cards. Tick counts
  appear only in Next Steps, where the selection can be changed.
- **Unchanged stays compact on disk and card-shaped on screen.** `results.md` carries
  unchanged decisions as one line each so reruns remain cheap; the UI presents those
  lines with the same card-list hierarchy as new results when the section is opened.
- **The stage track does not reflow.** Its action column has a fixed width, so changing
  the stage note never moves the chips. Sources uses its two equal columns; Criteria and
  Results deliberately use the full width.
- **Source gaps** — every row that is not `ok` stays visible in a dedicated rail on the
  sources view. `blocked` and `error` are different problems and the rail says which.
  Each one carries the **computer-use prompt** for that link — copy it, hand it to an
  agent or run it yourself — and a control that records the answer in that row's
  `manual status` / `manual checked` columns. A sources.md without those columns gets
  the prompt and no control: there would be nowhere to put the answer.
- **Ticking in Next Steps** writes `- [ ]` → `- [x]` on one line of `shortlist.md`. Same edit you would
  make by hand in Obsidian or VS Code, where these checkboxes are also clickable. The
  screen separates selecting inputs from choosing an output, and the shortlist can be
  searched or filtered to selected rows. Those views are presentation only; they never
  rewrite or reorder the file. `results.md` renders read-only and offers no checkbox:
  the ticks left it, and a dead checkbox on screen is worse than none.
- **Results and Next Steps fill the viewport.** Their document card uses the full
  content width and keeps its own body scroll, so the stage track and file header stay
  visible while long cards or shortlists move underneath.
- **A half-run cannot look published.** The server compares the semantic run dates
  inside `listings.md`, `results.md`, and `shortlist.md` with `MEMORY.md`. While a
  `pending run` exists, the old artifact is labelled Previous Results, a freshness
  warning names both dates, and Next Steps is locked. File modification time is never
  presented as the run date.
- **Two writes, two files.** A tick may write `shortlist.md` and nothing else; a hand
  check may write `sources.md` and nothing else. Each endpoint carries its own writable
  set, so widening one never widens the other.
- **Outputs have one address.** An output-name status resolves to
  `outputs/<name>/README.md`. The UI lists each canonical entry under the Next Steps
  `outputs` tree and renders its Markdown in the same panel. Supporting files beside
  it stay available on disk without becoming UI state.
- **Live reload** — SSE. Edit a file in the terminal, the pane follows.
- **Terminal drawer** — optional and detached at the bottom. Nothing in the dashboard
  approves a gate: each stage says what it is waiting for, and you confirm it in the
  terminal, where the Next Steps choice is written to the session files.

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
  makes deleting a source row later a new write function rather than a rewrite. The
  address is not trusted on its own — every write sends back the raw line it expects,
  and a mismatch is refused rather than written, so a parser bug costs a reload.
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
python3 ui/test_server.py    # both write paths, incl. refusing a moved line
node ui/test_app.js          # parser identity markers and four-gate stage states
```
