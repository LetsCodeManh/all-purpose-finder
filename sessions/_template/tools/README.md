# tools

Scripts belong to **this session**, not to the engine.

The first three — `probe.py`, `prefilter.py`, `regex.py` — were written for a
jobs session, and they are jobs-shaped: they normalise the field names job
feeds use, and their patterns trace to that session's `must` lines. A price
session parses a promotions feed with a from–to window. A company-research
session may need no script at all. One shared copy would have to know about all
three, and a script that knows the topic is the thing `AGENTS.md` forbids.

So: copy what fits from an existing session's `tools/`, change it freely, and
do not reach into another session's copy. **The cost is real** — a bug fixed
here is not fixed next door. That is the trade: divergence you can see, over a
shared script that quietly grows a branch per topic.

Rules that hold whatever the script does:

- **stdlib only.** No install step, ever.
- **a `--selfcheck` flag** that runs without network and asserts the parsing
  the script depends on.
- **no regex on the command line.** Patterns live in the `## prefilter` block
  of `criteria.md`, so a run is repeatable tomorrow.
- **locate the repo by searching upward for `AGENTS.md`**, never by counting
  `parent` levels — the count breaks the moment a file moves.
- **no LLM in the pre-filter.** It is a dumb, cheap, deliberately wide drop.

Delete this folder if the session needs no scripts.
