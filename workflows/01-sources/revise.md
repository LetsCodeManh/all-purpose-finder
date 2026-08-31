# Revise sources

Use this when sources were already approved.

1. Keep the session's current stable `status` and published result.
2. Probe proposed sources exactly as an initial source.
3. Report three compact groups: already present, new, and not checked with reason.
4. Include changes to `## gaps` and `## notes` in the delta.
5. Repeat Gate 2 for new, removed, or materially changed rows only. Stop.
6. After approval, edit the existing table and update `Last updated`.

Adding a source may close a recorded gap; remove or strike the obsolete gap so
the file does not contradict itself. A source that fails becomes a dated note.

A browser or hand check records `manual status` and `manual checked`; it does not
promote a reproducibly `blocked` source to `page` or `feed`.

If the new source introduces a question the approved criteria do not cover,
continue with `workflows/02-criteria/revise.md`. Otherwise rerun only the affected
result through `workflows/03-run/README.md`; its router selects `refresh.md`.
