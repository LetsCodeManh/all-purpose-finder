# next step — contacts

Find a human to talk to, for the rows the human ticked. Nothing else.

Rules: `AGENTS.md`. Reached from `workflows/04-next-steps.md`, never on its own.
Out: `sessions/<slug>/contacts.md`.

## Precondition

Two, and both **refuse and point**. Never continue on a guess, and never fill the
gap yourself.

The shape must use `selection: rows`. An artifact-wide result has no organisations
chosen for contact lookup; if the human wants contacts from one, row selection is a
different output that must be named first.

No results yet:

```
No results yet — this session is at `criteria`.
Next steps work on results. Continue the session first:  /session <slug>
```

Results, but nothing ticked:

```
Nothing ticked in shortlist.md — 12 rows, 0 of them chosen.
Contacts runs on the rows you tick. Tick the ones worth chasing, then say go.
```

An unticked shortlist is an answer, not a blank to fill in. Do not look up "all of
them", do not pick the high scorers, do not tick a row on the human's behalf.

---

## 1. Read the ticks

Only rows the human marked `- [x]` in `shortlist.md`. A `- [ ]` is an answer — do not
look up an organisation because it scored well. `results.md` holds the cards behind
those rows; it holds no ticks and this step never writes to it.

**Once per organisation, not once per row.** Two ticked rows from the same org is one lookup.

Check `contacts.md` first. An org already in there is done — reuse it, note the date, and say so. Re-looking-up a cached org is the most common way this step wastes an afternoon.

---

## 2. Look up

Per organisation, in this order, stopping as soon as you have something usable:

1. **The item itself** — a named person, a contact block, or a team page linked from it. Most reliable and most often skipped.
2. **The organisation's own site** — team, about, contact pages.
3. **A public search** for whoever owns this kind of thing there.

Take what is **publicly published for this purpose**: a listed contact address, a public professional profile, an author byline.

Do not guess an address from a name and a domain pattern. A guessed address bounces or lands wrong, and the human finds out by being ignored. **No contact is better than a wrong one** — write `not found` and let them decide whether to chase it by hand.

---

## 3. Write

`sessions/<slug>/contacts.md`. Skeleton: `sessions/_template/contacts.md`.

- **`not found` rows stay in the file.** That is the difference between "nobody there" and "never looked" — and it stops the next run from spending the lookup again.
- `source` is where you got it. The human has to be able to check your work.
- `found` dates the row, so a stale contact is visible as stale.

Append only. Never rewrite an existing row on a later run.

---

## 4. Hand back

Report per ticked organisation: found / not found / already cached. Then:

```
MEMORY.md → next: <what the human does with these>
```

**Stop at the contact.** This procedure finds the human; it does not write to them.
Drafting the message, the letter or the bid is a different thing to make, and the
  human names it — offer it back at GATE 4 if it is worth offering, and write nothing
until they answer. Producing an unasked-for draft is the same failure as looking up
an unticked row.
