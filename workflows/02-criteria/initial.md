# Define criteria

Turn what the user wants into an approved checklist.

## Ask lightly

Ask four or five short, topic-specific prompts: instant rejections, what earns a
closer look, important target and limit, location or flexibility, and past
rejections. Invite plain, messy text. Do not ask the user to classify, weight, or
fill a form; organising it is Scout's job.

## Read it back

Convert the answer into:

| kind | meaning | effect of a miss |
|---|---|---|
| `must` | hard requirement | drop the row |
| `nice` | preference | keep and rank lower |
| `range` | target plus limit | flag, never drop |
| `open` | judgement that needs reading | judge and explain |

For a one-subject brief, these may be questions rather than filters. A missing
`must` answer then becomes a visible gap, not a dropped subject.

Be stingy with `must`. An emphatic wish is not automatically hard. A number that
sources often omit is a `range`. Keep qualitative wishes `open`. Show every
inference, anything not carried over, and deliberate non-filters under `## notes`.

## Approve and stop — Gate 3

Say: “This is what I’ll search against. Change anything before I run.” Stop.
Do not fully retrieve, filter, score, or write a brief before approval.

## Write after approval

Fill `sessions/<slug>/criteria.md` from its skeleton. For a many-candidate shape,
append the machine-readable `## prefilter` block:

```text
<field> = <loose regex from a must>
exclude = <loose rejection regex from a must>
identity = <stable column>[+<stable column>]
compare = <watched columns>
```

Only `must` creates filters. Missing fields pass. `identity` and `compare` do not
filter. Never put a changing date in `identity`. Omit irrelevant keys and omit the
whole block for a shape that reads everything; state why.

Validate an existing block with the session's `tools/regex.py`. Then update
`MEMORY.md` to `status: run`, `next: first run`, and route to
`workflows/03-run/README.md`.
