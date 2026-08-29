# 00 — session

Entry procedure. Every finder session starts here, new or continuing.

Rules: `AGENTS.md`. Read them before this.

Worked example: `examples/<shape>.md` → *00 — session*, for the shape named in this session's `shape:` field. No example yet for this shape? Run the step from here anyway, say so, and write that section afterwards from what happened.

---

## Bare call — no slug given

The human typed `/session` or "start a finder session" with no topic.

**Create nothing.** Print:

1. One line on what finder does.
2. The existing sessions — folder name, `shape`, `status`, `last run` from each `sessions/<slug>/MEMORY.md`. Skip folders starting with `_`; they are skeletons, not sessions.
3. A prompt: "Which one, or describe a new topic in a line."

Then stop.

```
finder tracks things that get posted and expire.
One session per topic.

  <slug-a>     jobs      status: run        last run: 2026-08-24
  <slug-b>     prices    status: run        last run: 2026-08-24
  <slug-c>     <new>     status: criteria   last run: —

Which one, or describe a new topic in a line.
```

---

## A slug was given

**Exact match** on a folder in `sessions/` → continue it. Jump to *Continuing*.

**No exact match** → do not create anything. Show the close matches and ask.

```
No session called "<what they typed>".
Closest: <nearest existing slug>.

Continue that one, or is this a new topic?
```

A typo that silently creates a folder gives the human two sessions and they notice weeks later. **Never silently create.**

---

## A direction line was given

The human described a topic instead of naming one.

1. **Propose the slug yourself.** Short, readable, lowercase, hyphens. Never a hash, never a date. The human does not invent it — they approve or rename it.
2. **Name the shape — to yourself first.** Read the files in `examples/`. Either this topic is one of them, or it is not. The name goes in `MEMORY.md`; what the human hears is the plain-language question in the plan below, and — when the shape is new — one sentence on what makes it different. This is part of GATE 1, not a decision you make quietly, but it is not a word they should have to approve.
3. Say back, in two lines, what you understood the topic to be. For a one-shot
   shape driven by a meeting, decision, or deadline, include the occasion and
   date. If the human did not supply them, write `occasion not supplied` rather
   than inventing one; they can fill it in while approving GATE 1.
4. **GATE 1. Print the plan, then wait.** Below.

Before the answer, create nothing. After the human confirms the slug and the
one-subject/many-candidates reading, record that approval immediately — *After
GATE 1* below — before searching for sources.

### GATE 1 — print the plan

Say what the whole session is going to do before the human agrees to start it.
Not to be thorough: a human who can see where you stop can tell whether you
stopped there. This is the same four stops the rest of this repo is built on,
said once, in advance, out loud.

Three rules, and they are what make it safe to print:

- **Procedure, never findings.** You do not know the sources at GATE 1 — that is
  what GATE 2 is for. The plan says what the steps are and where each one stops.
  It never names a source, a criterion, or anything you expect to find. If you
  catch yourself writing "I'll check the usual boards", delete it.
- **It states what approving it does not approve.** A plan the human said yes to
  is the easiest thing in this repo to misread as permission for what comes
  after. It is not. The limit line is part of the plan and is never printed
  without it, never softened, never moved to the end as a footnote.
- **The plan is rendered, never stored.** It holds no fact that is not already in
  `workflows/`, so a stored copy only rots. After approval, the filled
  `MEMORY.md` is the record: slug, shape, `status: sources`, and nothing from the
  rendered plan.

**Plain language, never repo words.** A stranger cannot approve
`Shape: company-research`; they can answer *one thing, or many candidates?* —
which is `cardinality`, asked in human. Ask that one out loud, say which way you
read it, and let them correct you. The shape name is yours to carry; the
distinction behind it is theirs to confirm.

**Step 5 stays open.** Do not offer to write a report, and do not promise a list
of contacts. What the results are for is the human's call once they have seen
them, and saying so in advance is honest rather than vague.

#### Long form

When `sessions/` holds no real session yet, or the shape is new. About twenty
lines, and that is the intended cost — this is the one place a stranger learns
how the whole thing behaves.

```
Slug:  <proposed-slug>
Topic: <two lines, in your own words, of what you understood>

One question first, because it changes how I work:
is this one thing you want to know about, or many candidates you want to
pick from? I have read it as <many candidates / one subject>.

Here is the whole thing before we start. I stop and wait for you four times:

  now          you tell me the name above is right and I have understood the topic
  next         I go looking for places worth searching and bring you the list.
               You cut what is noise, add what I missed. I search nothing for
               real until you have
  after that   I write down what counts as a match, in your own words, and read
               it back. You approve it or change it
  at the end   you use the compact shortlist to pick what is worth acting on,
               then say what — if anything — to make from it

Then what to do with the results is your call — someone to contact, a report,
a list to apply from, something you name yourself. You choose that after you
have seen them, not now.

Saying yes here says yes to this plan and nothing else. I still stop at all
three of the others. I do not know what the sources are yet — finding out is
the next step, and you get to cut that list before anything is searched.

Good? Rename it if the name is wrong.
```

**When `selection: artifact`, there is no shortlist.** Keep the fourth stop, but
say that it acts on the result as a whole:

```
  at the end   you decide what, if anything, to make from the result
               as a whole
```

#### Short form

When the human has run a session before and the shape already exists — they have
seen the long form and do not need it twice.

```
Slug:  <proposed-slug>
Topic: <two lines, in your own words, of what you understood>
Reading this as <many candidates to pick from / one subject to read up on>.

Same four stops as last time: this plan, sources, criteria, then your call from
the shortlist or whole artifact. Approving this approves the plan only.

Good? Rename it if the slug is wrong.
```

**Printing a plan does not make this two gates.** It is one stop — GATE 1, the
slug and the shape — and the plan is what you print while standing at it. The
gates are four.

### When it is a new shape

Say so plainly, propose a name, and say what makes it different from the closest existing one. Do not force a topic into a shape that nearly fits — a shape that nearly fits produces a run that nearly works, and the human finds out three steps later.

A new shape always gets the **long form** plan, with two lines added and the
shape named — this is the one case where a repo word earns its place, because
the human is being asked to agree to a kind of session that does not exist yet:

```
Slug:  <proposed-slug>
Topic: <two lines>

This is a kind of search I have not done before. The closest one I have is
<existing>, but <what breaks, in plain words — e.g. the answer is something
written about one company, not a list of things to choose between>.

<then the long-form plan, unchanged>

It also means I write down how this kind of search works as we go, so the
next one is easier. That file is public and holds no detail of your search.
```

The signals that a topic is a new shape:

- **the result form differs** — rows and cards vs a written brief
- **a step does not apply** — nothing to contact, nothing to pre-filter, nothing that expires
- **the cadence differs** — weekly, one-shot with a deadline, or open-ended
- **the identity key differs**, or there is nothing worth deduping

`examples/<name>.md` starts as a copy of `examples/_template.md` and is filled **from what actually happened**, step by step, as the session passes each one — not guessed up front. An unfilled section is not a reason to pause a step. Scrub it as you write: placeholders, no URLs, no vendor names, and none of the human's actual criteria or results. The repo is public. The file records the *shape*, never the search.

**Before the GATE 1 answer, still create nothing.** Once the human approves this
new shape and slug, follow *After GATE 1* below exactly as for an existing shape.

### After GATE 1 — record the approval

The human confirmed the slug and the one-subject/many-candidates reading. Now,
and not before, create the session and write its pointer:

1. Create `sessions/<slug>/`.
2. Start from `sessions/_template/MEMORY.md` and fill only:
   `slug`, `shape`, `status: sources`, `last run: —`, and
   `next: propose sources`.
3. Copy no other skeleton file yet. `sources.md` is written only after GATE 2;
   `criteria.md` only after GATE 3; result and next-step files only when they run.

This is the durable GATE 1 record. If the source search is interrupted, the next
call sees `status: sources` and resumes the correct step instead of losing the
approved slug and shape.

---

## Continuing

1. Read `sessions/<slug>/MEMORY.md`.
2. Print the status line and the `next:` line back to the human — one short block, so they know where they are before anything moves.
3. Route on `status`:

| status | means | run |
|--------|-------|-----|
| `sources` | sources not approved yet | `workflows/01-sources.md` |
| `criteria` | sources approved, criteria not | `workflows/02-criteria.md` |
| `run` | criteria approved; ready to run | `workflows/03-run.md` |
| `next-steps` | the run is published; Next Steps (GATE 4) is waiting | `workflows/04-next-steps.md` |
| `done` | GATE 4 was answered with nothing to make | follow `next:`; rerun or reopen Next Steps only when asked |
| an output name, e.g. `contacts` | that next step has run; the shortlist is still there | `workflows/04-next-steps.md`, then use a reusable procedure if one exists |

Never skip forward because a later step looks more useful. If the human explicitly asks for a different step, say which step the session is on, then do what they asked.

### Amendments to a completed step

If the human adds a source, criterion, occasion, or question after the session
has moved past that step, follow the delta procedure in `AGENTS.md`:

- keep the current `status`
- show only the proposed source and criteria changes
- repeat GATE 2 and/or GATE 3 only for that delta
- after approval, update the stored files and rerun only the affected result sections

Do not make `results.md` broader than its approved sources and criteria merely
because the new request arrived during `run`.

---

## `MEMORY.md` — the fields

Status, shape and next step. **Pointer only. No data of any kind** — no items, no criteria, no results. Everything else lives in its own file.

Fields: `sessions/_template/MEMORY.md`. `shape:` names the file in `examples/` that this session reads for its worked example — set at GATE 1, and it never changes afterwards.

Rewrite it at the end of every step. It is the only thing that tells the next session where it is.
