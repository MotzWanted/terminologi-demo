/* ============================================================================
 * app.js — 4-pane demo orchestration + rendering.
 * Vanilla JS, no dependencies. Loads PT001 from data.js.
 * ========================================================================== */

const D = PT001;
let currentPane = 0;
let dark = false;
const $ = id => document.getElementById(id);
const esc = t => String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const cssv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/* ==========================================================================
   Navigation
   ========================================================================== */
function showPane(n) {
  currentPane = n;
  // Pane 0 is the note alone: no pane, no evidence marks
  $("app").classList.toggle("pane0", n === 0);
  document.querySelectorAll(".pane").forEach((p, i) => {
    p.classList.toggle("active", i + 1 === n);
  });
  document.querySelectorAll(".pi").forEach(p => {
    p.classList.toggle("active", +p.dataset.pane === n);
    p.classList.toggle("done", +p.dataset.pane < n);
  });
  if (n === 1) renderPane1();
  if (n === 2) renderPane2();
  if (n === 3) renderPane3();
  if (n === 4) renderPane4();
}

document.addEventListener("keydown", e => {
  if (e.target.matches("input,button,textarea")) return;
  if (e.key >= "0" && e.key <= "4") { showPane(+e.key); return; }
  if (e.key === " ") { e.preventDefault(); if (currentPane < 4) showPane(currentPane + 1); return; }
  if (e.key === "ArrowRight" && currentPane < 4) showPane(currentPane + 1);
  if (e.key === "ArrowLeft" && currentPane > 0) showPane(currentPane - 1);
  if (e.key.toLowerCase() === "t") toggleTheme();
});

function toggleTheme() {
  dark = !dark;
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  if (currentPane === 4) renderPane4();
}

/* ==========================================================================
   Shared clinical note panel — rendered once, visible across all panes.
   The note is the "status quo" input; each pane's right side shows what
   technology transforms it into.
   ========================================================================== */
let p1EvidenceMap = {}; // code -> [spanId, ...] built during note rendering
let stmtEvidenceMap = {}; // stmtId -> [spanId, ...], for SNOMED/FHIR/timeline evidence
let spanIdToStmts = {};   // spanId -> [stmtId, ...] (reverse of stmtEvidenceMap)

function renderNote() {
  const note = D.note;
  let noteHtml = `<div class="note-panel-label">Clinical Documentation</div><h2>${esc(note.title)}</h2><div class="note-date">${note.date}</div><div class="note-text" id="note-text"></div>`;
  $("note-panel").innerHTML = noteHtml;

  // Un-wrap the note text: join hard-wrapped lines within paragraphs into
  // single lines so the text reflows to fill the panel width. Only blank
  // lines (paragraph/section breaks) are preserved.
  const unwrapped = note.text
    .split(/\n{2,}/)           // split on blank lines (paragraph breaks)
    .map(p => p.replace(/\n/g, " ").trim())  // join wrapped lines within each paragraph
    .join("\n\n");

  // Render note text with evidence spans wrapped in <span> elements
  let text = esc(unwrapped);

  // --- ICD-10 evidence spans (pane 1) ---
  const normSpan = s => s.replace(/\n/g, " ");
  const allSpans = [];
  D.icd10cm.forEach(c => { if (c.evidenceSpans) c.evidenceSpans.forEach(s => allSpans.push({span: normSpan(s), code: c.code})); });
  D.icd10pcs.forEach(c => { if (c.evidenceSpans) c.evidenceSpans.forEach(s => allSpans.push({span: normSpan(s), code: c.code})); });

  allSpans.sort((a, b) => b.span.length - a.span.length);
  const replaced = [];
  const spanIdByText = {};
  let spanIdCounter = 0;
  allSpans.forEach(({span, code}) => {
    const escSpan = esc(span);
    if (spanIdByText[escSpan]) {
      if (!p1EvidenceMap[code]) p1EvidenceMap[code] = [];
      p1EvidenceMap[code].push(spanIdByText[escSpan]);
      return;
    }
    if (replaced.some(r => escSpan.includes(r) || r.includes(escSpan))) return;
    if (!text.includes(escSpan)) return;
    const spanId = `evspan-${spanIdCounter++}`;
    spanIdByText[escSpan] = spanId;
    if (!p1EvidenceMap[code]) p1EvidenceMap[code] = [];
    p1EvidenceMap[code].push(spanId);
    text = text.split(escSpan).join(`<span class="ev-hl" id="${spanId}" data-code="${code}">${escSpan}</span>`);
    replaced.push(escSpan);
  });

  // --- SNOMED CT evidence spans (pane 2 + 4) ---
  // For each SNOMED statement, try to link its evidence text to a position
  // in the note. If the text overlaps with existing ICD-10 ev-hl spans,
  // reuse ALL overlapping span IDs. Otherwise, wrap it in a new ev-stmt span.
  // stmtEvidenceMap maps stmtId → [spanId, ...] (array, first = scroll target).
  stmtEvidenceMap = {};
  const stmtSpans = D.statements
    .filter(s => s.evidence)
    .map(s => ({evidence: s.evidence, stmtId: s.id}))
    .sort((a, b) => b.evidence.length - a.evidence.length);
  const stmtReplaced = [];
  stmtSpans.forEach(({evidence, stmtId}) => {
    const escEv = esc(evidence);
    // Find ALL ICD-10 spans that overlap with this SNOMED evidence
    const overlappingIcdSpanIds = [];
    Object.keys(spanIdByText).forEach(icdText => {
      if (escEv.includes(icdText) || icdText.includes(escEv)) {
        overlappingIcdSpanIds.push(spanIdByText[icdText]);
      }
    });
    if (overlappingIcdSpanIds.length > 0) {
      // Deduplicate and store all overlapping ICD-10 span IDs
      stmtEvidenceMap[stmtId] = [...new Set(overlappingIcdSpanIds)];
      return;
    }
    // Skip if overlaps with another SNOMED span already wrapped
    if (stmtReplaced.some(r => escEv.includes(r) || r.includes(escEv))) return;
    // Try to find and wrap the text in the (possibly modified) HTML string
    if (!text.includes(escEv)) return;
    const stmtSpanId = `stmt-${stmtId}`;
    stmtEvidenceMap[stmtId] = [stmtSpanId];
    text = text.split(escEv).join(`<span class="ev-stmt" id="${stmtSpanId}" data-stmt="${stmtId}">${escEv}</span>`);
    stmtReplaced.push(escEv);
  });

  $("note-text").innerHTML = text;

  // Build reverse map: spanId → [stmtIds] (for pane-aware note clicks)
  spanIdToStmts = {};
  Object.keys(stmtEvidenceMap).forEach(stmtId => {
    (stmtEvidenceMap[stmtId] || []).forEach(spanId => {
      if (!spanIdToStmts[spanId]) spanIdToStmts[spanId] = [];
      spanIdToStmts[spanId].push(stmtId);
    });
  });
}

/* ==========================================================================
   Pane 1 — Console facsimile: code cards with evidence highlight + auto-scroll.
   ========================================================================== */
let p1Tab = "cm"; // "cm" or "pcs"
let p1Revealed = 0;
let p1ActiveCode = null;

function renderPane1() {
  p1Revealed = 0;
  p1ActiveCode = null;
  renderP1Codes();
}

function renderP1Codes() {
  const codes = p1Tab === "cm" ? D.icd10cm : D.icd10pcs;
  let html = `<div class="codes-header"><div class="section-label">${p1Tab==="cm"?"ICD-10-CM Diagnoses":"ICD-10-PCS Procedures"}</div>
    <div class="tab-btns">
      <span class="tab-btn ${p1Tab==="cm"?"active":""}" onclick="p1Tab='cm';renderP1Codes()">Diagnosis</span>
      <span class="tab-btn ${p1Tab==="pcs"?"active":""}" onclick="p1Tab='pcs';renderP1Codes()">Procedure</span>
    </div></div>`;

  codes.forEach((c, i) => {
    const delay = i < 5 ? `delay-${i}` : "";
    html += `<div class="code-card reveal ${delay}" data-idx="${i}" data-code="${c.code}">
      <div class="cc-head" onclick="p1Toggle(this, '${c.code}')">
        <span class="cc-code">${c.code}</span>
        <span class="cc-display">${esc(c.display)}</span>
        ${c.role ? `<span class="cc-role">${c.role}</span>` : c.rootOperation ? `<span class="cc-role">${c.rootOperation}</span>` : ""}
      </div>
      <div class="cc-body">`;

    // Evidence spans — clickable to highlight + scroll in the note
    if (c.evidenceSpans && c.evidenceSpans.length) {
      html += `<div class="cc-evidence"><div class="section-label">Evidences</div><ul class="cc-evidence-list">`;
      const spanIds = p1EvidenceMap[c.code] || [];
      c.evidenceSpans.forEach((s, i) => {
        const sid = spanIds[i] || spanIds[0] || "";
        const disp = s.replace(/\n/g, " ");
        html += `<li onclick="p1ScrollToEvidenceById('${sid}', '${c.code}')">${esc(disp)}</li>`;
      });
      html += `</ul></div>`;
    }

    // Alternatives — collapsible pane
    if (c.alternatives && c.alternatives.length) {
      html += `<div class="cc-alternatives">
        <div class="alt-header" onclick="this.parentElement.classList.toggle('open')">
          <span class="section-label">Alternatives (${c.alternatives.length})</span>
          <span class="alt-chevron">▾</span>
        </div>
        <div class="alt-body">`;
      c.alternatives.forEach(a => {
        html += `<div class="alt-item">
          <div class="alt-item-head"><span class="alt-code">${a.code}</span> <span class="alt-display">${esc(a.display)}</span></div>
          <div class="alt-reason">${esc(a.reason)}</div>
        </div>`;
      });
      html += `</div></div>`;
    }

    // PCS decomposition
    if (c.system === "ICD-10-PCS") {
      html += `<div style="margin-top:10px"><div class="section-label">PCS Decomposition</div><dl class="kv">
        <dt>Section</dt><dd>${c.section}</dd>
        <dt>Body System</dt><dd>${c.bodySystem}</dd>
        <dt>Root Operation</dt><dd>${c.rootOperation}</dd>
        <dt>Body Part</dt><dd>${c.bodyPart}</dd>
        <dt>Approach</dt><dd>${c.approach || "—"}</dd>
        ${c.qualifier ? `<dt>Qualifier</dt><dd>${c.qualifier}</dd>` : ""}
      </dl></div>`;
    }

    // Manifestation / pairing
    if (c.manifestation) html += `<div style="margin-top:8px"><span class="tag">Manifestation: ${c.manifestation} ${esc(c.manifestationDisplay||"")}</span></div>`;
    if (c.pairedWith) html += `<div style="margin-top:8px"><span class="tag">Paired with: ${c.pairedWith}</span></div>`;

    // Guideline with drill-down (click title to expand, click ref to open PDF)
    if (c.guideline) {
      const g = c.guideline;
      const hasPdf = (D.guidelinePages || {})[g.sectionId];
      const pdfLabel = c.system === "ICD-10-PCS" ? "FY 2026 ICD-10-PCS Guidelines" : "FY 2026 ICD-10-CM Guidelines";
      html += `<div class="cc-guideline">
        <div class="gl-breadcrumb">${g.breadcrumb.join(" › ")}</div>
        <div class="gl-title" onclick="p1ToggleGuideline(this)">${esc(g.title)}</div>
        <div class="gl-excerpt">${esc(g.excerpt)}</div>`;
      // Code-level instructions (Excludes, Code first, Use additional code)
      if (c.codingHints) {
        const ch = c.codingHints;
        const hints = [];
        if (ch.mutuallyExclusive) hints.push(`<div class="gl-hint"><span class="gl-hint-label">Exclude</span>${ch.mutuallyExclusive.map(esc).join("; ")}</div>`);
        if (ch.etiology) hints.push(`<div class="gl-hint"><span class="gl-hint-label">Code first</span>${ch.etiology.map(esc).join("; ")}</div>`);
        if (ch.manifestation) hints.push(`<div class="gl-hint"><span class="gl-hint-label">Use additional code</span>${ch.manifestation.map(esc).join("; ")}</div>`);
        if (ch.doesNotInclude) hints.push(`<div class="gl-hint"><span class="gl-hint-label">Does not include</span>${ch.doesNotInclude.map(esc).join("; ")}</div>`);
        if (ch.notes) hints.push(`<div class="gl-hint"><span class="gl-hint-label">Note</span>${ch.notes.map(esc).join("; ")}</div>`);
        // PCS-specific hints
        if (ch.rootOperation) hints.push(`<div class="gl-hint"><span class="gl-hint-label">Root operation</span>${esc(ch.rootOperation)}</div>`);
        if (ch.rootOperationNote) hints.push(`<div class="gl-hint"><span class="gl-hint-label">Note</span>${esc(ch.rootOperationNote)}</div>`);
        if (ch.bodyPartIncludes) hints.push(`<div class="gl-hint"><span class="gl-hint-label">Body part includes</span>${esc(ch.bodyPartIncludes)}</div>`);
        if (ch.approach) hints.push(`<div class="gl-hint"><span class="gl-hint-label">Approach</span>${esc(ch.approach)}</div>`);
        if (hints.length) html += `<div class="gl-hints">${hints.join("")}</div>`;
      }
      html += `<div class="gl-ref"${hasPdf ? ` onclick="p1ShowGuidelinePdf('${g.sectionId}', '${encodeURIComponent(g.title)}')"` : ""}>${pdfLabel} · §${g.sectionId}${hasPdf ? " · 📄 View in PDF" : ""}</div>`;
      // Drilldown: related guideline sub-sections from the Official Guidelines PDF
      if (g.subSections && g.subSections.length) {
        html += `<div class="gl-drilldown">`;
        g.subSections.forEach(sub => {
          const sectionMatch = sub.title.match(/^§([IVXB][A-Za-z.\d]+)/);
          const subHasPdf = sectionMatch && (D.guidelinePages || {})[sectionMatch[1]];
          if (subHasPdf) {
            const subSid = sectionMatch[1];
            html += `<div class="gl-sub-item" onclick="p1ShowGuidelinePdf('${subSid}', '${encodeURIComponent(sub.title)}')" style="cursor:pointer"><div class="gl-sub-title">${esc(sub.title)} <span class="gl-sub-link">📄</span></div><div class="gl-sub-excerpt">${esc(sub.excerpt)}</div></div>`;
          } else {
            html += `<div class="gl-sub-item"><div class="gl-sub-title">${esc(sub.title)}</div><div class="gl-sub-excerpt">${esc(sub.excerpt)}</div></div>`;
          }
        });
        html += `</div>`;
      }
      html += `</div>`;
    }

    html += `</div></div>`;
  });

  // Add hint
  html += `<div style="margin-top:10px;font-size:11px;color:var(--ink-3);font-family:var(--mono)">Click a card to expand · click evidence to locate in note · click 📄 to view the source guideline PDF</div>`;

  $("p1-codes").innerHTML = html;

  // Reveal cards progressively
  p1Revealed = 0;
  revealP1Cards();
}

function revealP1Cards() {
  const cards = $("p1-codes").querySelectorAll(".code-card.reveal");
  if (p1Revealed >= cards.length) return;
  cards[p1Revealed].classList.add("show");
  // Auto-open the first card to show the pattern
  if (p1Revealed === 0) cards[0].classList.add("open");
  p1Revealed++;
  setTimeout(revealP1Cards, 280);
}

function p1Toggle(cardEl, code) {
  cardEl.parentElement.classList.toggle("open");
  p1ActivateCode(code);
}

function p1ToggleGuideline(el) {
  const guideline = el.closest(".cc-guideline");
  const drilldown = guideline.querySelector(".gl-drilldown");
  if (drilldown) drilldown.classList.toggle("open");
}

// Show the guidelines PDF in the right pane, navigated to the section's page
// and with the section heading text highlighted.
function p1ShowGuidelinePdf(sectionId, searchEnc) {
  const page = (D.guidelinePages || {})[sectionId];
  if (!page) return;
  // Pick the right PDF: PCS sections (B3.x) use the PCS guidelines PDF
  const isPcs = sectionId.startsWith("B");
  const pdfFile = isPcs ? (D.guidelinePdfs?.pcs || "icd10-pcs-guidelines-fy2026.pdf")
                        : (D.guidelinePdfs?.cm || "icd10-cm-guidelines-fy2026.pdf");
  const pdfTitle = isPcs ? "FY 2026 ICD-10-PCS Official Guidelines" : "FY 2026 ICD-10-CM Official Guidelines";
  // Decode the search text and strip section prefix
  let searchText = searchEnc ? decodeURIComponent(searchEnc) : "";
  // Strip "§X.X.X —" section prefix
  searchText = searchText.replace(/^§[IVXB][A-Za-z.\d]+\s*[—-]\s*/, "").trim();
  // Truncate at em/en dash (separates heading from description, e.g.
  // "Adverse Effect — nature of the adverse effect coded first" → "Adverse Effect")
  searchText = searchText.replace(/\s*[—–].*/, "").trim();

  const codesEl = $("p1-codes");
  const tab = p1Tab === "cm" ? "ICD-10-CM" : "ICD-10-PCS";
  codesEl.innerHTML = `
    <div class="pdf-viewer">
      <div class="pdf-header">
        <span class="pdf-back" onclick="p1BackToCodes()">← Back to ${tab} codes</span>
        <span class="pdf-title">${pdfTitle}</span>
        <span class="pdf-section">§${sectionId} · page ${page}</span>
      </div>
      <div class="pdf-canvas-wrap" id="pdf-canvas-wrap"></div>
    </div>`;

  // Render the PDF page with highlighting using PDF.js
  if (typeof window.renderPdfPage === "function") {
    window.renderPdfPage(pdfFile, page, searchText, $("pdf-canvas-wrap"));
  } else {
    // PDF viewer script not loaded yet — retry shortly
    setTimeout(function () { p1ShowGuidelinePdf(sectionId, searchEnc); }, 200);
  }
}

// Return from PDF view to the code cards
function p1BackToCodes() {
  renderP1Codes();
}

function p1ActivateCode(code) {
  p1ActiveCode = code;
  // Highlight active card
  document.querySelectorAll(".code-card").forEach(c => c.classList.toggle("hl-active", c.dataset.code === code));
  // Highlight evidence spans for this code (by data-code or evidence map)
  p1HighlightSpans(code);
  // Auto-scroll note to first evidence span
  const firstSpanId = (p1EvidenceMap[code] || [])[0];
  if (firstSpanId) {
    const firstEl = document.getElementById(firstSpanId);
    if (firstEl) p1ScrollToEl(firstEl);
  }
}

function p1HighlightSpans(code) {
  const codeSpanIds = new Set(p1EvidenceMap[code] || []);
  document.querySelectorAll(".ev-hl").forEach(s => {
    s.classList.toggle("active", s.dataset.code === code || codeSpanIds.has(s.id));
  });
}

function p1ScrollToEl(el) {
  const noteEl = $("note-panel");
  const rect = el.getBoundingClientRect();
  const noteRect = noteEl.getBoundingClientRect();
  noteEl.scrollTo({ top: noteEl.scrollTop + rect.top - noteRect.top - 80, behavior: "smooth" });
}

/* ==========================================================================
   Shared evidence highlight/scroll — works across all panes.
   - highlightNoteEvidence(stmtId): highlight SNOMED evidence in the note
   - scrollToNoteEvidence(stmtId): highlight + scroll to SNOMED evidence
   - Clicking a .ev-stmt span in the note → switch to pane 2, select statement
   ========================================================================== */

function highlightNoteEvidence(stmtId) {
  // Clear previous highlights
  document.querySelectorAll(".ev-stmt.active, .ev-hl.active").forEach(s => s.classList.remove("active"));
  // Highlight all evidence spans for this statement
  const spanIds = stmtEvidenceMap[stmtId] || [];
  spanIds.forEach(spanId => {
    const el = document.getElementById(spanId);
    if (el) el.classList.add("active");
  });
}

function scrollToNoteEvidence(stmtId) {
  highlightNoteEvidence(stmtId);
  const spanIds = stmtEvidenceMap[stmtId] || [];
  // Scroll to the first evidence span
  if (spanIds.length > 0) {
    const el = document.getElementById(spanIds[0]);
    if (el) p1ScrollToEl(el);
  }
}

// Build a reverse map: SNOMED code → statement ID (for FHIR resource linking)
// Also map LOINC and RxNorm codes for Observation/AllergyIntolerance resources
const stmtCodeToId = {};
D.statements.forEach(s => { if (s.code) stmtCodeToId[s.code] = s.id; });

// Map FHIR resource → SNOMED statement ID (via any coding in code, reaction, or condition)
function fhirResourceToStmtId(resource) {
  const candidates = [];
  // Primary code
  if (resource.code?.coding) resource.code.coding.forEach(c => candidates.push(c));
  // AllergyIntolerance reaction manifestation
  if (resource.reaction) resource.reaction.forEach(r => {
    if (r.manifestation) r.manifestation.forEach(m => {
      if (m.coding) m.coding.forEach(c => candidates.push(c));
    });
  });
  // FamilyMemberHistory condition
  if (resource.condition) resource.condition.forEach(cond => {
    if (cond.code?.coding) cond.code.coding.forEach(c => candidates.push(c));
  });
  // Check each coding against the statement code map
  for (const c of candidates) {
    if (c.code && stmtCodeToId[c.code]) return stmtCodeToId[c.code];
  }
  return null;
}

// Click an evidence item in a code card → highlight + scroll to it in the note
function p1ScrollToEvidenceById(spanId, code) {
  const target = spanId ? document.getElementById(spanId) : null;
  // Highlight all spans for this code
  p1HighlightSpans(code);
  if (target) p1ScrollToEl(target);
}

// Click an evidence span in the note → switch to the right pane and highlight.
// Pane-aware: if in pane 2/3/4, navigate to the SNOMED/FHIR/timeline item.
document.addEventListener("click", e => {
  const hlSpan = e.target.closest(".ev-hl");
  const stmtSpan = e.target.closest(".ev-stmt");
  const clickedSpan = hlSpan || stmtSpan;
  if (!clickedSpan || currentPane === 0) return;

  // Resolve which SNOMED statement(s) are linked to this span
  const spanId = clickedSpan.id;
  const stmtIds = spanIdToStmts[spanId] || [];
  // For .ev-stmt spans, the stmtId is in the data attribute
  if (stmtSpan && stmtSpan.dataset.stmt && !stmtIds.includes(stmtSpan.dataset.stmt)) {
    stmtIds.unshift(stmtSpan.dataset.stmt);
  }

  // Determine the code (for pane 1)
  const code = hlSpan ? hlSpan.dataset.code : null;

  // --- Pane 2: SNOMED CT ---
  if (currentPane === 2 && stmtIds.length > 0) {
    const stmtId = stmtIds[0];
    p2Select(stmtId);
    document.querySelectorAll(".stmt-item").forEach(s => s.classList.remove("hl-active"));
    const item = document.querySelector(`.stmt-item[data-stmt="${stmtId}"]`);
    if (item) { item.classList.add("hl-active"); item.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
    return;
  }

  // --- Pane 3: FHIR ---
  if (currentPane === 3 && stmtIds.length > 0) {
    // Find the FHIR resource that links to this statement
    const stmtId = stmtIds[0];
    const resIdx = D.fhirBundle.entry.findIndex(en => fhirResourceToStmtId(en.resource) === stmtId);
    if (resIdx >= 0) {
      const card = document.querySelector(`.res-card[data-idx="${resIdx}"]`);
      if (card) {
        card.classList.add("hl-active");
        document.querySelectorAll(".res-card").forEach(c => { if (c !== card) c.classList.remove("hl-active"); });
        card.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
      return;
    }
    // Fall through to pane 1 if no FHIR resource found
  }

  // --- Pane 4: Timeline ---
  if (currentPane === 4 && stmtIds.length > 0) {
    const stmtId = stmtIds[0];
    p4Sel = stmtId;
    renderPane4();
    return;
  }

  // --- Default: Pane 1 (ICD-10) ---
  if (code) {
    if (currentPane !== 1) showPane(1);
    let card = document.querySelector(`.code-card[data-code="${code}"]`);
    if (!card) {
      const isCmCode = D.icd10cm.some(c => c.code === code);
      const isPcsCode = D.icd10pcs.some(c => c.code === code);
      if (isCmCode && p1Tab !== "cm") { p1Tab = "cm"; renderP1Codes(); }
      else if (isPcsCode && p1Tab !== "pcs") { p1Tab = "pcs"; renderP1Codes(); }
      card = document.querySelector(`.code-card[data-code="${code}"]`);
    }
    if (card) {
      card.classList.add("open");
      card.classList.add("hl-active");
      document.querySelectorAll(".code-card").forEach(c => { if (c !== card) c.classList.remove("hl-active"); });
      p1ActiveCode = code;
      p1HighlightSpans(code);
      const codesEl = $("p1-codes");
      const rect = card.getBoundingClientRect();
      const codesRect = codesEl.getBoundingClientRect();
      codesEl.scrollTo({ top: codesEl.scrollTop + rect.top - codesRect.top - 20, behavior: "smooth" });
    }
    return;
  }

  // SNOMED-only span clicked from a non-pane-2 context → switch to pane 2
  if (stmtSpan && stmtIds.length > 0) {
    const stmtId = stmtIds[0];
    showPane(2);
    p2Select(stmtId);
    document.querySelectorAll(".stmt-item").forEach(s => s.classList.remove("hl-active"));
    const item = document.querySelector(`.stmt-item[data-stmt="${stmtId}"]`);
    if (item) { item.classList.add("hl-active"); item.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  }
});

// Hover highlight (without scroll)
document.addEventListener("mouseover", e => {
  if (currentPane !== 1) return;
  const card = e.target.closest(".code-card");
  if (card && card.dataset.code) {
    p1HighlightSpans(card.dataset.code);
  }
});
document.addEventListener("mouseout", e => {
  if (currentPane !== 1) return;
  if (e.target.closest(".code-card") && p1ActiveCode) {
    p1HighlightSpans(p1ActiveCode);
  }
});

/* ==========================================================================
   Pane 2 — SNOMED CT: concept expression + subsumption + concept maps.
   ========================================================================== */
let p2Sel = "cancer";
let p2Subtab = "downstream";

function renderPane2() {
  renderP2List();
  renderP2Detail();
  renderP2Sub();
}

function renderP2Sub() {
  if (p2Subtab === "maps") renderP2Maps();
  else renderP2Downstream();
}

function renderP2List() {
  const K = D.timeline.KIND;
  const kc = k => dark ? K[k].dk : K[k].c;
  $("p2-list").innerHTML = `<div class="section-label">SNOMED CT Statements</div>` +
    D.statements.map(s => {
      const visible = s.sub === "patient" || s.pol !== "neg";
      if (!visible && false) return "";
      const c = kc(s.k);
      const active = s.id === p2Sel;
      return `<div class="stmt-item ${active?"active":""}" data-stmt="${s.id}" onclick="p2Select('${s.id}')">
        <span class="sw" style="background:${s.pol==="neg"?"transparent":c};border:1.5px solid ${c}"></span>
        <div><div class="si-name">${esc(s.sh||s.t)}</div>
        <div class="si-code">${s.codeSystem||"SNOMED"} ${esc(s.code)}</div></div>
      </div>`;
    }).join("");
}

function p2Select(id) {
  p2Sel = id;
  renderP2List();
  renderP2Detail();
  // Highlight + scroll the note to this statement's evidence
  if (id) scrollToNoteEvidence(id);
}

function renderP2Detail() {
  const s = D.statements.find(o => o.id === p2Sel);
  if (!s) return;

  // Show all det fields EXCEPT non-SNOMED-CT ones (lab values, medication
  // order details, clinical annotations, NLP temporality, external codes).
  // This includes Subject relationship context, Finding context (negation/
  // verification), Clinical course, Grade, Stage, Biomarker — all genuine
  // SNOMED CT concept model or post-coordination attributes.
  const NON_SNOMED = new Set([
    "Value", "Reference", "Reference high", "Interpretation", // lab observation values
    "Strength", "Frequency", "Duration", "Status", "Change",   // medication order details
    "Problem", "Basis",                                          // clinical annotation / reasoning
    "ICD-O-3",                                                   // external coding system
    "Time", "Interval",                                          // NLP temporality
  ]);
  const snomedDets = Object.entries(s.det).filter(([k]) => !NON_SNOMED.has(k));

  // Three meaningful relationship categories, colour-coded:
  //   is-a (green)    — hierarchical / taxonomic backbone
  //   structural(blue)— what the concept IS (anatomy, morphology, method, device)
  //   contextual(amber)— clinical context (who, confirmed/refuted, course, severity)
  const STRUCTURAL = new Set([
    "Finding site", "Topography", "Associated morphology", "Morphology",
    "Pathological process", "Causative agent", "Method",
    "Site", "Procedure site", "Direct device", "Device",
    "Intent", "Route", "Associated finding",
  ]);
  const relClass = k => STRUCTURAL.has(k) ? "rel-structural" : "rel-contextual";

  // SNOMED browser-style concept header
  let html = `<div class="snomed-concept-header">
    <div class="snomed-id">${esc(s.code)}</div>
    <div class="snomed-pt">${esc(s.t)}</div>
    <div class="snomed-fsn">${esc(s.fsn || s.t)}</div>
  </div>`;

  // Unified relationships section — is-a breadcrumb + attribute rows,
  // all in the same visual container
  html += `<div class="det-label snomed-label">Relationships</div>
    <div class="rel-container">`;

  // is-a as breadcrumb path
  if (s.parents && s.parents.length) {
    html += `<div class="rel-row rel-is-a">
      <span class="rel-type is-a-pill">is-a</span>
      <span class="rel-arrow">→</span>
      <span class="rel-value">`;
    s.parents.forEach((p, i) => {
      html += `${i > 0 ? '<span class="rel-sep"> → </span>' : ''}${esc(p.display)}`;
    });
    html += `<span class="rel-sep"> → </span><span class="rel-self">${esc(s.t)}</span></span></div>`;
  }

  // Concept model attribute relationships
  snomedDets.forEach(([k, v]) => {
    html += `<div class="rel-row">
      <span class="rel-type ${relClass(k)}">${esc(k)}</span>
      <span class="rel-arrow">→</span>
      <span class="rel-value">${esc(v)}</span>
    </div>`;
  });

  html += `</div>`;

  $("p2-detail").innerHTML = html;
}

document.addEventListener("click", e => {
  if (e.target.matches(".p2-subtab")) {
    p2Subtab = e.target.dataset.subtab;
    document.querySelectorAll(".p2-subtab").forEach(t => t.classList.toggle("active", t.dataset.subtab === p2Subtab));
    renderP2Sub();
  }
});

let p2TaskIdx = 0;

function renderP2Downstream() {
  const tasks = D.downstreamTasks;
  const t = tasks[p2TaskIdx];
  if (!t) return;

  let html = `<div class="task-carousel">
    <div class="task-nav">
      <div class="task-cap-badge">${t.icon} ${esc(t.capability)}</div>
      <div class="task-nav-btns">
        <button class="task-btn" onclick="p2TaskPrev()" ${p2TaskIdx === 0 ? "disabled" : ""}>←</button>
        <span class="task-counter">${p2TaskIdx + 1} / ${tasks.length}</span>
        <button class="task-btn" onclick="p2TaskNext()" ${p2TaskIdx === tasks.length - 1 ? "disabled" : ""}>→</button>
      </div>
    </div>`;

  // Headline — large, presentation-friendly
  html += `<div class="task-hero">
    <div class="task-query-big">${esc(t.headline || t.capability)}</div>
  </div>`;

  // Cohort identification: multi-criteria filters using different relationship types
  if (t.filters) {
    html += `<div class="task-trial-context">${esc(t.trialContext)}</div>`;
    t.filters.forEach(f => {
      const stmt = f.stmtId ? D.statements.find(s => s.id === f.stmtId) : null;
      const relClass = f.rel.includes("negation") || f.rel.includes("Finding context") ? "rel-contextual" : f.rel.includes("attribute") || f.rel.includes("Finding site") ? "rel-structural" : "is-a-pill";
      html += `<div class="task-filter">
        <span class="filter-rel ${relClass}">${esc(f.rel)}</span>
        <span class="filter-crit">${esc(f.crit)}</span>
        <span class="filter-arrow">→</span>
        <span class="filter-match">✓ ${esc(f.match)}</span>
      </div>`;
    });
    html += `<div class="task-filter-result">Patient found — all three criteria matched</div>`;
  }

  // Post-coordination: expression with therapy context
  if (t.expression) {
    if (t.therapyContext) html += `<div class="task-trial-context">${esc(t.therapyContext)}</div>`;
    html += `<div class="task-expr">
      <div class="det-label snomed-label">Post-coordinated expression</div>`;
    t.expression.forEach(e => {
      if (e.concept) {
        html += `<div class="pc-concept"><span class="mc">${esc(e.concept)}</span> ${esc(e.display)}</div>`;
      } else {
        const cls = e.isDecision ? " pc-decision" : "";
        html += `<div class="pc-attr${cls}"><span class="pc-attr-key">${esc(e.attr)}:</span> <span class="mc">${e.value ? esc(e.value) : ""}</span> ${e.valueDisplay ? esc(e.valueDisplay) : esc(e.value || "")}</div>`;
      }
    });
    html += `</div>`;
  }

  // Value set: ADR prevention flow + value set grid
  if (t.flow) {
    if (t.adrContext) html += `<div class="task-trial-context">${esc(t.adrContext)}</div>`;
    html += `<div class="task-flow">`;
    t.flow.forEach((f, i) => {
      html += `<div class="flow-step${f.isAlert ? " flow-alert" : ""}">
        <span class="flow-num">${i + 1}</span>
        <span class="flow-text"><strong>${esc(f.step)}</strong> — ${esc(f.detail)}</span>
      </div>`;
    });
    html += `</div>`;
    if (t.expanded) {
      html += `<div class="task-refset">Value set: all descendants of 373873005 |Penicillin antibacterial|</div>
      <div class="task-vs-grid">`;
      t.expanded.forEach(e => {
        const cls = e.isPatient ? " matched" : e.isAlert ? " alert" : "";
        const suffix = e.isPatient ? " ← caused ADR" : e.isAlert ? " ← blocked" : "";
        html += `<div class="task-vs-item${cls}"><span class="mc">${esc(e.code)}</span> ${esc(e.display)}${suffix}</div>`;
      });
      html += `</div>`;
    }
  }

  // EHDS: pseudonymisation — EHR record (PII) vs research record (concepts only)
  if (t.piiRecord && t.researchRecord) {
    html += `<div class="task-trial-context">${esc(t.studyContext)}</div>`;
    html += `<div class="task-pseudonymize">
      <div class="pseudo-col pseudo-pii">
        <div class="pseudo-title">${esc(t.piiRecord.title)}</div>`;
    t.piiRecord.fields.forEach(f => {
      html += `<div class="pseudo-field"><span class="pseudo-label">${esc(f.label)}</span><span class="pseudo-value">${esc(f.value)}</span></div>`;
    });
    html += `</div>
      <div class="pseudo-arrow">→</div>
      <div class="pseudo-col pseudo-research">
        <div class="pseudo-title">${esc(t.researchRecord.title)}</div>`;
    t.researchRecord.fields.forEach(f => {
      html += `<div class="pseudo-field"><span class="pseudo-label">${esc(f.label)}</span><span class="pseudo-value">${esc(f.value)}</span></div>`;
    });
    html += `</div>
    </div>`;
    if (t.conclusion) html += `<div class="task-filter-result">${esc(t.conclusion)}</div>`;
  }

  html += `</div>`;
  $("p2-subcontent").innerHTML = html;
  requestAnimationFrame(() => $("p2-subcontent").querySelectorAll(".reveal").forEach(el => el.classList.add("show")));
}

function p2TaskNext() {
  if (p2TaskIdx < D.downstreamTasks.length - 1) { p2TaskIdx++; renderP2Downstream(); }
}
function p2TaskPrev() {
  if (p2TaskIdx > 0) { p2TaskIdx--; renderP2Downstream(); }
}

function renderP2Maps() {
  const m = D.maps;
  let html = `<div class="section-label">Cross-language interoperability &amp; concept maps</div>
    <table class="map-table"><thead><tr>
      <th>SNOMED CT</th><th>Snomed-CT-DK</th><th>ICD-11</th><th>ICD-10</th><th>MedDRA</th><th>LOINC</th><th>RxNorm</th>
    </tr></thead><tbody>`;
  m.forEach(row => {
    const cell = obj => obj ? `<span class="mc">${obj.code}</span><br><span style="font-size:11px;color:var(--ink-2)">${esc(obj.display)}</span>` : `<span style="color:var(--ink-3)">—</span>`;
    const dkCell = row.dk ? `<span style="font-size:12px;font-weight:500">${esc(row.dk.display)}</span>` : `<span style="color:var(--ink-3)">—</span>`;
    // Merge ICD-10-CM and ICD-10-DK into one cell; prefer DK text (Danish conference)
    const icd10 = row.icd10dk || row.icd10cm;
    const icd10Cell = icd10 ? `<span class="mc">${icd10.code}</span><br><span style="font-size:11px;color:var(--ink-2)">${esc(icd10.display)}</span>` : `<span style="color:var(--ink-3)">—</span>`;
    html += `<tr>
      <td>${cell(row.snomed)}${row.snomed.system?`<span class="sys-tag">${row.snomed.system}</span>`:"<span class='sys-tag'>SNOMED CT</span>"}</td>
      <td>${dkCell}<span class="sys-tag">DA</span></td>
      <td>${cell(row.icd11)}${row.icd11?"<span class='sys-tag'>ICD-11</span>":""}</td>
      <td>${icd10Cell}<span class="sys-tag">${row.icd10dk?"DK":"CM"}</span></td>
      <td>${cell(row.meddra)}${row.meddra?"<span class='sys-tag'>MedDRA</span>":""}</td>
      <td>${cell(row.loinc)}${row.loinc?"<span class='sys-tag'>LOINC</span>":""}</td>
      <td>${cell(row.rxnorm)}${row.rxnorm?"<span class='sys-tag'>RxNorm</span>":""}</td>
    </tr>${row.note?`<tr><td colspan="7" style="font-size:10px;color:var(--ink-3);padding:0 10px 4px">⚠ ${esc(row.note)}</td></tr>`:""}`;
  });
  html += `</tbody></table>
    <div style="margin-top:12px;padding:10px 14px;background:var(--accent-bg);border-radius:6px;font-size:12px;color:var(--accent);line-height:1.5">
      <strong>SNOMED CT is the migration anchor.</strong> When Denmark moves from ICD-10-DK to ICD-11, you don't re-code the patient — you re-map the SNOMED CT concept. The same concept <code>93761005</code> means "Colon adenocarcinoma" in English, "Adenocarcinom i sigtarmen" in Danish, maps to ICD-10 <code>C18.7</code> today and ICD-11 <code>2B62.1</code> tomorrow. One concept, many representations — enabling cross-border data exchange (EHDS) without re-coding.
    </div>`;
  $("p2-subcontent").innerHTML = html;
}

/* ==========================================================================
   Pane 3 — FHIR: sub-tabs (Resources / JSON)
   ========================================================================== */
let p3Subtab = "resources";

function renderPane3() {
  // Render JSON into the JSON pane
  const json = JSON.stringify(D.fhirBundle, null, 2);
  $("p3-json-pane").innerHTML = `<div class="p3-json-view">${syntaxHighlight(json)}</div>`;

  // Render resource cards + downstream tasks into the resources pane
  let html = `<div class="section-label">FHIR Bundle · ${D.fhirBundle.entry.length} resources</div>`;
  D.fhirBundle.entry.forEach((e, i) => {
    const r = e.resource;
    const type = r.resourceType;
    const code = r.code?.coding?.[0]?.display || r.name?.[0]?.family || r.relationship?.coding?.[0]?.display || r.valueQuantity?.value || "—";
    let fields = [];
    if (r.subject) fields.push(["subject", r.subject.reference.replace("urn:uuid:","")]);
    if (r.patient) fields.push(["patient", r.patient.reference.replace("urn:uuid:","")]);
    if (r.clinicalStatus) fields.push(["clinicalStatus", r.clinicalStatus.coding[0].code]);
    if (r.verificationStatus) fields.push(["verification", r.verificationStatus.coding[0].code]);
    if (r.onsetDateTime) fields.push(["onset", r.onsetDateTime]);
    if (r.performedDateTime) fields.push(["performed", r.performedDateTime]);
    if (r.effectiveDateTime) fields.push(["effective", r.effectiveDateTime]);
    if (r.bodySite) fields.push(["bodySite", r.bodySite[0].coding[0].display]);
    if (r.valueQuantity) fields.push(["value", `${r.valueQuantity.value} ${r.valueQuantity.unit}`]);
    if (r.reaction) fields.push(["reaction", r.reaction[0].manifestation[0].coding[0].display + " → " + r.reaction[0].abatement]);

    // Link to SNOMED statement for evidence highlighting
    const stmtId = fhirResourceToStmtId(r);
    const clickAttr = stmtId ? `onclick="p3CardClick(${i},'${stmtId}')" style="cursor:pointer"` : "";

    html += `<div class="res-card reveal delay-${Math.min(i,4)}" data-idx="${i}" ${clickAttr}>
      <div class="res-head"><span class="res-type">${type}</span><span class="res-code">${esc(code)}</span></div>
      <dl class="res-fields">${fields.map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
    </div>`;
  });

  // Downstream clinical tasks — enabled by FHIR resources
  html += renderP3Downstream();

  $("p3-resources-pane").innerHTML = html;

  // Trigger reveals
  requestAnimationFrame(() => {
    $("p3-resources-pane").querySelectorAll(".reveal").forEach(el => el.classList.add("show"));
  });
}

// Sub-tab switching for pane 3
document.addEventListener("click", e => {
  if (e.target.matches(".p3-subtab")) {
    p3Subtab = e.target.dataset.subtab;
    document.querySelectorAll(".p3-subtab").forEach(t => t.classList.toggle("active", t.dataset.subtab === p3Subtab));
    $("p3-resources-pane").style.display = p3Subtab === "resources" ? "" : "none";
    $("p3-json-pane").style.display = p3Subtab === "json" ? "" : "none";
  }
});

// Downstream clinical tasks enabled by FHIR resources
function renderP3Downstream() {
  const d = D.downstream;
  let html = `<div class="ds-section-label">Clinical applications enabled by FHIR resources</div><div class="ds-grid">`;

  const a = d.adrAlert;
  html += `<div class="ds-card hero reveal">
    <div class="ds-title">⚠ ${esc(a.title)} <span class="ds-badge fired">fired</span></div>
    <div class="ds-explain">${esc(a.what)}</div>
    <dl class="kv">
      <dt>Drug</dt><dd>${esc(a.drug.display)} <span class="code-pill">RxNorm ${a.drug.rxnorm}</span> <span class="code-pill">SNOMED ${a.drug.snomed}</span></dd>
      <dt>Reaction</dt><dd>${esc(a.reaction.display)} <span class="code-pill">MedDRA ${a.reaction.meddra}</span> <span class="code-pill">SNOMED ${a.reaction.snomed}</span></dd>
      <dt>Causality</dt><dd>${esc(a.causality)} (${a.severity})</dd>
      <dt>Onset</dt><dd>${esc(a.onset)}</dd>
      <dt>Abatement</dt><dd>${esc(a.abatement)}</dd>
      <dt>Action</dt><dd>${esc(a.action)} → <span class="code-pill">FHIR ${a.fhirResource}</span></dd>
    </dl>
    <ul class="ds-criteria">${a.criteria.map(c => `<li>${esc(c)}</li>`).join("")}</ul>
  </div>`;

  const c = d.cdsRule;
  html += `<div class="ds-card reveal delay-1">
    <div class="ds-title">⚙ ${esc(c.title)} <span class="ds-badge ${c.fired?"fired":"info"}">${c.fired?"fired":"—"}</span></div>
    <div class="ds-explain">${esc(c.what)}</div>
    <dl class="kv">
      <dt>Rule</dt><dd>${esc(c.rule)}</dd>
      <dt>Trigger</dt><dd>${esc(c.trigger)}</dd>
      <dt>Rec</dt><dd>${esc(c.recommendation)}</dd>
    </dl>
  </div>`;

  const q = d.qualityMeasure;
  html += `<div class="ds-card reveal delay-2">
    <div class="ds-title">📊 ${esc(q.title)} <span class="ds-badge ok">${q.status}</span></div>
    <div class="ds-explain">${esc(q.what)}</div>
    <dl class="kv">
      <dt>Measure</dt><dd>${esc(q.measure)}</dd>
      <dt>Captured</dt><dd>${q.captured.map(x=>esc(x)).join(" · ")}</dd>
      <dt>Complete</dt><dd>${q.completeness}</dd>
    </dl>
  </div>`;

  const p = d.phenotype;
  html += `<div class="ds-card reveal delay-3">
    <div class="ds-title">🔬 ${esc(p.title)} <span class="ds-badge ${p.match?"ok":"info"}">${p.match?"match":"—"}</span></div>
    <div class="ds-explain">${esc(p.what)}</div>
    <dl class="kv">
      <dt>Cohort</dt><dd>${esc(p.cohort)}</dd>
      <dt>Criteria</dt><dd>${p.criteria.map(x=>esc(x)).join(" · ")}</dd>
      <dt>Eligible</dt><dd>${p.eligible ? "✓ yes" : "✗ no"}</dd>
    </dl>
  </div>`;

  html += `</div>`;
  return html;
}

function syntaxHighlight(json) {
  return esc(json)
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+\.?\d*([eE][+-]?\d+)?)/g, m => {
      let cls = "j-num";
      if (/^"/.test(m)) cls = /:$/.test(m) ? "j-key" : "j-string";
      else if (/true|false/.test(m)) cls = "j-bool";
      else if (/null/.test(m)) cls = "j-null";
      return `<span class="${cls}">${m}</span>`;
    });
}

// Click a FHIR resource card → highlight the card + scroll the note to evidence
function p3CardClick(idx, stmtId) {
  // Highlight this card
  document.querySelectorAll(".res-card").forEach(c => c.classList.remove("hl-active"));
  const card = document.querySelector(`.res-card[data-idx="${idx}"]`);
  if (card) card.classList.add("hl-active");
  // Scroll the note to the evidence
  scrollToNoteEvidence(stmtId);
}

/* ==========================================================================
   Pane 4 — Timeline (ported from patient_graph_explorer_5)
   ========================================================================== */
const W = 1180, LH = 76, TOP = 64, UNDX = 40;
let H = 460;
let p4Sel = "cancer";
let p4OnK = {}, p4OnF = {};

function renderPane4() {
  const T = D.timeline;
  const kinds = Object.keys(T.KIND);
  const fams = Object.keys(T.FAM);
  if (Object.keys(p4OnK).length === 0) kinds.forEach(k => p4OnK[k] = true);
  if (Object.keys(p4OnF).length === 0) fams.forEach(f => p4OnF[f] = true);

  const kc = k => dark ? T.KIND[k].dk : T.KIND[k].c;
  const fc = f => dark ? T.FAM[f].dk : T.FAM[f].c;

  // Render kind/link bars
  $("p4-kindbar").innerHTML = kinds.map(k => {
    const n = D.statements.filter(s => s.k === k).length;
    if (!n) return "";
    return `<button data-k="${k}" class="${p4OnK[k]?"":"off"}"><span class="sw" style="background:${p4OnK[k]?kc(k):"transparent"};border:1px solid ${kc(k)}"></span>${T.KIND[k].l}<span class="count">${n}</span></button>`;
  }).join("");
  $("p4-linkbar").innerHTML = fams.map(f => {
    const n = D.links.filter(l => T.LT[l.ty] === f).length;
    return `<button data-f="${f}" class="${p4OnF[f]?"":"off"}"><span class="swl" style="border-top-color:${p4OnF[f]?fc(f):cssv("--ink-3")};border-top-style:${T.FAM[f].dash?"dashed":"solid"}"></span>${T.FAM[f].l}<span class="count">${n}</span></button>`;
  }).join("");
  $("p4-kindbar").querySelectorAll("button").forEach(b => b.onclick = () => { p4OnK[b.dataset.k] = !p4OnK[b.dataset.k]; renderPane4(); });
  $("p4-linkbar").querySelectorAll("button").forEach(b => b.onclick = () => { p4OnF[b.dataset.f] = !p4OnF[b.dataset.f]; renderPane4(); });

  // Layout + render
  p4Render(kc, fc);
  p4Detail();
}

function p4Visible(s) {
  return p4OnK[s.k] && (s.sub === "patient" || true) && (s.pol === "pos" || true);
}

function p4Layout() {
  const T = D.timeline;
  const rows = D.statements.filter(p4Visible);
  const und = rows.filter(s => !s.d), dated = rows.filter(s => s.d);
  let div = 0;
  if (und.length) {
    const mw = Math.max(...und.map(s => Math.min(s.t.length * 6.35, (s.sh||"").length * 6.35 + 40)));
    div = Math.min(250, UNDX + 12 + mw + 18);
  }
  const L0 = und.length ? div + 34 : 56;
  const cols = [...new Set(dated.map(s => s.d))].sort();
  const step = (W - L0 - 40) / Math.max(1, cols.length - 1);
  const X = {}; cols.forEach((d, i) => X[d] = L0 + i * step);
  const xOf = s => s.d ? X[s.d] : UNDX;
  const kinds = Object.keys(T.KIND).filter(k => rows.some(s => s.k === k));
  H = TOP + kinds.length * LH + 34;
  const yOf = k => TOP + kinds.indexOf(k) * LH + LH / 2;

  const P = {}, boxes = [];
  rows.forEach(s => {
    const x = xOf(s), y = yOf(s.k);
    P[s.id] = { x, y };
    boxes.push({ own: s.id, kind: "dot", x1: x - 9, x2: x + 9, y1: y - 9, y2: y + 9 });
  });

  const wid = t => t.length * 6.35;
  const hit = (a, b) => !(a.x2 < b.x1 - 1 || b.x2 < a.x1 - 1 || a.y2 < b.y1 - 1 || b.y2 < a.y1 - 1);
  const CANDS = [{r:1,dy:5},{r:1,dy:-18},{r:0,dy:5},{r:0,dy:-18},{r:1,dy:24},{r:0,dy:24},{r:1,dy:-34},{r:0,dy:-34},{r:1,dy:40},{r:0,dy:40}];

  rows.slice().sort((a,b) => xOf(a) - xOf(b) || a.k.localeCompare(b.k)).forEach(s => {
    const p = P[s.id];
    let done = null;
    for (const text of [s.sh || s.t, s.sh]) {
      if (!text) continue;
      const w = wid(text);
      for (const c of CANDS) {
        const start = c.r ? p.x + 10 : p.x - 10 - w;
        const b = { x1: start - 3, x2: start + w + 3, y1: p.y + c.dy - 11, y2: p.y + c.dy + 5 };
        if (b.x1 < 14 || b.x2 > W - 14) continue;
        if (boxes.some(o => o.own !== s.id && hit(b, o))) continue;
        done = { text, w, dy: c.dy, right: !!c.r, box: b };
        break;
      }
      if (done) break;
    }
    if (!done) {
      const text = s.sh || s.t, w = wid(text), start = p.x + 10;
      done = { text, w, dy: 5, right: true, box: { x1: start - 3, x2: start + w + 3, y1: p.y - 6, y2: p.y + 10 } };
    }
    Object.assign(P[s.id], { label: done.text, w: done.w, dy: done.dy, right: done.right });
    boxes.push({ own: s.id, kind: "label", ...done.box });
  });

  return { rows, und, dated, cols, X, xOf, kinds, P, boxes, div };
}

function p4Render(kc, fc) {
  const T = D.timeline;
  const { rows, und, cols, X, xOf, kinds, P, boxes, div } = p4Layout();
  const rule = cssv("--rule"), rule2 = cssv("--rule-2"), ink = cssv("--ink"), ink3 = cssv("--ink-3"), panel = cssv("--panel");
  const nm = s => s.sh || s.t;
  let g = "";

  kinds.forEach((k, li) => {
    const y = TOP + li * LH + LH / 2;
    g += `<line x1="26" y1="${y}" x2="${W-14}" y2="${y}" stroke="${rule}" stroke-width="1"/>`;
    g += `<text x="26" y="${y-13}" font-size="10.5" font-family="${cssv("--mono")}" letter-spacing="0.9" fill="${ink3}">${T.KIND[k].l.toUpperCase()}</text>`;
  });

  if (und.length) {
    g += `<line x1="${div}" y1="${TOP-18}" x2="${div}" y2="${H-26}" stroke="${rule2}" stroke-width="1" stroke-dasharray="3 4"/>`;
    g += `<text x="${UNDX-4}" y="${H-10}" font-size="10.5" font-family="${cssv("--mono")}" fill="${ink3}" text-anchor="start">undated</text>`;
  }

  cols.forEach(d => {
    const s = rows.find(o => o.d === d);
    g += `<line x1="${X[d]}" y1="${H-24}" x2="${X[d]}" y2="${H-20}" stroke="${rule2}" stroke-width="1"/>`;
    g += `<text x="${X[d]}" y="${H-10}" font-size="10.5" font-family="${cssv("--mono")}" fill="${ink3}" text-anchor="middle">${s.dt}</text>`;
  });

  // Links
  const live = D.links.filter(l => p4OnF[T.LT[l.ty]] && P[l.s] && P[l.t]);
  live.forEach(l => {
    const f = T.LT[l.ty], hl = (l.s === p4Sel || l.t === p4Sel);
    const dsp = T.DISP[l.ty] || { v: l.ty, flip: 0 };
    const flow = true, fl = flow && dsp.flip;
    const p = fl ? P[l.t] : P[l.s], q = fl ? P[l.s] : P[l.t];
    const same = Math.abs(p.y - q.y) < 1;
    let d;

    if (same) {
      const cc = { x: (p.x + q.x) / 2, y: p.y - 40 };
      d = `M${p.x} ${p.y} Q${cc.x} ${cc.y} ${q.x} ${q.y}`;
    } else {
      const cy = (p.y + q.y) / 2;
      const x1 = p.x, x2 = q.x;
      const d1 = cy > p.y ? 1 : -1, d2 = q.y > cy ? 1 : -1;
      const r = Math.min(9, Math.abs(x2 - x1) / 2);
      if (Math.abs(x2 - x1) < 16)
        d = `M${p.x} ${p.y} L${x1} ${p.y+d1*11} L${x1} ${cy} L${x2} ${cy} L${x2} ${q.y-d2*11} L${q.x} ${q.y}`;
      else
        d = `M${p.x} ${p.y} L${x1} ${p.y+d1*11} L${x1} ${cy-d1*r} Q${x1} ${cy} ${x1+r} ${cy} L${x2-r} ${cy} Q${x2} ${cy} ${x2} ${cy+d2*r} L${x2} ${q.y-d2*11} L${q.x} ${q.y}`;
    }

    g += `<path d="${d}" fill="none" stroke="${fc(f)}" stroke-width="${hl?2.2:1.3}" stroke-dasharray="${T.FAM[f].dash}" opacity="${hl?1:0.28}" stroke-linejoin="round" marker-end="url(#p4a-${f})"/>`;

    // Label highlighted links
    if (hl) {
      let mx, my;
      if (same) {
        const cc = { x: (p.x + q.x) / 2, y: p.y - 40 };
        mx = cc.x; my = cc.y;
      } else {
        mx = (p.x + q.x) / 2; my = (p.y + q.y) / 2;
      }
      const label = dsp.v || l.ty;
      const bw = label.length * 6.1 + 14;
      g += `<rect x="${mx - bw/2}" y="${my - 8}" width="${bw}" height="17" rx="3" fill="${panel}" stroke="${fc(f)}" stroke-width="0.8"/>`;
      g += `<text x="${mx}" y="${my + 4}" font-size="10.5" font-family="${cssv("--mono")}" text-anchor="middle" fill="${fc(f)}">${esc(label)}</text>`;
    }
  });

  // Nodes
  rows.forEach(s => {
    const p = P[s.id], on = s.id === p4Sel, c = kc(s.k);
    g += `<g class="p4nd" data-id="${s.id}" style="cursor:pointer">`;
    if (on) g += `<circle cx="${p.x}" cy="${p.y}" r="11" fill="${c}" opacity="0.16"/>`;
    g += `<circle cx="${p.x}" cy="${p.y}" r="${on?6.5:5}" fill="${s.pol==="neg"?panel:c}" stroke="${c}" stroke-width="2"/>`;
    g += `<text x="${p.right?p.x+10:p.x-10}" y="${p.y+p.dy}" font-size="12" text-anchor="${p.right?"start":"end"}" font-weight="${on?600:400}" fill="${ink}" paint-order="stroke" stroke="${panel}" stroke-width="3.5" stroke-linejoin="round">${esc(p.label)}</text>`;
    g += `</g>`;
  });

  const defs = Object.keys(T.FAM).map(f => `<marker id="p4a-${f}" markerWidth="7" markerHeight="7" refX="5.6" refY="2.5" orient="auto"><path d="M0,0 L0,5 L6,2.5 z" fill="${fc(f)}"/></marker>`).join("");
  $("p4-svgbox").innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="aspect-ratio:${W}/${H}"><defs>${defs}</defs>${g}</svg>`;
  $("p4-svgbox").querySelectorAll(".p4nd").forEach(n => {
    n.onclick = () => { p4Sel = n.dataset.id; renderPane4(); if (p4Sel) scrollToNoteEvidence(p4Sel); };
  });
}

function p4Detail() {
  const T = D.timeline;
  const s = D.statements.find(o => o.id === p4Sel);
  if (!s) return;
  const kc = k => dark ? T.KIND[k].dk : T.KIND[k].c;
  const c = kc(s.k);
  const out = D.links.filter(l => l.s === p4Sel);
  const inc = D.links.filter(l => l.t === p4Sel);

  // Separate SNOMED CT concept model attributes from NLP-extracted attributes
  const SNOMED_ATTRS = new Set([
    "Finding site", "Associated morphology", "Pathological process",
    "Causative agent", "Severity", "Method", "Procedure site",
    "Direct device", "Finding context", "Temporal context",
    "Associated finding", "Has interpretation",
  ]);
  const snomedDets = [], nlpDets = [];
  Object.entries(s.det).forEach(([k, v]) => {
    if (SNOMED_ATTRS.has(k)) snomedDets.push([k, v]);
    else nlpDets.push([k, v]);
  });

  let html = `<h2 style="font-size:14px;font-weight:600;margin:0 0 10px">Clinical Statement</h2>
    <div style="display:flex;align-items:center;gap:9px;margin-bottom:9px">
      <span class="sw" style="width:11px;height:11px;border-radius:50%;background:${s.pol==="neg"?"transparent":c};border:2px solid ${c}"></span>
      <span style="font-size:15px;font-weight:600">${esc(s.t)}</span>
      <span style="font-family:var(--mono);font-size:11px;color:var(--ink-3)">${esc(s.code)}</span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">
      <span class="tag">${T.KIND[s.k].l}</span>
      ${s.pol==="neg"?`<span class="tag" style="background:var(--bad-bg);color:var(--bad)">negated</span>`:""}
      <span class="tag">${s.dt}</span>
      <span class="tag">${s.ast}</span>
      <span class="tag">${s.u}</span>
    </div>`;

  // NLP-extracted attributes (this is the reasoning layer)
  if (nlpDets.length) {
    html += `<div class="det-label nlp-label">Extracted from note (NLP)</div>
    <dl class="kv">${nlpDets.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`;
  }
  // SNOMED CT concept model attributes
  if (snomedDets.length) {
    html += `<div class="det-label snomed-label">SNOMED CT concept model</div>
    <dl class="kv">${snomedDets.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`;
  }

  html += `<div class="quote">${esc(s.src)}</div>`;

  if (out.length) {
    html += `<div class="det-label nlp-label">Reasoning graph — outgoing</div>`;
    out.forEach(l => {
      const f = T.LT[l.ty];
      const fc2 = dark ? T.FAM[f].dk : T.FAM[f].c;
      const o = D.statements.find(x => x.id === l.t);
      html += `<div class="edge"><span class="ename" style="color:${fc2}">${l.ty}</span> → <span style="font-size:12px">${esc(o.t)}</span> <span class="tag">${l.c}</span><div class="enote">${esc(l.n)}</div></div>`;
    });
  }
  if (inc.length) {
    html += `<div class="det-label nlp-label">Reasoning graph — incoming</div>`;
    inc.forEach(l => {
      const f = T.LT[l.ty];
      const fc2 = dark ? T.FAM[f].dk : T.FAM[f].c;
      const o = D.statements.find(x => x.id === l.s);
      html += `<div class="edge"><span class="ename" style="color:${fc2}">${l.ty}</span> ← <span style="font-size:12px">${esc(o.t)}</span> <span class="tag">${l.c}</span><div class="enote">${esc(l.n)}</div></div>`;
    });
  }
  $("p4-detail").innerHTML = html;
}

function p4ToggleFull(on) {
  const stage = document.querySelector("#pane-4 .stage");
  on = on ?? !stage.classList.contains("full");
  stage.classList.toggle("full", on);
  $("p4-full").textContent = on ? "✕ Close" : "⛶ Full view";
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") p4ToggleFull(false);
});

/* ==========================================================================
   Init
   ========================================================================== */
if (matchMedia("(prefers-color-scheme: dark)").matches) {
  dark = true;
  document.documentElement.dataset.theme = "dark";
}
renderNote();   // Render the shared clinical note panel (visible across all panes)
showPane(0);
