# 01 — sources

Turn a vague direction line into a list of places worth checking, that the human owns.

Rules: `AGENTS.md`. Entry: `00-session.md`.

In: a direction line. Out: `sessions/<slug>/sources.md`, `status: criteria`.

---

## 1. Search live

Do not answer from memory. Sites move, feeds die, aggregators shut down. Search now.

Cast wider than the obvious. For any topic, sweep at least:

- the big aggregators for that domain
- the small or regional ones — the ones with less competition on them
- **the primary sources**: the organisations themselves. For jobs that is company career feeds; for tenders it is the buyer's own portal. These are the highest-value and the most often missed.
- anything the human named in their direction line, even if you think it is weak

---

## 2. Establish the read method

For every candidate, **check the method before proposing it**. A proposed source with a guessed method is worthless — the human prunes on the method as much as the name.

Try in order:

1. **`feed`** — is there RSS, JSON, or a public API? Fetch it once and confirm it returns real items. Note the count.
2. **`page`** — does a plain HTML read return the listings? Confirm the listings are actually in the HTML, not injected by JavaScript.
3. **`blocked`** — auth wall, aggressive bot protection, or listings only rendered by JavaScript.

**Never write a per-site scraper.** A site needing one is `blocked`. That is the definition.

If a fetch fails, say how it failed — `403`, `timeout`, `empty` — not just "blocked". The human may know the site works from their own machine, and that is the difference between a dead source and a manual one.

---

## 3. Propose

One table. Every row gets a **why-line** — one clause on what this source gives that the others do not. A source you cannot write a why-line for is a source you are padding the list with.

Order: `feed` first, then `page`, then `blocked`. Best-read first.

```
| name | type | url | method | why |
|------|------|-----|--------|-----|
| GitLab careers | company | boards-api.greenhouse.io/v1/boards/gitlab/jobs | feed (207 items) | all-remote, posts everything, clean JSON |
| Karriere.at | aggregator | ... | page | DACH coverage the global boards miss |
| LinkedIn Jobs | aggregator | ... | blocked (auth) | biggest volume, open by hand |
```

State the gaps out loud in the same message:

- what you looked for and did not find
- anything you could not check, and why

---

## 4. GATE 2 — the human prunes and adds

Ask plainly:

```
Cut what is noise, add what I missed. Then I write the file.
```

**Wait.** Do not write `sources.md` before the answer. Do not create the session folder before the answer.

Expect additions — the human knows sources you cannot search your way to. Add them with the same method check as everything else: verify before writing the row, do not take a URL on faith.

---

## 5. Write

Create `sessions/<slug>/` now, and write `sources.md`:

```markdown
# sources — <slug>

Last updated: YYYY-MM-DD

| name | type | url | method | status | last checked | why |
|------|------|-----|--------|--------|--------------|-----|
```

- `type` is a **column** — `aggregator`, `company`, `portal`, `board`. Not a folder, not separate files.
- `status`: `ok` · `blocked` · `error` · `untested`
- `last checked`: the date you actually fetched it. This is what catches a source silently skipped for a month.
- Blocked rows **stay in the file**, with the URL to open by hand.

Then update `MEMORY.md` → `status: criteria`, `next: write criteria`.

---

## Rerunning this step

The human comes back later and wants more sources. **Report the delta, never the whole list again.**

Three buckets, in this order:

```
already have (4)   — GitLab, Karriere.at, LinkedIn, Personio
new, not on your list (2)
  - Ashby job board API — feed, 40 items — covers startups the aggregators skip
  - StepStone DE — blocked (bot protection) — big DACH volume, open by hand
not checked (1)
  - Bundesagentur API — 403 from here, unverified. May work from your machine.
```

Then GATE 2 again on the new rows only. Never re-litigate rows the human already pruned.
