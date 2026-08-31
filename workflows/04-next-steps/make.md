# Make the chosen output

Use only the selected rows or whole artifact defined in `choose.md`.

1. If `next-steps/<name>.md` exists, run its precondition first and follow it.
2. If no procedure exists, make the requested one-session output directly from
   the user's description. Do not require a reusable procedure.
3. Write session output only inside `sessions/<slug>/`.
4. Update `MEMORY.md` to `status: <output-name>` and set `next:` to what the user
   naturally does next.

The same published result can produce another output later; route back through
`choose.md` rather than rerunning the search.

After a new kind of output succeeds, ask whether to publish a generic procedure
as `next-steps/<name>.md`. Wait for approval because that file becomes executable
public method. Scrub all names, facts, numbers, URLs, vendors, and session details.
This publication check is not a session gate.
