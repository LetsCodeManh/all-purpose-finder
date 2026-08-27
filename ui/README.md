# ui — optional

**Delete this folder and nothing changes.** No workflow, no `AGENTS.md` rule and no
session file references it. Every session runs in a bare terminal exactly as it always
has; this is a second way in, never the way in.

## Run

```
brew install ttyd                # once
ttyd -p 7681 -W claude           # the right pane
python3 ui/server.py             # the left pane, stdlib only
open http://localhost:8420
```

Two processes, no npm, no build step, no database. Files are the contract between the
two panes: the left pane listens to `sessions/`, not to the terminal.

## What it does

Renders the session files and lets you tick a card. That is all of v1.

Anything you cannot click, you say in the terminal — *"drop NoFluffJobs"* — and the left
pane updates as the agent writes the file.

- **Tabs** — `ls sessions/` minus `_template`. Badge is `status:` from each `MEMORY.md`.
- **Chips** — derived from `shape` plus which files exist, never a hardcoded four.
  `✓` has output on disk · `●` where `status` says you are · `○` nothing written yet ·
  `⊘` not for this shape (only when `contacts: n/a — <reason>` is in the frontmatter).
- **Ticking** writes `- [ ]` → `- [x]` on one line of `results.md`. Same edit you would
  make by hand in Obsidian or VS Code, where these checkboxes are also clickable.
- **Live reload** — SSE. Edit a file in the terminal, the pane follows.

`listings.md` is never rendered. Its 3718 rows are not for reading; the header stat line
is, and that is what the box at the top of the run screen shows.

## Rules this code is built against

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
