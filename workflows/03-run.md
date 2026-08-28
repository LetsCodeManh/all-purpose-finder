# 03 — run

Fetch, narrow with a script, score the survivors, diff against last time.

Rules: `AGENTS.md`. Entry: `00-session.md`.

In: `sources.md` + an approved `criteria.md`. Out: `results.md` and
`shortlist.md`, plus `listings.md` for ledger shapes.

Worked example: `examples/<shape>.md` → *03 — run*, for the shape named in this session's `shape:` field. No example yet for this shape? Run the step from here anyway, say so, and write that section afterwards from what happened.

---

## 1. Pre-filter — script only, no LLM

```
python3 sessions/<slug>/tools/prefilter.py <slug> [--refetch]
```

No regexes on the command line. They live in the `## prefilter` block at the bottom of `criteria.md`, written when criteria are approved, and loaded by `sessions/<slug>/tools/regex.py`.

Derive every pattern from the **`must`** lines in `criteria.md`, nothing else. `must` is the only kind that drops, and this script is a drop. A `nice` or a `range` must never reach these patterns.

`exclude` drops on a match. It exists for the `must` lines that are cheaper to enforce as a rejection than a selection — a short list of disqualifying words beats trying to name everything acceptable.

An argument passed on the command line is an argument nobody wrote down, and a run nobody can repeat tomorrow. That is why the block lives in the session.

Keep the regexes **loose**. A row wrongly dropped here is never seen again — there is no LLM behind it to catch the mistake. A row wrongly kept costs one line of scoring. The asymmetry is the whole reason the script is dumb: cheap, wide, and stupid on purpose.

Stdlib only, no install step. Run `--selfcheck` if you have touched either script — `prefilter.py` and `regex.py` both have one.

The script belongs to this session and is tailored to it. That is the point — but it stays a dumb regex drop. If you find yourself wanting to add a branch that reasons about the topic, the thing you actually want belongs in `sources.md` or `criteria.md`.

What it does:

- reads `sources.md`, takes rows where method is `feed` **and** status is `ok`
- normalises every feed's own field names into one common row — who published it, what it is, where it applies, its url, its date
- **dedupes on issuer + item** — the same thing on three sites is one row
- marks each row `kept` / not, writes them all to `listings.md`
- **diffs this run against the last** and writes a `state` column — see section 5
- a source that fails is **reported by name with its error, never silently skipped**
- **a blank field passes.** An absent value is not a mismatch, and the pre-filter has no way to tell "does not apply" from "not stated"

### `page` and `blocked` sources

The script only handles feeds. After it runs:

- **`page`** — you read those yourself, apply the same narrowing by eye, and append the survivors to `listings.md` under a `## page sources` heading. The script preserves everything below that marker across runs and does not treat it as cache, so hand-added rows survive a `--refetch`. Keep the same column shape.
- **`blocked`** — do not fetch. List them in the run output with their hand-open URL. Every run, not just the first. A blocked source that stops being mentioned quietly becomes a source nobody checks.

### Before a source goes in sources.md

`sessions/<slug>/tools/probe.py <url>` establishes the method rather than guessing it, and prints the field names the feed actually uses. Read the alias line it prints: when a feed offers several fields carrying the same concept, `prefilter.py` takes the first that matches, and the first is not always the useful one. Guess wrong and every row from that source is mislabelled with no error at all. Each shape example names the alias trap for its own domain.

---

## 2. The cache and the previous run

`listings.md` carries the date it was fetched. Same day and no `--refetch` → **nothing hits the network**, the script re-applies the regexes to what is already there.

This is what makes criteria cheap to change. Say it out loud when the human hesitates over an edit: re-scoring costs a run of the script and no fetches. `--refetch` forces fresh.

On a **new day** the script rotates the old `listings.md` to `listings.prev.md` before writing, so there is always exactly one previous run to compare against. One run of memory is exactly what `gone` needs — a row is shown gone once, then it drops.

A `--refetch` on the **same day** does not rotate. Monday is still in `listings.prev.md` after the second Tuesday run, which is the point: the guard exists so a rerun cannot destroy the only history there is.

---

## 3. Result form — ledger or brief

Two forms, and the shape decides which: `form:` in the frontmatter of
`examples/<shape>.md`. Do not work it out from what is on disk. Read the body too
before writing anything — and `cardinality: one` is what makes sections 4 and 5
below not apply at all.

| form | what it is | when |
|------|-----------|------|
| **ledger** | scored rows, one card each, diffed against the last run | many items, each one a candidate the human accepts or rejects |
| **brief** | prose sections, every claim attributed to its source | one subject, and the question is *what is true about it*, not *which of these* |

Sections 4 and 5 below are the **ledger** form. For a **brief**, they are replaced by what the shape example lays out: no score line, no `4/6`, no `gone`. What carries over unchanged is the part that matters: **attribution, and gaps stated as their own section.**

Do not produce a ledger for a topic that wants a brief. Rows that each say "here is a fact" are a table pretending to be an answer.

---

## 4. Score the survivors — ledger form

Only rows marked `kept` **whose `state` is `new` or `changed`**. Against `criteria.md`, and only against `criteria.md`.

An `unchanged` row was already scored last run — carry its card over, do not read it again. That is what makes run two cheap, and it is most of the reason the diff is a script.

Score everything `kept` when there is no previous run, or after a criteria edit — new rules mean every card is stale, `state` or not. Say which of the two you are doing.

| kind | miss |
|------|------|
| `must` | drop the row |
| `range` | **flag it. Never drop it** |
| `nice` | keep, rank lower |
| `open` | judge, and say what you judged on |

- **No compensation math.** Never decide one strength makes up for another's shortfall. Show both misses and let the human weigh them.
- **Missing data is not a miss.** An unpublished value is `unknown`, flagged — not a failed range.
- **Do not invent a number.** No "82% match". The score is how many criteria hit, written as what it is: `4/6 · 1 range miss · 1 unknown`.

### The card

One per surviving row. Same layout whatever the topic:

```markdown
### <issuer> — <item>
<where> · [<link>](<url>) · posted <date>
source: <which source> · also seen: <other sources>

must   ✓ <criterion>
must   ✓ <criterion>
range  ⚠ <criterion> — not published (target X, limit Y)
range  ✓ <criterion> — <value found>
nice   ✓ <criterion>
open   ✓ <criterion> — <what you judged on>

4/6 · 1 unknown · 0 must misses
<one line on why this is worth the human's attention>
```

`also seen:` is the dedupe made visible — three sightings, one card.

**No card carries a checkbox.** The decision is taken in `shortlist.md`, written in
section 6 below; `results.md` only records what was found. Syntax and the rules that
bind a tick: `AGENTS.md` → **Ticks**.

---

## 5. Diff against the last run — ledger form

**Read the `state` column. Do not work it out.** The script already compared this run against `listings.prev.md` and wrote the answer per row:

```
new                  ← not in the previous run
changed: title,date  ← same row, and these columns moved
unchanged            ← identical on every watched column
gone                 ← was in the previous run, is not in this fetch
```

Comparing two files by eye is the one step in this pipeline nobody can check your work on — a missed `gone` row looks exactly like nothing. It is a set comparison, so it is a script, and `state` is what it returns.

The key and the watched columns come from `identity` and `compare` in `criteria.md`. **If `state` looks like noise — everything `new` and everything `gone` on a run where the sources barely moved — the key is wrong, not the sources.** Almost always a date crept into `identity`. Say so and fix the block; do not write the file up as if hundreds of things changed overnight.

`results.md` is **one file, rewritten each run**, in four sections mapping straight onto the four states. Skeleton: `sessions/_template/results.md`. A shape may rename or drop a section when it does not apply — a shape where nothing expires has no `gone` — but it never adds a fifth silently. Say what you changed and why.

```
## new              ← full cards
## changed          ← name the columns the state gave you, in words: the deadline moved, the price dropped
## unchanged        ← collapsed to one line each, not full cards: `<issuer> — <item> · <score>`
## gone             ← keep the card, mark it
```

- `unchanged` → stays collapsed to one line, is not re-scored and is not re-looked-up
- `changed` → says `changed: <cols>` in words. A `changed` card whose row is ticked in
  `shortlist.md` sorts to the top of its section: the human already decided on it once,
  and this is the row where the decision might now be wrong
- `gone` → the card is marked gone and drops next run

`gone` is not a deletion. Something that vanishes is information — it was taken, or it was pulled. The script shows it for one run and then drops it, so this file is the only place it is ever written up.

`page` rows are appended by hand below `## page sources` and the script does not diff them. Their state is yours to state in words.

Never re-print the whole list as if it were new. **New-since-last-run is the reason anyone runs this twice.**

---

## 6. Write the shortlist — ledger form

`sessions/<slug>/shortlist.md`, one line per row kept in `results.md`, in the same
order. Skeleton: `sessions/_template/shortlist.md`.

```
- [ ] <issuer> — <item> · <score>
```

**Regenerate it whole, and carry the ticks forward by `identity`** — the same key the
diff used above. Read the previous shortlist before you overwrite it: a row that was
already there keeps the tick it had, only a row new to this run is written `- [ ]`, and
a `gone` row drops off. **Never auto-untick.** Rewriting the file is not permission to
reset the human's decisions, and a run where everything came back unticked is exactly
the empty gate `AGENTS.md` → **Ticks** tells you to stop on.

A shape with no ledger, or no step-4 decision to make, writes no shortlist and says so.

---

## 7. Report the gaps in the same message

Every run ends with what it did not do:

```
blocked, open by hand: <names>
manually checked:      <name> (<checked|partial|unavailable>, <date>)
failed this run:       <name> (<error>)
not checked since:     <name> — <date>
```

Then update `MEMORY.md` → `last run: <date>`. If the shape has a contacts step, `status: contacts`, `next: tick the rows worth chasing`. If it has none, `status: run` and `next:` points at the rerun — the shape example says which.

Before handoff, run the topic-neutral consistency check:

```
python3 tools/session_audit.py <slug>
```

Fix errors before GATE 4. Warnings remain visible in the gap report when they
represent a real limitation rather than a malformed file.

---

## 8. GATE 4

For a ledger:

```
Tick the rows worth chasing in shortlist.md — `- [ ]` → `- [x]`.
Contact lookup runs on those only.
```

Rows that came in already ticked stay ticked and are already looked up; untick one to
drop it. Say how many rows actually need a decision this run — the `new` ones plus the
`changed` ones — so the human knows what they are looking at. If none of them ends up
ticked, that is an empty gate: stop and ask, never read it as all of them.

For a brief, ask the human to review the stated next action—read it before the
occasion, make the decision, or request a refresh.

Wait. Contact lookup is the expensive step and it runs once per organisation — do not pre-run it on everything to be helpful.

When the shape has no contacts step, GATE 4 is still a stop: say the result is final, say what the human does with it, and point `next:` back at the rerun rather than forward at a step that does not apply.
