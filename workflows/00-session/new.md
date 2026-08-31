# Create a session

Use this when the user describes a new topic.

## Prepare Gate 1

1. Propose a short lowercase hyphenated slug. Do not use a hash or date.
2. Read the available files in `examples/`. Decide whether this topic fits a
   shape or needs a new one.
3. Say back what you understood in two lines. For a one-shot topic, include its
   occasion and date; write `occasion not supplied` when missing.
4. Ask whether this is one subject to understand or many candidates to choose
   from. Say how you read it.

Then explain the four stops in plain language: this plan, sources, criteria, and
Next Steps after the result. State that approving the plan approves nothing
later. Do not name sources, criteria, expected findings, or a predetermined
output. Ask whether the slug and reading are right, then stop.

Use a short explanation for someone who has used Finder before. For a first
session or new shape, explain the whole path and where Scout waits.

## New shapes

A new shape is likely when the result form, cadence, selection surface, identity
key, or applicable steps differ from every existing shape. Say what makes it
different and propose the name at Gate 1. Do not force a near fit.

After approval, copy `examples/_template.md` to `examples/<shape>.md`. Fill each
section only after that workflow actually runs. Keep it public and generic:
placeholders only, with no session facts, URLs, or vendors.

## After approval

Only after Gate 1:

1. Create `sessions/<slug>/`.
2. Copy `sessions/_template/MEMORY.md` and fill `slug`, `shape`,
   `status: sources`, `last run: —`, `pending run: —`, and
   `next: propose sources`.
3. Copy no other skeleton yet.
4. Continue with `workflows/01-sources/README.md`.

The approved slug, shape, and current step are durable state. Record them before
searching so an interrupted session resumes correctly.
