---
shape: company-research
form: brief
cardinality: one
selection: artifact
---

# example — company-research

One shape, walked end to end. Illustration, not procedure.

Scope: **an organisation, and the people at it you will be dealing with.** Not
general-purpose research — the subject is a company and the occasion is dealing
with it. A topic with no organisation at its centre is a different shape.

Placeholders where a name or a URL would be. This repo is public and standalone —
no live links, and no real session's content.

- **Result form:** brief — prose sections, not rows. This is the shape that
  proves the engine is not a table generator.
- **Identity:** there is no dedupe key worth having. The subject is fixed; the
  sources are about the same one or two entities by definition.
- **Recurs?** Barely. One-shot with a deadline — a meeting, a call, a decision.
  A rerun is a refresh before the next meeting, not a weekly diff.
- **Selection:** artifact — the sourced brief stays whole; no shortlist.
- **Next steps:** propose a few uses of the published brief, such as a summary,
  briefing, proposal, or question list; the human may name something else or stop.

Two more things this shape does not have, and that is fine:

- **No pre-filter.** Twenty sources, all of them read. The `## prefilter` block
  exists to stop a run drowning in two hundred rows; here there is nothing to
  drown in. Omit the block entirely rather than writing a regex that filters
  nothing.
- **No `gone` section.** Nothing expires between the search and the meeting.

---

## 00 — session

```
Slug:  <subject>-brief
Topic: background on <an organisation> and <a person at it>, ahead of <the occasion>,
       on <date>.
Reading this as one subject to read up on, not a list to choose from.

Same four stops as last time: this plan, sources, criteria, then your call on the
published brief as a whole. Approving this approves the plan only.

Good? Rename it if the slug is wrong.
```

★ The cardinality line is the one that matters here. `one subject` is why this
shape has no pre-filter, no diff and no score — and it is the one thing a human
can confirm without knowing a single repo word.

The deadline belongs in the topic line. It is what decides how deep to go, and
it is the only thing in this shape that expires.

When the occasion or date is not supplied, write `occasion not supplied` at
GATE 1. Do not guess it and do not postpone the session; the visible gap prompts
the human to add it before approving or as a later scope amendment.

---

## 01 — sources

**Primary source for this shape:** what the subject publishes about itself —
its own site, its own writing, its own filings and announcements. Everything
else is commentary, and commentary is worth reading *after* you know what the
subject claims.

Two source sets, kept apart in the table, because they are read differently:

| name | type | method | why |
|------|------|--------|-----|
| the organisation's own site | subject | page | what they claim, in their words — the baseline everything else is read against |
| the organisation's own writing or updates | subject | feed (N items) | what they are actually working on now, dated |
| the person's public professional profile | subject | page | their own account of their path |
| the person's public writing, talks or posts | subject | feed (N items) | how they think, which is the only thing worth being interested in out loud |
| independent coverage | third-party | page | funding, reorganisations, controversies — what the subject will not publish |
| a public register or filings source | third-party | page | size, age, ownership. Boring and load-bearing |

**Only what is publicly published.** No aggregation of scattered personal
details into a profile, no personal address, no family, nothing behind a
privacy setting. The test: *would the subject expect a person preparing for a
meeting to have read this?* Their conference talk, yes. Their relatives, no.
This is a rule, not a preference — say what you excluded and why, out loud.

**Method reality for this shape:** most of these are `page`. Feeds exist only
where the subject publishes serially. That is normal here and not a failure.

---

## 02 — criteria

Criteria in this shape are **questions to answer**, not filters to score. Same
four kinds, read differently: a `must` is a question you refuse to walk in
without an answer to, and its "miss" is a stated gap in the brief — it drops a
question, never a source.

Nudge:

```
  - what is the occasion, and what do you want out of it?
  - what would embarrass you to not know?
  - what are you actually curious about, as opposed to due diligence?
  - anything you already know, so I do not spend the run re-finding it?
  - how deep — a page, or everything?
```

Expect to propose most of these yourself. Unlike the other shapes, the human
often does not know what is worth asking about a subject they have not
researched yet — proposing the question list *is* the value of this step.

Read back:

```markdown
must (answer, or state the gap)
  - what the organisation actually does, in one sentence a person there would agree with
  - how it makes money, and who pays
  - size, age, ownership, and whether it is growing or shrinking
  - what the person's role is, and what they are accountable for
  - what changed in the last <N> months

nice
  - how they describe their own way of working
  - who the visible competitors are, and how the subject positions against them
  - anything the person has said publicly about the thing the meeting is about

open
  - "would this be a good place to spend time" — judging on: what they publish,
    how they write about their own work, what the independent coverage says
    when it is not a press release

not carried over
  - anything not publicly published. Named here so the gap is visible, not silently skipped.
```

**No `## prefilter` block.** State that it is omitted and why, so the next run
does not think it went missing.

---

## 03 — run

Fetch, read, and **write a brief**. No cards, no score line, no `4/6`.

- Attribute every claim to the source it came from. A brief the human cannot
  check is a brief that will embarrass them in the room.
- **Separate what the subject says about itself from what others say.** When
  the two disagree, that disagreement is the single most useful line in the file.
- **State the gaps as their own section.** "Nothing public on X" is an answer,
  and often the one that changes how the meeting goes.
- Do not smooth over uncertainty into confident prose. Hedge where the source hedges.

```markdown
# brief — <slug>
Prepared <date> · for <the occasion> on <date> · <N> sources checked ·
<B> blocked to automation (<M> manually checked) · <U> unreachable

## in one line
<what the organisation does, as someone there would put it>

## meeting card

### five things to remember
<the smallest set of verified facts needed in the room>

### three questions to ask
<questions tied to the human's objective, not generic due diligence>

### claims not to repeat as facts
<subject claims, estimates, or unresolved disagreements likely to sound factual>

### objective
<what the human wants from this occasion; `not supplied` is visible>

## the organisation
<what they do, how they earn, size, age, ownership — each claim sourced>

## the person
<role, what they are accountable for, their public path — each claim sourced>

## what changed recently
<dated items, newest first>

## what they say vs what others say
<only where the two diverge. Skip the section entirely if they do not>

## good to know
<the small, true, non-obvious things — a talk they gave, a project they are
proud of, a term they use for their own work>

## open questions
<what to ask in the room. The output the human actually uses>

## gaps
<what is not public, what was unreachable, what stayed unanswered>
```

Rerun before a later meeting: the diff is **what changed since the last brief**,
not a rewrite. Keep the previous brief's date line.

The meeting card is the operational view, not a second result file. Refresh it
whenever the occasion, objective, or underlying brief changes.

---

## 04 — Next Steps

At GATE 4 the published brief is the whole input; propose
a few relevant next steps without treating them as a menu, then wait.

```
Nothing to make from this one; the brief is the result.
MEMORY.md → status: done, next: read the brief before <the occasion>.
```
