# finder — rules

**This is the only rules file in this repo.** `CLAUDE.md` points here. Do not create a second one.

finder finds things that get posted and expire — jobs, tenders, grants, suppliers. A **session** is one topic. The engine is the same for every topic; nothing here is tender-specific or job-specific.

---

## The law

**AI proposes, the human prunes, the file gets written after.**

Four gates. Each one stops you until the human answers. There is no "obviously they'd want" — propose it and wait.

| # | Gate | You stop until |
|---|------|----------------|
| 1 | Session creation | the human confirms the slug |
| 2 | Sources list | the human prunes and adds |
| 3 | Criteria checklist | the human approves |
| 4 | Results → shortlist | the human ticks rows |

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

---

## Where you may write

**Only inside `sessions/<slug>/`.**

Two exceptions, both public and both topic-neutral:

- `sessions/_template/` — the **skeleton** of a session: empty files, no data. Not a session — never a slug, never listed as one. Copy it at step 1.
- `examples/<shape>.md` — one worked walkthrough per **shape**, keyed by workflow step. Illustration only, never procedure. No URLs and no vendor names, so the repo stays standalone. A new shape is a new file here, not an edit to a workflow. Skeleton: `examples/_template.md`.

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

**Only what is publicly published, for the purpose it was published for.** This binds hardest on shapes that read about people: a public professional profile, a talk, a byline — yes. Assembling scattered personal details into a dossier, anything behind a privacy setting, home address, family — no, whatever the topic. Say what you excluded, so the gap is visible rather than silently skipped.

---

## Make your own gaps visible

The human has to be able to tell what you did not do. Always surface:

- blocked sources, with status
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

## Cost

- The pre-filter is `sessions/<slug>/tools/prefilter.py`, and it belongs to that session. **No LLM in it.** Its patterns come from the `## prefilter` block in `criteria.md`, never from the command line — an argument nobody wrote down is a run nobody can repeat. One source can return 200+ items; scoring all of them ends the run early.
- Only survivors get scored.
- Fetched listings are cached in `listings.md` and not refetched the same day, so re-scoring after a criteria edit is free. `--refetch` forces fresh.
- Contact lookup runs on ticked rows only, once per organisation.

---

## Files, per session

| file | holds |
|------|-------|
| `MEMORY.md` | status + next step. **Pointer only — no data** |
| `sources.md` | one table, `type` is a column |
| `criteria.md` | the approved checklist |
| `results.md` | one file, diffed. Not per-site files |
| `listings.md` | raw fetch cache |
| `contacts.md` | looked-up contacts, cached per organisation |
| `tools/` | this session's scripts. **Per session, not shared** |

`criteria.md` also carries a `## prefilter` block — the regexes the pre-filter runs, each traceable to a `must` line. Written at GATE 3, read by `sessions/<slug>/tools/regex.py`. Keeping them in the session is what makes a run reproducible tomorrow.

One file each, and `tools/` is the only folder. Skeletons: `sessions/_template/`.

**`tools/` is per session on purpose.** The scripts parse the field names one
kind of source uses, so a shared copy would have to know every topic — and a
script that knows the topic is what the rule above forbids. The cost is honest:
a fix does not travel. Copy from a neighbouring session, then diverge.
Rules for anything in there: `sessions/_template/tools/README.md`.

---

## Shapes

Two words, kept apart, because they are easy to confuse:

- **shape** — a kind of topic: `jobs`, `prices`, `company-research`. Named in
  `MEMORY.md`, worked through in `examples/<shape>.md`.
- **skeleton** — an empty file with the headings and nothing in them:
  `sessions/_template/`, `examples/_template.md`.

A shape is a way of running. A skeleton is a blank page.

The engine is one procedure. A **shape** is what a topic makes of it — jobs are
posted by employers and expire; a price hunt has no one to contact and every row
carries an expiry window; company research produces a written brief, not rows.

Shapes live in `examples/`, one file each, headed by the same workflow steps.
When a step reads oddly for a new topic, the fix is a new `examples/<shape>.md`
that says how that step lands for this domain. **Do not put the topic in the
workflow.** A workflow that names a domain is a workflow that has stopped being
the engine.

Every session names its shape in `MEMORY.md`, decided at GATE 1 and never after.
Whether a topic is a new shape is the human's call, not yours — propose, wait.
A topic forced into a shape that nearly fits produces a run that nearly works.

A new shape's example is written **from what the session actually did**, step by
step as it happens, not guessed in advance — starting from `examples/_template.md`.

**A shape with no example yet is normal, not a blocker.** The workflow is the
procedure and it stands on its own; the example only shows how a step landed for
one domain. Run the step from the workflow, say out loud that you are running
without an example, and write that step's section afterwards from what happened.
Never postpone a step waiting for an example, and never bend the topic toward a
shape that has one.

Two result forms:

| form | what it is |
|------|-----------|
| `ledger` | scored rows, cards, diffed each run — many candidates, accept or reject |
| `brief` | prose sections, every claim attributed — one subject, and the question is what is true about it |

`python3 check.py` is the guard on all of this: it fails when a workflow names a
shape, when a public file carries a URL or a vendor name, when a documented path
does not exist, or when a shape file skips a step. Stdlib, no network. Run it
after editing anything in `workflows/`, `examples/` or this file.

`examples/` is **public**. Placeholders only: no URLs, no vendor names, no real
criteria, no real results, nothing about who the human is or what they are
looking for. The file records the shape. It never records the search.
