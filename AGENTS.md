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
| 4 | Next Steps | the human reviews the result as needed; for `selection: rows`, they tick `shortlist.md`, then choose what, if anything, to make |

Passing a gate without an answer is the single worst failure mode in this repo. If you are unsure whether you are at a gate, you are at a gate.

---

## Step order

A session moves in one direction:

```
sources → criteria → run → [ what the result is for ]
  fixed     fixed    fixed             open
```

**Three fixed steps and one open slot.** Sources, criteria and the run are the same
for every topic. The fourth gate is **Next Steps**: whatever the human decides the
result is for—someone to talk to, a report,
a resume, a proposal, links to apply with, or nothing. Some recurring choices have
a reusable procedure in `next-steps/<name>.md`; those files never define the menu.

The current step is the `status` field in `sessions/<slug>/MEMORY.md`. Read it, do that step, update it. Never run a later step because it seems more useful.

| status | means | you run |
|--------|-------|---------|
| `sources` | sources not approved yet | `workflows/01-sources.md` |
| `criteria` | sources approved, criteria not | `workflows/02-criteria.md` |
| `run` | criteria approved; the next action is a run | `workflows/03-run.md` |
| `output` | the run is published; GATE 4 is waiting for selection and the next action | `workflows/04-output.md` |
| `done` | GATE 4 was answered with nothing to make; the same result remains available | follow `next:`; rerun or reopen output only when asked |
| an output name, e.g. `contacts` | that next step has run; the same shortlist is still there to make something else from | `workflows/04-output.md`, then use a reusable procedure if one exists |

`output` is the stop after the run. Publication moves there directly; Results is
available for review or correction, but it is not a gate. GATE 4 moves the session
to `done` or the output name. A finished run never leaves `status: run` behind: that reads as
"step 3 is next" and re-runs a run that already happened.

### Run publication is atomic

`MEMORY.md` is the publication marker. Before any fetch, run
`python3 tools/publish_run.py <slug> begin`; it sets `status: run` and a
`pending run:` date without changing `last run:`. Existing results are then explicitly
previous results, and Next Steps is closed. After `listings.md`, `results.md`, and any
`shortlist.md` have all been written for that same date, run `publish_run.py <slug>
finish`. It validates the dates and the session audit, then—and only then—moves to
`status: output`, advances `last run:`, and removes `pending run:`.

Never update `last run:` or publish `status: output` by hand. A partial run may remain
at `status: run`; it must never look published. The UI and audit independently compare
the semantic dates written inside the artifacts, never filesystem modification times.

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

**A skill is a shortcut, not a capability, and it holds no logic.** `session` starts or continues the workflow; a frequently named next step may have its own shortcut only when a reusable procedure exists. The workflow files are walked by you, driven by `status` — do not turn a workflow into a skill, that is a file only ever called by another file. Every skill is a pointer at the real document, so the repo runs identically in an agent that has never heard of `.claude/`.

**GATE 4 is never skipped.** Call it **Next Steps** to the human. Propose two to
four small possibilities grounded in the result, selected rows and the
human's stated goal. They are examples, never a capability list or fixed end goal.
`selection:` says whether GATE 4 acts on ticked rows or on the artifact as
a whole. The human may name something else or answer "nothing"; record
`status: done` rather than silently ending at `run`.

---

## Where you may write

**Only inside `sessions/<slug>/`.**

Five exceptions, all public and topic-neutral:

- `sessions/_template/` — the **skeleton** of a session: empty files, no data. Not a session — never a slug, never listed as one. Copy `MEMORY.md` after GATE 1, then copy each remaining file only when its workflow step reaches it. Never copy the skeleton over an existing `MEMORY.md`.
- `examples/<shape>.md` — one worked walkthrough per **shape**, keyed by workflow step. **The frontmatter is procedure and is read as such; the body below it is illustration only.** So the four fields are written from what the shape does, and the prose never has to be parsed. No URLs and no vendor names, so the repo stays standalone. A new shape is a new file here, not an edit to a workflow. Skeleton: `examples/_template.md`.
- `tools/session_audit.py` — a read-only structural validator. It may count,
  compare dates, read a shape's frontmatter, and check one file's claims against
  another's — that result-link domains appear in `sources.md` for a brief, and that
  a ledger's hand-read `page` sources reached `listings.md` or were declared unread.
  It never fetches, filters, scores, or knows a topic.
- `tools/publish_run.py` — the topic-neutral run transaction. It writes only the
  target session's `MEMORY.md`, and only to begin a pending run or publish one after
  structural validation succeeds.
- `next-steps/<name>.md` — one procedure per repeatable thing that can be made from a result,
  tool-neutral. **The first executable exception in this list**, and the only one
  guarded by a gate of its own, below.

**Writing a reusable next-step procedure is gated. Running a next step is not.** A session that invents a new
thing to make runs it there and then, from what the human described — that run is
theirs, it costs nothing, and asking permission for it would be the friction this
repo is trying to remove. Writing it back into the repo is the different act:

```
That worked. Write it up as `next-steps/<name>.md` so it is reusable?
It goes in the public repo.
```

Then wait for the answer. **The reason is publication, not caution:** this is the
first time an agent writes executable procedure that strangers will run, on their
machines, against their own sessions. A wrong line in `next-steps/` is wrong for
everyone who clones this repo, and nobody reviews it because it arrived looking
like part of the method.

⚠ **This is not a fifth gate.** Gates 1–4 are per-session and every session hits
all four. This one fires rarely, changes the repo rather than the session, and is
the same class of rule as *do not write to `AGENTS.md` or `workflows/`*. The gates
are four.

**Scrub a reusable next-step procedure exactly like `examples/`**: placeholders instead of names,
numbers and URLs, no vendor names, nothing about who the human is or what they
were looking for. The file records how the thing is made. It never records the
search.

- No global memory. No user-level memory. No project memory outside the session folder.
- No cross-session notes. Two sessions never learn from each other.
- Do not write to `AGENTS.md`, `CLAUDE.md`, or `workflows/` unless the human asks for a change to the procedure itself.
- Do not create a session folder before GATE 1 is approved. Immediately after approval,
  create it with the filled `MEMORY.md`; the approved slug, shape and current step are
  real state, so this is not an empty folder. Nothing else is copied until its gate passes.

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
- [x] <issuer> — <item> · <score> <!-- identity: <canonical value> -->
```

`<score>` is whatever the card's own score line said — the shape decides how that
reads, this line does not. The HTML comment is hidden in rendered Markdown and is
the stable key `shortlist.py` uses to carry a tick across runs; it is required and
never guessed from the visible label. `results.md` is a pure artifact of the run: it records what
was found and never carries a decision, so nothing in it is ticked and no later step
writes to it. Skeletons: `sessions/_template/shortlist.md`,
`sessions/_template/results.md`; per-shape card layout: `examples/<shape>.md`.

The shortlist is regenerated by `sessions/<slug>/tools/shortlist.py` every run and
**the ticks carry forward by `identity`** —
how, and why unticking is forbidden, is written where the file is specified:
`sessions/_template/shortlist.md`.

- **An untick is an answer.** A row left `- [ ]` is a rejection. Do not look something
  up because it scored well.
- **Zero ticks among the rows that needed a decision is a stop.** Not a green light,
  and never "then all of them". Ask unless the human explicitly said they rejected
  all of them or want nothing made. This is *rows that needed a decision this run* —
  rows new to this shortlist, and `changed` rows put back in front of the human — not
  "no rows ticked at all": a run whose rows all carry their ticks forward produces zero
  new ticks legitimately, and that gate is satisfied.

**A tick is the row-selection input to GATE 4.** Results is available beside it for
review or correction, but does not need a separate approval. A
`selection: artifact` shape writes no shortlist and GATE 4 acts on the whole
result. There is nothing to carry forward or count for that shape, so the empty-tick
rule applies only to `selection: rows`.

A skipped step is visible. A gate written up as satisfied is not, which is why an
empty one stops.

---

## Cost

- The pre-filter is `sessions/<slug>/tools/prefilter.py`, and it belongs to that session. **No LLM in it.** Its patterns come from the `## prefilter` block in `criteria.md`, never from the command line — an argument nobody wrote down is a run nobody can repeat. One source can return 200+ items; scoring all of them ends the run early.
- Only survivors get scored.
- Fetched listings are cached in `listings.md` and not refetched the same day, so re-scoring after a criteria edit is free. `--refetch` forces fresh.
- **The diff is a script, not a judgment.** `prefilter.py` rotates the last run to `listings.prev.md` and writes a `state` column — `new` / `changed:<cols>` / `unchanged` / `gone`. Comparing two files by eye is the one step an LLM cannot be checked on, and it makes every rerun cost a full re-score. Only `new` and `changed` rows are scored.
- The compact shortlist is a script projection, not a second agent summary.
  `shortlist.py` reads the identities and score lines already written in
  `results.md`, carries old ticks by identity, and refuses ambiguity.
- Contact lookup runs on ticked rows only, once per organisation. Ticks carry across runs in `shortlist.md`, so a rerun re-looks-up nothing — see **Ticks**.

---

## Files, per session

| file | holds |
|------|-------|
| `MEMORY.md` | status + next step, plus `last run` and temporary `pending run`. **Pointer only — no topic data** |
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

### The frontmatter — four fields, and what each one decides

Every `examples/<shape>.md` opens with them. They are the machine half of a shape;
the body below is the agent half, and neither replaces the other — a tender's
closing-date trap and a classification-code trap are not derivable from four enum
values, and `tenders` and `grants` carry identical fields with different traps.

```yaml
---
shape: courses
form: ledger
cardinality: many
selection: rows
---
```

| field | values | decides |
|-------|--------|---------|
| `form` | `ledger` · `brief` | **how the result reads.** `ledger` is scored rows and cards; `brief` is prose sections, every claim attributed |
| `cardinality` | `one` · `many` | **whether pre-filter, diff and score apply at all.** `many` is candidates you accept or reject, so all three run. `one` is a single subject the sources are all about, so there is nothing to narrow, nothing to compare against last week, and nothing to rank |
| `selection` | `rows` · `artifact` | **what GATE 4 acts on.** `rows` writes a compact `shortlist.md` beside `results.md`; `artifact` uses the result as a whole and writes no shortlist |

Keep frontmatter values bare: no inline comments. The UI reads this deliberately
small syntax without a YAML dependency; explanatory prose belongs below the closing
`---`.

**Defaults: `one → brief`, `many → ledger`.** A shape that deviates says why in its
body — the field still states what it is, and the prose carries the reason.

`cardinality` decides why `company-research` skips the pre-filter, diff and score:
it has **one subject**. `selection: artifact` separately decides why it has no
shortlist. Next-step suggestions are proposed from the actual result and
are not shape metadata.

`expiry` — whether `gone` is news, and whether a closing date sorts the file — stays
**prose in the body**. It is not a frontmatter field.

`examples/` is **public**. Placeholders only: no URLs, no vendor names, no real
criteria, no real results, nothing about who the human is or what they are
looking for. The file records the shape. It never records the search.
