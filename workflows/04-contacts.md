# 04 — contacts

Find a human to talk to, for the rows the human ticked. Nothing else.

Rules: `AGENTS.md`. Entry: `00-session.md`.

In: ticked rows in `results.md`. Out: `sessions/<slug>/contacts.md`.

---

## 1. Read the ticks

Only rows the human marked in `results.md`. An untick is an answer — do not look up a company because it scored well.

**Once per company, not once per row.** Two roles at the same company is one lookup.

Check `contacts.md` first. A company already in there is done — reuse it, note the date, and say so. Re-looking-up a cached company is the most common way this step wastes an afternoon.

---

## 2. Look up

Per company, in this order, stopping as soon as you have something usable:

1. **The posting itself** — hiring manager, recruiter, or a team page linked from it. Most reliable and most often skipped.
2. **The company site** — team, about, careers pages.
3. **A public search** for the role owner: engineering lead, head of the team, the recruiter named in other postings.

Take what is **publicly published for this purpose**: a careers email, a recruiter's public profile, an author byline on the engineering blog.

Do not guess an email from a name and a domain pattern. A guessed address bounces or lands wrong, and the human finds out by being ignored. **No contact is better than a wrong one** — write `not found` and let them decide whether to chase it by hand.

---

## 3. Write

```markdown
# contacts — <slug>

| company | who | role | how | source | found |
|---------|-----|------|-----|--------|-------|
| Langfuse | Marc Klingen | co-founder | careers@langfuse.com | posting footer | 2026-08-24 |
| n8n | — | not found | — | checked site + posting | 2026-08-24 |
```

- **`not found` rows stay in the file.** That is the difference between "nobody there" and "never looked" — and it stops the next run from spending the lookup again.
- `source` is where you got it. The human has to be able to check your work.
- `found` dates the row, so a stale contact is visible as stale.

Append only. Never rewrite an existing row on a later run.

---

## 4. Hand back

Report per ticked company: found / not found / already cached. Then:

```
MEMORY.md → next: <what the human does with these>
```

**Stop there.** Writing the outreach is workflow 5, and workflow 5 does not exist in v1. Do not draft the email, the cover letter, or the bid — even when it seems obviously helpful. The human writes it, and that is the design, not an omission.
