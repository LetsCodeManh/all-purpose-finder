# results — example-site-review

Run 2026-08-31 · 4 new · 0 changed · 0 unchanged · 0 gone · 1 dropped at scoring
8 sources checked, 1 browser-dependent · 11 listings fetched, 5 kept

**The run never sees a pixel.** Every candidate below was read as markup, a
capped sample of its assets, and a lab measurement — not as a rendered page. So
the whole aesthetic side of "modern" is unresolved by construction: the `open`
criterion is `?` on every row, and no `nice` line about type or photography is
anything more than what the markup admits. This ledger ranks craft evidence. It
does not tell you a design suits your visitors, because no source here knows who
they are — that question went unanswered at GATE 2 and is still open.

`?` is not `✗`. A library or media query absent from the files actually fetched
is unknown, not missing: the run reads a capped number of assets per site. Only a
positively observed thing drops a row.

***Byte totals are declared, not transferred.*** A lazy-loaded or never-played
video contributes its whole `Content-Length` to the declared number and nothing
to what a visitor pays. Where only a declared total was available the range line
says so and is flagged, never ranked on.

Nothing is ticked here. The decision lives in `shortlist.md`.

## new

### Studio Awards — hollowform.example
<!-- identity: hollowform.example -->
[site](https://hollowform.example/) · awarded 2026 · Studio Awards, ceramics category
source: Studio Awards, ceramics category

must   ✓ subject kind — a working ceramics studio selling its own pieces
must   ✓ keyboard — tab order reaches every nav item, focus ring is visible and unstyled-away
must   ✓ motion — one hover transition, no autoplay video, no scroll hijacking
must   ✓ recency — refreshed 2026
range  ✓ largest contentful paint — 1.9s measured (target 2.5s)
range  ✓ transferred weight — 0.8 MB transferred (target 1.2 MB)
range  ⚠ body-text contrast — 3.9:1 measured on the caption grey (target 4.5:1)
nice   ✓ type-led — the grid is set in one typeface, images sit inside it
nice   ✓ a real shop path — product pages with prices, not a contact form
open   ? feels like a person made it — not read (no rendered view)

4/4 must · 1 range flag · 0 must misses
The closest match in the whole set to what Larkspur already sells, and the only
candidate that is both light and keyboard-clean. Its one flag is a contrast miss
on captions — a fixable detail, not a reason to skip it.

### Studio Awards — kiln-and-co.example
<!-- identity: kiln-and-co.example -->
[site](https://kiln-and-co.example/) · awarded 2025 · Studio Awards, ceramics category
source: Studio Awards, ceramics category

must   ✓ subject kind — studio and teaching workshop
must   ✓ keyboard — visible focus state, no trap in the menu
must   ✓ motion — a fade on scroll that respects reduced-motion
must   ✓ recency — refreshed 2025
range  ⚠ largest contentful paint — 4.1s measured (target 2.5s)
range  ⚠ transferred weight — 3.4 MB declared, transferred total not available (target 1.2 MB)
range  ⚠ body-text contrast — 4.2:1 measured (target 4.5:1)
nice   ✓ type-led — headings carry the layout
nice   ⚠ a real shop path — enquiry form only, no prices published
open   ? feels like a person made it — not read (no rendered view)

4/4 must · 3 range flags · 0 must misses
The heaviest candidate that still passes every `must`. Worth keeping precisely
because it shows what the workshop pages could look like — the part of Larkspur's
sitemap no other candidate covers.

### Craft Gallery Weekly — vessel-atelier.example
<!-- identity: vessel-atelier.example -->
[site](https://vessel-atelier.example/) · listed 2025 · Craft Gallery Weekly
source: Craft Gallery Weekly

must   ✓ subject kind — maker-run gallery
must   ✓ keyboard — focus visible throughout, skip link present
must   ✓ motion — none beyond a colour transition
must   ✓ recency — refreshed 2025
range  ✓ largest contentful paint — 2.2s measured (target 2.5s)
range  ⚠ transferred weight — 1.9 MB transferred (target 1.2 MB)
range  ⚠ body-text contrast — 4.4:1 measured (target 4.5:1)
nice   ✓ type-led — no hero image at all
nice   ✓ a real shop path — priced, with stock state on the product page
open   ? feels like a person made it — not read (no rendered view)

4/4 must · 2 range flags · 0 must misses
The only candidate carrying a skip link, and the only one that publishes stock
state — the two things Larkspur's current shop pages lack outright.

### Craft Gallery Weekly — northshore-pottery.example
<!-- identity: northshore-pottery.example -->
[site](https://northshore-pottery.example/) · listed 2024 · Craft Gallery Weekly
source: Craft Gallery Weekly

must   ✓ subject kind — pottery studio, sells direct
must   ✓ keyboard — focus ring present, order follows the layout
must   ✓ motion — a marquee, pausable on hover and on focus
must   ✓ recency — refreshed 2024
range  ⚠ largest contentful paint — 3.0s measured (target 2.5s)
range  ✓ transferred weight — 1.1 MB transferred (target 1.2 MB)
range  ⚠ body-text contrast — 4.0:1 measured (target 4.5:1)
nice   ⚠ type-led — image-led above the fold
nice   ✓ a real shop path — priced product pages
open   ? feels like a person made it — not read (no rendered view)

4/4 must · 2 range flags · 0 must misses
The oldest candidate that still clears recency, and the one whose structure is
closest to Larkspur's existing sitemap — useful as a page-for-page comparison
rather than as a look to copy.

## dropped at scoring

1 row survived the prefilter and was then dropped by a `must` miss. It names the
criterion, so it can be overruled.

- **Studio Awards — glazeworks.example** · Studio Awards, ceramics category · [site](https://glazeworks.example/) — must #3 — stacks a 3D canvas, scroll hijacking and an autoplay video with sound, none of it dismissible

The prefilter's own drops are not here. They are in `listings.md`, held as
`kept: no` rows with their reason — and this run that means the subject's own six
pages and nothing else. **The prefilter dropped no candidate at all.** Two of the
four `must` lines cannot be tested by regex, so the empty drop list is a
limitation of the pre-filter, not a clean sweep.

## gaps this run

```
blocked, open by hand: Type & Grid Index
manually checked:      Type & Grid Index (checked, 2026-08-31) — 429 on every fetch; opened by hand, carried 3 sites, all already listed by Studio Awards
page read, nothing:    Modern Web Showcase — list rendered in JavaScript, fetch returns an empty shell
rendered appearance:   never read — no candidate was viewed as a page
assets per site:       capped sample; an unobserved library is `?`, never `✗`
byte totals:           declared where noted, not transferred — never ranked on
unanswered since GATE 2: who the site is for and what a visitor should do
```
