/* The check on the addressing constraint, run against the real session files.
 * Every block parse() emits must point at the line it actually came from — that is the
 * one property the whole "add editing later" plan rests on.   node ui/test_parse.mjs
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const UI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(UI, "..");
const src = fs.readFileSync(path.join(UI, "app.js"), "utf8");
const { parse } = await import(
  "data:text/javascript," + encodeURIComponent(src + "\nexport { parse, inline };")
);

const read = (slug, name) => fs.readFileSync(path.join(REPO, "sessions", slug, name), "utf8");

function everyBlockPointsAtItsOwnLine(text, label) {
  const lines = text.split("\n");
  for (const b of parse(text)) {
    const at = lines[b.line - 1];
    if (b.type === "heading") assert.ok(at.startsWith("#".repeat(b.level) + " "), `${label}:${b.line} heading`);
    if (b.type === "tick") assert.strictEqual(at, b.raw, `${label}:${b.line} tick`);
    if (b.type === "code") assert.ok(at.startsWith("```"), `${label}:${b.line} fence`);
    if (b.type === "table") {
      for (const r of b.rows) assert.ok(lines[r.line - 1].startsWith("|"), `${label}:${r.line} row`);
    }
    if (b.type === "list") {
      for (const it of b.items) assert.ok(/^\s*[-*+]\s+/.test(lines[it.line - 1]), `${label}:${it.line} item`);
    }
  }
}

/* --- real data, not mocks --- */

const results = read("eu-ai-jobs", "results.md");
everyBlockPointsAtItsOwnLine(results, "eu-ai-jobs/results.md");

const blocks = parse(results);
const cards = blocks.filter((b) => b.type === "heading" && b.level === 3);
const ticks = blocks.filter((b) => b.type === "tick");
assert.strictEqual(cards.length, 33, "33 result cards");
assert.strictEqual(ticks.length, 33, "one tick per card");
assert.ok(ticks.every((t) => t.kind === "card"), "all 33 are card ticks, told apart by the ### above");
assert.ok(ticks.every((t, i) => t.cardLine === cards[i].line), "each tick knows its card");
console.log("ok  results.md — 33 cards, 33 addressed card ticks");

const sources = read("eu-ai-jobs", "sources.md");
everyBlockPointsAtItsOwnLine(sources, "eu-ai-jobs/sources.md");
const table = parse(sources).find((b) => b.type === "table");
assert.strictEqual(table.rows.length, 37, "37 sources");
assert.strictEqual(table.rows.filter((r) => r.cells[4] === "blocked").length, 9, "9 blocked");
assert.ok(table.rows.every((r) => r.url), "every source row is addressable by url");
// The prose after the table is the point: a table widget would drop it silently.
assert.ok(parse(sources).some((b) => b.type === "heading" && b.text === "Not checked"),
  "## Not checked survives — the whole file is rendered, not just its table");
console.log("ok  sources.md — 37 rows, 9 blocked, prose tail survives");

const criteria = read("eu-ai-jobs", "criteria.md");
everyBlockPointsAtItsOwnLine(criteria, "eu-ai-jobs/criteria.md");
assert.ok(parse(criteria).some((b) => b.type === "heading" && /prefilter/i.test(b.text)),
  "## prefilter is found so it can be marked read-only");
console.log("ok  criteria.md — buckets and the derived prefilter block");

/* --- the brief shape: no ledger, no ticks, must not crash the same renderer --- */
const brief = read("alivia-inversa", "results.md");
everyBlockPointsAtItsOwnLine(brief, "alivia-inversa/results.md");
assert.strictEqual(parse(brief).filter((b) => b.type === "tick").length, 0, "a brief has no ticks");
console.log("ok  alivia-inversa/results.md — brief renders, zero ticks");

console.log("all good");
