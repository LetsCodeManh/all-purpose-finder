#!/usr/bin/env node

const assert = require("assert");
const { inline, parse, stagesFor, shortlistMatches, nextStepIdeas, resultCardCount,
  activeResultRowCount, resultBadge, compactResultRow, rerunInProgress,
  runFreshness } = require("./app.js");

function session(status, stages = ["sources", "criteria", "run"], files = {}) {
  return { status, stages, files, form: "ledger", selection: "rows" };
}

function testIdentityMarkersStayHidden() {
  assert.strictEqual(inline("A row <!-- identity: stable-key -->"), "A row ");
  const blocks = parse("### A row\n<!-- identity: stable-key -->\nBody\n");
  assert.deepStrictEqual(blocks.map((b) => b.type), ["heading", "para"]);
  assert.strictEqual(blocks[1].text, "Body");
}

function testEveryShapeGetsGateFour() {
  const track = stagesFor(session("next-steps", undefined, { "results.md": 1, "shortlist.md": 1 }));
  assert.strictEqual(track.length, 4);
  assert.strictEqual(track[2].stage, "run");
  assert.strictEqual(track[2].mark, "✓");
  assert.strictEqual(track[3].stage, null);
  assert.strictEqual(track[3].mark, "●");
}

function testGateFourStates() {
  const nextSteps = stagesFor(session("next-steps"));
  assert.strictEqual(nextSteps[3].mark, "●");
  const done = stagesFor(session("done"));
  assert.strictEqual(done[3].mark, "✓");
}

function testChosenOutputReplacesSlot() {
  const track = stagesFor(session("letter", ["sources", "criteria", "run", "contacts", "letter"], {
    "results.md": 1,
    "letter.md": 1,
  }));
  assert.strictEqual(track[3].stage, "letter");
  assert.strictEqual(track[3].mark, "●");
}

function testShortlistFiltering() {
  assert.strictEqual(shortlistMatches("Example Co — Engineer", false, "engine", "all"), true);
  assert.strictEqual(shortlistMatches("Example Co — Engineer", false, "design", "all"), false);
  assert.strictEqual(shortlistMatches("Example Co — Engineer", false, "", "selected"), false);
  assert.strictEqual(shortlistMatches("Example Co — Engineer", true, "example", "selected"), true);
}

function testNextStepIdeasAreExamplesNotShapeMenu() {
  assert(nextStepIdeas("rows").includes("Find contacts"));
  assert(nextStepIdeas("artifact").includes("Create a summary"));
  assert(nextStepIdeas("artifact").includes("Draft a proposal"));
}

function testResultsSeparatePostingsFromCards() {
  const text = "# results\n\nRun 2026-01-02 · 3 new · 0 changed · 0 unchanged · 1 gone\n\n## new\n\n### Grouped\n[posting](https://example.test/one)\n[posting](https://example.test/two)\n\n### Three\n[posting](https://example.test/three)\n\n## gone\n\n### Old\n[posting](https://example.test/old)\n";
  const blocks = parse(text);
  assert.strictEqual(resultCardCount(blocks), 3);
  assert.strictEqual(activeResultRowCount(text), 3);
  assert.strictEqual(resultBadge(text), "3 postings · 2 cards");
}

function testPendingRerunLocksNextStepsAndExposesStaleDates() {
  const s = session("run");
  s.pending_run = "2026-08-29";
  s.last_run = "2026-08-28";
  s.run_dates = { listings: "2026-08-29", results: "2026-08-28", shortlist: "2026-08-28" };
  assert.strictEqual(rerunInProgress(s), true);
  assert.strictEqual(stagesFor(s)[3].locked, true);
  assert.deepStrictEqual(runFreshness(s).mismatched, ["results", "shortlist"]);
}

function testUnchangedRowBecomesCompactCardData() {
  assert.deepStrictEqual(
    compactResultRow("Acme — Engineer · 4/4 must · 1 unknown · 0 must misses <!-- identity: stable -->"),
    { label: "Acme — Engineer", score: "4/4 must · 1 unknown · 0 must misses" },
  );
}

for (const [name, fn] of Object.entries({
  testIdentityMarkersStayHidden,
  testEveryShapeGetsGateFour,
  testGateFourStates,
  testChosenOutputReplacesSlot,
  testShortlistFiltering,
  testNextStepIdeasAreExamplesNotShapeMenu,
  testResultsSeparatePostingsFromCards,
  testPendingRerunLocksNextStepsAndExposesStaleDates,
  testUnchangedRowBecomesCompactCardData,
})) {
  fn();
  console.log("ok", name);
}

console.log("all good");
