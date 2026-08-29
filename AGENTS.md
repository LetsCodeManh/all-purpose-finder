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
| 4 | Results → next action | the human reviews the result; for a ledger, they tick rows in `shortlist.md` — `- [x]`, see **Ticks** |

Passing a gate without an answer is the single worst failure mode in this repo. If you are unsure whether you are at a gate, you are at a gate.

---

## Step order

A session moves in one direction:

```
sources → criteria → run → [ what the result is for ]
  fixed     fixed    fixed          open
```

**Three fixed steps and one open slot.** The first three are the same for every
topic. The fourth is whatever the result was for — someone to talk to, a report, a
resume, a proposal, links to apply with — and the procedure for each one is a
**filler**: `fillers/<name>.md`. The step itself is the gate that offers them.

The current step is the `status` field in `sessions/<slug>/MEMORY.md`. Read it, do that step, update it. Never run a later step because it seems more useful.

| status | means | you run |
|--------|-------|---------|
| `sources` | sources not approved yet | `workflows/01-sources.md` |
| `criteria` | sources approved, criteria not | `workflows/02-criteria.md` |
| `run` | criteria approved, or this shape has nothing to make and the last run is done | `workflows/03-run.md` |
| `output` | results exist, the human has not picked what to make from them | `workflows/04-output.md` |
| a filler name, e.g. `contacts` | that filler has run; the same shortlist is still there to make something else from | `workflows/04-output.md`, then `fillers/<name>.md` |

`output` is a status, not a gate — there are four gates and GATE 4 is the one it
sits at. A finished run never leaves `status: run` behind on a shape that has
something to make: that reads as "step 3 is next" and re-runs a run that already
happened.

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

**A skill is a shortcut, not a capability, and it holds no logic.** One per thing a human types: `session` to start or continue one, and one per filler, because a filler is the one step the human names. The four workflow steps are walked by you, driven by `status` — do not turn a workflow into a skill, that is a file only ever called by another file. Every skill is a pointer at the real document, so the repo runs identically in an agent that has never heard of `.claude/`.

**Step 4 is optional, and the shape decides — in `examples/<shape>.md` → `fillers:`.** A shape with `fillers: []` has nothing to make from its result and nobody to look up: the session ends at `run`, so say the result is final, leave `status: run`, and point `next:` at the rerun. Skipping the step out loud is correct; quietly inventing someone to contact, or a document nobody asked for, is not.

That fact belongs to the shape, not to the session. It is on disk once, in the
shape's frontmatter, and every session of that shape reads it there — never copied
into a session's `MEMORY.md`. A shape whose `fillers:` is not empty does have the
step; do not skip it for one session because this run looks thin.

---

## Where you may write

**Only inside `sessions/<slug>/`.**

Three exceptions, all public and topic-neutral:

- `sessions/_template/` — the **skeleton** of a session: empty files, no data. Not a session — never a slug, never listed as one. Copy its contents after GATE 2, as `workflows/01-sources.md` specifies.
- `examples/<shape>.md` — one worked walkthrough per **shape**, keyed by workflow step. **The frontmatter is procedure and is read as such; the body below it is illustration only.** So the three fields are written from what the shape does, and the prose never has to be parsed. No URLs and no vendor names, so the repo stays standalone. A new shape is a new file here, not an edit to a workflow. Skeleton: `examples/_template.md`.
- `tools/session_audit.py` — a read-only structural validator. It may count,
  compare dates, read a shape's frontmatter, and check one file's claims against
  another's — that result-link domains appear in `sources.md` for a brief, and that
  a ledger's hand-read `page` sources reached `listings.md` or were declared unread.
  It never fetches, filters, scores, or knows a topic.
- `fillers/<name>.md` — one procedure per thing that can be made from a result,
  tool-neutral. **The first executable exception in this list**, and the only one
  guarded by a gate of its own, below.

**Writing a filler is gated. Running one is not.** A session that invents a new
thing to make runs it there and then, from what the human described — that run is
theirs, it costs nothing, and asking permission for it would be the friction this
repo is trying to remove. Writing it back into the repo is the different act:

```
That worked. Write it up as `fillers/<name>.md` so it is reusable?
It goes in the public repo.
```

Then wait for the answer. **The reason is publication, not caution:** this is the
first time an agent writes executable procedure that strangers will run, on their
machines, against their own sessions. A wrong line in `fillers/` is wrong for
everyone who clones this repo, and nobody reviews it because it arrived looking
like part of the method.

⚠ **This is not a fifth gate.** Gates 1–4 are per-session and every session hits
all four. This one fires rarely, changes the repo rather than the session, and is
the same class of rule as *do not write to `AGENTS.md` or `workflows/`*. The gates
are four.

**Scrub a filler exactly like `examples/`**: placeholders instead of names,
numbers and URLs, no vendor names, nothing about who the human is or what they
were looking for. The file records how the thing is made. It never records the
search.

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
- **`page` sources you did not read this run** — the row still says `ok` and
  `listings.md` just has no rows from it, so nothing else makes this visible
- what is new since the last run
- `gone` for hits that vanished
- missing data — **flag it, never drop the row**
- **what you did not read, kept apart from what was not published.** A value in a
  body you chose not to fetch is your gap, not the source's; scoring them alike
  hides a shortcut behind a flag that looks like honesty
- range misses — **flag them, never drop the row**
- `last checked` dates, so a silently skipped source shows up as stale

Never quietly improve a list by shortening it.

---

## Scoring

- Only a **`must`** miss drops a row. Everything else flags.
- **A row you drop is written down** — `results.md` → `## dropped at scoring`, one
  line, naming the `must` that killed it. The pre-filter's drops are held in
  `listings.md` for the same reason. A drop nobody can see is a drop nobody can
  disagree with, and this is the only one that is a judgement rather than a regex.
- No compensation math. Never decide one criterion makes up for another's shortfall — show both misses, the human weighs them.
- Do not invent a number. No "78% match", no "chance of winning". Score what the criteria file defines and nothing more.
- Dedupe key is **issuer + item** — who published it, and what it is. The same thing on three sites is one card with three sightings.

---

## Ticks

A tick is a **task-list checkbox**: `- [ ]` unticked, `- [x]` ticked. Nothing else is
a tick — not bold, not an emoji, not a `yes` column. It is clickable as-is in GitHub,
Obsidian, VS Code and Cursor, so ticking needs no tooling and no script.

**Ticks live in `sessions/<slug>/shortlist.md`, and nowhere else.** One form, and no
second:

```
- [x] <issuer> — <item> · <score>
```

`<score>` is whatever the card's own score line said — the shape decides how that
reads, this line does not. `results.md` is a pure artifact of the run: it records what
was found and never carries a decision, so nothing in it is ticked and no later step
writes to it. Skeletons: `sessions/_template/shortlist.md`,
`sessions/_template/results.md`; per-shape card layout: `examples/<shape>.md`.

The shortlist is regenerated every run and **the ticks carry forward by `identity`** —
how, and why unticking is forbidden, is written where the file is specified:
`sessions/_template/shortlist.md`.

- **An untick is an answer.** A row left `- [ ]` is a rejection. Do not look something
  up because it scored well.
- **Zero ticks among the rows that needed a decision is a stop.** Not a green light,
  and never "then all of them". Ask. This is *rows that needed a decision this run* —
  rows new to this shortlist, and `changed` rows put back in front of the human — not
  "no rows ticked at all": a run whose rows all carry their ticks forward produces zero
  new ticks legitimately, and that gate is satisfied.

**A tick is the input to step 4.** A shape that ends at `run` has neither: no
shortlist, no tick line, and its GATE 4 asks the human to review the result rather than
to tick it. There is nothing to carry forward and nothing to count, so the empty-gate
rule never fires there — it fires on shapes that ask for a decision and get none. Such
a shape says so on disk with `fillers: []` in `examples/<shape>.md`.

A skipped step is visible. A gate written up as satisfied is not, which is why an
empty one stops.

---

## Cost

- The pre-filter is `sessions/<slug>/tools/prefilter.py`, and it belongs to that session. **No LLM in it.** Its patterns come from the `## prefilter` block in `criteria.md`, never from the command line — an argument nobody wrote down is a run nobody can repeat. One source can return 200+ items; scoring all of them ends the run early.
- Only survivors get scored.
- Fetched listings are cached in `listings.md` and not refetched the same day, so re-scoring after a criteria edit is free. `--refetch` forces fresh.
- **The diff is a script, not a judgment.** `prefilter.py` rotates the last run to `listings.prev.md` and writes a `state` column — `new` / `changed:<cols>` / `unchanged` / `gone`. Comparing two files by eye is the one step an LLM cannot be checked on, and it makes every rerun cost a full re-score. Only `new` and `changed` rows are scored.
- Contact lookup runs on ticked rows only, once per organisation. Ticks carry across runs in `shortlist.md`, so a rerun re-looks-up nothing — see **Ticks**.

---

## Files, per session

| file | holds |
|------|-------|
| `MEMORY.md` | status + next step. **Pointer only — no data** |
| `sources.md` | one table, `type` is a column, then `## gaps` and `## notes` — what is not covered, and how the reading was done |
| `criteria.md` | the approved checklist |
| `results.md` | one file, diffed. Not per-site files. Never ticked, never edited by a later step |
| `shortlist.md` | one line per kept row, regenerated each run. **The only file that carries ticks** |
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

### The frontmatter — three fields, and what each one decides

Every `examples/<shape>.md` opens with them. They are the machine half of a shape;
the body below is the agent half, and neither replaces the other — a tender's
closing-date trap and a classification-code trap are not derivable from three enum
values, and `tenders` and `grants` carry identical fields with different traps.

```yaml
---
shape: courses
form: ledger        # ledger | brief
cardinality: many   # one | many
fillers: [apply-links]
---
```

| field | values | decides |
|-------|--------|---------|
| `form` | `ledger` · `brief` | **how the result reads.** `ledger` is scored rows and cards; `brief` is prose sections, every claim attributed |
| `cardinality` | `one` · `many` | **whether pre-filter, diff and score apply at all.** `many` is candidates you accept or reject, so all three run. `one` is a single subject the sources are all about, so there is nothing to narrow, nothing to compare against last week, and nothing to rank |
| `fillers` | a list, possibly empty | **what can be made from the result at step 4.** `[]` means the session ends at `run` |

**`fillers:` is a menu, not a constraint.** It is what gets offered at GATE 4, drawn
from the rows actually on screen rather than read out as a capability list. The human
may always name something that is not in it — including one with no `fillers/` file
yet. Refusing a request because the shape's list does not mention it is the shape
telling the human what they are allowed to want, which is backwards.

**Defaults: `one → brief`, `many → ledger`.** A shape that deviates says why in its
body — the field still states what it is, and the prose carries the reason.

`cardinality` is the field that was missing longest, and its absence cost the most:
`company-research` skips the pre-filter, the diff and contacts, and not one of those
skips is because it is a brief. All three are because it has **one subject**. While
the axis had no name, every skip got patched separately.

`expiry` — whether `gone` is news, and whether a closing date sorts the file — stays
**prose in the body**. It is not a frontmatter field.

`examples/` is **public**. Placeholders only: no URLs, no vendor names, no real
criteria, no real results, nothing about who the human is or what they are
looking for. The file records the shape. It never records the search.
