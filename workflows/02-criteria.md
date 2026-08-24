# 02 — criteria

Turn what the human wants into a checklist the run scores against.

Rules: `AGENTS.md`. Entry: `00-session.md`.

In: `sources.md` exists. Out: `sessions/<slug>/criteria.md`, `status: run`.

---

## 1. Nudge, do not interview

A few short prompts. Not a form, not twenty questions. The human writes plain messy text back — full sentences, fragments, contradictions, whatever comes out. That is the input, and it is correct as-is.

Four or five prompts, adapted to the topic:

```
Rough shape of what you want:

  - what makes something an instant no?
  - what would make you actually open it?
  - money — target, and the floor you would not go under?
  - where, and how flexible is that?
  - anything you have said no to before, and why?

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
| `range` | target + floor | **flagged, never dropped** |
| `open` | a judgment call — "small team", "good culture", "serious about the problem" | you judge it, flag when unclear |

Rules while converting:

- **Be stingy with `must`.** It is the only kind that deletes results. When the human says "I really want remote", that is `nice` or `range`, not `must`. Ask if you are unsure — it is cheaper than a run that returns four rows.
- **Money is `range`, always.** Target plus floor. Never a `must`, because most listings do not publish a number and a `must` would drop every one of them.
- **`open` is legitimate** — do not force a vague wish into a hard rule to make it measurable. Write it as `open` and say how you will judge it.
- **Surface what you inferred.** If they said "no agencies" and you turned that into a `must`, show it. If you dropped something because you could not make it checkable, say so.

```markdown
must
  - role is frontend or full-stack        (from "not backend, not devops")
  - not an agency or a consultancy        (from "no agencies")

range
  - salary — target 75k, floor 65k        will flag, not drop, when unpublished
  - team size — target under 50           will flag when not stated

nice
  - remote-first, or Berlin
  - product company over services

open
  - "serious about the craft"             judging on: engineering blog, open source, how the posting is written

not carried over
  - "somewhere I would stay 3 years" — nothing on a posting tells me this. Say more and I will make it open.
```

---

## 3. GATE 3 — approve

```
This is what I will search against. Change anything before I run.
```

**Wait. Nothing searches before approval.** A run against wrong criteria is not merely useless — it burns the fetch cache and the quota, and it teaches the human that the results are noise.

Expect a rewrite. `must` → `nice` is the most common correction, and the human is right every time they make it.

---

## 4. Write

`sessions/<slug>/criteria.md`:

```markdown
# criteria — <slug>

Approved: YYYY-MM-DD

## must
- ...

## range
- <thing> — target X, floor Y

## nice
- ...

## open
- <thing> — judging on: ...
```

### The `## prefilter` block

Append it to the same file. It is the machine-readable half of the `must` lines, and `sessions/tools/prefilter.py` reads nothing else:

```markdown
## prefilter

```
title    = front.?end|full.?stack
location = remote|europe|berlin|amsterdam
exclude  = \bsenior\b|\bstaff\b|\bprincipal\b|\blead\b
```
```

- one pattern per `must` line that can be checked by a regex, and **nothing from `nice` or `range`** — only a `must` drops a row
- `exclude` drops on a title match; the others keep
- keep them loose. A row wrongly dropped here is never seen again; a row wrongly kept costs one line of scoring
- omit a key entirely if that check should not run

Check it before moving on:

```
python3 sessions/tools/regex.py <slug>
```

Then `MEMORY.md` → `status: run`, `next: first run`.

---

## Editing criteria later

Criteria change constantly once real results land — that is the system working, not a mistake.

The fetch cache in `listings.md` means **re-scoring after an edit is free**: no refetch, same day or not, unless the human asks for `--refetch`. Say this out loud when they hesitate to change something. Cheap edits are the point.

Re-approve only the changed lines. Then re-score and diff `results.md` as normal.

If the edit touched a `must`, update the `## prefilter` block to match. A `must` line and its pattern drifting apart is the one inconsistency in this file nobody notices, because the run still succeeds — it just quietly filters on the old rule.
