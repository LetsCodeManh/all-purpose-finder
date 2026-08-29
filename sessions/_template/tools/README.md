# tools

Scripts belong to **this session**, not to the engine.

The one shared lifecycle script is `tools/publish_run.py` at the repository root.
It is topic-neutral and writes only `MEMORY.md`: use `<slug> begin` before fetching,
then `<slug> finish` after this session's artifacts pass validation.

**This folder ships no code, and that is deliberate.** A jobs session writes
scripts that normalise the field names job feeds use. A price session parses a
promotions feed with a from–to window. A tender session has to read a closing
date, which neither of the others has. A company-research session may need no
script at all. One shared copy would have to know about all of them, and a
script that knows the topic is the thing `AGENTS.md` forbids.

So: write what this session needs. Copy what fits from an existing session's
`tools/` and change it freely, but never reach into another session's copy at
run time. On the first session in a fresh repo there is nothing to copy — write
it from the rules below. That is the intended path, not a missing file.

**The cost is real:** a bug fixed here is not fixed next door. That is the
trade — divergence you can see, over a shared script that quietly grows a
branch per topic.

A row-selection jobs session tends to end up with four:

| script | does |
|--------|------|
| `probe.py` | fetch one URL, report `feed` / `page` / `blocked` with the reason, print the field names a feed actually carries. Run before a source is proposed |
| `regex.py` | read the `## prefilter` block out of `criteria.md` and hand back the patterns |
| `prefilter.py` | fetch every `feed`+`ok` source, normalise, dedupe, apply the patterns, diff against `listings.prev.md`, write `listings.md` |
| `shortlist.py` | after `results.md` is written, project its kept rows into `shortlist.md` and carry ticks forward by the hidden `identity` marker |

`shortlist.py` reads only the result sections that remain actionable: full cards
and collapsed kept rows, never `gone` or `dropped at scoring`. Every input row has
exactly one `<!-- identity: ... -->` marker. The script:

1. reads the previous shortlist into `identity → checked`
2. reads the new result in display order and refuses missing or duplicate identities
3. copies the visible issuer, item and score without rewriting them
4. emits `Run <date> · <N> rows`, then one checkbox line with the hidden identity
5. writes atomically, preserving `x` or blank by identity and defaulting only new
   identities to blank

The ticked count is deliberately not stored in the header: a UI click changes one
checkbox line, and a second mutable tally would become stale immediately. Count the
checkboxes when displaying or auditing them.

**`probe.py` usually grows a second mode, and it is the one that finds the primary
sources.** Many domains publish through a small set of hosted platforms rather than
each site rolling its own: whoever originates the thing signs up with one of a
handful of vendors, and that vendor exposes the same feed path for every customer.
So the useful question is not *does this one URL have a feed* but *which of the
known vendors is this subject on*, and the answer is one cheap request per vendor:

```
probe.py --<sweep> <subject-slug>     # try every known vendor pattern, report which answer
```

Where a domain works this way, the sweep is the difference between finding the
primary source and settling for an aggregator that lags it — and step 1 names the
primary source as the highest-value and most often missed. Two traps it must report
rather than resolve: a vendor slug that answers with **a different subject's data**
because the slug collides, and one subject answering on **two vendors at once**, where
fetching both costs a request per run and changes nothing after the dedupe.

Which vendors those are is this session's knowledge, not the engine's. The list is a
constant in this session's `probe.py`; a session on another topic has a different list
or none at all.

Rules that hold whatever the script does:

- **stdlib only.** No install step, ever.
- **a `--selfcheck` flag** that runs without network and asserts the parsing
  the script depends on.
- **no regex on the command line.** Patterns live in the `## prefilter` block
  of `criteria.md`, so a run is repeatable tomorrow.
- **locate the repo by searching upward for `AGENTS.md`**, never by counting
  `parent` levels — the count breaks the moment a file moves.
- **no LLM in the pre-filter.** It is a dumb, cheap, deliberately wide drop.
- **anything countable or comparable is a script.** Counting and set comparison are
  where an LLM is both the most expensive tool and the only one whose mistakes
  nobody can spot — a miscounted tally and a missed `gone` row both look like
  nothing. Reading meaning stays with the agent; that is the whole split.
- **`shortlist.py` is a projection, not a scorer.** It reads the stable identity
  marker and visible label/score already written in `results.md`, preserves the old
  checkbox by identity, and writes the compact file atomically. It refuses missing
  or duplicate identities. It never decides whether a row belongs or changes a score.
- **a deterministic step that drops something ships with a way to see what it
  dropped.** Deterministic means repeatable, not correct — a wrong script is
  wrong identically every run, and consistency reads as confidence. `probe.py`
  exists for the fetch guess; `listings.md` keeps dropped rows marked `—` rather
  than deleting them.
- **fail loudly.** A source that errors is reported by name with its error. A
  heuristic that guesses (which field is the location, which date is the
  deadline) ships with a way to see the guess — that is what `probe.py` is for.

Delete this folder if the session needs no scripts.
