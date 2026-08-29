# 03 — run

Fetch, narrow with a script, score the survivors, diff against last time.

Rules: `AGENTS.md`. Entry: `00-session.md`.

In: `sources.md` + an approved `criteria.md`. Out: `results.md`, plus
`shortlist.md` for `selection: rows` and `listings.md` for ledger shapes.

Worked example: `examples/<shape>.md` → *03 — run*, for the shape named in this session's `shape:` field. No example yet for this shape? Run the step from here anyway, say so, and write that section afterwards from what happened.

If the run is already published (`status: next-steps`, `done`, or a next-step output
name), route to `workflows/04-next-steps.md`; never refetch merely because the result
is being viewed again.

Before the first fetch of every initial run or rerun:

```
python3 tools/publish_run.py <slug> begin
```

This makes the run pending before `listings.md` can move ahead of the published
result. If a previous result exists, call it **Previous Results** until publication.
Do not offer Next Steps while `pending run:` exists.

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

**A `page` source you did not read is a gap, and it has to be written down.** This
is the easiest step in the whole run to skip, because skipping it looks like
nothing: the row still says `ok`, its `last checked` still carries the date the
probe fetched it, and `listings.md` simply has no rows from it. Nobody can tell
the difference between a page source that yielded nothing and one nobody opened.

So every `page` + `ok` row ends a run in exactly one of two states:

1. its survivors are under `## page sources` in `listings.md`, or
2. it is named in the gap report as **not read this run**, with the reason

The heading goes in whether or not anything survived — `## page sources` with a
line saying which sources were read and found nothing is the record that they
were read. An empty heading is a claim, the same way an empty `## gaps` is.

```
## page sources — read by hand, appended after the script

| issuer | item | location | url | date | salary | state | kept | source |
|---|---|---|---|---|---|---|---|---|
| <issuer> | <item> | <where> | <url> | <date> | <value> | new | yes | <source name> |

read and nothing survived: <names>
```

The script matches the heading as a prefix, so a suffix after `## page sources`
is free — it does not have to be the bare heading.

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
before writing anything — and `cardinality: one` is what makes the pre-filter, the
score and the diff not apply at all: sections 1, 4 and 5.

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

### Say how deep you read

**`unknown` means two different things and only one of them is the world's
fault.** A value the source never published is a gap in the source. A value
sitting in a posting body you did not fetch is a gap in the run. They score
identically, they print identically, and the second one is the tool hiding its
own shortcut behind a flag that looks like honesty.

A feed carries a title, a seat, a date, sometimes a salary. Everything else — the
experience band, the degree demand, the team, whatever an `open` criterion is
judged on — is in the body, and the body is a fetch per row. Not fetching is a
legitimate call: it is the difference between one request and three hundred.
Pretending it was not a call is not.

So the run header states the depth in one line, before any card:

```
Read: feed fields only, bodies not fetched. Undecidable on that alone:
<criterion>, <criterion>. Say the word and the ticked rows get their bodies read.
```

And on a card, a criterion undecidable for that reason is marked as such rather
than as `unknown`:

```
range  ? <criterion> — not read (in the posting body)
range  ⚠ <criterion> — not published (target X, limit Y)
```

`?` is the tool's gap, `⚠` is the source's. Both stay on the card, neither drops
a row, and the human can see which one a rescore would fix.

### The card

One per surviving row. Same layout whatever the topic:

```markdown
### <issuer> — <item>
<!-- identity: <canonical value from criteria.md identity> -->
<where> · [<link>](<url>) · posted <date>
source: <which source> · also seen: <other sources>

must   ✓ <criterion>
must   ✓ <criterion>
range  ⚠ <criterion> — not published (target X, limit Y)
range  ✓ <criterion> — <value found>
range  ? <criterion> — not read (in the <item> body)
nice   ✓ <criterion>
open   ✓ <criterion> — <what you judged on>

4/7 · 1 unpublished · 1 not read · 0 must misses
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

`results.md` is **one file, rewritten each run**, in the four state sections plus
`## dropped at scoring`. Skeleton: `sessions/_template/results.md`. A shape may rename
or drop a section when it does not apply — a shape where nothing expires has no `gone` —
but it never adds one of its own silently. Say what you changed and why.

```
## new                 ← full cards
## changed             ← name the columns the state gave you, in words: the deadline moved, the price dropped
## unchanged           ← collapsed to one line each, not full cards; keep its hidden identity marker
## gone                ← keep the card, mark it
## dropped at scoring  ← one line each, and the `must` that killed it
```

### `## dropped at scoring` — where your own drops go

The four state sections record what survived. **A row you killed on a `must` miss
is in none of them**, and that is the one drop in this pipeline with no home
anywhere else: the pre-filter's drops are held in `listings.md` as `kept: no` rows
with their reason, by rule, because a deterministic drop you cannot see is a drop
you cannot disagree with. The same argument binds harder here — this drop is a
judgement, not a regex, and it is the one nobody can reproduce.

So it is a section of its own, not a count in a sentence. One line per row, naming
the criterion by its number in `criteria.md` and what the row actually said:

```
- **<issuer> — <item>** · <source> · [<link>](<url>) — must #<n> — <what it said, in a clause>
```

`must #<n>` is the position of the line under `## must` in `criteria.md`, counted
from 1. The number is what makes the drop arguable — the human reads the rule and
the row on one line and can overrule either. Open the section with the count and
what it means:

```
<N> rows survived the prefilter and were then dropped by a `must` miss. Each one
names the criterion, so you can overrule it.
```

**This is not the pre-filter's drops.** Those stay in `listings.md` and are usually
an order of magnitude larger. Say which is which — a reader who confuses the two
thinks the scoring threw away three thousand rows.

- `unchanged` → stays collapsed to one line, is not re-scored and is not re-looked-up
- `changed` → says `changed: <cols>` in words. A `changed` card whose row is ticked in
  `shortlist.md` sorts to the top of its section: the human already decided on it once,
  and this is the row where the decision might now be wrong
- `gone` → the card is marked gone and drops next run

`gone` is not a deletion. Something that vanishes is information — it was taken, or it was pulled. The script shows it for one run and then drops it, so this file is the only place it is ever written up.

`page` rows are appended by hand below `## page sources` and the script does not diff them. Their state is yours to state in words.

Never re-print the whole list as if it were new. **New-since-last-run is the reason anyone runs this twice.**

---

## 6. Write the shortlist — `selection: rows`

Write `results.md` first, then generate `sessions/<slug>/shortlist.md` beside it
with this session's deterministic script:

```
python3 sessions/<slug>/tools/shortlist.py <slug>
```

On the first row-selection run, write `shortlist.py` before invoking it; there is
no shared copy. Start from the specification in
`sessions/_template/tools/README.md` or copy a neighbouring session's version and
diverge. It belongs to this session and never imports another session at runtime.

The script projects one compact line per row kept in `results.md`, in the same
order. It reads the previous shortlist before replacing it and carries ticks by
the `identity` key from `criteria.md`. It has `--selfcheck`, uses no network and
no LLM, and refuses a result row whose identity or score line it cannot read.
Specification: `sessions/_template/tools/README.md`. Skeleton for the output:
`sessions/_template/shortlist.md`.

```
- [ ] <issuer> — <item> · <score> <!-- identity: <canonical value> -->
```

**Regenerate it whole, and carry the ticks forward by `identity`** — the same key the
diff used above. A row that was already there keeps the tick it had, only a row new
to this run is written `- [ ]`, and a `gone` row drops off. **Never auto-untick.**
This is deterministic projection and comparison, so the script owns it; do not
rebuild or compare the shortlist by eye.

A `selection: artifact` shape writes no shortlist. Its `results.md` is the whole
input to GATE 4.

---

## 7. Report the gaps in the same message

Every run ends with what it did not do:

```
blocked, open by hand: <names>
manually checked:      <name> (<checked|partial|unavailable>, <date>)
page not read:         <name> — <why>
failed this run:       <name> (<error>)
not checked since:     <name> — <date>
```

**Write this block at the foot of `results.md` as well as saying it.** Every other
gap in this repo has a file behind it; this one used to live only in a chat message,
which meant the rule that keeps blocked sources visible *every run* was the one rule
nobody could check afterwards. A message is gone tomorrow. Put it under a `## gaps
this run` heading at the end of the file, and it is still there next week, in the
file the human actually opens.

`page not read` is the line from section 1, and it is not optional: a `page` + `ok`
source with no rows under `## page sources` is named here with the reason, every run.

**A run discovers gaps, and they go back into `sources.md`.** The message above is
gone tomorrow; the file is not. A source that failed, one that has not been checked
in a month, a kind of place you noticed is missing while reading the results — the
first two are `## notes` with a date, the third is `## gaps`. Update the section,
update `Last updated:`, and do not rewrite the table from what the run saw:
adding a source is GATE 2, not a run.

Then publish the run; do not edit those MEMORY fields by hand:

```
python3 tools/publish_run.py <slug> finish
```

The command refuses date mismatches or audit errors, then atomically updates
`MEMORY.md` → `last run: <date>`, `status: next-steps`,
`next: decide what, if anything, to make`. `results.md` and, for
`selection: rows`, `shortlist.md` now exist together. Results stay available for
review or correction, while GATE 4 (Next Steps) is immediately ready.

For diagnostics before publication, run either check:

```
python3 tools/session_audit.py <slug>
python3 tools/publish_run.py <slug> check
```

Fix errors before publication. Warnings remain visible in the gap report when they
represent a real limitation rather than a malformed file.

---

## 8. Present the result and open Next Steps

Present `results.md`, including its scoring drops and gap report, then route to
`workflows/04-next-steps.md`. Results are not an approval gate. If the human spots
something wrong or missing, apply the source or criteria delta gates and rerun only
the affected sections.
