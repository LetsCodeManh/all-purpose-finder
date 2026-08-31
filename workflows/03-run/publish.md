# Publish a run

Before publication, write `## gaps this run` at the foot of `results.md` and
include the same compact block in the message:

```text
blocked, open by hand: <names>
manually checked:      <name> (<status>, <date>)
page not read:         <name> — <reason>
failed this run:       <name> (<error>)
not checked since:     <name> — <date>
```

Also state missing fields, source material not published, bodies Scout chose not
to read, and relevant coverage gaps. Update `sources.md` notes and gaps discovered
during the run, but do not add an unapproved source.

Validate and publish atomically:

```sh
python3 tools/session_audit.py <slug>
python3 tools/publish_run.py <slug> finish
```

Fix structural errors before publication. Keep genuine limitations as visible
warnings. Never edit `last run`, `pending run`, or the publication status by hand.

Successful publication advances `last run`, clears `pending run`, and writes:

```text
status: next-steps
next: decide what, if anything, to make
```

Present the result, scoring drops, and gaps. Then route immediately to
`workflows/04-next-steps/README.md`. The user may instead correct a source or
criterion; that follows the revision loop and preserves this published result
until its replacement is ready.
