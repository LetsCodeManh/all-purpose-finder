# 04 — contacts

Find a human to talk to, for the rows the human ticked. Nothing else.

Rules: `AGENTS.md`. Entry: `00-session.md`.

In: ticked rows in `results.md` — rows marked `- [x]`. Out: `sessions/<slug>/contacts.md`.

Worked example: `examples/<shape>.md` → *04 — contacts*, for the shape named in this session's `shape:` field. No example yet for this shape? Run the step from here anyway, say so, and write that section afterwards from what happened.

Some shapes have no one to contact — a price hunt ends at the result. Then this
step is one line: "nothing to look up here", `MEMORY.md` updated with
`contacts: n/a — <reason>`, done. Saying it in the terminal alone loses it; the key
keeps it on disk.

---

## 1. Read the ticks

Only rows the human marked `- [x]` in `results.md`. A `- [ ]` is an answer — do not
look up an organisation because it scored well.

**Zero ticks among the rows that needed a decision stops this step.** If nothing that
arrived `new` or came back `changed` carries a tick, do not proceed and never resolve
it as "then all of them": say what you found and ask. Ticks carried forward from
earlier runs are not an empty gate — those organisations are already in `contacts.md`
and need no lookup at all. Full rule: `AGENTS.md` → **Ticks**.

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

**Stop there.** Writing the outreach is workflow 5, and workflow 5 does not exist in v1. Do not draft the message, the letter, or the bid — even when it seems obviously helpful. The human writes it, and that is the design, not an omission.
