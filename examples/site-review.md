---
shape: site-review
form: ledger
cardinality: many
selection: rows
---

# example — site-review

One site is being redesigned. The candidates are not listings but **reference
designs** — other sites, gathered from award galleries, that the redesign could
learn from. Unlike `company-research`, the subject is not the thing being chosen;
unlike `jobs` or `tenders`, nothing here expires or closes.

- **Result form:** ledger
- **Identity:** issuer = the gallery the candidate came from · item = the candidate's domain. No date in the key: award galleries re-surface the same site for years.
- **Recurs?** one-shot, unless the subject is redesigned again. A diff would mean the galleries moved, not that the subject did.
- **Selection:** ticked rows in `shortlist.md`
- **Next steps?** a design direction written up, a page-by-page rebuild plan, a fix list for the existing site, a moodboard of ticked references.

This shape has **no pre-filter worth the name**. The one `must` a regex can test
is a rejection word that gallery markup does not contain, so the block exists,
runs, and drops almost nothing. Say so rather than letting the empty drop list
read as a clean sweep. It also has no `gone` section in practice on a first run.

**Scrub as you write.** Placeholders only. No session facts, URLs or vendors.

---

## 00 — session

Slug names the subject and the intent. The plain-language read to settle at
GATE 1 is whether the user wants **one subject** (a critique of their own site)
or **many candidates** (references to choose between). Both start from the same
sentence — "make our site modern" — and produce completely different files.

---

## 01 — sources

The primary source is **the subject's own site**, and its sitemap is the only
reliable feed: it names every page the redesign has to cover. Everything else is
a `page` source read by hand.

Award galleries are the candidate supply. Their listings are `page`, not `feed`:
several publish no RSS at all, and some render the list in JavaScript, in which
case they yield nothing and must be recorded as read-and-empty rather than
quietly dropped. Expect at least one gallery to answer 403 or 429; it stays in
the table as `blocked` with an openable URL.

The user's own knowledge beats searching on exactly one thing, and it is worth
asking at GATE 2: **who the site is for and what a visitor should do.** No source
contains it. If it goes unanswered it stays a visible gap through the whole run.

| name | type | method | why |
|------|------|--------|-----|
| subject site | subject | page | the thing being replaced |
| subject sitemap | subject index | feed | the page inventory |
| award gallery, sector category | reference | page | candidates in the same subject matter |
| award gallery, general | reference | page | candidates for craft alone |
| performance / accessibility standard | standard | page | the thresholds candidates are measured against |
| local lab audit tool | measurement | page | numbers for the subject, so "modern" is not only taste |
| parent or brand-owner site | brand constraint | page | how far the identity is allowed to move |

***Field-alias trap, this shape:*** a measured **declared** byte total is not a
**transferred** byte total. A lazy-loaded or never-played video contributes its
whole `Content-Length` to the first number and nothing to the second. Pick the
wrong one and a site ranks two orders of magnitude worse than a visitor
experiences. Rank on it, never quote it.

---

## 02 — criteria

The nudge is: what would you reject on sight, what caught your eye, how fast does
it have to be, who builds it, and what has already been tried. Criteria read as
filters to score, not as questions to answer.

***The stingy-`must` call, this shape:*** "fast" is not a `must`. Users say it
emphatically and mean it, but almost every award-winning candidate misses every
speed number, so a speed `must` empties the ledger and hides the whole reference
set. It belongs in `range`, where a miss is flagged and stays visible. The one
speed-adjacent thing that does earn a `must` is a named accessibility behaviour,
because that is a yes/no fact rather than a target.

The prefilter block is written and run, and its patterns come only from `must`
lines — but state plainly that motion intensity is not present in gallery markup,
so the deterministic drop does almost nothing and the real screening is reading.

---

## 03 — run

Rows map one candidate site to one card. The subject's own pages go in
`listings.md` from the sitemap feed and are never scored: they are scope, not
candidates. Mark them `kept: no` with a baseline reason.

`unknown` versus a miss matters more here than in any other shape. A library or
media query that is **absent from the files actually fetched** is `?`, not `✗` —
the run reads a capped number of assets per site, so absence is not proof. Only a
positively observed thing drops a row. `not read` is the whole rendered
appearance: the run never sees a pixel, and every aesthetic criterion is
therefore unresolved by construction. Say this in the run header, not in a
footnote, or the ledger reads as a verdict it has not earned.

A filled card carries: the award status, one line per criterion, the measured
numbers with their unit made honest, and one sentence on why this candidate is
worth the user's time. The score line is
`<n>/<n> must · <n> range flags · <n> must misses`.

The shortlist line reads `<gallery> — <site name> · <score>`. `shortlist.py`
writes it beside `results.md`.

A `## dropped at scoring` line here names the motion `must` almost every time:
the candidate that stacks 3D, smooth-scroll hijacking and autoplay video at once.
Write what it stacked, so the user can overrule a drop they disagree with.

The gap report always contains at least: galleries that yielded nothing and why,
the capped-asset limitation, the declared-versus-transferred byte caveat, and any
unanswered question about audience.

---

## 04 — Next Steps

Advisor's job here is to keep craft separate from fitness. The ledger can say a
candidate is light, accessible and award-winning; it cannot say the design suits
the user's visitors, because no source knows who those visitors are. Name that
line every time.

If an output is chosen it lives at `outputs/<name>/README.md`. If nothing is
made, `next:` points at the user viewing the ticked references themselves — the
one step no script can do for them.
