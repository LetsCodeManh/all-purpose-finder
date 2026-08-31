# Refresh or rerun

Determine why this run exists before fetching.

- Fresh-data request: refetch every approved readable source.
- Same data, criteria changed: reuse `listings.md` and re-score affected rows.
- Source delta: fetch the approved changed sources and preserve unaffected rows.
- Interrupted pending run: inspect the artifacts and continue or repair that run;
  never publish a mixture of dates.

For a many-candidate shape, the prefilter cache avoids same-day network work unless
`--refetch` is requested. On a new day it rotates `listings.md` to
`listings.prev.md`; a same-day refetch does not rotate again.

For a one-subject brief, reread only sources or sections affected by the request,
but keep attribution and the gap report complete.

An amendment keeps the last stable `status` while being approved. Once a new run
begins, `publish_run.py` owns the temporary `status: run` and `pending run:` state.
