# finder

A procedure for finding things that get posted and expire — jobs, discounts,
tenders, grants — and for reading up on a company before you deal with it.

Finder has three named roles. Two work inside sessions: **Scout** searches and
organises the evidence, while **Advisor** helps you discuss it, understand
trade-offs, and decide what you think. Scout brings the map; Advisor helps you
choose the path. You remain in control.

**Builder** is the maintenance role. When you explicitly ask to repair or improve
this repository, Builder inspects the affected code, method, documentation, and
tests; makes the scoped change; and verifies it. Builder never joins a finding
session or bypasses one of its four gates.

It is not an app. There is nothing to install and nothing running. It is a set
of instructions an AI coding agent reads and follows, plus the files it writes
while following them. You supply the agent; this repo supplies the method.

The point is **not** to hand you a filtered list. It is to make the tool's
reasoning visible at every step, and to stop it acting on your behalf before
you have said yes.

---

## The one rule

> **AI proposes, the human prunes, the file gets written after.**

Four gates. At each one the agent stops and waits for you:

| # | gate | you |
|---|------|-----|
| 1 | session created | confirm the slug and the shape |
| 2 | sources proposed | cut what is noise, add what it missed |
| 3 | criteria written back | approve what it will search against |
| 4 | next steps | review the result, then use `shortlist.md` or the whole artifact to choose what, if anything, should be made |

Before gate 3, candidate sources are searched and lightly probed only to
establish whether and how they can be read. Full retrieval, filtering, scoring,
and brief-writing begin after criteria approval. Output-specific research and
production begin only after gate 4.

---

## Requirements

- an AI coding agent that reads `AGENTS.md` or `CLAUDE.md` — this repo was
  built with one, and any equivalent works
- `python3`, for the small scripts a session writes for itself and the shared,
  topic-neutral run publisher. Standard library only, no install step. Fetching and
  parsing stay per session; `tools/publish_run.py` only guards lifecycle state.

---

## Start

Say it in a line:

```
start a finder session — weekly discounts on groceries near me
```

Or, if your agent supports slash commands, `/session`. With no topic it lists
what already exists and asks which one.

The included `.claude/skills/session/` shortcut is for agents that discover
Claude-style repository skills. Other agents need no installation: use the
natural-language command above, and they follow `AGENTS.md` plus
`workflows/00-session/README.md`.

The agent proposes a slug and a shape, then waits. Approve, and Scout follows the
default path:

```
sources → criteria → run → [ what the result is for ]
```

Three fixed steps and one open slot. Results are published automatically after a
validated run and remain available for review or correction. The fourth gate asks
what the result is for — someone to talk to, a report, a resume, links to apply
with, or nothing. Row shapes use the compact shortlist; artifact shapes use the
whole result. You can always name something the agent did not offer.

The path is revisable, not one-way. You can add a source, change a criterion, or
refresh the data after seeing a result. Scout approves only the changed part,
keeps the last valid result, and reruns what the change affects.

You can stop after any step and come back days later. `sessions/<slug>/MEMORY.md`
holds the status, and it is the only thing the next session needs to resume.

---

## What it writes

Each session is one folder, with one file per search artifact and one folder per
chosen output:

| file | holds |
|------|-------|
| `MEMORY.md` | slug, shape, status, next step, and published/pending run dates. Pointer only — no topic data |
| `sources.md` | where it looks, how each one reads, when it was last checked — and, under `## gaps`, what it does not cover |
| `criteria.md` | the approved checklist, plus the regexes the pre-filter runs |
| `results.md` | this run, diffed against the last one |
| `shortlist.md` | compact scripted projection beside a row-based result, and the only file you tick |
| `listings.md` | the raw fetch cache |
| `tools/` | that session's own scripts, if it needs any |
| `outputs/<name>/README.md` | the canonical entry for a chosen output; supporting files sit beside it |

Run `python3 tools/session_audit.py <slug>` before relying on a finished session.
The validator is read-only and topic-neutral: it checks structure, source
accounting, dates, and whether cited web domains are represented in the source
table. It does not fetch or score anything.

Every run starts with `python3 tools/publish_run.py <slug> begin` and ends with
`python3 tools/publish_run.py <slug> finish`. Until the finish command validates
all artifact dates and identities, the previous result stays visibly previous and
Next Steps remains closed. A successful finish opens Next Steps immediately.

**Sessions are yours and stay local.** `sessions/*` is gitignored. Your job
hunt, your shopping list and your meeting prep never leave your machine, and
nothing in the tracked part of this repo says what you were looking for.

### Complete dummy sessions

The repository includes one complete, invented session for every built-in shape.
All names, facts, dates, and `.example` URLs are dummy data:

| session | demonstrates | final state |
|---------|--------------|-------------|
| `sessions/example-jobs/` | recurring scored rows, shortlist selection, chosen comparison output | `comparison` |
| `sessions/example-tenders/` | deadline-led rows, changed notices, shortlist awaiting a choice | `next-steps` |
| `sessions/example-prices/` | seller-grouped weekly rows with whole-artifact selection | `done` |
| `sessions/example-company-research/` | a sourced one-subject brief with no listings or shortlist | `done` |

Each is valid against the same contract as a real session. Check them with:

```sh
for slug in example-jobs example-tenders example-prices example-company-research; do
  python3 tools/session_audit.py "$slug"
done
```

---

## Shapes

The procedure is one procedure. A **shape** is what a kind of topic makes of it:

| shape | result | recurs | Next Steps input |
|-------|--------|--------|------------------|
| `jobs` | scored rows, diffed each run | yes | selected shortlist rows |
| `tenders` | scored rows, each with a closing date that sorts them | yes | selected shortlist rows |
| `prices` | rows per seller, each with a from–to window | weekly | the whole result |
| `company-research` | a written brief, sourced | one-shot, before a meeting | the whole brief |

`selection:` decides rows versus the whole artifact. At Next Steps the agent
proposes a few possibilities grounded in the actual result and your goal. They
are examples, not a fixed menu; you can name something else or stop.

Your topic may be none of these. That is expected — the agent says so at gate 1,
proposes a name, and writes `examples/<shape>.md` as the session goes, from what
actually happened. See `examples/` for the worked walkthroughs, and
`examples/_template.md` for the blank.

---

## What it will not do

By design, not by omission:

- **it will not hide a gap.** Blocked sources, failed fetches, stale sources and
  missing fields are reported every run. A list is never quietly shortened
- **it will not invent a number.** No "82% match", no odds of winning
- **it will not trade one criterion against another.** Both misses are shown; you weigh them
- **it will not write a per-site scraper.** A site that needs one is marked
  `blocked` and stays in the file with a link you open by hand
- **it will not guess an email** from a name and a domain pattern
- **it will not collect private information about people.** Only what is
  published for the purpose you are reading it for, and it says what it excluded

---

## Layout

```
AGENTS.md              the rules. The only rules file
CLAUDE.md              one line, pointing at AGENTS.md
.claude/skills/        the /session shortcut. It holds no logic — delete it and
                       everything still works, you just type the sentence
tools/session_audit.py read-only, topic-neutral session consistency check
workflows/             routers and small procedures; only the current path is read
examples/              one method walkthrough per shape. Public, placeholders only
sessions/_template/    the skeleton of a session
sessions/example-*/    complete audit-valid sessions made only from dummy data
sessions/<slug>/       your sessions and their outputs. Gitignored
  outputs/<name>/      one chosen output, with README.md as its entry
```

Changing how it behaves means editing `AGENTS.md` or `workflows/`. Adding a new
kind of topic means adding a file to `examples/` — never editing a workflow.

---

## License

MIT. See [LICENSE](LICENSE).
