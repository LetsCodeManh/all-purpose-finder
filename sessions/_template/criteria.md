# criteria — <slug>

Approved: YYYY-MM-DD
Last amended: —

## must
- <hard requirement — a miss drops the row>

## range
- <thing> — target X, floor Y        <how a missing value is flagged>

## nice
- <preference — shown, ranked lower>

## open
- <judgment call> — judging on: <what you will read to decide>

## notes
- <a thing deliberately NOT filtered on, and why — the filter would only hide good rows>
- <a fact about the human that changes how a criterion reads, but is not itself a criterion>

## not carried over
- <what the human said that could not be made checkable, and why>

## prefilter

```
<field> = <regex>
exclude = <regex>
```

One pattern per `must` line that a regex can check. Nothing from `nice` or `range`.
Omit a key entirely if that check should not run.
