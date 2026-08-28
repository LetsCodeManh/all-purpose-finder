# finder

A procedure for finding things that get posted and expire — jobs, discounts,
tenders, grants — and for reading up on a company before you deal with it.

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
| 4 | results ready | review the result; for a ledger, tick the rows worth chasing in `shortlist.md`, then say what to make from them |

Before gate 3, candidate sources are searched and lightly probed only to
establish whether and how they can be read. Full retrieval, filtering, scoring,
and brief-writing begin after criteria approval. Nobody is looked up for contact
purposes before gate 4.

---

## Requirements

- an AI coding agent that reads `AGENTS.md` or `CLAUDE.md` — this repo was
  built with one, and any equivalent works
- `python3`, for the small scripts a session writes for itself. Standard library
  only, no install step. There is no shared engine script to install or update:
  each session writes what its own sources need, from the spec in
  `sessions/_template/tools/README.md`

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
`workflows/00-session.md`.

The agent proposes a slug and a shape, then waits. Approve, and it walks the
four steps in order:

```
sources → criteria → run → [ what the result is for ]
```

Three fixed steps and one open slot. The fourth is whatever you wanted the result
for — someone to talk to, a report, a resume, links to apply with. The agent offers
what it can make from the rows you ticked and waits; you can always name something
it did not offer.

You can stop after any step and come back days later. `sessions/<slug>/MEMORY.md`
holds the status, and it is the only thing the next session needs to resume.

---

## What it writes

Each session is one folder, one file per thing:

| file | holds |
|------|-------|
| `MEMORY.md` | slug, shape, status, next step. Pointer only — no data |
| `sources.md` | where it looks, how each one reads, when it was last checked |
| `criteria.md` | the approved checklist, plus the regexes the pre-filter runs |
| `results.md` | this run, diffed against the last one |
| `shortlist.md` | one line per kept row, and the only file you tick |
| `listings.md` | the raw fetch cache |
| `contacts.md` | who to talk to, cached so it is never looked up twice |
| `tools/` | that session's own scripts, if it needs any |

Run `python3 tools/session_audit.py <slug>` before relying on a finished session.
The validator is read-only and topic-neutral: it checks structure, source
accounting, dates, and whether cited web domains are represented in the source
table. It does not fetch or score anything.

**Sessions are yours and stay local.** `sessions/*` is gitignored. Your job
hunt, your shopping list and your meeting prep never leave your machine, and
nothing in the tracked part of this repo says what you were looking for.

---

## Shapes

The procedure is one procedure. A **shape** is what a kind of topic makes of it:

| shape | result | recurs | step 4 |
|-------|--------|--------|--------|
| `jobs` | scored rows, diffed each run | yes | `contacts`, per organisation |
| `tenders` | scored rows, each with a closing date that sorts them | yes | `contacts`, per authority |
| `prices` | rows per seller, each with a from–to window | weekly | nothing to make |
| `company-research` | a written brief, sourced | one-shot, before a meeting | nothing to make |

The step 4 column is the shape's `fillers:` list, and it is a menu rather than a
limit — you can ask for something that is not on it.

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
- **it will not write your outreach.** Contacts is the last step. The message is yours
- **it will not collect private information about people.** Only what is
  published for the purpose you are reading it for, and it says what it excluded

---

## Layout

```
AGENTS.md              the rules. The only rules file
CLAUDE.md              one line, pointing at AGENTS.md
.claude/skills/        the /session and /contacts shortcuts. Hold no logic — delete
                       them and everything still works, you just type the sentence
tools/session_audit.py read-only, topic-neutral session consistency check
workflows/             one file per step, procedure only, no topic
fillers/               one file per thing that can be made from a result. Step 4
                       is a slot; these are what plugs into it
examples/              one worked walkthrough per shape. Public, placeholders only
sessions/_template/    the skeleton of a session
sessions/<slug>/       your sessions. Gitignored
```

Changing how it behaves means editing `AGENTS.md` or `workflows/`. Adding a new
kind of topic means adding a file to `examples/` — never editing a workflow.

---

## License

MIT. See [LICENSE](LICENSE).
