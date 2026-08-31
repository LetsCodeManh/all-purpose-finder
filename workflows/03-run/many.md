# Run many candidates

Use this only for `cardinality: many`.

## Fetch and prefilter

Run the session's deterministic prefilter:

```sh
python3 sessions/<slug>/tools/prefilter.py <slug> [--refetch]
```

Patterns come only from approved `must` lines in `criteria.md`; never pass an
unstored regex on the command line. Keep patterns loose. Missing fields pass.
Run `--selfcheck` after changing a session script.

The script reads `feed` + `ok` sources, normalises fields, deduplicates on the
approved identity, records every kept and dropped row in `listings.md`, and writes
`new`, `changed:<cols>`, `unchanged`, or `gone`. It must report failed sources by
name. Read the state column; never recreate the diff by eye.

For each `page` + `ok` source, either read it and append survivors under
`## page sources`, or name it as `not read this run` with the reason. Keep the same
column shape. Never fetch a `blocked` source; include its hand-open URL in the
result gaps.

Update `last checked` only for sources actually fetched or read. Keep failures in
the table, record the precise error and date in `## notes`, and never make a
silently skipped source look fresh.

## Score

On a normal rerun, score only kept `new` and `changed` rows. Carry unchanged cards
forward. After criteria changed, re-score every affected card.

- only a `must` miss drops
- `range` misses and missing values stay visible
- `nice` ranks lower
- `open` records the judgement and evidence
- never compensate one criterion with another or invent a percentage

Distinguish `not published` from `not read`. The run header states how deeply
bodies were read and which criteria could not be decided at that depth.

## Write results

Start from `sessions/_template/results.md` and the shape example. Each kept card
has one stable identity marker, source links, criterion lines, a literal count of
criteria hits and gaps, and one useful summary line. Results contain no checkboxes.

Organise by script state. Full cards belong under `new` and `changed`; unchanged
rows may collapse to one line with their identity and old score. Mark `gone` for
one run. A shape may rename or omit a section only when its example says why.

Every row dropped during judgement goes under `## dropped at scoring`, naming the
specific `must` and what the row said. Prefilter drops remain visible separately
in `listings.md`.

If the diff is mostly matching `new` and `gone`, inspect `identity`; a changing
date probably entered the key. Correct it through Gate 3 rather than publishing a
noisy diff.

When results are complete, follow `shortlist.md` if selection is row-based, then
always follow `publish.md`.
