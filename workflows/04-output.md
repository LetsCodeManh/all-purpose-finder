# 04 — output

The result exists. Offer what can be made from it, and stop.

Rules: `AGENTS.md`. Entry: `00-session.md`.

In: ticked rows in `shortlist.md`. Out: nothing at all until the human picks one.

**This step is a slot, not a task.** The first three steps are fixed — sources,
criteria, run. This one is whatever the result was for: someone to talk to, a
report, a resume, a proposal, links to apply with. The procedure for each one is a
**filler**: `fillers/<name>.md`, tool-neutral, one file per thing that can be made.
Day one ships one, `fillers/contacts.md`.

Worked example: `examples/<shape>.md` → *04 — output*, for the shape named in this
session's `shape:` field. No example yet for this shape? Run the step from here
anyway, say so, and write that section afterwards from what happened.

---

## 1. Read the ticks

Only rows the human marked `- [x]` in `shortlist.md`. A `- [ ]` is an answer — do
not act on a row because it scored well.

**Zero ticks among the rows that needed a decision stops this step.** If nothing
that arrived `new` or came back `changed` carries a tick, do not proceed and never
resolve it as "then all of them": say what you found and ask. Ticks carried forward
from earlier runs are not an empty gate. Full rule: `AGENTS.md` → **Ticks**.

Some shapes have nothing to make — a price hunt ends at the result. The shape says
so already: `fillers: []` in `examples/<shape>.md`, and such a session never reaches
`status: output` at all. Then this step is one line, "nothing to make from this one",
`MEMORY.md` left at `status: run` with `next:` pointing at the rerun, done.

---

## 2. GATE 4 — offer, then wait

`fillers:` in the shape's frontmatter is the **menu, not the constraint**. Offer
what it names, **drawn from the rows actually on screen** — not the abstract
capability, the thing these ticked rows could become:

```
7 rows ticked, 5 organisations.
From these I can:
  contacts   — find a human to talk to at each of the 5
Or name something else — a report, a resume, a proposal, links to apply.
```

**The human may always name one that is not on the list, and one that has no
`fillers/` file at all.** That is not an error; it is the point of the slot.

**Stop here.** Wait. Making the thing is the expensive step, and an offer the human
did not answer is not an approval. Do not run a filler because it looks obviously
helpful — that is the whole failure mode this repo exists to prevent.

---

## 3. Run the one they picked

- **It has a file** — `fillers/<name>.md`. Follow it. Its precondition line runs
  first, and it refuses rather than continues if the session is not ready.
- **It has no file** — run it anyway, from what the human just described. Inventing
  a filler for one session needs no permission; the run is theirs and it is free.
  Afterwards, and only afterwards, ask whether it should be written up as
  `fillers/<name>.md` — the repo-change gate in `AGENTS.md` → **Where you may
  write**. Never write the file first and ask after.

Then `MEMORY.md` → `status:` the name of the filler you ran, and `next:` what the
human does with what it produced. That status still routes back here, which is
correct: the same shortlist can have something else made from it tomorrow.
