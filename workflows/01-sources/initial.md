# Choose sources

Turn the topic into a source list the user owns.

## Discover

Search live; sites and feeds change. Before Gate 3, read only enough to establish
the method, fields, and usefulness. Do not retrieve or score the full result set.

Look for domain aggregators, smaller or regional sources, anything the user
named, and especially primary publishers. Name what “primary” means for this
topic before searching.

For each candidate, use the session's `tools/probe.py`. Create it from
`sessions/_template/tools/README.md` if needed. Try, in order:

1. `feed` — a working RSS, JSON, or public API with real items
2. `page` — items present in plain HTML
3. `blocked` — auth, bot protection, JavaScript, or a required custom scraper

Never guess the method or write a per-site scraper. A large feed that cannot be
read in one request is `blocked`. Record a precise failure such as `403`,
`timeout`, `empty`, or wrong content. Check field aliases because choosing the
wrong duplicate field can silently mislabel every row.

## Propose and stop — Gate 2

Present one table ordered `feed`, `page`, then `blocked`. Each row needs name,
type, URL, method, and one clause explaining what it adds. State what you looked
for but did not find and what you could not check.

Ask: “Cut what is noise and add what I missed. Then I’ll write the file.” Stop.

Probe user additions in the same way before adding them. Do not copy
`sources.md` before approval.

## Write after approval

Copy `sessions/_template/sources.md` and fill it. Use one table.

- `status`: `ok`, `blocked`, `error`, or `untested`
- `last checked`: the actual fetch date
- a blocked source stays in the table with its openable URL
- `manual status`: `checked`, `partial`, `unavailable`, or `—`
- `manual checked`: the manual/browser check date or `—`
- a clean response with the wrong content is `error`, not `ok`

Keep `## gaps` for missing coverage and `## notes` for method limitations,
manual checks, and privacy exclusions. Do not move blocked rows into prose, put
findings here, store regexes here, or turn gaps into promises. An empty gaps
section must explain why coverage is believed complete.

Delete an unused session `tools/` folder. Otherwise its scripts remain local to
that session and follow `sessions/_template/tools/README.md`.

Update `MEMORY.md` to `status: criteria`, `next: write criteria`, then route to
`workflows/02-criteria/README.md`.
