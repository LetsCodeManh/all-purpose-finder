---
shape: jobs
form: ledger
cardinality: many
fillers: [contacts]
---

# example — jobs

One shape, walked end to end. Illustration, not procedure: the procedure is in
`workflows/`, and it is the same for every shape.

Placeholders where a name, a number or a URL would be. This repo is public and
standalone — no live links to rot, and **no real session's content**. Read
`<role family>` as "whatever the human is actually after", never as a suggestion.

- **Result form:** ledger — rows, scored, diffed each run.
- **Identity:** issuer = the organisation hiring · item = the role title.
- **Recurs?** Yes. New-since-last-run is the point.
- **Fillers?** `contacts` — someone to talk to per organisation.

---

## 00 — session

Slug, topic and the plan, said back before anything is created. Short form here —
the shape exists and the human has run one before; a first session gets the long
form, `workflows/00-session.md` → *GATE 1 — print the plan*.

```
Slug:  <topic>-<region>
Topic: <role family> roles in <region>, <work-mode preference>, <seniority band>.
Reading this as many candidates to pick from.

Same four stops as last time: sources, criteria, results, then your call on
what to make of them. Approving this approves the plan only.

Good? Rename it if the slug is wrong.
```

`shape: jobs` goes in `MEMORY.md`. It is not a word the human is asked to approve.

---

## 01 — sources

**Primary source for this shape:** the hiring organisation's own careers feed.
The aggregators are downstream of it — they lag, and they drop fields.

| name | type | method | why |
|------|------|--------|-----|
| large employer, careers API | organisation | feed (N items) | posts everything, clean JSON, no syndication lag |
| regional aggregator | aggregator | page | regional coverage the global boards do not carry |
| hosted board, mid-size employer | organisation | feed (N items) | small team, never syndicates anywhere else |
| large walled platform | aggregator | blocked (auth) | biggest volume by far — open by hand |

Gaps, in the same message:

```
looked for and did not find: a public feed for the national employment agency
could not check:             one regional board — 403 from here, may work from your machine
```

**Tool shortcut, this shape:** `probe.py --ats <org-slug>` sweeps the common
hosted-board vendors for one employer in a single call. Jobs-shape only — the
plain `probe.py <url>` path is the general one.

**Field-alias trap, this shape:** a hosted board can carry a nested location of
`"<city>, <country>"` next to a bare country code. Pre-filter takes the first
alias that matches. Pick wrong and every row from that source is placed in the
wrong region, with no error.

---

## 02 — criteria

The nudge, worded for this shape:

```
  - what makes something an instant no?
  - what would make you actually open it?
  - money — target, and the floor you would not go under?
  - where, and how flexible is that?
  - anything you have said no to before, and why?
```

Read back:

```markdown
must
  - role is in the <role family> family
  - located in <region>, or remote and open to candidates based there
  - working language <language>
  - not explicitly above the seniority band       (explicit only — unstated level does not drop)

range
  - pay — target <X>, floor <Y>          flagged, never dropped, when unpublished
  - experience asked for — target <band> flagged when unstated
  - formal credential demanded           flagged, never dropped

nice
  - work mode, best first: remote > hybrid > on-site
  - the tools the human already works with

open
  - "somewhere I can learn" — judging on: team size, whether the posting
    describes mentorship, whether the work named is real or a bolt-on

not carried over
  - "fits my profile" on its own — too broad to check. Encoded as the role list under must.
```

**The stingy-must call, this shape:** "I really want remote" is `nice` or
`range`, never `must`. Pay is `range` always — most postings publish no number,
and a `must` would drop every one of them.

Prefilter block:

```
title    = <role terms, alternated>
location = remote|<region terms>
exclude  = <disqualifying seniority words>
```

Each line traces to a `must`. `exclude` exists because "not above the band" is
cheaper to enforce as a rejection than a selection.

---

## 03 — run

Row mapping: issuer = employer · item = role title · where = location · date =
posted date. Dedupe on employer + role title — the same job on three boards is
one card with three sightings.

Diff key: `identity = url`, because a board edits a title far more often than it
moves a posting. Keying on employer + title would report an edited title as a
job that vanished and a different one that appeared.

```
identity = url
compare  = title, location, date
```


**Blank location passes.** Remote roles often name no city.

**Age is this shape's date handling.** A job has no deadline — it has a posted
date that quietly stops meaning anything. Flag a row `stale` past <N> days
(30 is the usual line) and say so on the card. It is a flag, never a drop: a
four-month-old posting is often still open, and an employer who reposts weekly
looks fresh while hiring nobody. A missing posted date is `unknown`, flagged —
several boards publish none.

Contrast with `tenders`, where the date is a hard closing date and sorts the
whole file. Here it only ranks.

A scored card:

```markdown
### <employer> — <role title>
<location> · [posting](<url>) · posted <date>
source: employer careers feed · also seen: one aggregator, one regional board

must   ✓ in the role family
must   ✓ in region
range  ⚠ pay — not published (target <X>, floor <Y>)
range  ✓ experience — "<what the posting says>" (target <band>)
nice   ✓ remote-first
open   ✓ somewhere I can learn — <what you read to decide>

4/6 · 1 unknown · 0 must misses · posted <N> days ago
<one line on why this one is worth opening>
```

Gap report:

```
blocked, open by hand: <names>
failed this run:       <name> (429)
not checked since:     <name> — <date>
```

---

## 04 — output · contacts

The filler this shape offers is `contacts`. **Once per employer**, not once per row — two ticked roles at one org is one lookup.

Lookup order: the posting itself (a named person, or a linked team page) → the
employer's own site → a public search for whoever owns that team.

```markdown
| org | who | role | how | source | found |
|-----|-----|------|-----|--------|-------|
| <employer A> | <name> | <their role> | <published address> | posting footer | <date> |
| <employer B> | — | not found | — | checked site + posting | <date> |
```

Never guess an address from a name and a domain pattern. `not found` is a result
and it stays in the file.
