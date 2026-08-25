# 02 — criteria

Turn what the human wants into a checklist the run scores against.

Rules: `AGENTS.md`. Entry: `00-session.md`.

In: `sources.md` exists. Out: `sessions/<slug>/criteria.md`, `status: run`.

Worked example: `examples/<shape>.md` → *02 — criteria*, for the shape named in this session's `shape:` field. No example yet for this shape? Run the step from here anyway, say so, and write that section afterwards from what happened.

---

## 1. Nudge, do not interview

A few short prompts. Not a form, not twenty questions. The human writes plain messy text back — full sentences, fragments, contradictions, whatever comes out. That is the input, and it is correct as-is.

Four or five prompts, **written for this topic**, not copied from another one. The pattern under them is always the same:

```
Rough shape of what you want:

  - what makes something an instant no?
  - what would make you actually open it?
  - the number that matters here — target, and the limit you would not cross?
  - where, and how flexible is that?
  - anything you have rejected before, and why?

Write it however it comes out. Messy is fine.
```

Never ask them to pick a category, assign a weight, or fill in a table. **Categorising is your job.**

---

## 2. Write back the checklist

Convert their text into the four kinds. This is the step that matters — you are showing them the tool's actual reading of what they said, before it searches anything.

| kind | meaning | a miss |
|------|---------|--------|
| `must` | hard requirement | **drops the row** |
| `nice` | preference | shown, ranked lower |
| `range` | target + limit | **flagged, never dropped** |
| `open` | a judgment call — a quality you can read but not measure | you judge it, flag when unclear |

Some shapes read these as **questions to answer** rather than filters to score. The four kinds still hold: a `must` is then a question you refuse to walk in without an answer to, and its miss is a stated gap, not a dropped row. The shape example says which reading applies.

Rules while converting:

- **Be stingy with `must`.** It is the only kind that deletes results. An emphatic wish — "I really want X" — is `nice` or `range`, not `must`. Ask if you are unsure; it is cheaper than a run that returns four rows.
- **Any number the sources often do not publish is `range`.** Target plus limit. Never a `must` — a `must` on an unpublished field drops every row that simply stayed quiet.
- **`open` is legitimate** — do not force a vague wish into a hard rule to make it measurable. Write it as `open` and say how you will judge it.
- **Surface what you inferred.** If you turned an offhand line into a `must`, show it. If you dropped something because you could not make it checkable, say so under `not carried over`.

---

## 3. GATE 3 — approve

```
This is what I will search against. Change anything before I run.
```

**Wait. Nothing searches before approval.** A run against wrong criteria is not merely useless — it burns the fetch cache and the quota, and it teaches the human that the results are noise.

Expect a rewrite. `must` → `nice` is the most common correction, and the human is right every time they make it.

---

## 4. Write

`sessions/<slug>/criteria.md`. Skeleton: `sessions/_template/criteria.md`.

### The `## prefilter` block

Append it to the same file. It is the machine-readable half of the `must` lines, and `sessions/<slug>/tools/prefilter.py` reads nothing else:

```
<field> = <regex>
<field> = <regex>
exclude  = <regex>
identity = <column>[+<column>]
compare  = <column>, <column>
```

- fields are the ones the item rows actually carry — the pre-filter matches on those names, so a field no source publishes is a filter that never fires
- one pattern per `must` line that a regex can check, and **nothing from `nice` or `range`** — only a `must` drops a row
- `exclude` drops on a match; the others keep
- keep them loose. A row wrongly dropped here is never seen again; a row wrongly kept costs one line of scoring
- omit a key entirely if that check should not run
- `identity` and `compare` are **not filters and drop nothing** — they are the diff's key and its watched columns, and they are the only keys here that do not trace to a `must`. Defaults: `identity = url`, `compare` = every column the rows carry. Set them when the shape says otherwise — a flyer keys on `company+title` because its products share one url, a tender keys on its published reference, and prices watch the price and the window rather than the title
- **never put a date in `identity`.** It is the one mistake that silently produces a diff of pure noise: every row reads `new` and `gone` each run, and the thing that actually moved is never reported at all
- **omit the whole block** when the shape reads every item anyway. The pre-filter exists to stop a run drowning in hundreds of rows; where there is nothing to drown in, a regex that filters nothing is a rule that can only cause harm. Say it is omitted and why, so the next run does not think it went missing

Check it before moving on, when there is one:

```
python3 sessions/<slug>/tools/regex.py <slug>
```

Then `MEMORY.md` → `status: run`, `next: first run`.

---

## Editing criteria later

Criteria change constantly once real results land — that is the system working, not a mistake.

The fetch cache in `listings.md` means **re-scoring after an edit is free**: no refetch, same day or not, unless the human asks for `--refetch`. Say this out loud when they hesitate to change something. Cheap edits are the point.

Re-approve only the changed lines. Then re-score and diff `results.md` as normal.

If the edit touched a `must`, update the `## prefilter` block to match. A `must` line and its pattern drifting apart is the one inconsistency in this file nobody notices, because the run still succeeds — it just quietly filters on the old rule.
