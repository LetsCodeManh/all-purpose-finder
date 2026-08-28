# sources — <slug>

Last updated: YYYY-MM-DD

| name | type | url | method | status | last checked | manual status | manual checked | why |
|------|------|-----|--------|--------|--------------|---------------|----------------|-----|
|      |      |     |        |        |              |               |                |     |

- `type` — what kind of place this is, as a column. Not a folder, not a separate file.
- `method` — `feed` · `page` · `blocked`. Established by probing, never guessed.
- `status` — `ok` · `blocked` · `error` · `untested`
- `last checked` — the date it was actually fetched. Stale rows are the point.
- `manual status` — `checked` · `partial` · `unavailable` · `—`; only for a
  human-authorized browser or hand check of a blocked source.
- `manual checked` — the date of that manual check, or `—`.
- Blocked rows stay, with a URL the human can open by hand.

## gaps

What is **not** covered by the table above, and why. Coverage, not method.

- <kind of source considered and not probed — and what it would add if it were>
- <what was searched for and does not appear to exist>

## notes

How the reading was actually done. Method, not coverage.

- <no feed found for X — the page is the only way in>
- <a blocked source checked by hand on <date>: what it turned out to hold>
- <a source excluded on privacy grounds, and the ground>
