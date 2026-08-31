# Revise criteria

Criteria often change after the first result. That is useful feedback.

1. Keep the stable session `status` and existing published result.
2. Show only added, removed, or changed lines.
3. Repeat Gate 3 for that delta and stop.
4. After approval, edit `criteria.md` and update `Last amended`.
5. If a `must` changed, update and validate its prefilter pattern.
6. Record which cards are affected; unchanged rules do not need re-evaluation.

If the question needs another source, approve that source first through
`workflows/01-sources/revise.md`. Re-scoring can normally reuse `listings.md`
without network access; say so when the user hesitates to correct a rule.

Continue with `workflows/03-run/README.md`; its router selects `refresh.md` and
then re-scores the affected cards.
