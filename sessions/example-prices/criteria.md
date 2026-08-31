# criteria — example-prices

Approved: 2026-08-29
Last amended: —

## must
- item is food or a household staple
- seller is within the example neighbourhood

## range
- unit price — target at or below the usual price; flag when no comparable unit is published
- validity window — target at least three days; flag when either endpoint is missing

## nice
- item is already on the standing shopping list
- discount is at least 20 percent from the published usual price

## open
- an unusually deep offer may be worth adding — judge against shelf life and likely waste

## notes
- brand is deliberately not a filter; equivalent staples remain visible
- an unpublished usual price is unknown, not evidence that an offer is weak

## not carried over
- “good quality” was not made a filter because the catalogue data cannot support it

## prefilter

```
title    = milk|rice|soap|apples|coffee
identity = company+title
compare  = price, window_end
```
