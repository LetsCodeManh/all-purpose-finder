# The machine-read lines

Every line in a session that something other than a human reads. A script, the
audit or the UI parses each one; break the shape and the run fails to publish or
the screen goes blank. **Everything not listed here is prose and is never
parsed** — headings a shape renamed, the sentence on a card, the reason a source
is blocked. Do not add validation for those.

The tracked `sessions/example-*/` folders are worked, valid instances made from
dummy data. Together they exercise every built-in shape.

Readers: `A` = `tools/session_audit.py` · `P` = `tools/publish_run.py` ·
`U` = `ui/server.py` + `ui/app.js` · `S` = the session's `tools/shortlist.py`.

## MEMORY.md — frontmatter

Read by `tools/memory.py`, the repo's one frontmatter reader. `key: value`, one
per line, between two `---` lines. A trailing `# comment` on the value is
allowed. After the block, one `next: <line>`.

| key | value | readers |
|-----|-------|---------|
| `slug` | must equal the folder name | A U |
| `shape` | a name; `examples/<shape>.md` supplies its four fields, and a missing file is fine | A P U |
| `status` | `sources` · `criteria` · `run` · `next-steps` · `done`, or a non-reserved output name matching `^[a-z0-9][a-z0-9-]*$`; an output name requires `outputs/<name>/README.md` | A P U |
| `last run` | `YYYY-MM-DD` or `—` | A P U |
| `pending run` | `YYYY-MM-DD` or `—`; a date is only valid while `status: run` | A P U |

## examples/&lt;shape&gt;.md — frontmatter

Read by `tools/shape.py` without a YAML dependency: bare values, no inline
comments. `form: ledger|brief` · `cardinality: one|many` · `selection:
rows|artifact`. Anything unreadable falls back to `ledger`/`many`/`rows`.

## sources.md

- `Last updated: YYYY-MM-DD` at the top — A
- one pipe table containing at least the columns `name`, `type`, `url`,
  `method`, `status`, `last checked`, `manual status`, `manual checked`, `why`.
  Header order is free; cell count must match the header — A U
- `method` — first word is `feed` · `page` · `blocked` (`feed (6)` is fine) — A
- `status` — `ok` · `blocked` · `error` · `untested`; `blocked` method demands
  `blocked` status — A U
- `url` — `http`/`https`, and for a `brief` every domain cited in `results.md`
  must appear here — A
- `last checked`, `manual checked` — `YYYY-MM-DD` or `—` — A
- `manual status` — `checked` · `partial` · `unavailable` · `—`; the first three
  demand a real `manual checked` date — A

## criteria.md

- `Approved: YYYY-MM-DD` — A
- `Last amended:` present (a `—` counts) — A
- a fenced block under `## prefilter` of `key = value` lines — U, and the
  session's own `regex.py`. `identity` and `compare` are keys there, not filters

## listings.md — `cardinality: many` only

- `# listings — fetched YYYY-MM-DD` as the first heading. The date must equal
  `last run` — A P U. Missing, and `publish_run.py finish` refuses the run
- the stat line, within the first 12 lines: `<N> rows · <N> kept · …` — U reads
  every `<number> <word>` pair off it, so the labels after the first two are
  free
- `## page sources` — the marker A looks for to prove a `page`+`ok` source was
  read. Everything below it survives a `--refetch`
- the table's `state` column: `new` · `changed:<cols>` · `unchanged` · `gone`,
  and `kept`: `yes` or `no:<pattern>` — the session's `prefilter.py`
- never served whole by the UI: only its head is read

## results.md

- `Run YYYY-MM-DD · <N> new · <N> changed · <N> unchanged · <N> gone` (a
  `brief` writes `Prepared YYYY-MM-DD`). The date must equal `last run` — A P U S
- in the first 12 lines, if written at all: `<N> sources checked|read` and
  `<N> browser-dependent` must agree with `sources.md` — A
- `## new` · `## changed` · `## unchanged` are the sections `S` projects from;
  `## gone` and `## dropped at scoring` are skipped. **A shape may rename or
  drop any section** — nothing counts cards per heading
- `### <issuer> — <item>` opens a card — U S
- `<!-- identity: <value> -->` — exactly one per card or collapsed row, and the
  key everything joins on. `A` fails a `shortlist.md` row with no `results.md`
  row behind it
- the score line, alone on its line and last in the card:
  `^\d+/\d+ must\b.*must misses$` — S copies it verbatim into the shortlist. A
  collapsed `unchanged` row carries it after ` · `:
  `- <issuer> — <item> · <score> <!-- identity: … -->`
- a criterion line renders as a chip only in the form
  `(must|range|nice|open|note) <✓|⚠|✗|?> <text>` — U
- a dropped row renders only as
  `- **<issuer> — <item>** · <source> · [<label>](<url>) — must #<n> — <text>` — A U

## shortlist.md — `selection: rows` only

- `Run YYYY-MM-DD · <N> rows`; the date must equal `last run` and `<N>` must
  equal the number of checkbox lines — A U
- one row per kept result row, and **nothing else in the file starts with a
  checkbox**:
  `- [ ] <issuer> — <item> · <score> <!-- identity: <value> -->` — A U S.
  Identities must be unique; a row without one is an error
- the only file the UI may write, and it may only flip `[ ]` ↔ `[x]`
- the ticked count is deliberately not in the header — count the boxes

## outputs/&lt;name&gt;/README.md

Every chosen output has one canonical Markdown entry at this path — A U. `<name>` must
equal the output-name `status` in `MEMORY.md` when it is the current output and
cannot be a reserved status name. The audit requires a README in every output
folder and the UI renders each one under the Next Steps output tree. Supporting
files may sit in the same folder; they are not parsed by the engine. Do not create
the folder before Gate 4 chooses it.
