# Make the chosen output

Use only the selected rows or whole artifact defined in `choose.md`.

1. Turn the user's choice into a short lowercase hyphenated output name. Do not
   use the reserved statuses `sources`, `criteria`, `run`, `next-steps`, or `done`.
2. Create `sessions/<slug>/outputs/<name>/` only now, after Gate 4 chose it.
3. Write `README.md` there as the canonical entry. Start from
   `sessions/_template/outputs/_template/README.md` when useful.
4. Put supporting files in the same output folder. Never write them at the session
   root or inside another output.
5. Verify the output against the user's request and selected input.
6. Only after the canonical README exists, update `MEMORY.md` to
   `status: <name>` and set `next:` to what the user naturally does next.

The README states what was made, its input, the deliverable, and remaining gaps.
It may be the whole deliverable or a short index to files beside it.

The same published result can produce another output later. Give it another
folder and route back through `choose.md`; do not rerun the search or overwrite a
previous output.
