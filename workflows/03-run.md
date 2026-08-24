# 03 — run

Fetch, narrow with a script, score the survivors, diff against last time.

Rules: `AGENTS.md`. Entry: `00-session.md`.

In: `sources.md` + an approved `criteria.md`. Out: `sessions/<slug>/listings.md` + `results.md`.

---

## 1. Pre-filter — script only, no LLM

```
python3 sessions/tools/prefilter.py <slug> [--refetch]
```

No regexes on the command line. They live in the `## prefilter` block at the bottom of `criteria.md`, written when criteria are approved, and loaded by `sessions/tools/regex.py`:

```
## prefilter

```
title    = front.?end|full.?stack
location = remote|europe|berlin|paris|amsterdam
exclude  = \bsenior\b|\bstaff\b|\bprincipal\b|\blead\b
```
```

Derive all three from the **`must`** lines in `criteria.md`, nothing else. `must` is the only kind that drops, and this script is a drop. A `nice` or a `range` must never reach these patterns.

```
must: role is frontend or full-stack        → title
must: EU or remote                          → location
must: not explicitly senior/staff/lead      → exclude
```

`exclude` drops on a title match. It exists because "not explicitly senior" is the one `must` that is cheaper to enforce as a rejection than a selection.

An argument passed on the command line is an argument nobody wrote down, and a run nobody can repeat tomorrow. That is why the block lives in the session.

Keep all three regexes **loose**. A row wrongly dropped here is never seen again — there is no LLM behind it to catch the mistake. A row wrongly kept costs one line of scoring. The asymmetry is the whole reason the script is dumb: cheap, wide, and stupid on purpose.

Stdlib only, no install step. Run `--selfcheck` if you have touched either script — `prefilter.py` and `regex.py` both have one.

The script is shared by every session and holds nothing topic-specific. If you find yourself wanting to add a topic-specific branch to it, the thing you actually want belongs in `sources.md` or `criteria.md`.

What it does:

- reads `sources.md`, takes rows where method is `feed` **and** status is `ok`
- normalises every feed shape into `company · title · location · url · date`
- **dedupes on company + title** — same job on three sites is one row
- marks each row `kept` / not, writes them all to `listings.md`
- a source that fails is **reported by name with its error, never silently skipped**
- a blank location **passes** — remote roles often name no city

### `page` and `blocked` sources

The script only handles feeds. After it runs:

- **`page`** — you read those yourself, apply the same title/location narrowing by eye, and append the survivors to `listings.md` under a `## page sources` heading. The script preserves everything below that marker across runs and does not treat it as cache, so hand-added rows survive a `--refetch`. Keep the same seven-column table shape.
- **`blocked`** — do not fetch. List them in the run output with their hand-open URL. Every run, not just the first. A blocked source that stops being mentioned quietly becomes a source nobody checks.

---

### Before a source goes in sources.md

`sessions/tools/probe.py <url>` establishes the method rather than guessing it, and prints the field names the feed actually uses. `--ats <company>` sweeps Greenhouse, Ashby, Lever, Workable and Personio for a company slug.

Read the location line it prints. When a feed offers several location-ish fields, `prefilter.py` takes the first alias that matches, and the first one is not always the useful one — a Lever feed carries `categories.location` as "London, United Kingdom" and a bare `country` as "GB". Guess wrong and every row lands in the wrong place with no error at all.

## 2. The cache

`listings.md` carries the date it was fetched. Same day and no `--refetch` → **nothing hits the network**, the script re-applies the regexes to what is already there.

This is what makes criteria cheap to change. Say it out loud when the human hesitates over an edit: re-scoring costs a run of the script and no fetches. `--refetch` forces fresh.

---

## 3. Score the survivors

Only rows marked `kept`. Against `criteria.md`, and only against `criteria.md`.

| kind | miss |
|------|------|
| `must` | drop the row |
| `range` | **flag it. Never drop it** |
| `nice` | keep, rank lower |
| `open` | judge, and say what you judged on |

- **No compensation math.** Never decide remote makes up for 8k less. Show both misses and let the human weigh them.
- **Missing data is not a miss.** No published salary is `unknown`, flagged — not a failed range.
- **Do not invent a number.** No "82% match". The score is how many criteria hit, written as what it is: `4/6 · 1 range miss · 1 unknown`.

### The card

```markdown
### Langfuse — Full-Stack Engineer
Berlin / remote-EU · [posting](url) · posted 2026-08-11
source: Langfuse (feed) · also seen: RemoteOK

must   ✓ frontend or full-stack
must   ✓ not an agency
range  ⚠ salary — not published (target 75k, floor 65k)
range  ✓ team size ~30 (target under 50)
nice   ✓ remote-first
open   ✓ serious about the craft — public docs, active OSS repo, posting written by an engineer

4/6 · 1 unknown · 0 must misses
LLM observability tooling, small team, the stack you already build on.
```

`also seen:` is the dedupe made visible — three sightings, one card.

---

## 4. Diff against the last run

`results.md` is **one file, rewritten each run**, in four sections:

```markdown
# results — <slug>
Run 2026-08-24 · 6 new · 2 changed · 31 unchanged · 3 gone

## new
## changed          ← say what changed: salary added, location moved, title edited
## unchanged        ← collapsed to one line each, not full cards
## gone             ← was in the last run, not in this one. Keep the card, mark it
```

`gone` is not a deletion. A posting that vanishes is information — it filled, or it was pulled. Keep the row for one run, then let it drop.

Never re-print the whole list as if it were new. **New-since-last-run is the reason anyone runs this twice.**

---

## 5. Report the gaps in the same message

Every run ends with what it did not do:

```
blocked, open by hand: Indeed DE · Wellfound · Welcome to the Jungle · EURES
failed this run:       Helsing (429)
not checked since:     JustJoin.it — 2026-08-11
```

Then update `MEMORY.md` → `last run: <date>`, `status: contacts`, `next: tick the rows worth chasing`.

---

## 6. GATE 4

```
Tick the rows worth chasing in results.md. Contact lookup runs on those only.
```

Wait. Contact lookup is the expensive step and it runs once per company — do not pre-run it on everything to be helpful.
