# 00 — session

Entry procedure. Every finder session starts here, new or continuing.

Rules: `AGENTS.md`. Read them before this.

Worked example: `examples/<shape>.md` → *00 — session*, for the shape named in this session's `shape:` field. No example yet for this shape? Run the step from here anyway, say so, and write that section afterwards from what happened.

---

## Bare call — no slug given

The human typed `/session` or "start a finder session" with no topic.

**Create nothing.** Print:

1. One line on what finder does.
2. The existing sessions — folder name, `shape`, `status`, `last run` from each `sessions/<slug>/MEMORY.md`. Skip folders starting with `_`; they are skeletons, not sessions.
3. A prompt: "Which one, or describe a new topic in a line."

Then stop.

```
finder tracks things that get posted and expire.
One session per topic.

  <slug-a>     jobs      status: run        last run: 2026-08-24
  <slug-b>     prices    status: run        last run: 2026-08-24
  <slug-c>     <new>     status: criteria   last run: —

Which one, or describe a new topic in a line.
```

---

## A slug was given

**Exact match** on a folder in `sessions/` → continue it. Jump to *Continuing*.

**No exact match** → do not create anything. Show the close matches and ask.

```
No session called "<what they typed>".
Closest: <nearest existing slug>.

Continue that one, or is this a new topic?
```

A typo that silently creates a folder gives the human two sessions and they notice weeks later. **Never silently create.**

---

## A direction line was given

The human described a topic instead of naming one.

1. **Propose the slug yourself.** Short, readable, lowercase, hyphens. Never a hash, never a date. The human does not invent it — they approve or rename it.
2. **Name the shape.** Read the files in `examples/`. Either this topic is one of them, or it is not — say which, and say why in one clause. This is part of GATE 1, not a decision you make quietly.
3. Say back, in two lines, what you understood the topic to be. For a one-shot
   shape driven by a meeting, decision, or deadline, include the occasion and
   date. If the human did not supply them, write `occasion not supplied` rather
   than inventing one; they can fill it in while approving GATE 1.
4. **GATE 1.** Wait.

```
Slug:  <proposed-slug>
Shape: <name> — existing, examples/<name>.md
Topic: <two lines, in your own words, of what you understood>

Good? Rename it if the slug is wrong.
```

### When it is a new shape

Say so plainly, propose a name, and say what makes it different from the closest existing one. Do not force a topic into a shape that nearly fits — a shape that nearly fits produces a run that nearly works, and the human finds out three steps later.

```
Slug:  <proposed-slug>
Shape: <proposed-name> — NEW. Closest is <existing>, but <what breaks>:
       <e.g. the result is a written brief, not scored rows>
Topic: <two lines>

New shape means I write examples/<proposed-name>.md as we go. Good?
```

The signals that a topic is a new shape:

- **the result form differs** — rows and cards vs a written brief
- **a step does not apply** — nothing to contact, nothing to pre-filter, nothing that expires
- **the cadence differs** — weekly, one-shot with a deadline, or open-ended
- **the identity key differs**, or there is nothing worth deduping

`examples/<name>.md` starts as a copy of `examples/_template.md` and is filled **from what actually happened**, step by step, as the session passes each one — not guessed up front. An unfilled section is not a reason to pause a step. Scrub it as you write: placeholders, no URLs, no vendor names, and none of the human's actual criteria or results. The repo is public. The file records the *shape*, never the search.

**Still create nothing.** The folder appears in step 1 (`01-sources.md`), when there is a real `sources.md` to write. Not before.

---

## Continuing

1. Read `sessions/<slug>/MEMORY.md`.
2. Print the status line and the `next:` line back to the human — one short block, so they know where they are before anything moves.
3. Route on `status`:

| status | means | run |
|--------|-------|-----|
| `sources` | sources not approved yet | `workflows/01-sources.md` |
| `criteria` | sources approved, criteria not | `workflows/02-criteria.md` |
| `run` | ready to run, or a shape with nothing to make has finished one | `workflows/03-run.md` |
| `output` | results exist, nothing picked from them yet | `workflows/04-output.md` |
| a filler name, e.g. `contacts` | that filler has run; the shortlist is still there | `workflows/04-output.md`, then `fillers/<name>.md` |

Never skip forward because a later step looks more useful. If the human explicitly asks for a different step, say which step the session is on, then do what they asked.

### Amendments to a completed step

If the human adds a source, criterion, occasion, or question after the session
has moved past that step, follow the delta procedure in `AGENTS.md`:

- keep the current `status`
- show only the proposed source and criteria changes
- repeat GATE 2 and/or GATE 3 only for that delta
- after approval, update the stored files and rerun only the affected result sections

Do not make `results.md` broader than its approved sources and criteria merely
because the new request arrived during `run`.

---

## `MEMORY.md` — the fields

Status, shape and next step. **Pointer only. No data of any kind** — no items, no criteria, no results. Everything else lives in its own file.

Fields: `sessions/_template/MEMORY.md`. `shape:` names the file in `examples/` that this session reads for its worked example — set at GATE 1, and it never changes afterwards.

Rewrite it at the end of every step. It is the only thing that tells the next session where it is.
