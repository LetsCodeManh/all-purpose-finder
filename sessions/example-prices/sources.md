# sources — example-prices

Last updated: 2026-08-30

| name | type | url | method | status | last checked | manual status | manual checked | why |
|------|------|-----|--------|--------|--------------|---------------|----------------|-----|
| Cedar Market | seller | https://catalog.example/cedar/feed.json | feed (3) | ok | 2026-08-30 | — | — | primary weekly catalogue with product, price, and validity window |
| Lantern Grocer | seller | https://offers.example/lantern/feed.json | feed (2) | ok | 2026-08-30 | — | — | primary offers feed covering the other nearby seller |
| Paper Basket | seller | https://flyers.example/paper-basket | blocked | blocked | 2026-08-30 | unavailable | 2026-08-30 | image-only flyer; retained for a manual check rather than scraped |

## gaps

- independent corner shops do not publish stable weekly catalogues, so their
  unadvertised prices are outside this run
- Paper Basket could not be read; its image flyer may contain missing offers

## notes

- Cedar Market calls the end of the offer `valid_until`; Lantern Grocer calls it
  `window_end`. The dummy normalisation maps both before comparing rows
- Paper Basket was opened on 2026-08-30, but the flyer image did not expose
  readable item text; no offer was inferred from pixels
