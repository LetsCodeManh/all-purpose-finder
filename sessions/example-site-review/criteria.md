# criteria — example-site-review

Approved: 2026-08-30
Last amended: —

## must
- a live site for a studio, maker or gallery — not an agency portfolio, not a template demo
- navigation is operable by keyboard, with a visible focus state and no keyboard trap
- motion can be escaped: no autoplay video with sound, no scroll hijacking
- published or last refreshed within three years

## range
- largest contentful paint — target 2.5s          flagged, never dropped
- transferred page weight — target 1.2 MB         flagged when only a declared total is available
- body-text contrast — target 4.5:1               flagged when measured below

## nice
- type-led rather than image-led
- a real path from looking to buying, not a contact form standing in for one

## open
- "it should feel like a person made it" — judging on: whether photography is of
  the actual work, whether the copy is written or filled in, whether anything on
  the page is specific to this maker

## notes
- speed is deliberately **not** a `must`. Users say "fast" emphatically and mean
  it, but nearly every award-winning candidate misses every speed number, so a
  speed `must` empties the ledger and hides the reference set. It sits in `range`,
  where a miss is flagged and stays visible
- the one speed-adjacent thing that does earn a `must` is a named accessibility
  behaviour, because that is a yes/no fact rather than a target

## not carried over
- "make it modern" — the sentence the session started from. Nothing in it is
  checkable; it decomposed into the `range` numbers and the `open` line above.

## prefilter

```
kind     = studio|maker|gallery|ceramic|craft|workshop
exclude  = template|theme demo|agency portfolio|dribbble shot
year     = 202[4-9]
identity = url
compare  = title, gallery, year
```

One pattern per `must` line a regex can check. Two of the four `must` lines have
no pattern at all: keyboard operability and dismissible motion are not present in
gallery markup, so **the block runs and drops almost nothing**. The real screening
is reading. An empty drop list here is not a clean sweep — see `results.md`.
