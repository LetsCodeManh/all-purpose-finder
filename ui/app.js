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

const STAGE_ORDER = ["sources", "criteria", "run", "contacts"];
const FILE_FOR = { sources: "sources.md", criteria: "criteria.md", run: "results.md", contacts: "contacts.md" };

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
        else rows.push({ line: i + 1, cells, url: cells.find((c) => /^https?:\/\//.test(c)) || null });
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

const SOURCE_ICON = { ok: "✓", blocked: "⛔", unchecked: "?", gone: "⊘" };

function renderTable(b, ctx) {
  const wrap = el("div", "table", b.line);
  const head = b.header ? b.header.cells.map((c) => c.toLowerCase()) : [];
  const iStatus = head.indexOf("status");
  const isSources = iStatus > -1 && head.includes("url");

  b.rows.forEach((r) => {
    if (isSources) {
      const st = (r.cells[iStatus] || "").split(" ")[0] || "unchecked";
      if (ctx.hideBlocked && st === "blocked") return;
      const row = el("div", "row", r.line);
      if (r.url) row.dataset.url = r.url;          // a source row knows which row it is
      row.classList.add("src", "st-" + st.replace(/[^a-z]/g, ""));
      const cell = (name) => r.cells[head.indexOf(name)] || "";
      row.innerHTML =
        '<div class="r1"><span class="ic">' + (SOURCE_ICON[st] || "·") + "</span>" +
        '<span class="nm">' + esc(cell("name")) + "</span>" +
        '<span class="ty">' + esc(cell("type")) + "</span>" +
        '<span class="me">' + esc(cell("method")) + "</span>" +
        '<span class="lc">' + esc(cell("last checked")) + "</span></div>" +
        '<div class="r2">' + inline(cell("why")) + "</div>" +
        (st === "blocked" && r.url
          ? '<div class="r3"><a href="' + escAttr(safeUrl(r.url)) + '" target="_blank" rel="noreferrer">&#8599; open by hand</a></div>'
          : "");
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

function criterionRows(text, line) {
  const rows = [];
  text.split("\n").forEach((raw) => {
    const m = raw.match(/^(must|range|nice|open)\s+([✓⚠✗])\s+(.*)$/);
    if (m) rows.push({ tier: m[1], mark: m[2], text: m[3] });
    else if (rows.length && raw.trim()) rows[rows.length - 1].text += " " + raw.trim();
  });
  const box = el("div", "card-criteria", line);
  rows.forEach((r) => {
    const row = el("div", "criterion-row", line);
    const markClass = r.mark === "✓" ? " pass" : r.mark === "⚠" ? " warn" : " fail";
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
  const tickBlock = content.find((b) => b.type === "tick" && b.kind === "card");
  const codeBlock = content.find((b) => b.type === "code");
  const paras = content.filter((b) => b.type === "para");
  const entries = paras.flatMap((b) => b.text.split("\n").map((text, offset) => ({ text, line: b.line + offset })));
  const sourceEntry = entries.find((e) => /^source:\s*/i.test(e.text));
  const metricEntry = entries.find((e) => /\bpostings?\b.*\bmust misses\b/i.test(e.text));
  const locationEntry = entries.find((e) => e !== sourceEntry && e !== metricEntry &&
    (!codeBlock || e.line < codeBlock.line));
  const comments = entries.filter((e) => e !== sourceEntry && e !== metricEntry && e !== locationEntry &&
    metricEntry && e.line > metricEntry.line);
  const match = metricEntry && metricEntry.text.match(/\b(\d+)\s+postings?\b/i);
  const count = match ? Number(match[1]) : 0;

  const top = el("div", "card-top", heading.line);
  if (tickBlock) top.appendChild(renderTick(tickBlock, ctx));
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

  if (codeBlock) card.appendChild(criterionRows(codeBlock.text, codeBlock.line));

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
  summary.textContent = "show the three patterns";
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
    row.innerHTML = '<strong class="prefilter-key">' + esc(pattern.key) + '</strong><span>' +
      inline(descriptions[pattern.key] || "approved must pattern") + " · " + count + " alternatives</span>";
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
  const frag = document.createDocumentFragment();
  let i = 0;
  // The document card already carries the title and approval date, so avoid repeating
  // the markdown H1 and Approved line inside the card body.
  while (i < blocks.length && ((blocks[i].type === "heading" && blocks[i].level === 1) ||
    (blocks[i].type === "para" && /^Approved:/i.test(blocks[i].text)))) i++;

  while (i < blocks.length) {
    const heading = blocks[i];
    if (!(heading.type === "heading" && heading.level === 2)) {
      frag.appendChild(renderBlocks([heading], { cards: false, writable: false }));
      i++;
      continue;
    }
    let end = i + 1;
    while (end < blocks.length && !(blocks[end].type === "heading" && blocks[end].level === 2)) end++;
    const key = heading.text.trim().toLowerCase();
    if (key === "prefilter") {
      frag.appendChild(renderPrefilter(heading, blocks.slice(i + 1, end)));
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
    frag.appendChild(section);
    i = end;
  }
  return frag;
}

function renderBlocks(blocks, ctx) {
  if (ctx.cards) return renderLedgerBlocks(blocks, ctx);
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
      case "tick": n = renderTick(b, ctx); break;
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

function stagesFor(s) {
  const has = (n) => n in s.files;
  const at = STAGE_ORDER.indexOf(s.status);
  return STAGE_ORDER.map((name, i) => {
    let mark, why = "";
    // `contacts: n/a — <reason>` is the only thing that makes a stage not-for-this-shape.
    // Never inferred from `shape`: if it is not on disk, the terminal user cannot see it.
    const present =
      name === "sources" ? has("sources.md") :
      name === "criteria" ? has("criteria.md") :
      name === "run" ? has("results.md") || has("listings.md") :
      has("contacts.md");
    // Read reality: ✓ means this stage has output on disk, ● is where `status` says you
    // are, ○ means nothing written yet. The loop is run -> contacts -> run, so a stage
    // downstream of `status` can legitimately already have a file.
    if (name === "contacts" && s.contacts_na) { mark = "⊘"; why = s.contacts_na; }
    else if (i === at) mark = "●";
    else if (present) mark = "✓";
    else mark = "○";
    return { name, mark, why, present };
  });
}

function formFor(s) {
  return s.files["listings.md"] ? "ledger" : s.files["results.md"] ? "brief" : "";
}

function visibleStages(s) {
  return stagesFor(s).filter((st) => !(st.name === "contacts" && s.contacts_na));
}

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
  if (stage === "run") return form === "brief" ? "Brief" : "Results";
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

function stageStatus(s, stage) {
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
    const p = S.files["results.md"];
    if (!p) return "not started";
    const blocks = parse(p.text);
    const ticks = blocks.filter((b) => b.type === "tick");
    if (!ticks.length) return "draft";
    return ticks.length + " cards · " + ticks.filter((b) => b.checked).length + " ticked";
  }
  return S.files["contacts.md"] ? "lookup complete" : "not started";
}

// No approve button: every gate is confirmed in the terminal, where the approval and the
// next step get written. This line says what the stage is waiting for, and nothing clicks.
function actionFor(s) {
  const notes = {
    sources: "the next gate is recorded in the terminal",
    criteria: "the run waits for your approval",
    run: formFor(s) === "ledger" ? "tick cards before moving on" : "review the artifact before rerunning",
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
  const stages = visibleStages(s);
  bar.style.gridTemplateColumns = "repeat(" + stages.length + ", minmax(0, 1fr))";
  bar.style.setProperty("--stage-count", stages.length);
  stages.forEach((st, i) => {
    const c = el("button", "chip" + (st.name === S.stage ? " on" : "") +
      (st.mark === "⊘" ? " na" : "") + (st.mark === "✓" ? " done" : ""));
    c.type = "button";
    c.innerHTML = '<span class="chip-track"><span class="chip-dot"></span>' +
      (i < stages.length - 1 ? '<span class="chip-line"></span>' : "") + '</span>' +
      '<span class="chip-copy"><span class="chip-name">' + esc(stageLabel(s, st.name)) + '</span>' +
      '<span class="chip-status">' + esc(stageStatus(s, st.name)) + "</span></span>";
    if (st.why) c.title = st.why;
    c.onclick = () => { S.stage = st.name; draw(); };
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
  const cards = document.querySelectorAll("#doc .card").length;
  const ticked = document.querySelectorAll("#doc .tick input:checked").length;
  const n = $("#count");
  if (n && cards) n.textContent = cards + " cards · " + ticked + " ticked";
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

function drawGaps(blocks) {
  const pane = $("#gaps");
  const table = sourceTable(blocks);
  if (S.stage !== "sources" || !table) {
    pane.hidden = true;
    pane.innerHTML = "";
    return;
  }
  const head = table.header.cells.map((c) => c.toLowerCase());
  const cell = (r, name) => r.cells[head.indexOf(name)] || "";
  const blocked = table.rows.filter((r) => cell(r, "status").split(" ")[0] === "blocked");
  if (!blocked.length) {
    pane.hidden = true;
    pane.innerHTML = "";
    return;
  }
  pane.hidden = false;
  pane.innerHTML = '<div class="gaps-head"><h2>Gaps</h2><span class="gap-count">' + blocked.length +
    '</span><span class="gaps-only">sources only</span></div><div class="gaps-body">' +
    blocked.map((r) => {
      const url = cell(r, "url");
      return '<div class="gap" data-line="' + r.line + '"><div class="gap-top"><span class="gap-name">' +
        esc(cell(r, "name")) + '</span><span class="gap-date">' + esc(cell(r, "last checked")) + '</span></div>' +
        '<span class="gap-reason">' + esc(cell(r, "status")) + '</span><div class="gap-note">' +
        inline(cell(r, "why")) + '</div>' + (url ? '<a href="' + escAttr(safeUrl(url)) +
        '" target="_blank" rel="noreferrer">Open by hand ↗</a>' : "") + "</div>";
    }).join("") + "</div>";
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
    const ticks = blocks.filter((b) => b.type === "tick");
    return ticks.length ? ticks.length + " cards · " + ticks.filter((b) => b.checked).length + " ticked" : "draft";
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
  if (!S.stage) S.stage = STAGE_ORDER.indexOf(s.status) > -1 ? s.status : "sources";
  drawTabs();
  drawChips(s);

  const doc = $("#doc");
  doc.innerHTML = "";
  const file = FILE_FOR[S.stage];
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

  const blocks = parse(payload.text);
  const head = el("div", "dochead");
  head.classList.add(S.stage + "-head");
  const badge = screenBadge(s, blocks);
  head.innerHTML = '<span class="title">' + esc(screenTitle(s)) + '</span>' +
    (badge ? '<span class="count-badge" id="count">' + esc(badge) + '</span>' : '<span id="count"></span>') +
    '<span class="file-meta">' + esc(file) + (S.stage === "contacts" ? " · append only" :
      S.stage === "criteria" ? "" : (s.files[file] ? " · updated " + ago(s.files[file]) : "")) + "</span>";
  doc.appendChild(head);
  const body = el("div", "docbody");

  // run is three screens under one status: read reality, do not add a state machine.
  if (S.stage === "run" && S.listings) {
    const box = statBox(S.listings.stats, S.listings.blocked || []);
    if (box) body.appendChild(box);
  }

  // A card is a thing you can tick, so the ticks decide — not the ###. A brief has
  // ### section headings and no ticks, and must render as the prose it is.
  const cards = blocks.some((b) => b.type === "tick" && b.kind === "card");
  if (S.stage === "contacts") body.appendChild(renderContacts(blocks));
  else if (S.stage === "criteria") body.appendChild(renderCriteria(blocks, formFor(s)));
  else body.appendChild(renderBlocks(blocks, {
    file, cards, writable: file === "results.md", hideBlocked: S.stage === "sources",
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
  await Promise.all(STAGE_ORDER.map(async (stage) => {
    const f = FILE_FOR[stage];
    if (!(f in s.files)) return;
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
