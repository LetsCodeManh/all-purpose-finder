# Run router

Read `examples/<shape>.md`, including its frontmatter and `03 — run` section.
Do not infer the path from existing files.

If the request changes an approved source or criterion, stop here and use
`workflows/00-session/revise.md`. Return only after its gate passes.

Before any fetch, run:

```sh
python3 tools/publish_run.py <slug> begin
```

This marks a pending run while preserving the last published result. Until
publication, call that artifact **Previous Results** and do not open Next Steps.

Then choose only what applies:

1. Existing result, source change, criteria change, or requested refresh: read
   `refresh.md`.
2. `cardinality: many`: read `many.md`.
3. `cardinality: one`: read `one.md` instead. Do not prefilter, score, or diff.
4. `selection: rows`: after results, read `shortlist.md`.
5. Every path ends with `publish.md`.

If the result is already published and the user only wants to view or act on it,
do not fetch. Route to `workflows/04-next-steps/README.md`.

Rules: `AGENTS.md`. Exact artifact formats: `CONTRACT.md` and the session
templates.
