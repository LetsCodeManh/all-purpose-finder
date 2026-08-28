/* finder ui — vanilla, one file.
 *
 * THE CONSTRAINT: every rendered element knows its address in the source file.
 * A card knows it is the ### block at line N. A source row knows it is the row whose
 * url is X. Markdown is never rendered to an HTML blob — parse() returns blocks that
 * carry their line number, and render() puts that number on the DOM node.
 *
 * v1 uses that addressing for exactly one write (a tick). Deleting a source row or
 * adding a criterion is the same mechanism with a different write function, which is
 * the whole reason the addressing exists before anything needs it.
 */

// The stage track is the server's: three fixed steps and then whatever the shape's
// `fillers:` menu offers. There is deliberately no fallback list here — a default four is
// the old hardcoding wearing a shrug, and server.py already falls back safely when it
// cannot read a shape.
const FILE_FOR = { sources: "sources.md", criteria: "criteria.md", run: "results.md" };
const SLOT_STAGE = "**slot**";
// A filler produces <name>.md, and filler names are an open set, so this cannot be an
// exhaustive map. A stage whose file is not there is still a stage: the chip renders and
// the screen says the document does not exist yet.
const fileFor = (stage) => FILE_FOR[stage] || stage + ".md";
// The one file the page writes. Ticks live here and nowhere else (AGENTS.md -> Ticks);
// results.md is a step-3 artifact that no later step edits.
const TICK_FILE = "shortlist.md";

const S = { sessions: [], slug: null, stage: null, ttyd: false, ttydPort: 7681, files: {}, listings: null };

const $ = (sel) => document.querySelector(sel);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");
const safeUrl = (u) => (/^https?:\/\//i.test(u) ? u : "#");

/* ---------- inline markdown ---------- */

function inline(s) {
  const tok = [];
  const hold = (html) => "@@" + (tok.push(html) - 1) + "@@";
  s = s.replace(/`([^`]+)`/g, (m, c) => hold("<code>" + esc(c) + "</code>"));
  s = s.replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, (m, t, u) =>
    hold('<a href="' + escAttr(safeUrl(u)) + '" target="_blank" rel="noreferrer">' + esc(t) + "</a>"));
  s = s.replace(/\bhttps?:\/\/[^\s|)<>]+/g, (u) =>
    hold('<a href="' + escAttr(u) + '" target="_blank" rel="noreferrer">' + esc(u) + "</a>"));
  s = esc(s);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s.,;:)])/g, "$1<em>$2</em>");
  return s.replace(/@@(\d+)@@/g, (m, i) => tok[+i]);
}

/* ---------- block parser: markdown in, addressed blocks out ---------- */

const TICK_RE = /^- \[([ x])\] (.*)$/;

function parse(text) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;
  const prev = () => blocks[blocks.length - 1];

  while (i < lines.length) {
    const raw = lines[i];
    const no = i + 1;

    if (/^```/.test(raw)) {
      const fence = [];
      const start = no;
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { fence.push(lines[i]); i++; }
      i++;
      blocks.push({ type: "code", line: start, text: fence.join("\n") });
      continue;
    }

    let m;
    if ((m = raw.match(/^(#{1,6})\s+(.*)$/))) {
      blocks.push({ type: "heading", line: no, level: m[1].length, text: m[2] });
      i++;
      continue;
    }

    if ((m = raw.match(TICK_RE))) {
      const p = prev();
      // The two tick forms are told apart by context, not by regex: a card tick has a
      // ### directly above it, a collapsed-row tick sits under ## unchanged.
      const kind = p && p.type === "heading" && p.level === 3 ? "card" : "row";
      blocks.push({
        type: "tick", line: no, checked: m[1] === "x", label: m[2], kind, raw,
        cardLine: kind === "card" ? p.line : null,
      });
      i++;
      continue;
    }

    if (raw.startsWith("|")) {
      const start = no;
      const rows = [];
      let header = null;
      while (i < lines.length && lines[i].startsWith("|")) {
        const cells = lines[i].replace(/^\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
        if (/^[-: ]+$/.test(cells.join(""))) { i++; continue; }   // separator row
        if (!header) header = { line: i + 1, cells };
        else rows.push({ line: i + 1, cells, raw: lines[i], url: cells.find((c) => /^https?:\/\//.test(c)) || null });
        i++;
      }
      blocks.push({ type: "table", line: start, header, rows });
      continue;
    }

    if (/^(-{3,}|\*{3,})\s*$/.test(raw)) { blocks.push({ type: "hr", line: no }); i++; continue; }

    if (/^\s*[-*+]\s+/.test(raw)) {
      const start = no;
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i]) && !TICK_RE.test(lines[i])) {
        const indent = lines[i].match(/^\s*/)[0].length;
        let body = lines[i].replace(/^\s*[-*+]\s+/, "");
        const at = i + 1;
        i++;
        while (i < lines.length && /^\s+\S/.test(lines[i]) && !/^\s*[-*+]\s+/.test(lines[i])) {
          body += " " + lines[i].trim();   // continuation lines fold into the item
          i++;
        }
        items.push({ line: at, text: body, indent });
      }
      blocks.push({ type: "list", line: start, items });
      continue;
    }

    if (!raw.trim()) { i++; continue; }

    const start = no;
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|\||\s*[-*+]\s|-{3,}\s*$)/.test(lines[i])) {
      para.push(lines[i]); i++;
    }
    blocks.push({ type: "para", line: start, text: para.join("\n") });
  }
  return blocks;
}

/* ---------- render ---------- */

function el(tag, cls, line) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (line != null) n.dataset.line = line;   // the address, on every node
  return n;
}

const SOURCE_ICON = { ok: "✓", blocked: "⛔", error: "!", unchecked: "?", untested: "?", gone: "⊘" };
// A status that is not `ok` is a source a human may still have to open themselves. The set
// is sources.md's own vocabulary (`ok · blocked · error · untested`), so nothing here is a
// list of the two statuses this run happened to produce.
const needsHand = (st) => st !== "ok" && st !== "";
// What the page asks a computer-use agent to do with a link it cannot fetch itself. It
// says what to report and, out loud, what not to do — a browser session is the human's.
const cuPrompt = (name, url) =>
  "Open " + url + " in a browser and read the " + name + " listings.\n" +
  "Report: how many postings are there, what the newest one is dated, and whether the page " +
  "is readable without signing in.\n" +
  "Do not sign in, do not accept terms, and do not submit anything on my behalf.";

const MANUAL_VALUES = ["—", "checked", "partial", "unavailable"];
const MANUAL_LABELS = {
  "—": "Not checked",
  checked: "✓ Checked",
  partial: "◐ Partial",
  unavailable: "× Unavailable",
};

// Does this session's sources.md carry the two manual columns? An older one does not, and
// then the hand check has nowhere to be recorded — so it is not offered.
function manualColumns() {
  const payload = S.files["sources.md"];
  if (!payload) return false;
  const t = parse(payload.text).find((b) => b.type === "table" && b.header);
  if (!t) return false;
  const head = t.header.cells.map((c) => c.toLowerCase());
  return head.includes("manual status") && head.includes("manual checked");
}

function copyButton(text, label) {
  const b = el("button", "copy-prompt");
  b.type = "button";
  b.textContent = label;
  b.title = "Copy hand-check prompt";
  b.setAttribute("aria-label", "Copy hand-check prompt");
  b.onclick = () => {
    navigator.clipboard.writeText(text).then(
      () => note("prompt copied — paste it to a computer-use agent"),
      () => note("clipboard refused"));
  };
  return b;
}

// The second write, and the same shape as the tick: one line of one file, guarded by the
// text we read it as. `manual checked` is the server's date, not the browser's.
function manualControl(row, current) {
  const wrap = el("label", "manual", row.line);
  const sel = document.createElement("select");
  MANUAL_VALUES.forEach((v) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = MANUAL_LABELS[v];
    o.selected = v === (current || "—");
    sel.appendChild(o);
  });
  sel.title = "Manual status";
  sel.setAttribute("aria-label", "Manual status");
  sel.onchange = async () => {
    const want = sel.value;
    sel.disabled = true;
    const res = await fetch("/api/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: S.slug, file: "sources.md", line: row.line, expect: row.raw, value: want }),
    }).then((r) => r.json()).catch(() => ({ ok: false, detail: "server unreachable" }));
    sel.disabled = false;
    if (res.ok) { row.raw = res.detail; note("recorded in sources.md"); }
    else { note(res.detail || "refused"); load(); }
  };
  wrap.append(sel);
  return wrap;
}

// Compact actions for a blocked or erroring row: copy its hand-check prompt, open the
// source, and record the manual result when the file has columns for it.
function handCheck(name, url, row, manualStatus) {
  const box = el("div", "handcheck", row.line);
  const prompt = cuPrompt(name, url);
  const head = el("div", "handcheck-head");
  head.appendChild(copyButton(prompt, "⧉"));
  const open = el("a", "handcheck-open");
  open.href = safeUrl(url);
  open.target = "_blank";
  open.rel = "noreferrer";
  open.textContent = "↗";
  open.title = "Open source";
  open.setAttribute("aria-label", "Open source");
  head.appendChild(open);
  if (manualColumns()) head.appendChild(manualControl(row, manualStatus));
  box.appendChild(head);
  return box;
}

function renderTable(b, ctx) {
  const wrap = el("div", "table", b.line);
  const head = b.header ? b.header.cells.map((c) => c.toLowerCase()) : [];
  const iStatus = head.indexOf("status");
  const isSources = iStatus > -1 && head.includes("url");

  b.rows.forEach((r) => {
    if (isSources) {
      const st = (r.cells[iStatus] || "").split(" ")[0] || "unchecked";
      // Rows that need a hand check live in the gaps rail on the sources screen, where
      // they get the prompt and the place to record the answer. Not only `blocked`.
      if (ctx.hideBlocked && needsHand(st)) return;
      const row = el("div", "row", r.line);
      if (r.url) row.dataset.url = r.url;          // a source row knows which row it is
      row.classList.add("src", "st-" + st.replace(/[^a-z]/g, ""));
      const cell = (name) => r.cells[head.indexOf(name)] || "";
      const manual = cell("manual status");
      row.innerHTML =
        '<div class="r1"><span class="ic">' + (SOURCE_ICON[st] || "·") + "</span>" +
        '<span class="nm">' + esc(cell("name")) + "</span>" +
        (needsHand(st) ? '<span class="st">' + esc(cell("status")) + "</span>" : "") +
        (manual && manual !== "—" ? '<span class="mn">hand: ' + esc(manual) + "</span>" : "") +
        '<span class="ty">' + esc(cell("type")) + "</span>" +
        '<span class="me">' + esc(cell("method")) + "</span>" +
        '<span class="lc">' + esc(cell("last checked")) + "</span></div>" +
        '<div class="r2">' + inline(cell("why")) + "</div>";
      if (needsHand(st) && r.url) row.appendChild(handCheck(cell("name"), r.url, r, manual));
      wrap.appendChild(row);
    } else {
      const row = el("div", "row", r.line);
      if (r.url) row.dataset.url = r.url;
      row.classList.add("plain");
      row.innerHTML = r.cells.map((c, n) =>
        '<span class="c">' + (head[n] ? "<b>" + esc(head[n]) + "</b> " : "") + inline(c) + "</span>").join("");
      wrap.appendChild(row);
    }
  });
  return wrap;
}

function renderTick(b, ctx) {
  const line = el("label", "tick tick-" + b.kind, b.line);
  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = b.checked;
  box.disabled = !ctx.writable;
  box.addEventListener("change", () => tick(b, box, ctx));
  const lab = el("span", "tick-label");
  lab.innerHTML = inline(b.label);
  line.append(box, lab);
  return line;
}

function parseCriterionRows(text) {
  const rows = [];
  text.split("\n").forEach((raw) => {
    const m = raw.trim().match(/^(must|range|nice|open|note)\s+([✓⚠✗?])\s+(.*)$/);
    if (m) rows.push({ tier: m[1], mark: m[2], text: m[3] });
    else if (rows.length && raw.trim()) rows[rows.length - 1].text += " " + raw.trim();
  });
  return rows;
}

function criterionRows(rows, line) {
  const box = el("div", "card-criteria", line);
  rows.forEach((r) => {
    const row = el("div", "criterion-row", line);
    const markClass = r.mark === "✓" ? " pass" : r.mark === "⚠" ? " warn" :
      r.mark === "?" ? " unknown" : " fail";
    row.innerHTML = '<span class="criterion-tier">' + esc(r.tier) + '</span><span class="criterion-mark' +
      markClass + '">' + esc(r.mark) + '</span><span class="criterion-text">' + inline(r.text) + "</span>";
    box.appendChild(row);
  });
  return box;
}

function postingSummary(text, count) {
  let lead = text.split("[")[0].trim().replace(/[·\s]+$/, "").replace(/:$/, "");
  if (/^one posting per country$/i.test(lead)) lead = "";
  const linked = count ? count + " linked posting" + (count === 1 ? "" : "s") : "";
  return [lead, linked].filter(Boolean).join(" · ");
}

function renderLedgerCard(heading, content, ctx) {
  const card = el("section", "card", heading.line);
  const codeBlock = content.find((b) => b.type === "code");
  const paras = content.filter((b) => b.type === "para");
  const entries = paras.flatMap((b) => b.text.split("\n").map((text, offset) => ({ text, line: b.line + offset })));
  const sourceEntry = entries.find((e) => /^source:\s*/i.test(e.text));
  const metricEntry = entries.find((e) => /\b(?:postings?|\d+\/\d+ must)\b.*\bmust misses\b/i.test(e.text));
  const criterionPattern = /^(must|range|nice|open|note)\s+[✓⚠✗?]\s+/;
  const firstCriterion = entries.findIndex((e) => criterionPattern.test(e.text.trim()));
  const metricIndex = metricEntry ? entries.indexOf(metricEntry) : entries.length;
  const plainCriterionEntries = firstCriterion < 0 ? [] : entries.slice(firstCriterion, metricIndex)
    .filter((e) => e !== sourceEntry);
  const criteria = codeBlock ? parseCriterionRows(codeBlock.text) :
    parseCriterionRows(plainCriterionEntries.map((e) => e.text).join("\n"));
  const locationEntry = entries.find((e, index) => e !== sourceEntry && e !== metricEntry &&
    !criterionPattern.test(e.text.trim()) && (firstCriterion < 0 || index < firstCriterion) &&
    (!codeBlock || e.line < codeBlock.line));
  const comments = entries.filter((e, index) => e !== sourceEntry && e !== metricEntry && e !== locationEntry &&
    !criterionPattern.test(e.text.trim()) && !(firstCriterion >= 0 && index >= firstCriterion && index < metricIndex) &&
    metricEntry && e.line > metricEntry.line);
  const match = metricEntry && metricEntry.text.match(/\b(\d+)\s+postings?\b/i);
  const count = match ? Number(match[1]) : 0;

  const top = el("div", "card-top", heading.line);
  const copy = el("div", "card-title-copy", heading.line);
  const title = el("h3", null, heading.line);
  title.innerHTML = inline(heading.text);
  copy.appendChild(title);
  if (locationEntry || count) {
    const summary = el("div", "card-summary", locationEntry ? locationEntry.line : heading.line);
    summary.textContent = postingSummary(locationEntry ? locationEntry.text : "", count);
    copy.appendChild(summary);
  }
  top.appendChild(copy);
  const source = el("div", "card-source", sourceEntry ? sourceEntry.line : heading.line);
  source.textContent = sourceEntry ? sourceEntry.text.replace(/^source:\s*/i, "") : heading.text.split(" — ")[0];
  top.appendChild(source);
  card.appendChild(top);

  if (criteria.length) card.appendChild(criterionRows(criteria,
    codeBlock ? codeBlock.line : plainCriterionEntries[0].line));

  if (metricEntry || comments.length) {
    const foot = el("div", "card-foot", metricEntry ? metricEntry.line : comments[0].line);
    if (metricEntry) {
      const metrics = el("span", "card-metrics", metricEntry.line);
      metrics.innerHTML = inline(metricEntry.text);
      foot.appendChild(metrics);
    }
    comments.forEach((b) => {
      const comment = el("span", "card-comment", b.line);
      comment.innerHTML = inline(b.text);
      foot.appendChild(comment);
    });
    card.appendChild(foot);
  }
  return card;
}

function renderLedgerBlocks(blocks, ctx) {
  const frag = document.createDocumentFragment();
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.type === "heading" && b.level === 3) {
      let end = i + 1;
      while (end < blocks.length && !(blocks[end].type === "heading" && blocks[end].level <= 3)) end++;
      frag.appendChild(renderLedgerCard(b, blocks.slice(i + 1, end), ctx));
      i = end;
      continue;
    }
    let end = i + 1;
    while (end < blocks.length && !(blocks[end].type === "heading" && blocks[end].level === 3)) end++;
    frag.appendChild(renderBlocks(blocks.slice(i, end), { ...ctx, cards: false }));
    i = end;
  }
  return frag;
}

function resultSectionKind(text) {
  const key = text.trim().toLowerCase();
  if (key.startsWith("new")) return "new";
  if (key.startsWith("changed")) return "changed";
  if (key.startsWith("unchanged")) return "unchanged";
  if (key.startsWith("gone")) return "gone";
  if (key.startsWith("dropped")) return "dropped";
  return "other";
}

function resultSectionCount(blocks) {
  const cards = blocks.filter((b) => b.type === "heading" && b.level === 3).length;
  if (cards) return { count: cards, unit: "card" };
  const list = blocks.find((b) => b.type === "list");
  return { count: list ? list.items.length : 0, unit: "row" };
}

function mustRules() {
  const payload = S.files["criteria.md"];
  if (!payload) return [];
  const blocks = parse(payload.text);
  const start = blocks.findIndex((b) => b.type === "heading" && b.level === 2 &&
    b.text.trim().toLowerCase() === "must");
  if (start < 0) return [];
  const list = blocks.slice(start + 1).find((b) => b.type === "list" ||
    (b.type === "heading" && b.level === 2));
  return list && list.type === "list" ? list.items.map((item) => item.text) : [];
}

function droppedItem(text) {
  const match = text.match(/^\*\*(.+?)\*\*\s*·\s*(.+?)\s*·\s*\[([^\]]+)\]\(([^)]+)\)\s*—\s*must\s*#(\d+)\s*—\s*(.+)$/i);
  if (!match) return null;
  return { title: match[1], source: match[2], linkLabel: match[3], url: match[4],
    must: Number(match[5]), reason: match[6] };
}

function renderDroppedRows(blocks, ctx) {
  const frag = document.createDocumentFragment();
  const list = blocks.find((b) => b.type === "list");
  const parsed = list ? list.items.map((item) => ({ ...droppedItem(item.text), line: item.line })) : [];
  if (!list || parsed.some((item) => !item.title)) return renderLedgerBlocks(blocks, ctx);

  const lead = blocks.filter((b) => b !== list);
  if (lead.length) frag.appendChild(renderBlocks(lead, { ...ctx, cards: false }));
  const rules = mustRules();
  const groups = new Map();
  parsed.forEach((item) => {
    if (!groups.has(item.must)) groups.set(item.must, []);
    groups.get(item.must).push(item);
  });
  const wrap = el("div", "dropped-groups", list.line);
  groups.forEach((items, number) => {
    const group = el("details", "dropped-group", items[0].line);
    const head = el("summary", "dropped-group-head", items[0].line);
    head.innerHTML = '<span class="dropped-rule-number">Must ' + number + '</span>' +
      '<span class="dropped-rule-text">' + inline(rules[number - 1] || "Criterion " + number) + '</span>' +
      '<span class="dropped-rule-count">' + items.length + '</span>';
    group.appendChild(head);
    const rows = el("div", "dropped-rows", items[0].line);
    items.forEach((item) => {
      const row = el("div", "dropped-row", item.line);
      const copy = el("div", "dropped-row-copy", item.line);
      copy.innerHTML = '<div class="dropped-row-title">' + inline(item.title) +
        '<span class="dropped-row-source">' + inline(item.source) + '</span></div>' +
        '<div class="dropped-row-reason">' + inline(item.reason) + '</div>';
      const open = el("a", "dropped-row-open", item.line);
      open.href = safeUrl(item.url);
      open.target = "_blank";
      open.rel = "noreferrer";
      open.textContent = "↗";
      open.title = "Open " + item.linkLabel;
      open.setAttribute("aria-label", open.title);
      row.append(copy, open);
      rows.appendChild(row);
    });
    group.appendChild(rows);
    wrap.appendChild(group);
  });
  frag.appendChild(wrap);
  return frag;
}

function renderResultOverview(preamble, ctx) {
  const body = el("div", "result-overview-body", preamble[0].line);
  const run = preamble.find((b) => b.type === "para" && /^Run\s+/i.test(b.text));
  if (run) {
    const match = run.text.match(/^Run\s+(\d{4}-\d{2}-\d{2})\s*·\s*(\d+) new\s*·\s*(\d+) changed\s*·\s*(\d+) unchanged\s*·\s*(\d+) gone/i);
    if (match) {
      const stats = el("div", "result-run-stats", run.line);
      [["Run", match[1]], ["New", match[2]], ["Changed", match[3]],
        ["Unchanged", match[4]], ["Gone", match[5]]].forEach(([label, value]) => {
        const stat = el("div", "result-run-stat", run.line);
        stat.innerHTML = '<span>' + esc(label) + '</span><strong>' + esc(value) + '</strong>';
        stats.appendChild(stat);
      });
      body.appendChild(stats);
    }
  }
  preamble.filter((b) => b !== run).forEach((block) => {
    if (block.type === "para") {
      block.text.split(/\n(?=\d+\.\s+)/).forEach((text, offset) => {
        const point = text.match(/^(\d+)\.\s+([\s\S]+)$/);
        const item = el("div", point ? "result-overview-point" : "result-overview-note", block.line + offset);
        item.innerHTML = point ? '<span class="result-overview-number">' + esc(point[1]) +
          '</span><p>' + inline(point[2]) + '</p>' : '<p>' + inline(text) + '</p>';
        body.appendChild(item);
      });
    } else {
      body.appendChild(renderBlocks([block], { ...ctx, cards: false }));
    }
  });
  return body;
}

function renderResultSection(heading, blocks, ctx) {
  const kind = resultSectionKind(heading.text);
  const tally = resultSectionCount(blocks);
  const section = el("details", "result-section result-" + kind, heading.line);
  section.open = kind === "new" || (kind === "changed" && tally.count > 0) || kind === "other";
  const summary = el("summary", "result-section-head", heading.line);
  const title = el("span", "result-section-title");
  title.innerHTML = inline(heading.text);
  const badge = el("span", "result-section-count");
  badge.textContent = tally.count + " " + tally.unit + (tally.count === 1 ? "" : "s");
  summary.append(title, badge);
  section.appendChild(summary);
  const body = el("div", "result-section-body", heading.line);
  if (blocks.length) body.appendChild(kind === "dropped" ? renderDroppedRows(blocks, ctx) :
    renderLedgerBlocks(blocks, ctx));
  else {
    const empty = el("div", "result-empty", heading.line);
    empty.textContent = "No " + kind + " results in this run.";
    body.appendChild(empty);
  }
  section.appendChild(body);
  return section;
}

function renderLedgerResults(blocks, ctx) {
  const frag = document.createDocumentFragment();
  const firstSection = blocks.findIndex((b) => b.type === "heading" && b.level === 2);
  const preamble = (firstSection < 0 ? blocks : blocks.slice(0, firstSection))
    .filter((b) => !(b.type === "heading" && b.level === 1));
  if (preamble.length) {
    const overview = el("details", "result-overview", preamble[0].line);
    const summary = el("summary", "result-overview-head", preamble[0].line);
    const firstLine = preamble.find((b) => b.type === "para");
    summary.innerHTML = '<span>About this run</span>' + (firstLine ?
      '<span class="result-overview-preview">' + inline(firstLine.text.split("\n")[0]) + "</span>" : "");
    overview.appendChild(summary);
    overview.appendChild(renderResultOverview(preamble, ctx));
    frag.appendChild(overview);
  }

  if (firstSection < 0) {
    frag.appendChild(renderLedgerBlocks(blocks, ctx));
    return frag;
  }
  let i = firstSection;
  while (i < blocks.length) {
    const heading = blocks[i];
    if (!(heading.type === "heading" && heading.level === 2)) {
      i++;
      continue;
    }
    let end = i + 1;
    while (end < blocks.length && !(blocks[end].type === "heading" && blocks[end].level === 2)) end++;
    frag.appendChild(renderResultSection(heading, blocks.slice(i + 1, end), ctx));
    i = end;
  }
  return frag;
}

function contactTable(blocks) {
  return blocks.find((b) => b.type === "table" && b.header &&
    ["org", "who", "role", "how", "source", "found"].every((name) =>
      b.header.cells.map((c) => c.toLowerCase()).includes(name)));
}

function renderContacts(blocks) {
  const frag = document.createDocumentFragment();
  const table = contactTable(blocks);
  if (!table) return renderBlocks(blocks, { cards: false, writable: false });
  const head = table.header.cells.map((c) => c.toLowerCase());
  const cell = (r, name) => r.cells[head.indexOf(name)] || "";
  const paras = blocks.filter((b) => b.type === "para");
  const allText = paras.map((b) => b.text).join("\n");
  const date = (allText.match(/Looked up\s+(\d{4}-\d{2}-\d{2})/i) || [])[1] || "";

  const intro = el("div", "contacts-intro", paras.length ? paras[0].line : table.line);
  intro.innerHTML = '<p>One lookup per organisation' + (date ? ", " + esc(date) : "") +
    '. Order: the posting → the org\'s own site → a public search. <strong>No address is guessed from a name and a domain.</strong> ' +
    '<code>not found</code> means looked and nothing published.</p>' +
    '<p>Excluded on purpose: RocketReach, ZoomInfo and ContactOut hits for named recruiters. ' +
    'Broker-assembled personal contact data is not published for this purpose. The gap is real and stays visible.</p>';
  frag.appendChild(intro);

  const list = el("div", "contact-list", table.line);
  table.rows.forEach((r) => {
    const missing = /^not found$/i.test(cell(r, "role"));
    const row = el("div", "contact-row" + (missing ? " missing" : ""), r.line);
    row.dataset.org = cell(r, "org");
    const identity = el("div", "contact-identity", r.line);
    identity.innerHTML = '<strong>' + esc(cell(r, "org")) + '</strong><span>' + esc(cell(r, "found")) + "</span>";
    const detail = el("div", "contact-detail", r.line);
    let lead = "";
    if (missing) {
      lead = '<span class="missing-badge">not found</span>';
    } else {
      const who = cell(r, "who");
      const role = cell(r, "role");
      lead = (who && who !== "—" ? '<strong class="contact-who">' + esc(who) + "</strong>" : "") +
        (role ? '<span class="contact-role">' + esc(role) + "</span>" : "");
    }
    detail.innerHTML = '<div class="contact-lead">' + lead + '</div><div class="contact-how">' +
      inline(cell(r, "how")) + '</div><div class="contact-source">' + inline(cell(r, "source")) + "</div>";
    row.append(identity, detail);
    list.appendChild(row);
  });
  frag.appendChild(list);
  return frag;
}

function criteriaGuidance(name, form) {
  const key = name.toLowerCase();
  if (key === "must") return form === "brief" ? "a miss is a gap, never a silent drop" : "only a must drops a row";
  if (key === "range") return form === "ledger" ? "flagged, never dropped" : "";
  if (key === "open") return "judgement, with the basis stated";
  if (key === "prefilter") return "derived · read only";
  return "";
}

function renderPrefilter(heading, blocks) {
  const section = el("section", "criteria-section criteria-prefilter", heading.line);
  const paras = blocks.filter((b) => b.type === "para");
  const prose = paras.map((b) => b.text).join(" ");
  const explanationAt = prose.indexOf("Every pattern");
  const loaderText = explanationAt >= 0 ? prose.slice(0, explanationAt).trim() : "";
  const introText = explanationAt >= 0 ? prose.slice(explanationAt).trim() : prose;
  const code = blocks.find((b) => b.type === "code");
  const list = blocks.find((b) => b.type === "list");
  const patterns = [];

  if (code) {
    code.text.split("\n").forEach((line) => {
      const match = line.match(/^([a-z]+)\s*=\s*(.+)$/i);
      if (match) patterns.push({ key: match[1], value: match[2] });
    });
  }

  const descriptions = {};
  if (list) {
    list.items.forEach((item) => {
      const match = item.text.match(/^`?([a-z]+)`?\s+—\s+(.+)$/i);
      if (match) descriptions[match[1]] = match[2];
    });
  }

  const head = el("div", "criteria-section-head prefilter-head", heading.line);
  head.innerHTML = '<span class="criteria-name">prefilter</span>' +
    '<span class="prefilter-derived">derived · read only</span><span class="criteria-rule"></span>';

  const details = el("details", "prefilter-patterns", code ? code.line : heading.line);
  const summary = el("summary", null, code ? code.line : heading.line);
  const filterCount = patterns.filter((p) => p.key !== "identity" && p.key !== "compare").length;
  const diffCount = patterns.length - filterCount;
  summary.textContent = "show " + filterCount + " patterns" + (diffCount ? " · " + diffCount + " diff settings" : "");
  const full = el("pre", "code ro-block", code ? code.line : heading.line);
  full.textContent = code ? code.text : "";
  details.append(summary, full);
  head.appendChild(details);
  section.appendChild(head);

  const body = el("div", "criteria-section-body", heading.line);
  if (introText) {
    const intro = el("p", "prefilter-intro", paras[paras.length - 1].line);
    intro.innerHTML = inline(introText);
    body.appendChild(intro);
  }

  const rows = el("div", "prefilter-rows", code ? code.line : heading.line);
  patterns.forEach((pattern) => {
    const row = el("div", "prefilter-row", code ? code.line : heading.line);
    const count = pattern.value.split("|").length;
    const diffSetting = pattern.key === "identity" || pattern.key === "compare";
    row.innerHTML = '<strong class="prefilter-key">' + esc(pattern.key) + '</strong><span>' +
      inline(descriptions[pattern.key] || (diffSetting ? "diff setting" : "approved must pattern")) +
      (diffSetting ? "" : " · " + count + " alternatives") + "</span>";
    rows.appendChild(row);
  });
  body.appendChild(rows);

  if (loaderText) {
    const loader = el("p", "prefilter-loader", paras[0].line);
    loader.innerHTML = inline(loaderText)
      .replace(/^Loaded by/i, "loaded by")
      .replace(/,\s*applied by/i, " · applied by");
    body.appendChild(loader);
  }
  section.appendChild(body);
  return section;
}

function renderCriteria(blocks, form) {
  const layout = el("div", "criteria-layout");
  let i = 0;
  // The document card already carries the title and approval date, so avoid repeating
  // the markdown H1 and Approved line inside the card body.
  while (i < blocks.length && ((blocks[i].type === "heading" && blocks[i].level === 1) ||
    (blocks[i].type === "para" && /^Approved:/i.test(blocks[i].text)))) i++;

  while (i < blocks.length) {
    const heading = blocks[i];
    if (!(heading.type === "heading" && heading.level === 2)) {
      layout.appendChild(renderBlocks([heading], { cards: false, writable: false }));
      i++;
      continue;
    }
    let end = i + 1;
    while (end < blocks.length && !(blocks[end].type === "heading" && blocks[end].level === 2)) end++;
    const key = heading.text.trim().toLowerCase();
    if (key === "prefilter") {
      layout.appendChild(renderPrefilter(heading, blocks.slice(i + 1, end)));
      i = end;
      continue;
    }
    const cls = "criteria-section criteria-" + key.replace(/[^a-z0-9]+/g, "-");
    const section = el("section", cls, heading.line);
    const guide = criteriaGuidance(key, form);
    const head = el("div", "criteria-section-head", heading.line);
    head.innerHTML = '<span class="criteria-name">' + esc(heading.text) + '</span><span class="criteria-rule"></span>' +
      (guide ? '<span class="criteria-guide">' + esc(guide) + "</span>" : "");
    section.appendChild(head);
    const body = el("div", "criteria-section-body", heading.line);
    body.appendChild(renderBlocks(blocks.slice(i + 1, end), { cards: false, writable: false }));
    section.appendChild(body);
    layout.appendChild(section);
    i = end;
  }
  return layout;
}

function renderBlocks(blocks, ctx) {
  if (ctx.cards) return renderLedgerResults(blocks, ctx);
  const frag = document.createDocumentFragment();
  let host = frag;
  let readOnlyNext = false;

  blocks.forEach((b) => {
    // results.md: a ### opens a card, and everything under it belongs to that card.
    if (b.type === "heading" && b.level === 3 && ctx.cards) {
      host = el("section", "card", b.line);
      const h = el("h3", null, b.line);
      h.innerHTML = inline(b.text);
      host.appendChild(h);
      frag.appendChild(host);
      return;
    }
    if (b.type === "heading" && b.level <= 2) host = frag;

    let n;
    switch (b.type) {
      case "heading": {
        n = el("h" + b.level, "h h" + b.level, b.line);
        n.innerHTML = inline(b.text);
        // `## prefilter` is derived from the musts. Read-only, and it says so.
        readOnlyNext = /^prefilter$/i.test(b.text.trim());
        if (readOnlyNext) n.innerHTML += '<span class="ro">derived &middot; read only</span>';
        break;
      }
      case "para": n = el("p", null, b.line); n.innerHTML = inline(b.text); break;
      case "hr": n = el("hr", null, b.line); break;
      case "code":
        n = el("pre", readOnlyNext ? "code ro-block" : "code", b.line);
        n.textContent = b.text;
        break;
      case "table": n = renderTable(b, ctx); break;
      // A dead checkbox is worse than none: a tick renders only in the file the page can
      // actually write. Old results.md files still carry `- [ ] chase` lines and they are
      // no longer a decision anyone makes here.
      case "tick": n = ctx.writable ? renderTick(b, ctx) : null; break;
      case "list": {
        n = el("ul", null, b.line);
        b.items.forEach((it) => {
          const li = el("li", it.indent ? "sub" : null, it.line);   // every bullet, addressed
          li.innerHTML = inline(it.text);
          n.appendChild(li);
        });
        break;
      }
    }
    if (n) host.appendChild(n);
  });
  return frag;
}

/* ---------- the one write ---------- */

async function tick(b, box, ctx) {
  const want = box.checked;
  box.disabled = true;
  const res = await fetch("/api/tick", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // `expect` is the concurrency design: if the agent moved this line since we read
    // it, the server refuses and we reload rather than writing over its work.
    body: JSON.stringify({ slug: S.slug, file: ctx.file, line: b.line, expect: b.raw, checked: want }),
  }).then((r) => r.json()).catch(() => ({ ok: false, detail: "server unreachable" }));

  box.disabled = false;
  if (res.ok) {
    b.checked = want;
    b.raw = res.detail;
    const card = box.closest(".card");
    if (card) card.classList.toggle("ticked", want);
    countLine();
  } else {
    box.checked = !want;
    note(res.detail || "tick refused");
    load();
  }
}

/* ---------- chrome ---------- */

const FIXED = ["sources", "criteria", "run"];
// Step 4 is a slot, not a stage called Contacts. The shape's `fillers:` is a menu of what
// could fill it; until the human picks one at GATE 4 the track shows a selectable slot
// whose panel explains the choice still happens in the terminal.
const chosenFiller = (s) => (s.stages || []).slice(FIXED.length).includes(s.status) ? s.status : null;

function stagesFor(s) {
  const stages = s.stages || [];
  const has = (n) => n in s.files;
  const offered = stages.slice(FIXED.length);
  const track = FIXED.map((name) => {
    const present = name === "run" ? has("results.md") || has("listings.md") : has(fileFor(name));
    return { name, stage: name, mark: name === s.status ? "●" : present ? "✓" : "○", present };
  });
  // A shape with `fillers: []` and no filler status ends at the run: no slot to draw.
  if (!offered.length) return track;
  const chosen = chosenFiller(s);
  if (chosen) {
    const present = has(fileFor(chosen));
    track.push({ name: chosen, stage: chosen, mark: s.status === chosen ? "●" : present ? "✓" : "○", present });
  } else {
    // `output` is step 4 pending — that is exactly where you are standing.
    track.push({ name: null, stage: null, mark: s.status === "output" ? "●" : "○", present: false, offered });
  }
  return track;
}

// The shape's own `form:`, read from its frontmatter by the server. Which files happen to
// exist says nothing about whether the result is a ledger or a brief.
const formFor = (s) => s.form || "";

function sourceFacts() {
  const payload = S.files["sources.md"];
  if (!payload) return { total: 0, blocked: 0 };
  const table = parse(payload.text).find((b) => b.type === "table");
  if (!table || !table.header) return { total: 0, blocked: 0 };
  const head = table.header.cells.map((c) => c.toLowerCase());
  const iStatus = head.indexOf("status");
  const blocked = table.rows.filter((r) => ((r.cells[iStatus] || "").split(" ")[0] === "blocked")).length;
  return { total: table.rows.length, blocked };
}

function stageLabel(s, stage) {
  const form = formFor(s);
  if (!stage) return "Step 4";               // the slot's own name, until something fills it
  if (stage === "run") return form === "brief" ? "Brief" : "Results";
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

function stageStatus(s, stage, offered) {
  if (!stage) return offered && offered.length ? offered.join(" · ") + " offered" : "not chosen yet";
  if (stage === "sources") {
    const f = sourceFacts();
    return f.total ? f.total + " sources" + (f.blocked ? " · " + f.blocked + " blocked" : "") : "not started";
  }
  if (stage === "criteria") {
    const p = S.files["criteria.md"];
    const approved = p && p.text.match(/^Approved:\s*([^\n]+)/mi);
    return approved ? "approved " + approved[1].split(" · ")[0] : (p ? "draft ready" : "not started");
  }
  if (stage === "run") {
    if (!S.files["results.md"]) return "not started";
    const t = shortlistTicks();
    return t.length ? t.length + " rows · " + t.filter((b) => b.checked).length + " ticked" : "draft";
  }
  if (stage === "contacts") return S.files["contacts.md"] ? "lookup complete" : "not started";
  return fileFor(stage) in S.files ? "written" : "not started";
}

// Every tick in the session, in the one file that holds them.
function shortlistTicks() {
  const p = S.files[TICK_FILE];
  return p ? parse(p.text).filter((b) => b.type === "tick") : [];
}

// No approve button: every gate is confirmed in the terminal, where the approval and the
// next step get written. This line says what the stage is waiting for, and nothing clicks.
function actionFor(s) {
  const notes = {
    sources: "the next gate is recorded in the terminal",
    criteria: "the run waits for your approval",
    run: formFor(s) === "ledger" ? "tick the shortlist, then say go in the terminal" : "review the artifact before rerunning",
    contacts: "append only, never rewritten",
  };
  return notes[S.stage] || "continue in the terminal";
}

function drawTabs() {
  const bar = $("#tabs");
  bar.innerHTML = "";
  const current = S.sessions.find((s) => s.slug === S.slug);
  if (!current) return;
  const trigger = el("button", "session-trigger");
  trigger.type = "button";
  trigger.setAttribute("aria-expanded", "false");
  trigger.innerHTML = '<span class="dot"></span><span>' + esc(current.slug) + '</span><span class="chev">▾</span>';
  const menu = el("div", "session-menu");
  S.sessions.forEach((s) => {
    const t = el("button", "session-option" + (s.slug === S.slug ? " on" : ""));
    t.type = "button";
    t.innerHTML = '<span class="dot"></span><span>' + esc(s.slug) + '</span><span class="session-status">' + esc(s.status) + "</span>";
    t.onclick = () => { S.slug = s.slug; S.stage = null; menu.classList.remove("open"); load(); };
    menu.appendChild(t);
  });
  trigger.onclick = () => {
    const open = menu.classList.toggle("open");
    trigger.setAttribute("aria-expanded", String(open));
  };
  bar.append(trigger, menu);

  const meta = $("#session-meta");
  const form = formFor(current);
  meta.innerHTML = '<span class="shape-tag">' + esc(current.shape || "unshaped") + '</span>' +
    (form ? '<span class="form-label">produces a ' + esc(form) + "</span>" : "");
}

function drawChips(s) {
  const bar = $("#chips");
  bar.innerHTML = "";
  const stages = stagesFor(s);
  bar.style.gridTemplateColumns = "repeat(" + stages.length + ", minmax(0, 1fr))";
  bar.style.setProperty("--stage-count", stages.length);
  stages.forEach((st, i) => {
    const slot = !st.stage;
    const selected = slot ? S.stage === SLOT_STAGE : st.stage === S.stage;
    const c = el("button", "chip" + (selected ? " on" : "") +
      (st.mark === "✓" ? " done" : "") + (st.stage ? "" : " slot") +
      (st.mark === "●" ? " here" : ""));
    c.type = "button";
    c.innerHTML = '<span class="chip-track"><span class="chip-dot"></span>' +
      (i < stages.length - 1 ? '<span class="chip-line"></span>' : "") + '</span>' +
      '<span class="chip-copy"><span class="chip-name">' + esc(stageLabel(s, st.stage)) + '</span>' +
      '<span class="chip-status">' + esc(stageStatus(s, st.stage, st.offered)) + "</span></span>";
    c.onclick = () => { S.stage = slot ? SLOT_STAGE : st.stage; draw(); };
    bar.appendChild(c);
  });
  $("#stage-note").textContent = actionFor(s);
}

const ago = (t) => {
  if (!t) return "";
  const d = Math.floor((Date.now() / 1000 - t) / 86400);
  return d <= 0 ? "today" : d === 1 ? "1d ago" : d + "d ago";
};

function statBox(stats, blocked) {
  if (!stats || !stats.line) return null;
  const box = el("div", "stats");
  const rest = stats.counts.slice(1);
  const max = Math.max.apply(null, rest.map((c) => c.n).concat([1]));
  box.innerHTML = '<div class="stat-line">' + esc(stats.line) + "</div>" +
    rest.map((c) =>
      '<div class="bar"><span class="bl">' + esc(c.label) + '</span><span class="bn">' + c.n + "</span>" +
      '<span class="bar-track"><span class="bb" style="width:' + Math.round((c.n / max) * 100) + '%"></span></span></div>').join("") +
    (blocked.length
      ? '<div class="blocked">! ' + blocked.length + " blocked source" + (blocked.length > 1 ? "s" : "") +
        " &nbsp; " + esc(blocked.join(" · ")) + "</div>"
      : "");
  return box;
}

function countLine() {
  const rows = document.querySelectorAll("#doc .tick input").length;
  const ticked = document.querySelectorAll("#doc .tick input:checked").length;
  const n = $("#count");
  if (n && rows) n.textContent = rows + " rows · " + ticked + " ticked";
}

function note(msg) {
  const n = $("#note");
  n.textContent = msg;
  n.classList.add("show");
  clearTimeout(note.t);
  note.t = setTimeout(() => n.classList.remove("show"), 4000);
}

/* ---------- screens ---------- */

function sourceTable(blocks) {
  return blocks.find((b) => b.type === "table" && b.header &&
    b.header.cells.map((c) => c.toLowerCase()).includes("status"));
}

function sourceSectionPreview(blocks) {
  for (const b of blocks) {
    if (b.type === "para" || b.type === "code") return b.text.split("\n")[0];
    if (b.type === "list" && b.items.length) return b.items[0].text;
    if (b.type === "heading") return b.text;
  }
  return "Empty section";
}

function sourceSections(blocks) {
  const firstSection = blocks.findIndex((b) => b.type === "heading" && b.level === 2);
  const sections = [];
  if (firstSection < 0) return sections;
  let i = firstSection;
  while (i < blocks.length) {
    const heading = blocks[i];
    if (heading.type !== "heading" || heading.level !== 2) { i++; continue; }
    let end = i + 1;
    while (end < blocks.length && !(blocks[end].type === "heading" && blocks[end].level <= 2)) end++;
    sections.push({ heading, content: blocks.slice(i + 1, end) });
    i = end;
  }
  return sections;
}

function renderSourceBlocks(blocks) {
  const table = sourceTable(blocks);
  const tableIndex = blocks.findIndex((b) => b === table);
  return renderBlocks(tableIndex < 0 ? blocks : blocks.slice(0, tableIndex + 1), {
    file: "sources.md", cards: false, writable: false, hideBlocked: true,
  });
}

function drawSourceCards(blocks) {
  const rail = $("#source-sections");
  rail.innerHTML = "";
  if (S.stage !== "sources") return;
  sourceSections(blocks).forEach(({ heading, content }) => {
    const card = el("details", "source-info-card", heading.line);
    const summary = el("summary", null, heading.line);
    const title = el("span", "source-info-title", heading.line);
    title.textContent = /^gaps$/i.test(heading.text.trim()) ? "Coverage gaps" :
      /^notes$/i.test(heading.text.trim()) ? "Notes" : heading.text;
    const preview = el("span", "source-info-preview", content[0] ? content[0].line : heading.line);
    preview.innerHTML = inline(sourceSectionPreview(content));
    summary.append(title, preview);
    card.appendChild(summary);
    const body = el("div", "source-info-body", heading.line);
    body.appendChild(renderBlocks(content, { file: "sources.md", cards: false, writable: false }));
    card.appendChild(body);
    card.addEventListener("toggle", () => {
      if (!card.open) {
        queueMicrotask(() => {
          if (!document.querySelector("#source-sections .source-info-card[open]")) {
            setSourcesCollapsed(false);
          }
        });
        return;
      }
      document.querySelectorAll("#source-sections .source-info-card[open]").forEach((other) => {
        if (other !== card) other.open = false;
      });
      setSourcesCollapsed(true);
    });
    rail.appendChild(card);
  });
}

function setSourcesCollapsed(collapsed) {
  const card = $("#document-card");
  const button = $("#sources-collapse");
  if (!card || !button) return;
  // The right column is an accordion, not three independent disclosures: Working
  // sources may close only while one of the file-section cards is open.
  if (collapsed && !document.querySelector("#source-sections .source-info-card[open]")) return;
  card.classList.toggle("sources-collapsed", collapsed);
  if (!collapsed) {
    document.querySelectorAll("#source-sections .source-info-card[open]").forEach((section) => {
      section.open = false;
    });
  }
  button.textContent = collapsed ? "›" : "⌄";
  button.title = collapsed ? "Expand Working sources" : "Collapse Working sources";
  button.setAttribute("aria-label", button.title);
  button.setAttribute("aria-expanded", String(!collapsed));
}

function drawGaps(blocks) {
  const pane = $("#gaps");
  pane.innerHTML = "";
  const table = S.stage === "sources" ? sourceTable(blocks) : null;
  const head = table ? table.header.cells.map((c) => c.toLowerCase()) : [];
  const cell = (r, name) => r.cells[head.indexOf(name)] || "";
  const rows = table ? table.rows.filter((r) => needsHand(cell(r, "status").split(" ")[0])) : [];
  drawSourceCards(blocks);
  // The rail keeps its column on every screen — an empty one is invisible, not absent, so
  // the document beside it never changes width when the stage changes.
  pane.classList.toggle("empty", !rows.length);
  if (!rows.length) return;

  const top = el("div", "gaps-head");
  top.innerHTML = '<h2>Needs a hand</h2><span class="gap-count">' + rows.length +
    '</span><span class="gaps-only">sources only</span>';
  pane.appendChild(top);
  const body = el("div", "gaps-body");
  rows.forEach((r) => {
    const gap = el("div", "gap", r.line);
    const gtop = el("div", "gap-top");
    const identity = el("div", "gap-identity");
    const status = cell(r, "status").split(" ")[0];
    identity.innerHTML = '<span class="gap-name">' + esc(cell(r, "name")) +
      '</span><span class="gap-dash">—</span><span class="gap-reason status-' +
      escAttr(status.replace(/[^a-z]/gi, "").toLowerCase()) + '">' + esc(status) + "</span>";
    const date = el("span", "gap-date");
    date.textContent = cell(r, "last checked");
    gtop.append(identity, date);
    const why = el("div", "gap-note");
    why.innerHTML = inline(cell(r, "why"));
    gap.append(gtop, why);
    const url = cell(r, "url");
    // No bare "open by hand" link: the work is a prompt someone or something can run, and
    // the result of running it has a column to land in.
    if (url) gap.appendChild(handCheck(cell(r, "name"), url, r, cell(r, "manual status")));
    body.appendChild(gap);
  });
  pane.appendChild(body);
}

function screenTitle(s) {
  if (S.stage === "sources") return "Working sources";
  return stageLabel(s, S.stage);
}

function screenBadge(s, blocks) {
  if (S.stage === "sources") {
    const f = sourceFacts();
    return f.total ? (f.total - f.blocked) + " of " + f.total : "";
  }
  if (S.stage === "criteria") {
    const approved = S.files["criteria.md"] && S.files["criteria.md"].text.match(/^Approved:\s*([^\n]+)/mi);
    return approved ? "approved " + approved[1].split(" · ")[0] : "";
  }
  if (S.stage === "run") {
    const t = shortlistTicks();
    return t.length ? t.length + " rows · " + t.filter((b) => b.checked).length + " ticked" : "draft";
  }
  const table = contactTable(blocks);
  if (!table) return "";
  const head = table.header.cells.map((c) => c.toLowerCase());
  const role = head.indexOf("role");
  const how = head.indexOf("how");
  // This badge counts published addresses, not every useful contact route. A row with
  // only a booking link remains visible but does not pretend an address was found.
  const found = table.rows.filter((r) => !/^not found$/i.test(r.cells[role] || "") && /@/.test(r.cells[how] || "")).length;
  return found + " of " + table.rows.length;
}

function draw() {
  const s = S.sessions.find((x) => x.slug === S.slug);
  if (!s) return;
  const chosen = chosenFiller(s);
  if (S.stage === SLOT_STAGE && chosen) S.stage = chosen;
  // `output` is step 4 pending — it is not a stage, and the screen it means is the run,
  // where the shortlist waiting to be ticked is.
  if (!S.stage) S.stage = (s.stages || []).includes(s.status) ? s.status
    : s.status === "output" ? "run" : "sources";
  document.body.classList.toggle("sources-page", S.stage === "sources");
  document.documentElement.classList.toggle("sources-page", S.stage === "sources");
  document.body.classList.toggle("criteria-page", S.stage === "criteria");
  document.documentElement.classList.toggle("criteria-page", S.stage === "criteria");
  document.body.classList.toggle("run-page", S.stage === "run");
  document.documentElement.classList.toggle("run-page", S.stage === "run");
  const contentGrid = $("#content-grid");
  contentGrid.classList.toggle("sources-layout", S.stage === "sources");
  contentGrid.classList.toggle("criteria-screen", S.stage === "criteria");
  contentGrid.classList.toggle("run-screen", S.stage === "run");
  $("#document-card").classList.remove("sources-collapsed");
  drawTabs();
  drawChips(s);

  const doc = $("#doc");
  doc.innerHTML = "";
  if (S.stage === SLOT_STAGE) {
    const slot = stagesFor(s).find((st) => !st.stage);
    const offered = slot ? slot.offered : [];
    const head = el("div", "dochead");
    head.innerHTML = '<span class="title">Step 4</span>';
    doc.appendChild(head);
    const body = el("div", "docbody");
    const content = el("div");
    content.innerHTML = '<h2>Offered fillers</h2><p>' + esc(offered.join(" · ")) +
      '</p><p>A filler is chosen in the terminal; nothing is picked here.</p>';
    body.appendChild(content);
    doc.appendChild(body);
    drawGaps([]);
    return;
  }
  const file = fileFor(S.stage);
  const payload = S.files[file];

  if (!payload) {
    const head = el("div", "dochead");
    head.innerHTML = '<span class="title">' + esc(screenTitle(s)) + '</span><span class="file-meta">' + esc(file) + "</span>";
    doc.appendChild(head);
    const body = el("div", "docbody");
    const e = el("div", "empty");
    e.textContent = file + " does not exist in this session.";
    body.appendChild(e);
    doc.appendChild(body);
    drawGaps([]);
    return;
  }

  let blocks = parse(payload.text);
  // The card's own header already carries the title and `sources.md · updated 2d ago`, so
  // the file's H1 and its `Last updated:` line are printed twice otherwise.
  if (S.stage === "sources") {
    blocks = blocks.filter((b) => !(b.type === "heading" && b.level === 1) &&
      !(b.type === "para" && /^Last updated:/i.test(b.text)));
  }
  const head = el("div", "dochead");
  head.classList.add(S.stage + "-head");
  const badge = screenBadge(s, blocks);
  head.innerHTML = '<span class="title">' + esc(screenTitle(s)) + '</span>' +
    (badge ? '<span class="count-badge" id="count">' + esc(badge) + '</span>' : '<span id="count"></span>') +
    '<span class="file-meta">' + esc(file) + (S.stage === "contacts" ? " · append only" :
      S.stage === "criteria" ? "" : (s.files[file] ? " · updated " + ago(s.files[file]) : "")) + "</span>";
  if (S.stage === "sources") {
    const collapse = el("button", "sources-collapse");
    collapse.id = "sources-collapse";
    collapse.type = "button";
    collapse.textContent = "⌄";
    collapse.title = "Collapse Working sources";
    collapse.setAttribute("aria-label", collapse.title);
    collapse.setAttribute("aria-expanded", "true");
    collapse.onclick = () => {
      if ($("#document-card").classList.contains("sources-collapsed")) {
        setSourcesCollapsed(false);
        return;
      }
      const firstSection = document.querySelector("#source-sections .source-info-card");
      if (firstSection) firstSection.open = true;
    };
    head.appendChild(collapse);
  }
  doc.appendChild(head);
  const body = el("div", "docbody");

  // run is three screens under one status: read reality, do not add a state machine.
  if (S.stage === "run" && S.listings) {
    const box = statBox(S.listings.stats, S.listings.blocked || []);
    if (box) body.appendChild(box);
  }

  // Cards are a ledger's layout, and the shape says whether it produces one. It used to be
  // guessed from whether results.md had ticks in it, which stopped being true when the
  // ticks moved out.
  const cards = S.stage === "run" && formFor(s) === "ledger";
  if (S.stage === "sources") body.appendChild(renderSourceBlocks(blocks));
  else if (S.stage === "contacts") body.appendChild(renderContacts(blocks));
  else if (S.stage === "criteria") body.appendChild(renderCriteria(blocks, formFor(s)));
  else body.appendChild(renderBlocks(blocks, {
    file, cards, writable: false,
  }));
  doc.appendChild(body);
  drawGaps(blocks);
  document.querySelectorAll("#doc .card").forEach((c) => {
    if (c.querySelector(".tick input:checked")) c.classList.add("ticked");
  });
  countLine();
}

function drawTerminal() {
  const pane = $("#term");
  const copy = $("#terminal-copy");
  if (S.ttyd) {
    if (!pane.querySelector("iframe")) {
      pane.innerHTML = '<iframe src="http://localhost:' + S.ttydPort + '" title="terminal"></iframe>';
    }
    copy.textContent = "connected · click to open the session terminal";
  } else {
    pane.innerHTML = '<div class="noterm"><p><b>No terminal in the page.</b></p>' +
      "<p>The UI is optional. Every session runs in a bare terminal exactly as it always has — " +
      "this pane is a convenience, not a dependency. To put one here:</p>" +
      "<pre>brew install ttyd\nttyd -p " + S.ttydPort + " -W claude</pre></div>";
    copy.textContent = "detached — every session still runs from the files";
  }
}

function toggleTerminal(force) {
  const open = force == null ? !document.body.classList.contains("terminal-open") : force;
  document.body.classList.toggle("terminal-open", open);
  $("#terminal-toggle").setAttribute("aria-expanded", String(open));
}

function openSessionMenu() {
  const menu = $(".session-menu");
  const trigger = $(".session-trigger");
  if (!menu || !trigger) return;
  menu.classList.add("open");
  trigger.setAttribute("aria-expanded", "true");
  const active = menu.querySelector(".on");
  if (active) active.focus();
}

function bindUI() {
  $("#terminal-toggle").onclick = () => toggleTerminal();
  $("#new-session").onclick = () => {
    toggleTerminal(true);
    note("Start the session in the terminal. Its tab appears after the confirmed session is written.");
  };
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openSessionMenu();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
      e.preventDefault();
      toggleTerminal();
    }
    if (e.key === "Escape") {
      const menu = $(".session-menu");
      if (menu) menu.classList.remove("open");
      const trigger = $(".session-trigger");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest("#tabs")) return;
    const menu = $(".session-menu");
    const trigger = $(".session-trigger");
    if (menu) menu.classList.remove("open");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  });
}

/* ---------- load ---------- */

async function load() {
  const idx = await fetch("/api/sessions").then((r) => r.json());
  S.sessions = idx.sessions;
  S.ttyd = idx.ttyd;
  S.ttydPort = idx.ttyd_port;
  if (!S.slug && S.sessions.length) S.slug = S.sessions[0].slug;
  const s = S.sessions.find((x) => x.slug === S.slug);
  if (!s) return;

  S.files = {};
  const wanted = new Set((s.stages || []).map(fileFor).concat([TICK_FILE]));
  await Promise.all([...wanted].map(async (f) => {
    if (!(f in s.files)) return;   // the server only lists files it has and will serve
    S.files[f] = await fetch("/api/file/" + s.slug + "/" + f).then((r) => r.json());
  }));
  // listings.md is never fetched whole — 3718 rows nobody reads. Only its stat line.
  S.listings = "listings.md" in s.files
    ? await fetch("/api/listings/" + s.slug).then((r) => r.json())
    : null;

  drawTerminal();
  draw();
}

function live() {
  const src = new EventSource("/events");
  src.onmessage = (e) => {
    const changed = JSON.parse(e.data).changed || [];
    if (!changed.length) return;
    note("changed: " + changed.join(", "));
    load();
  };
  src.onerror = () => note("live reload disconnected — is server.py still running?");
}

if (typeof document !== "undefined") {
  bindUI();
  load().then(live);
}   // importable for tests
