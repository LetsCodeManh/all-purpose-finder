---
shape: prices
form: ledger
cardinality: many
fillers: []
---

# example — prices

One shape, walked end to end. Illustration, not procedure.

Placeholders where a name, a number or a URL would be. This repo is public and
standalone — no live links, and no real session's content.

- **Result form:** ledger — rows, grouped by seller, each with a validity window.
- **Identity:** issuer = the seller · item = the product.
- **Recurs?** Yes, and faster than jobs — a weekly cycle, and every row expires
  on a stated date. The diff that matters is *new this week* and *ends tomorrow*.
- **Fillers?** **None.** `fillers: []` — nothing to make from a price list and
  nobody to look up. Step 04 is one line, and the result is the end of the road.
- **Ticks?** **No.** The tick is what feeds a filler, and this shape has none, so
  it writes no `shortlist.md` at all. GATE 4 here asks for a review, not a tick.

The one structural difference from jobs: **every row carries a from–to window**,
and a row outside its window is not a result, it is history.

---

## 00 — session

```
Slug:  <category>-deals-<city>
Topic: weekly discounts on <category> at stores in and around <city>.
Reading this as many candidates to pick from.

Same four stops as last time: sources, criteria, results, then a review —
there is nothing to make from a price list. Approving this approves the plan only.

Good? Rename it if the slug is wrong.
```

---

## 01 — sources

**Primary source for this shape:** the seller's own weekly flyer or promotions
feed. Aggregator sites republish it late and drop the end date, which is the one
field that matters most.

Sweep, in this order:

1. **The obvious sellers** — the large chains in the region. Wide coverage, and
   the human already knows them, so these are the rows they will skim fastest.
2. **The ones they would not have listed** — independents, discount chains,
   regional and ethnic grocers, warehouse and clearance sellers. Ask for these
   explicitly at GATE 2: *"which shops do you actually rate that I would not have
   found by searching?"* This is where the shape earns its keep.
3. **Aggregators of flyers** — useful when a seller publishes nothing readable,
   worth less when the seller does.

| name | type | method | why |
|------|------|--------|-----|
| large chain, promotions API | seller | feed (N items) | full weekly list with real from–to dates |
| second large chain, flyer page | seller | page | readable HTML, dates in the header |
| independent grocer | seller | blocked (flyer is a PDF/image) | consistently the best prices — open by hand |
| flyer aggregator | aggregator | page | covers the sellers that publish nothing machine-readable |

**Method reality for this shape:** flyers are very often a PDF or a set of
images. That is `blocked`, and the row stays with a URL to open by hand. Do not
write an image scraper. A seller who publishes only pictures is a seller the
human checks manually — say so every run.

**Field-alias trap, this shape:** a promotions feed can carry several prices per
row — the regular price, the member price, and the price with a coupon — and
several dates. Establish which field is the actual sale price and which pair is
the sale window before proposing the source. The wrong pick shows a discount
that nobody can get.

---

## 02 — criteria

Nudge, worded for this shape:

```
  - what do you actually buy — the list you would want every week?
  - what would you buy on impulse if the price were low enough?
  - the discount that makes it worth a trip — percent, or a price you would pay?
  - which stores are you willing to travel to, and how far?
  - anything you never want to see, however cheap?
```

Read back:

```markdown
must
  - product is on the standing list, or in an exception category below
  - seller is within <distance> of <where the human is>
  - the discount is live now, or starts within <N> days

range
  - discount depth — target <X>%, worth a look from <Y>%   flagged when only an absolute price is given
  - unit price — target <X> per <unit>                     flagged when the unit is not stated

nice
  - stacks with a loyalty programme the human already has
  - sizes that keep, over sizes that spoil

open
  - "an exceptionally good deal on something not on the list" — judging on:
    depth of discount against the usual price for that item, not against the
    seller's own claim

not carried over
  - "good quality" — the flyer does not say. Ask per item if it matters.
```

**The stingy-must call, this shape:** the standing shopping list looks like a
hard `must`, and it mostly is — but a `must` on the list alone deletes the
category the human named as the reason to run this at all: *the surprise good
deal*. Hence the `open` line, which lets a strong discount on an unlisted item
survive. This is the shape's one real design decision.

Prefilter block:

```
item    = <standing list terms, alternated>
seller  = <chains within range>
exclude = <categories the human never wants>
```

Keep `item` loose. A deal wrongly dropped here is never seen — and this shape
reruns weekly, so a dropped row is not merely missed once, it is missed
systematically.

---

## 03 — run

Row mapping: issuer = seller · item = product · where = branch or region · date
= **the window**, not one date. Dedupe on seller + product.

★ **This is the shape where `identity = url` is wrong.** One flyer page carries
two hundred products, so every row shares a url and the whole flyer collapses
into one row. Key on the product instead:

```
identity = company+title
compare  = price, window_end
```

And the reason the date is in `compare` and never in `identity`: milk at 2.19
last week and 2.49 this week is **one row that changed**, which is the entire
news. Put the week in the key and it becomes a new row plus a vanished one, the
price move is never reported, and every run reads 100% new and 100% gone.

Note `price` has to be a **column this session's `prefilter.py` normalises** —
the jobs columns do not carry one. A `compare` naming a column nobody fetches is
a comparison that never fires, so the script rejects it rather than running
quietly.

**A window is two fields.** A row whose end date is missing is `unknown` and
flagged, not dropped — but say it clearly, because an unbounded sale is usually
a parsing failure, not a generous seller.

Grouped by seller, so the output maps to one trip:

```markdown
## <seller A> — valid <from> → <to>

| item | price | usual | depth | note |
|------|-------|-------|-------|------|
| <product> | <price> | <usual price> | <-N%> | on the standing list |
| <product> | <price> | <usual price> | <-N%> | open — not on the list, unusually deep |

## <seller B> — valid <from> → <to>
...
```

The diff, this shape:

```
## new this week
## ending soon      ← window closes within <N> days. This section is the one people act on
## unchanged        ← same price as last week, collapsed to one line
## gone             ← was on sale last week, is not now
```

Gap report is the same as every shape, and here it is mostly the image-flyer
sellers:

```
blocked, open by hand: <sellers who publish flyers as images>
failed this run:       <name> (<error>)
not checked since:     <name> — <date>
```

---

## 04 — output

Skipped. `fillers: []` — nothing to make, nobody to look up.

```
Nothing to make from this one — the result is the end of it.
MEMORY.md → status: run, next: rerun when the new week's flyers land.
```

This is not a hole: `fillers: []` in the frontmatter above says why this shape
stops at `run`, once, for every session of it. No shortlist and no ticks anywhere
in this shape either, so a run that reports zero ticked rows here is correct
rather than an empty gate.

Note the loop: this shape does not finish, it cycles. `next:` points back at the
run, not forward at a step that does not apply.
