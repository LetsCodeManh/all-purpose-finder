# sources — example-site-review

Last updated: 2026-08-31 (run 2026-08-31)

| name | type | url | method | status | last checked | manual status | manual checked | why |
|------|------|-----|--------|--------|--------------|---------------|----------------|-----|
| Larkspur Ceramics | subject | https://www.larkspur.example/ | page | ok | 2026-08-31 | — | — | the site being replaced |
| Larkspur Ceramics sitemap | subject index | https://www.larkspur.example/sitemap.xml | feed (6) | ok | 2026-08-31 | — | — | the page inventory the redesign has to cover |
| Studio Awards, ceramics category | reference | https://awards.example.org/category/ceramics | page | ok | 2026-08-31 | — | — | candidates in the same subject matter |
| Craft Gallery Weekly | reference | https://gallery.example.net/craft | page | ok | 2026-08-31 | — | — | candidates for craft alone |
| Modern Web Showcase | reference | https://showcase.example.net/sites | page | ok | 2026-08-31 | — | — | general-craft candidates; renders its list in JavaScript |
| Type & Grid Index | reference | https://index.example.com/sites | blocked | blocked | 2026-08-31 | checked | 2026-08-31 | 429 on every fetch — opened by hand once |
| Accessibility standard, AA quick reference | standard | https://standards.example.org/a11y-aa | page | ok | 2026-08-31 | — | — | the thresholds candidates are measured against |
| Local lab audit tool | measurement | https://lab.example.org/audit | page | ok | 2026-08-31 | — | — | numbers for the subject, so "modern" is not only taste |

- `type` — what kind of place this is, as a column.
- `method` — `feed` · `page` · `blocked`. Established by probing, never guessed.
- `status` — `ok` · `blocked` · `error` · `untested`
- Blocked rows stay, with a URL that can be opened by hand.

## gaps

What is **not** covered by the table above, and why. Coverage, not method.

- **who the site is for, and what a visitor should do.** Asked at GATE 2, left
  unanswered. No source contains it, so it stays a visible gap through the whole
  run: the ledger can rank craft, it cannot rank fit
- print and packaging work by the same studios: out of scope, the redesign is
  the website only
- galleries older than three years: not probed — the `must` on recency would
  drop everything they carry
