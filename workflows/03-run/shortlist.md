# Build the shortlist

Use this only for `selection: rows`, after writing `results.md`.

Run the session's deterministic projection:

```sh
python3 sessions/<slug>/tools/shortlist.py <slug>
```

Create the script from `sessions/_template/tools/README.md` on the first run. It
reads actionable result rows, refuses missing or duplicate identities, regenerates
`shortlist.md`, and carries old checkboxes forward by identity.

Every line has this form:

```md
- [ ] <issuer> — <item> · <score> <!-- identity: <canonical value> -->
```

New identities start unticked. Existing identities preserve their exact choice.
Gone rows disappear. Never rebuild, compare, tick, or untick the shortlist by
judgement. `results.md` remains the read-only run artifact.

Run the script's `--selfcheck` after changing it. Then follow `publish.md`.
