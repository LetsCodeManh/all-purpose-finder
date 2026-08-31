# sources — example-jobs

Last updated: 2026-08-28 (run 2026-08-28)

| name | type | url | method | status | last checked | manual status | manual checked | why |
|------|------|-----|--------|--------|--------------|---------------|----------------|-----|
| Northwind Robotics | organisation | https://boards.example.com/api/northwind/jobs | feed (6) | ok | 2026-08-28 | — | — | primary source, posts every role itself, never syndicates |
| Halcyon Analytics | organisation | https://boards.example.com/api/halcyon/jobs | feed (4) | ok | 2026-08-28 | — | — | primary source, clean JSON, publishes a salary band |
| Meridian City Jobs Board | aggregator | https://jobs.example.org/listings | page | ok | 2026-08-28 | — | — | regional coverage no employer feed carries; read by hand |
| Vantage Talent Network | aggregator | https://www.example.net/careers | blocked | blocked | 2026-08-28 | checked | 2026-08-28 | largest volume, login wall — opened by hand once |

- `type` — what kind of place this is, as a column.
- `method` — `feed` · `page` · `blocked`. Established by probing, never guessed.
- `status` — `ok` · `blocked` · `error` · `untested`
- Blocked rows stay, with a URL that can be opened by hand.

## gaps

What is **not** covered by the table above, and why. Coverage, not method.

- national employment agency: searched for a feed, found none published; the
  site is a search form, so there is no stable URL to probe
- university and research-institute boards: not probed this run — they would add
  fixed-term research roles the criteria do not ask for

## notes

How the reading was actually done. Method, not coverage.

- Meridian City Jobs Board publishes no feed; the listings page is the only way
  in, so its rows are read by hand and appended to `listings.md` under the page
  marker
- Vantage Talent Network needs a login. Opened by hand on 2026-08-28: it carried
  two roles, both already in the Northwind feed, so nothing new reached the run.
  The row stays `blocked` — a generic rerun still cannot fetch it
- no source was read for anything about a named person; only what each
  organisation published about its own openings
