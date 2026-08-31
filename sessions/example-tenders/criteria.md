# criteria — example-tenders

Approved: 2026-08-29
Last amended: —

## must
- work includes service design, accessibility research, or content design
- authority is in the example region or accepts remote delivery
- notice is still open on the run date

## range
- contract value — target 100k, floor 25k; flag when unpublished
- bid window — target at least 14 days, floor 7 days; flag, never drop

## nice
- separate lots allow a bid on only the relevant work
- evaluation gives delivery quality at least as much weight as price

## open
- “could a small studio credibly win” — judge from references, insurance, team size, and incumbent signals

## notes
- classification codes do not filter; authorities use neighbouring codes for the same work
- a missing value remains visible rather than dropping the notice

## not carried over
- “not too much paperwork” cannot be decided from summary notices alone

## prefilter

```
title    = service design|accessibility|content design|research
region   = example region|remote
exclude  = construction|hardware
identity = ref
compare  = title, closing, place
```
