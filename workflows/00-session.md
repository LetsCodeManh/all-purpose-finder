# 00 — session

Entry procedure. Every finder session starts here, new or continuing.

Rules: `AGENTS.md`. Read them before this.

---

## Bare call — no slug given

The human typed `/session` or "start a finder session" with no topic.

**Create nothing.** Print:

1. One line on what finder does.
2. The existing sessions — folder name, `status`, `last run` from each `sessions/<slug>/MEMORY.md`.
3. A prompt: "Which one, or describe a new topic in a line."

Then stop.

```
finder tracks things that get posted and expire — jobs, tenders, grants.
One session per topic.

  tech-jobs-de     status: run        last run: 2026-08-24
  qc-tenders       status: criteria   last run: —

Which one, or describe a new topic in a line.
```

---

## A slug was given

**Exact match** on a folder in `sessions/` → continue it. Jump to *Continuing*.

**No exact match** → do not create anything. Show the close matches and ask.

```
No session called "tech-jobs-du".
Closest: tech-jobs-de.

Continue tech-jobs-de, or is this a new topic?
```

A typo that silently creates a folder gives the human two sessions and they notice weeks later. **Never silently create.**

---

## A direction line was given

The human described a topic instead of naming one — "I want to track frontend jobs in Germany", "tenders for small municipalities in Quebec".

1. **Propose the slug yourself.** Short, readable, lowercase, hyphens. `tech-jobs-de`, `qc-muni-tenders`. Never a hash, never a date. The human does not invent it — they approve or rename it.
2. Say back, in two lines, what you understood the topic to be.
3. **GATE 1.** Wait.

```
Slug: tech-jobs-de
Topic: frontend and full-stack roles at tech companies in Germany, remote or Berlin.

Good? Rename it if the slug is wrong.
```

**Still create nothing.** The folder appears in step 1 (`01-sources.md`), when there is a real `sources.md` to write. Not before.

---

## Continuing

1. Read `sessions/<slug>/MEMORY.md`.
2. Print the status line and the `next:` line back to the human — one short block, so they know where they are before anything moves.
3. Route on `status`:

| status | run |
|--------|-----|
| `sources` | `workflows/01-sources.md` |
| `criteria` | `workflows/02-criteria.md` |
| `run` | `workflows/03-run.md` |
| `contacts` | `workflows/04-contacts.md` |

Never skip forward because a later step looks more useful. If the human explicitly asks for a different step, say which step the session is on, then do what they asked.

---

## `MEMORY.md` — the shape

Status and next step. **Pointer only. No listings, no criteria, no results.** Everything else lives in its own file.

```markdown
---
slug: tech-jobs-de
status: sources
last run: —
---

next: prune the proposed source list
```

Rewrite it at the end of every step. It is the only thing that tells the next session where it is.
