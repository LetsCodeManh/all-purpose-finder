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

function renderTable(b) {
  const wrap = el("div", "table", b.line);
  const head = b.header ? b.header.cells.map((c) => c.toLowerCase()) : [];
  const iStatus = head.indexOf("status");
  const isSources = iStatus > -1 && head.includes("url");

  b.rows.forEach((r) => {
    const row = el("div", "row", r.line);
    if (r.url) row.dataset.url = r.url;          // a source row knows which row it is
    if (isSources) {
      const st = (r.cells[iStatus] || "").split(" ")[0] || "unchecked";
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
    } else {
      row.classList.add("plain");
      row.innerHTML = r.cells.map((c, n) =>
        '<span class="c">' + (head[n] ? "<b>" + esc(head[n]) + "</b> " : "") + inline(c) + "</span>").join("");
    }
    wrap.appendChild(row);
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

function renderBlocks(blocks, ctx) {
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
      case "table": n = renderTable(b); break;
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

function drawTabs() {
  const bar = $("#tabs");
  bar.innerHTML = "";
  S.sessions.forEach((s) => {
    const t = el("button", "tab" + (s.slug === S.slug ? " on" : ""));
    t.innerHTML = '<span class="dot"></span>' + esc(s.slug) + '<span class="badge">' + esc(s.status) + "</span>";
    t.onclick = () => { S.slug = s.slug; S.stage = null; load(); };
    bar.appendChild(t);
  });
  const add = el("button", "tab add");
  add.textContent = "+";
  // A tab cannot be created here: AGENTS.md forbids empty folders, so the tab appears
  // when the agent writes the folder. No pending state, no placeholder.
  add.onclick = () => note("type /session in the terminal — the tab appears when the agent writes the folder");
  bar.appendChild(add);
}

function drawChips(s) {
  const bar = $("#chips");
  bar.innerHTML = "";
  stagesFor(s).forEach((st, i) => {
    const c = el("button", "chip" + (st.name === S.stage ? " on" : "") +
      (st.mark === "⊘" ? " na" : "") + (st.present ? "" : " absent"));
    c.innerHTML = '<span class="num">' + "①②③④"[i] + "</span>" + esc(st.name) +
      '<span class="mk">' + st.mark + "</span>";
    if (st.why) c.title = st.why;
    c.onclick = () => { S.stage = st.name; draw(); };
    bar.appendChild(c);
  });
  const meta = el("span", "shape");
  const form = s.files["listings.md"] ? "ledger" : s.files["results.md"] ? "brief" : "";
  meta.textContent = [s.shape, form].filter(Boolean).join(" · ");
  bar.appendChild(meta);
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
      '<span class="bb" style="width:' + Math.round((c.n / max) * 100) + '%"></span></div>').join("") +
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
  if (n) n.textContent = cards ? "results · " + cards + " cards · " + ticked + " ticked" : "";
}

function note(msg) {
  const n = $("#note");
  n.textContent = msg;
  n.classList.add("show");
  clearTimeout(note.t);
  note.t = setTimeout(() => n.classList.remove("show"), 4000);
}

/* ---------- screens ---------- */

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

  const head = el("div", "dochead");
  head.innerHTML = '<span class="fn">' + esc(file) + "</span>" +
    '<span class="when">' + (s.files[file] ? "updated " + ago(s.files[file]) : "") + "</span>" +
    '<span id="count"></span>';
  doc.appendChild(head);

  // run is three screens under one status: read reality, do not add a state machine.
  if (S.stage === "run" && S.listings) {
    const box = statBox(S.listings.stats, S.listings.blocked || []);
    if (box) doc.appendChild(box);
  }

  if (!payload) {
    const e = el("div", "empty");
    e.textContent = file + " does not exist in this session.";
    doc.appendChild(e);
    return;
  }

  const blocks = parse(payload.text);
  // A card is a thing you can tick, so the ticks decide — not the ###. A brief has
  // ### section headings and no ticks, and must render as the prose it is.
  const cards = blocks.some((b) => b.type === "tick" && b.kind === "card");
  doc.appendChild(renderBlocks(blocks, { file, cards, writable: file === "results.md" }));
  document.querySelectorAll("#doc .card").forEach((c) => {
    if (c.querySelector(".tick input:checked")) c.classList.add("ticked");
  });
  countLine();
}

function drawTerminal() {
  const pane = $("#term");
  if (S.ttyd) {
    if (!pane.querySelector("iframe")) {
      pane.innerHTML = '<iframe src="http://localhost:' + S.ttydPort + '" title="terminal"></iframe>';
    }
  } else {
    pane.innerHTML = '<div class="noterm"><p><b>No terminal in the page.</b></p>' +
      "<p>The UI is optional. Every session runs in a bare terminal exactly as it always has — " +
      "this pane is a convenience, not a dependency. To put one here:</p>" +
      "<pre>brew install ttyd\nttyd -p " + S.ttydPort + " -W claude</pre></div>";
  }
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

if (typeof document !== "undefined") load().then(live);   // importable for tests
