# finder — rules

**This is the only rules file in this repo.** `CLAUDE.md` points here. Do not create a second one.

finder finds things that get posted and expire — jobs, tenders, grants, suppliers. A **session** is one topic. The engine is the same for every topic; nothing here is tender-specific or job-specific.

---

## The law

**AI proposes, the human prunes, the file gets written after.**

Four gates. Each one stops you until the human answers. There is no "obviously they'd want" — propose it and wait.

| # | Gate | You stop until |
|---|------|----------------|
| 1 | Session creation | the human confirms the slug and shape |
| 2 | Sources list | the human prunes and adds |
| 3 | Criteria checklist | the human approves |
| 4 | Results → next action | the human reviews the result; for a ledger, they tick rows — `- [x]`, see **Ticks** |

Passing a gate without an answer is the single worst failure mode in this repo. If you are unsure whether you are at a gate, you are at a gate.

---

## Step order

A session moves in one direction:

```
sources → criteria → run → contacts
```

The current step is the `status` field in `sessions/<slug>/MEMORY.md`. Read it, do that step, update it. Never run a later step because it seems more useful.

| status | you run |
|--------|---------|
| `sources` | `workflows/01-sources.md` |
| `criteria` | `workflows/02-criteria.md` |
| `run` | `workflows/03-run.md` |
| `contacts` | `workflows/04-contacts.md` |

Entry procedure for every session: `workflows/00-session.md`.

### Scope amendments after a gate

The human may add a source, question, occasion, or criterion after a session has
already moved on. Do not silently widen the approved run and do not restart the
whole session. Show only the delta:

1. new sources → run the source-method check and repeat GATE 2 for those rows
2. new or changed criteria → read back those lines and repeat GATE 3 for them
3. rerun only the sections affected by the approved delta

Keep `status` at the furthest completed step while the amendment is being
approved. Update `sources.md` and `criteria.md` only after their delta gate, add
the amendment date, then update `results.md`. An explicit request to add a fact
to the result is permission to propose the amendment, not permission to make the
stored source and criteria state disagree with the result.

**One skill, not six.** A skill is a shortcut, not a capability. Only `session` is triggered by a human; the other four steps are walked by you, driven by `status`. Do not turn a workflow into a skill — that is five files only ever called by another file.

**Contacts is optional, and the shape decides.** A topic with nobody to look up ends at `run`: say the result is final, leave `status: run`, and point `next:` at the rerun. Skipping the step out loud is correct; quietly inventing someone to contact is not.

Said out loud is said in the terminal, and the terminal is gone tomorrow. Put it on
disk too: the optional `MEMORY.md` key `contacts: n/a — <reason>` records that this
session ends at `run` and why. Present means the step is closed by decision; absent
means it is still ahead or already done. Never write it to skip a lookup the shape
does have.

---

## Where you may write

**Only inside `sessions/<slug>/`.**

Three exceptions, all public and topic-neutral:

- `sessions/_template/` — the **skeleton** of a session: empty files, no data. Not a session — never a slug, never listed as one. Copy its contents after GATE 2, as `workflows/01-sources.md` specifies.
- `examples/<shape>.md` — one worked walkthrough per **shape**, keyed by workflow step. Illustration only, never procedure. No URLs and no vendor names, so the repo stays standalone. A new shape is a new file here, not an edit to a workflow. Skeleton: `examples/_template.md`.
- `tools/session_audit.py` — a read-only structural validator. It may count,
  compare dates, and check that result-link domains appear in `sources.md`. It
  never fetches, filters, scores, or knows a topic.

- No global memory. No user-level memory. No project memory outside the session folder.
- No cross-session notes. Two sessions never learn from each other.
- Do not write to `AGENTS.md`, `CLAUDE.md`, or `workflows/` unless the human asks for a change to the procedure itself.
- Do not create a session folder until step 1 has something real to write. No empty folders.

This applies to every tool, not just the one you happen to be. If your tool has an automatic memory feature, it is off for this repo.

---

## Reading sources

Every source gets one of three methods, tried in this order:

1. **`feed`** — RSS, JSON, or a public API. Always preferred.
2. **`page`** — a generic HTML read.
3. **`blocked`** — needs its own scraper, auth, or a browser to run JavaScript.

**Never write a per-site scraper.** A site that needs one is `blocked`. That is the definition, not a failure.

A `blocked` source stays in `sources.md` with its status and a URL the human can open by hand. **Never delete a blocked source.** A gap you can see is worth more than a list that looks clean.

When the human authorizes a browser or opens a blocked source by hand, the
method and status remain `blocked`: a generic rerun still cannot fetch it.
Record `manual status` (`checked`, `partial`, or `unavailable`) and `manual
checked` in the same source row. This distinguishes "automatically readable"
from "publicly inspected once" without pretending the latter is reproducible.

**Only what is publicly published, for the purpose it was published for.** This binds hardest on shapes that read about people: a public professional profile, a talk, a byline — yes. Assembling scattered personal details into a dossier, anything behind a privacy setting, home address, family — no, whatever the topic. Say what you excluded, so the gap is visible rather than silently skipped.

---

## Make your own gaps visible

The human has to be able to tell what you did not do. Always surface:

- blocked sources, with status
- manual browser/hand checks, with status and date
- what is new since the last run
- `gone` for hits that vanished
- missing data — **flag it, never drop the row**
- range misses — **flag them, never drop the row**
- `last checked` dates, so a silently skipped source shows up as stale

Never quietly improve a list by shortening it.

---

## Scoring

- Only a **`must`** miss drops a row. Everything else flags.
- No compensation math. Never decide one criterion makes up for another's shortfall — show both misses, the human weighs them.
- Do not invent a number. No "78% match", no "chance of winning". Score what the criteria file defines and nothing more.
- Dedupe key is **issuer + item** — who published it, and what it is. The same thing on three sites is one card with three sightings.

---

## Ticks

A tick is a **task-list checkbox**: `- [ ]` unticked, `- [x]` ticked. Nothing else is
a tick — not bold, not an emoji, not a `yes` column. It is clickable as-is in GitHub,
Obsidian, VS Code and Cursor, so ticking needs no tooling and no script.

Exactly two forms, and no third. Both start a line and both match `^- \[[ x]\] `:

```
- [ ] chase                        ← card tick: the line directly under a card's ### heading
- [x] <issuer> — <item> · <score>  ← collapsed-row tick: an unchanged row, whole
```

`<score>` is whatever the card's own score line said — the shape decides how that
reads, this line does not. Nothing else in `results.md` may begin with a checkbox, so
ticks stay countable by a script rather than by eye. Skeleton:
`sessions/_template/results.md`; per-shape card layout: `examples/<shape>.md`.

- **An untick is an answer.** A row left `- [ ]` is a rejection. Do not look something
  up because it scored well.
- **A tick survives the run.** An `unchanged` row keeps the tick it had, so nothing is
  re-decided and contacts does not re-look-up. A `changed` row keeps its tick too, and
  shows `changed: <cols>` so a date move and a location move do not read alike — the
  human re-decides only when it matters. Only `new` rows arrive unticked.
  **Never auto-untick.** Unticking makes people redo settled work.
- **Zero ticks among the rows that needed a decision is a stop.** Not a green light,
  and never "then all of them". Ask. This is *rows that needed a decision this run* —
  `new` rows, and `changed` rows put back in front of the human — not "no rows ticked
  at all": a run whose rows all carry their ticks forward produces zero new ticks
  legitimately, and that gate is satisfied.

A skipped step is visible. A gate written up as satisfied is not, which is why an
empty one stops.

---

## Cost

- The pre-filter is `sessions/<slug>/tools/prefilter.py`, and it belongs to that session. **No LLM in it.** Its patterns come from the `## prefilter` block in `criteria.md`, never from the command line — an argument nobody wrote down is a run nobody can repeat. One source can return 200+ items; scoring all of them ends the run early.
- Only survivors get scored.
- Fetched listings are cached in `listings.md` and not refetched the same day, so re-scoring after a criteria edit is free. `--refetch` forces fresh.
- **The diff is a script, not a judgment.** `prefilter.py` rotates the last run to `listings.prev.md` and writes a `state` column — `new` / `changed:<cols>` / `unchanged` / `gone`. Comparing two files by eye is the one step an LLM cannot be checked on, and it makes every rerun cost a full re-score. Only `new` and `changed` rows are scored.
- Contact lookup runs on ticked rows only, once per organisation. Ticks carry across runs, so a rerun re-looks-up nothing — see **Ticks**.

---

## Files, per session

| file | holds |
|------|-------|
| `MEMORY.md` | status + next step, plus optional `contacts: n/a — <reason>`. **Pointer only — no data** |
| `sources.md` | one table, `type` is a column |
| `criteria.md` | the approved checklist |
| `results.md` | one file, diffed. Not per-site files |
| `listings.md` | raw fetch cache + the `state` column from the diff |
| `listings.prev.md` | the previous run, rotated in on a new day. One run of memory, which is what `gone` needs |
| `contacts.md` | looked-up contacts, cached per organisation |
| `tools/` | this session's scripts. **Per session, not shared** |

The root `tools/session_audit.py` is not a session engine script. It is the
topic-neutral, read-only validator named in **Where you may write**; it must not
grow fetching, parsing, filtering, scoring, or shape-specific branches.

`criteria.md` also carries a `## prefilter` block — the regexes the pre-filter runs, each traceable to a `must` line. Written at GATE 3, read by `sessions/<slug>/tools/regex.py`. Keeping them in the session is what makes a run reproducible tomorrow.

The same block carries `identity` and `compare`, which drop nothing and drive the diff instead. `identity` is the columns that make a row the same row next week — the url for jobs and tenders, `company+title` for a flyer where 200 products share one url, the published reference where the shape has a real one. **A date never belongs in `identity`**: identity is what must hold still so you can tell it is the same thing, and a key that moves every week reports the same row as `new` plus `gone` forever while hiding the change itself.

One file each, and `tools/` is the only folder. Skeletons: `sessions/_template/`.

**`tools/` is per session on purpose.** The scripts parse the field names one
kind of source uses, so a shared copy would have to know every topic — and a
script that knows the topic is what the rule above forbids. The cost is honest:
a fix does not travel. Copy from a neighbouring session, then diverge.
Rules for anything in there: `sessions/_template/tools/README.md`.

---

## Shapes

Two words, kept apart, because they are easy to confuse:

- **shape** — a kind of topic: `jobs`, `prices`, `tenders`, `company-research`.
  Named in `MEMORY.md`, worked through in `examples/<shape>.md`.
- **skeleton** — an empty file with the headings and nothing in them:
  `sessions/_template/`, `examples/_template.md`.

A shape is a way of running. A skeleton is a blank page.

The engine is one procedure; a shape is what a topic makes of it. Shapes live in
`examples/`, one file each, headed by the same workflow steps. When a step reads
oddly for a new topic, the fix is a new `examples/<shape>.md` saying how that step
lands here. **Never put the topic in the workflow** — a workflow that names a
domain has stopped being the engine.

Every session names its shape in `MEMORY.md`, decided at GATE 1 and never after.
Whether a topic is a new shape is the human's call, not yours — propose, wait.
A topic forced into a shape that nearly fits produces a run that nearly works.

**A shape with no example yet is normal, not a blocker.** Run the step from the
workflow, say out loud that you are running without one, and write that section
afterwards from what happened — started from `examples/_template.md`, never
guessed up front. Never postpone a step waiting for an example, and never bend a
topic toward a shape that has one.

Two result forms:

| form | what it is |
|------|-----------|
| `ledger` | scored rows, cards, diffed each run — many candidates, accept or reject |
| `brief` | prose sections, every claim attributed — one subject, and the question is what is true about it |

`examples/` is **public**. Placeholders only: no URLs, no vendor names, no real
criteria, no real results, nothing about who the human is or what they are
looking for. The file records the shape. It never records the search.
