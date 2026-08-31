# Workflows

Use one procedure at a time. Start with the user's request and the session's
`MEMORY.md`.

If the request changes an already approved source, criterion, occasion, question,
slug, or shape, open `00-session/revise.md` before following the status table.
Otherwise open the folder matching the status.

| state | open |
|---|---|
| no session or no exact slug | `00-session/README.md` |
| `status: sources` | `01-sources/README.md` |
| `status: criteria` | `02-criteria/README.md` |
| `status: run` | `03-run/README.md` |
| `next-steps`, `done`, or an output name | `04-next-steps/README.md` |

The folder's `README.md` is a router. Read only the procedures it selects, plus
the matching section of `examples/<shape>.md` when instructed.

The table is a default path, not a one-way pipeline. A request may revise sources
or criteria at any time. Keep the last published result valid while the change is
approved, then rerun only what depends on it.

Rules: `AGENTS.md`. Machine-readable file formats: `CONTRACT.md`.
