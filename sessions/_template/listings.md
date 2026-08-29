# listings — fetched YYYY-MM-DD

0 rows · 0 kept · 0 new · 0 changed · 0 unchanged · 0 gone

Raw fetch cache plus the diff's `state` column. Not a result file: never scored,
never ticked, never read by a next step. `kept: no` rows are held and never
deleted — a drop you cannot see is a drop you cannot disagree with.

**Written only when the shape is `cardinality: many`.** A one-subject shape reads
its sources straight into the brief, so it has nothing to cache and writes no
listings at all. `tools/shape.py` is where that rule lives.

The two lines above are read by scripts and have to keep their exact shape:

| line | read by |
|------|---------|
| `# listings — fetched <date>` | `tools/publish_run.py`, `tools/session_audit.py`, `ui/server.py` |
| `<N> rows · <N> kept · …` | `ui/server.py`, for the box at the top of the run screen |

Get the header wrong and `publish_run.py <slug> finish` refuses the run with
`listings.md run date is missing`. It is the one date the publisher cannot infer.

## the columns

Columns are **this session's**, set by what its sources actually publish — a jobs
session carries a salary, a tender session carries a closing date, a price session
carries a window. Four carry meaning to something other than a human reader:

| column | who reads it, and for what |
|--------|---------------------------|
| whatever `identity` names in `criteria.md` | the diff key — the thing that must hold still so you can tell it is the same row next week |
| whatever `compare` names | the watched columns — a move in one of these is what makes a row `changed` |
| `state` | `new` · `changed:<cols>` · `unchanged` · `gone`, written by `prefilter.py`. The agent scores only `new` and `changed` |
| `kept` | `yes`, or `no:<which pattern dropped it>`. The reason is the point — a drop with no reason cannot be argued with |

| issuer | item | url | date | state | kept | source |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

## page sources — read by hand, appended after the script

`prefilter.py` handles feeds only. A `page` source is read by hand and its
survivors go here. The script preserves everything below this marker across runs
and does not treat it as cache, so hand-added rows survive a `--refetch`. Same
column shape as above.

**The heading goes in whether or not anything survived.** An empty heading is a
claim, the same way an empty `## gaps` is — so say which sources were read and
found nothing. A `page` + `ok` source with no rows here and no line below is
indistinguishable from one nobody opened, which is why every such source is
named in the run's gap report as not read, with the reason.

| issuer | item | url | date | state | kept | source |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

read and nothing survived: <names>
