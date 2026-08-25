# tools

Scripts belong to **this session**, not to the engine.

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

A jobs session tends to end up with three:

| script | does |
|--------|------|
| `probe.py` | fetch one URL, report `feed` / `page` / `blocked` with the reason, print the field names a feed actually carries. Run before a source is proposed |
| `regex.py` | read the `## prefilter` block out of `criteria.md` and hand back the patterns |
| `prefilter.py` | fetch every `feed`+`ok` source, normalise, dedupe, apply the patterns, diff against `listings.prev.md`, write `listings.md` |

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
- **a deterministic step that drops something ships with a way to see what it
  dropped.** Deterministic means repeatable, not correct — a wrong script is
  wrong identically every run, and consistency reads as confidence. `probe.py`
  exists for the fetch guess; `listings.md` keeps dropped rows marked `—` rather
  than deleting them.
- **fail loudly.** A source that errors is reported by name with its error. A
  heuristic that guesses (which field is the location, which date is the
  deadline) ships with a way to see the guess — that is what `probe.py` is for.

Delete this folder if the session needs no scripts.
