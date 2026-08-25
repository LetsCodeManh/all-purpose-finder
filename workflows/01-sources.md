# 01 — sources

Turn a vague direction line into a list of places worth checking, that the human owns.

Rules: `AGENTS.md`. Entry: `00-session.md`.

In: a direction line. Out: `sessions/<slug>/sources.md`, `status: criteria`.

Worked example: `examples/<shape>.md` → *01 — sources*, for the shape named in this session's `shape:` field. No example yet for this shape? Run the step from here anyway, say so, and write that section afterwards from what happened.

---

## 1. Search live

Do not answer from memory. Sites move, feeds die, aggregators shut down. Search now.

Cast wider than the obvious. For any topic, sweep at least:

- the big aggregators for that domain
- the small or regional ones — the ones with less competition on them
- **the primary sources**: whoever originates the thing, publishing it themselves. Downstream aggregators lag them and drop fields. These are the highest-value and the most often missed. Name what the primary source is for this topic before you start searching — if you cannot, you do not understand the topic yet.
- anything the human named in their direction line, even if you think it is weak

---

## 2. Establish the read method

```
python3 sessions/<slug>/tools/probe.py <url> [<url> ...]
```

For every candidate, **check the method before proposing it**. A proposed source with a guessed method is worthless — the human prunes on the method as much as the name.

Try in order:

1. **`feed`** — is there RSS, JSON, or a public API? Fetch it once and confirm it returns real items. Note the count.
2. **`page`** — does a plain HTML read return the items? Confirm they are actually in the HTML, not injected by JavaScript.
3. **`blocked`** — auth wall, aggressive bot protection, or content only rendered by JavaScript.

**Never write a per-site scraper.** A site needing one is `blocked`. That is the definition.

`probe.py` also prints the field names a feed actually uses, and warns when several could carry the same meaning. Read that line. `prefilter.py` takes the first alias that matches and the first is not always right — one feed can carry the same concept twice at different precision, and the wrong pick mislabels every row from that source and raises no error. The shape example names the trap for its own domain.

A feed too large to read in one request is `blocked`, not `ok`. A row marked `ok` that fails on every run is worse than a row that says what it is.

If a fetch fails, say how it failed — `403`, `timeout`, `empty` — not just "blocked". The human may know the site works from their own machine, and that is the difference between a dead source and a manual one.

---

## 3. Propose

One table. Every row gets a **why-line** — one clause on what this source gives that the others do not. A source you cannot write a why-line for is a source you are padding the list with.

Order: `feed` first, then `page`, then `blocked`. Best-read first.

| name | type | url | method | why |
|------|------|-----|--------|-----|
| <primary source> | <type> | <url> | feed (N items) | <what only this one gives> |
| <regional aggregator> | <type> | <url> | page | <coverage the others miss> |
| <big walled platform> | <type> | <url> | blocked (auth) | <volume — open by hand> |

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

Copy `sessions/_template/` to `sessions/<slug>/` now, and fill `sources.md`:

- `type` is a **column** — whatever kinds this topic has. Not a folder, not separate files.
- `status`: `ok` · `blocked` · `error` · `untested`
- `last checked`: the date you actually fetched it. This is what catches a source silently skipped for a month.
- Blocked rows **stay in the file**, with the URL to open by hand.

Delete the skeleton files this session has not reached yet, and `tools/` if it needs no scripts. Anything left in `tools/` is this session's own — copy from a neighbouring session and diverge, never import across sessions. Rules: `sessions/_template/tools/README.md`.

Then update `MEMORY.md` → `status: criteria`, `next: write criteria`.

---

## Rerunning this step

The human comes back later and wants more sources. **Report the delta, never the whole list again.**

Three buckets, in this order:

```
already have (N)   — <names, one line>
new, not on your list (N)
  - <name> — <method, item count> — <why-line>
not checked (N)
  - <name> — <how the check failed>, unverified
```

Then GATE 2 again on the new rows only. Never re-litigate rows the human already pruned.
