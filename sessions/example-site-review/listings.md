# listings — fetched 2026-08-31

11 rows · 5 kept · 5 new · 0 changed · 0 unchanged · 0 gone

Raw fetch cache plus the diff's `state` column. Not a result file: never scored,
never ticked, never read by a next step. `kept: no` rows are held and never
deleted — a drop you cannot see is a drop you cannot disagree with.

The subject's own pages sit here too, from the sitemap feed. They are scope, not
candidates: they say what the redesign has to cover, and they are never scored.

| issuer | item | url | year | state | kept | source |
|---|---|---|---|---|---|---|
| Larkspur Ceramics | home | https://www.larkspur.example/ | 2019 | new | no:subject | Larkspur Ceramics sitemap |
| Larkspur Ceramics | shop index | https://www.larkspur.example/shop | 2019 | new | no:subject | Larkspur Ceramics sitemap |
| Larkspur Ceramics | product page | https://www.larkspur.example/shop/bowl | 2019 | new | no:subject | Larkspur Ceramics sitemap |
| Larkspur Ceramics | about the studio | https://www.larkspur.example/about | 2019 | new | no:subject | Larkspur Ceramics sitemap |
| Larkspur Ceramics | workshops | https://www.larkspur.example/workshops | 2021 | new | no:subject | Larkspur Ceramics sitemap |
| Larkspur Ceramics | contact | https://www.larkspur.example/contact | 2019 | new | no:subject | Larkspur Ceramics sitemap |

## page sources — read by hand, appended after the script

`prefilter.py` handles feeds only. A `page` source is read by hand and its
survivors go here. The script preserves everything below this marker across runs
and does not treat it as cache, so hand-added rows survive a `--refetch`.

| issuer | item | url | year | state | kept | source |
|---|---|---|---|---|---|---|
| Studio Awards | hollowform.example | https://hollowform.example/ | 2026 | new | yes | Studio Awards, ceramics category |
| Studio Awards | kiln-and-co.example | https://kiln-and-co.example/ | 2025 | new | yes | Studio Awards, ceramics category |
| Studio Awards | glazeworks.example | https://glazeworks.example/ | 2026 | new | yes | Studio Awards, ceramics category |
| Craft Gallery Weekly | vessel-atelier.example | https://vessel-atelier.example/ | 2025 | new | yes | Craft Gallery Weekly |
| Craft Gallery Weekly | northshore-pottery.example | https://northshore-pottery.example/ | 2024 | new | yes | Craft Gallery Weekly |

read and nothing survived: Modern Web Showcase — the gallery renders its list in
JavaScript and the fetch returns an empty shell. Read, empty, recorded as such
rather than quietly dropped.

read for thresholds, not candidates: Accessibility standard, AA quick reference ·
Local lab audit tool · Larkspur Ceramics (the subject's own home page, read by
hand alongside its sitemap).
