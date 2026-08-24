# finder — rules

**This is the only rules file in this repo.** `CLAUDE.md` points here. Do not create a second one.

finder finds things that get posted and expire — jobs, tenders, grants, suppliers. A **session** is one topic. The engine is the same for every topic; nothing here is tender-specific or job-specific.

---

## The law

**AI proposes, the human prunes, the file gets written after.**

Four gates. Each one stops you until the human answers. There is no "obviously they'd want" — propose it and wait.

| # | Gate | You stop until |
|---|------|----------------|
| 1 | Session creation | the human confirms the slug |
| 2 | Sources list | the human prunes and adds |
| 3 | Criteria checklist | the human approves |
| 4 | Results → shortlist | the human ticks rows |

Passing a gate without an answer is the single worst failure mode in this repo. If you are unsure whether you are at a gate, you are at a gate.

---

## Step order

A session moves in one direction:

```
sources → criteria → run → contacts
```

The current step is the `status` field in `sessions/<slug>/MEMORY.md`. Read it, do that step, update it. Never run a later step because it seems more useful.

| status | you run |
|--------|---------|
| `sources` | `workflows/01-sources.md` |
| `criteria` | `workflows/02-criteria.md` |
| `run` | `workflows/03-run.md` |
| `contacts` | `workflows/04-contacts.md` |

Entry procedure for every session: `workflows/00-session.md`.

---

## Where you may write

**Only inside `sessions/<slug>/`.**

- No global memory. No user-level memory. No project memory outside the session folder.
- No cross-session notes. Two sessions never learn from each other.
- Do not write to `AGENTS.md`, `CLAUDE.md`, or `workflows/` unless the human asks for a change to the procedure itself.
- Do not create a session folder until step 1 has something real to write. No empty folders.

This applies to every tool, not just the one you happen to be. If your tool has an automatic memory feature, it is off for this repo.

---

## Reading sources

Every source gets one of three methods, tried in this order:

1. **`feed`** — RSS, JSON, or a public API. Always preferred.
2. **`page`** — a generic HTML read.
3. **`blocked`** — needs its own scraper, auth, or a browser to run JavaScript.

**Never write a per-site scraper.** A site that needs one is `blocked`. That is the definition, not a failure.

A `blocked` source stays in `sources.md` with its status and a URL the human can open by hand. **Never delete a blocked source.** A gap you can see is worth more than a list that looks clean.

---

## Make your own gaps visible

The human has to be able to tell what you did not do. Always surface:

- blocked sources, with status
- what is new since the last run
- `gone` for hits that vanished
- missing data — **flag it, never drop the row**
- range misses — **flag them, never drop the row**
- `last checked` dates, so a silently skipped source shows up as stale

Never quietly improve a list by shortening it.

---

## Scoring

- Only a **`must`** miss drops a row. Everything else flags.
- No compensation math. Do not decide that remote makes up for a lower salary — show both, the human weighs them.
- Do not invent a number. No "78% match", no "chance of winning". Score what the criteria file defines and nothing more.
- Dedupe key is **company + title**. The same job on three sites is one card with three sightings.

---

## Cost

- The pre-filter on title and location is a script. **No LLM in the pre-filter.** One source can return 200+ listings; scoring all of them ends the run early.
- Only survivors get scored.
- Fetched listings are cached in `listings.md` and not refetched the same day, so re-scoring after a criteria edit is free. `--refetch` forces fresh.
- Contact lookup runs on ticked rows only, once per company.

---

## Files, per session

| file | holds |
|------|-------|
| `MEMORY.md` | status + next step. **Pointer only — no data** |
| `sources.md` | one table, `type` is a column |
| `criteria.md` | the approved checklist |
| `results.md` | one file, diffed. Not per-site files |
| `listings.md` | raw fetch cache |
| `contacts.md` | looked-up contacts, cached per company |

One file each. No folders inside a session.
