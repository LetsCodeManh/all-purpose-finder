---
shape: <shape>
form: ledger | brief
cardinality: one | many
fillers: [<filler>, ...]        # [] when there is nothing to make from the result
---

# example — <shape>

Skeleton for a new shape. Copy it, fill each section **as the session passes
that step**, from what actually happened. Do not guess it up front — a shape
invented in advance describes a run nobody has done.

Delete this paragraph and the italic prompts as you fill them in.

*One line on what this shape is, and what makes it not one of the others.*

- **Result form:** ledger | brief
- **Identity:** issuer = *what* · item = *what*. Or: no dedupe key worth having, because *why*.
- **Recurs?** *weekly · one-shot with a deadline · open-ended — and what the diff means here*
- **Fillers?** *what can be made from this result — `contacts`, a report, a resume,
  links to apply · or nothing, and step 04 is one line*

*What this shape does not have, and why that is fine — a missing pre-filter, no
`gone` section, no expiry. Naming the absence stops the next run treating it as
a bug.*

**Scrub as you write.** This repo is public: placeholders instead of names,
numbers and URLs, and none of the human's actual criteria or results. The file
records the shape. It never records the search.

---

## 00 — session

*Slug, topic and the plan as they were printed at GATE 1 — long form or short,
and the plain-language reading of one-subject vs many-candidates.*

---

## 01 — sources

*What the primary source is for this shape — whoever originates the thing.
Where the human's own knowledge beats searching, and the question to ask them
for it at GATE 2. The method reality: what tends to be `feed`, what is
routinely `blocked` and must never be scraped.*

*A proposed table, placeholders only:*

| name | type | method | why |
|------|------|--------|-----|
|      |      |        |     |

***Field-alias trap, this shape:*** *the field this domain carries twice at
different precision, and what breaks silently when the wrong one is picked.*

---

## 02 — criteria

*The nudge, worded for this shape. Whether criteria read as filters to score or
as questions to answer.*

*The read-back, in the four kinds.*

***The stingy-`must` call, this shape:*** *the one rule that looks like a `must`
and must not be one, and what it deletes if it is.*

*The prefilter block — or a line saying it is omitted, and why.*

---

## 03 — run

*Row mapping, or the brief's sections. What is `unknown` rather than a miss.
What the diff sections are called here, and which one the human actually acts on.*

*One filled card, or one brief skeleton.*

*The gap report, which every shape has.*

---

## 04 — output

*Per organisation, or skipped. If skipped, say what `next:` points at instead —
a rerun, a date, a decision.*
