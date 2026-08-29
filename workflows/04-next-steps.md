# 04 — Next Steps

The run is published. Use its compact selection surface to decide what, if
anything, happens next.

Rules: `AGENTS.md`. Entry: `00-session.md`.

In: `status: next-steps`, an output name, or `done` with an explicit request to make
something after all. Out: nothing until the human answers GATE 4.

**This step is a slot, not a predetermined task.** Sources, criteria and the run
are fixed. This slot is whatever the result was for: someone to talk to, a report,
a resume, a proposal, links to apply with — or nothing. Some common choices have a
reusable procedure in `next-steps/<name>.md`, but that library is an implementation
shortcut, never the user's menu.

Worked example: `examples/<shape>.md` → *04 — output*, for the shape named in this
session's `shape:` field. No example yet for this shape? Run the step from here
anyway, say so, and write that section afterwards from what happened.

---

## 1. Read the shape's selection

`selection:` in `examples/<shape>.md` decides the input surface:

- **`rows`** — read only rows the human marked `- [x]` in `shortlist.md`. A
  `- [ ]` is an answer; do not act on a row because it scored well. The shortlist
  was generated beside `results.md`, and the detailed cards remain read-only.
- **`artifact`** — there is no shortlist. `results.md` as a whole is the input.
  Never invent row selection for a brief or compact result meant to stay whole.

For `selection: rows`, zero ticks among rows that needed a decision is unresolved
unless the human explicitly says they rejected all of them or want nothing made.
Do not resolve silence as "all" or "none". Ticks carried forward from earlier runs
are not an empty gate. Full rule: `AGENTS.md` → **Ticks**.

---

## 2. GATE 4 — Next Steps, then wait

Propose **two to four small, relevant possibilities** from the result, the
selected rows and what the human originally wanted. These are examples, not a
menu and not a fixed end goal. Do not read a capability list from the shape.

For row selection, ground the suggestions in what is actually ticked:

```
7 rows ticked, 5 organisations.
Some possible next steps:
  find the right public contact for each organisation
  compare the selected rows side by side
  prepare an application or proposal from one of them
  collect the official action links
Or tell me a different goal.
Or say "nothing" and this result stays as it is.
```

For artifact selection, ground suggestions in the whole result: a summary for a
named audience, a proposal, a short briefing, questions for a meeting, action
items, or something more specific to what is on screen. Ask only for the details
needed by the option the human actually chooses—for example, audience, purpose
and length for a summary. Do not collect requirements for every example before
the choice.

**Stop here. Wait.** Ticking rows selects inputs; it does not choose an output.
An offer the human did not answer is not approval. Making the thing is the
expensive step, so do not pre-run one because it looks helpful.

If the answer is **nothing**, update `MEMORY.md` → `status: done`, with `next:`
pointing at the natural rerun, refresh, occasion or decision. The result remains
available, and the human may return to GATE 4 later.

---

## 3. Run the one they picked

- **It has a reusable procedure** — `next-steps/<name>.md`. Follow it. Its
  precondition line runs first, and it refuses rather than continues if the
  session is not ready.
- **It has no procedure** — run it anyway, from what the human just described. A
  one-session output needs no permission; the run is theirs and it is free.
  Afterwards, and only afterwards, ask whether it should be written up as
  `next-steps/<name>.md` — the repo-change gate in `AGENTS.md` → **Where you may
  write**. Never write the file first and ask after.

Then `MEMORY.md` → `status:` the name of the output you made, and `next:` what the
human does with what it produced. That status still routes back here, which is
correct: the same result can have something else made from it tomorrow.
