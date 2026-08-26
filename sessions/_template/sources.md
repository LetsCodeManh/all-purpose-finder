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
