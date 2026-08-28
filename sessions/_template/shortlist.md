# shortlist — <slug>

Run YYYY-MM-DD · 0 rows · 0 ticked

One line per kept row in `results.md`. Tick the ones worth acting on —
`- [ ]` → `- [x]`, clicked here or typed. **The ticks are the input to step 4**;
`results.md` itself is never ticked and never edited by a later step.

**Regenerated at the end of every run**, right after `results.md` is written, from
the rows that survived scoring. Rewriting it is not permission to reset the human's
decisions: **carry the ticks forward by `identity`** — the key in `criteria.md` that
the diff already uses — before overwriting.

- a row that was here before keeps the tick it had, whatever its state this run.
  Nothing is re-decided and step 4 re-looks-up nothing
- only a row new to this run arrives `- [ ]`
- a row that is `gone` this run drops off the list, and its tick goes with it
- **never auto-untick.** Unticking makes people redo settled work

Nothing else in this file begins with a checkbox, so ticks stay countable by a
script rather than by eye. Rules: `AGENTS.md` → **Ticks**.

A shape with no ledger and no step-4 decision to make writes no shortlist at all.

- [ ] <issuer> — <item> · <score>
