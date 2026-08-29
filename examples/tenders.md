---
shape: tenders
form: ledger
cardinality: many
selection: rows
---

# example — tenders

One shape, walked end to end. Illustration, not procedure: the procedure is in
`workflows/`, and it is the same for every shape.

Placeholders where a name, a number or a URL would be. This repo is public and
standalone — no live links to rot, and no real session's content.

- **Result form:** ledger — rows, scored, diffed each run.
- **Identity:** issuer = the contracting authority · item = the **notice
  reference**. Unlike every other shape, this one has a real published ID. Use
  it as the dedupe key, and fall back to authority + title only when a source
  strips it.
- **Recurs?** Yes, and on a clock. Every row carries a **closing date**, and that
  date is what sorts the file. The diff that matters is *new* and *closing soon*.
- **Selection:** rows — GATE 4 uses the compact shortlist beside the detailed
  notices.
- **Next steps:** propose possibilities from the selected notices. Contact lookup
  is often useful because a notice commonly publishes a contact point.

Closest shape is `jobs` — same rows, same cards, same scoring. Three things
differ, and all three come from the same fact, that a tender is a legal process
with a deadline:

1. **The deadline is not a flag, it is the sort order.** A perfect match closing
   tomorrow is worth less than a decent one closing in three weeks.
2. **Rows change after publication.** Deadlines get extended, documents get
   revised, scope gets clarified. `changed` is a section people act on here.
3. **`gone` splits in two.** *Awarded* and *withdrawn* are different news, and
   who won is worth keeping.

---

## 00 — session

```
Slug:  <sector>-tenders-<region>
Topic: public contracts for <kind of work> published by <authority level> in
       <region>, above <size> or any size.
Reading this as many candidates to pick from.

Same four stops as last time: this plan, sources, criteria, then the shortlist
and your call on what to make. Approving this approves the plan only.

Good? Rename it if the slug is wrong.
```

---

## 01 — sources

**Primary source for this shape:** the register the authority is *obliged* to
publish in. Nothing else is authoritative, and everything else is downstream of
it and late.

**The fork that decides this whole session — ask it at GATE 1 or 2, never later:**

> Above a value threshold, notices must by law be published in one central
> register. Below it, each authority publishes wherever it likes — its own
> site, a regional portal, a local paper, a mailing list.

- **Above-threshold only** → one or two sources cover nearly everything.
  The work is filtering, and this shape is mostly `criteria.md`.
- **Below-threshold** → there is no register. The work is finding the authorities
  one by one and reading each of their portals, and `sources.md` is the whole
  product. Expect many rows, most of them `page`, several `blocked`.

They are not the same amount of work and they are not the same tool. Say which
one this session is, in `MEMORY.md`'s topic line, before proposing anything.

| name | type | method | why |
|------|------|--------|-----|
| central notice register | register | feed (N items) | mandatory publication above the threshold — the only complete source that exists |
| regional procurement portal | portal | feed (N items) | below-threshold notices the register never sees |
| an individual authority's own page | authority | page | small contracts published nowhere else |
| a large authority's supplier portal | portal | blocked (auth) | registration wall — open by hand, and it is worth registering |

Gaps, in the same message:

```
looked for and did not find: a machine-readable feed for <authority level> in <region>
could not check:             one portal — registration required, unverified
```

**Method reality for this shape:** procurement portals are old, heavy, and often
sit behind a login you get for free by registering. That is `blocked`, it stays
in the file with a URL, and it is frequently the highest-value row on the list —
a wall usually means less competition behind it. Never write a scraper for one.

**Field-alias trap, this shape: the dates.** A single notice carries several —
published, dispatched, question deadline, site-visit date, closing date, and
sometimes a separate opening date. They are all dates, they all look alike, and
the pre-filter takes the first alias that matches. Pick wrong and rows show as
open weeks after they closed, with no error anywhere. **Probe every source for
which field is the closing date before proposing it**, and record the answer in
the `why` column.

Second trap, smaller: the classification code. A notice can carry the code
system's identifier, a free-text label, or both, and the two disagree more often
than they should.

---

## 02 — criteria

Nudge, worded for this shape:

```
  - what work can you actually deliver, and what would you never bid on?
  - how big a contract is worth the effort of a bid — and how big is too big?
  - how far will you travel, or does it have to be remote-deliverable?
  - how much notice do you need? A tender closing in four days — bid, or bin?
  - anything that has disqualified you before — a certification, a reference
    requirement, a framework you are not on?
```

Read back:

```markdown
must
  - the work is in <the family of work the human delivers>
  - the authority is in <region>, or the contract is deliverable from there
  - the notice is still open — closing date is in the future

range
  - contract value — target <X>, floor <Y>       flagged when unpublished
  - days left to bid — target <N>, floor <M>     flagged, never dropped
  - duration of the contract                     flagged when unstated

nice
  - the authority has bought this kind of work before
  - lot structure allows a bid on part of it, not all of it

open
  - "could we credibly win this" — judging on: what the notice asks for against
    what the human has done before, and whether the requirements read as written
    around an incumbent

not carried over
  - "not too much paperwork" — no notice states this. Ask per tender if it matters.
```

**The stingy-`must` call, this shape:** the classification code looks like the
perfect `must` and it is a trap. Authorities file the same work under
neighbouring codes routinely, and a `must` on the code deletes those rows in
silence — which is exactly the failure the human hired this tool to stop.
Filter on the work in the title and description; keep the code as a `nice`.

**The second one: contract value.** Many notices publish no estimated value at
all. `range`, never `must`, or a floor deletes every quiet authority.

The one `must` that is safe here is **closed is closed**. A tender past its
deadline is not a lower-scoring row, it is not a row.

Prefilter block:

```
title    = <terms for the family of work>
region   = <region terms>
exclude  = <kinds of work the human will never bid on>
```

Note what is **not** in the block: nothing about value, nothing about days left.
Both are `range`, and a `range` never reaches the pre-filter.

---

## 03 — run

Row mapping: issuer = contracting authority · item = notice reference and title ·
where = place of performance · date = **the closing date**. Dedupe on the notice
reference.

The only shape with a real published ID, so the diff key is that ID and nothing
else. `changed` matters more here than anywhere: authorities extend deadlines
and revise documents after publication, and a moved closing date is the single
most actionable thing this shape produces.

```
identity = ref
compare  = title, closing, place
```

**Date handling is the whole shape.** Every row gets a computed `days left`, and
the file is sorted by it, ascending. Two flags:

- `closing soon` — under <N> days. The human sees these first, always.
- `overdue` — closing date has passed. It should have been filtered out; when
  one appears, the source's date field is mapped to the wrong alias. Treat an
  overdue row as a bug report about `sources.md`, not as a result.

A missing closing date is `unknown` and flagged, never assumed open. An
unbounded tender is a parsing failure, not a generous authority.

A scored card:

```markdown
### <authority> — <notice title>
<!-- identity: <notice reference> -->
ref <notice reference> · <place of performance> · [notice](<url>)
published <date> · **closes <date> — <N> days left**
source: central register · also seen: one regional portal

must   ✓ work is in the family
must   ✓ authority in region
must   ✓ still open
range  ⚠ value — not published (target <X>, floor <Y>)
range  ⚠ days left — <N> (target <N>, floor <M>)  ← tight
nice   ✓ authority has bought this before
open   ✓ could we credibly win — <what you read to decide>

5/7 · 1 unknown · 0 must misses · closing soon
<one line on why this one is worth the human's attention>
```

**No probability.** Not "68% chance", not "strong odds". `open` says what you
read and what you concluded; the human decides whether to spend a week on a bid.
This is the number a buyer will ask for by name, and the answer is still no.

The diff, this shape:

```
## closing soon     ← under <N> days, whatever else changed. First, always
## new
## changed          ← deadline extended, documents revised, scope clarified,
                       value corrected. Say which. People act on this section
## unchanged        ← one line each: `<authority> — <notice title> · <score>`
## gone             ← split it:
                       awarded    — and to whom, if the award notice says
                       withdrawn  — cancelled or pulled
## dropped at scoring
```

`changed` carries more weight here than in any other shape. An extended deadline
turns a tender the human wrote off into one they can still bid.

The shortlist line — the closing date belongs in it, because this shape's whole
argument is that a date outranks a score:

```
- [ ] <authority> — <notice title> · closes <date> · 5/7 · 0 must misses <!-- identity: <notice reference> -->
```

Dropped at scoring, this shape. **A closed tender is not a `must` miss and does not
belong here** — it is `gone`, or it never entered. What drops a tender at scoring is
the work not being the work, or a qualification the human cannot meet:

```
- **<authority> — <notice title>** · [notice](<url>) — must #<n> — <what the scope turned out to be>
```

⚠ **The classification code is the trap, and it is a `nice`, not a `must`** — see
*02 — criteria* above. A row dropped here on a code rather than on the work is the
alias bug wearing a different hat: authorities file neighbouring work under
neighbouring codes as a matter of routine.

Gap report, same as every shape:

```
blocked, open by hand: <portals behind a registration wall>
page not read:         <name> — <why>
failed this run:       <name> (<error>)
not checked since:     <name> — <date>
```

---

## 04 — Next Steps

GATE 4 uses the generated shortlist beside the detailed cards.
Propose relevant possibilities without fixing the user's end goal. If the human
chooses contacts, look up **once per authority**, not once per notice — three
ticked tenders from one authority is one lookup.

Lookup order is the same as everywhere, but step 1 pays off far more often here:
a notice names a contact point by law in most jurisdictions. Read the notice
before searching anything.

```markdown
| org | who | role | how | source | found |
|-----|-----|------|-----|--------|-------|
| <authority A> | <name> | <procurement role> | <published address> | notice contact section | <date> |
| <authority B> | — | not found | — | notice names a department, no person | <date> |
```

A notice that names a department and no person is `not found`, written as what
it is. Do not guess a person from the department name.

**Questions to an authority are formal, and often published to every bidder.**
Drafting one is a different thing to make, and the human asks for it by name.
`contacts` hands back the contact and stops.
