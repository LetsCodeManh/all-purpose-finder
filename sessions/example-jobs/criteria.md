# criteria — example-jobs

Approved: 2026-08-26
Last amended: —

## must
- role is in the engineering, data or solutions family
- located in the Randstad or Berlin, or remote and open to candidates in the EU
- working language is English
- not explicitly senior, staff, principal or above   (explicit only — unstated level does not drop)

## range
- pay — target 85k, floor 70k              flagged, never dropped, when unpublished
- experience asked for — target 3–6 years  flagged when unstated
- formal degree demanded                   flagged, never dropped

## nice
- work mode, best first: remote > hybrid > on-site
- Python and a real data platform, not a bolt-on

## open
- "somewhere I can learn" — judging on: team size, whether the posting describes
  mentorship, whether the engineering work named is the product or a side effect

## notes
- company size is deliberately not filtered on — the interesting rows here have
  been both very small and very large, and a size filter would only hide them
- a relocation package is not a criterion, but it changes how the location range
  reads for a row that is otherwise a match

## not carried over
- "somewhere with a good culture" — nothing checkable in a posting. The nearest
  checkable part became the `open` line above.

## prefilter

```
title    = engineer|scientist|analyst
location = remote|amsterdam|rotterdam|utrecht|berlin
exclude  = vp|chief|head of|senior|staff|principal
identity = url
compare  = title, location, date
```

One pattern per `must` line a regex can check. Nothing from `nice` or `range`.
`identity` and `compare` drop nothing — they drive the diff.
