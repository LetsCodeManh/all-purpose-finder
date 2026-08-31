# Open or resume a session

## Bare request

When the user gives no slug or topic:

1. Say in one line what Finder's two session assistants do.
2. List real session folders with their shape, status, and last run. Skip names
   beginning with `_`.
3. Ask which one to continue, or ask for a new topic in one line.
4. Stop. Create nothing.

## Named session

Match the slug exactly.

- Exact folder match: read its `MEMORY.md`, show its `status` and `next:` in a
  short block, then use `workflows/README.md`.
- No exact match: show close matches and ask whether one is intended or this is a
  new topic. Never create a second session from a likely typo.

For `done` or an output-name status, follow `next:` when the user asks for that
action. A refresh routes to `workflows/03-run/README.md`; another output routes
to `workflows/04-next-steps/README.md`.

`MEMORY.md` is a pointer only: slug, shape, status, run dates, and one `next:`
line. It contains no sources, criteria, results, or other topic data. Its exact
format is in `sessions/_template/MEMORY.md` and `CONTRACT.md`.
