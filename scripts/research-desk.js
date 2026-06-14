(function () {
  const research = window.CHEMVAULT_RESEARCH;
  const chem = window.CHEMVAULT_DATA;
  const state = {
    activeCase: null,
    reviewChecks: new Set()
  };

  document.addEventListener("DOMContentLoaded", initResearchDesk);

  function initResearchDesk() {
    if (!research || !chem) return;
    populateCaseSelector();
    wireResearchActions();
    selectCase(new URLSearchParams(location.search).get("case") || research.caseStudies[0].id);
    renderReviewChecklist();
  }

  function populateCaseSelector() {
    const select = $("#caseStudySelect");
    select.innerHTML = research.caseStudies.map((item) => `<option value="${item.id}">${escapeHTML(item.title)}</option>`).join("");
    select.addEventListener("change", () => selectCase(select.value));
    $("#citationStyle").addEventListener("change", renderCitationWindow);
  }

  function wireResearchActions() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-research-action]");
      if (!button) return;
      const action = button.dataset.researchAction;
      const handlers = {
        "toggle-window": () => toggleWindow(button.dataset.windowTarget),
        "focus-all": restoreWindows,
        "save-note": saveAcademicNote
      };
      handlers[action]?.();
    });
  }

  function selectCase(id) {
    const item = research.caseStudies.find((caseFile) => caseFile.id === id);
    if (!item) return;
    state.activeCase = item;
    updateQueryParam("case", id);
    state.reviewChecks.clear();
    $("#caseStudySelect").value = id;
    $("#caseTitle").textContent = item.title;
    renderResearchStatus();
    renderCaseWindow();
    renderEvidenceWindow();
    renderArgumentWindow();
    renderSpectralWindow();
    renderCitationWindow();
    renderReportDraft();
    renderReviewChecklist();
  }

  function renderResearchStatus() {
    const item = state.activeCase;
    $("#researchStatus").innerHTML = `
      <div><span class="label">Discipline</span><strong>${escapeHTML(item.discipline)}</strong></div>
      <div><span class="label">Confidence</span><strong>${item.confidence}%</strong></div>
      <div><span class="label">Evidence items</span><strong>${item.observations.length}</strong></div>
      <div><span class="label">Source links</span><strong>${item.sourceRefs.length}</strong></div>
    `;
  }

  function renderCaseWindow() {
    const item = state.activeCase;
    $("#caseWindow").innerHTML = `
      <div class="case-question">
        <span class="label">Research question</span>
        <p>${escapeHTML(item.question)}</p>
      </div>
      <div class="claim-card">
        <span class="label">Working thesis</span>
        <strong>${escapeHTML(item.thesis)}</strong>
      </div>
      <div class="mini-source-row">
        ${getSources(item.sourceRefs).map((source) => `<a href="${escapeHTML(source.url)}" target="_blank" rel="noreferrer">${escapeHTML(source.short)}</a>`).join("")}
      </div>
    `;
  }

  function renderEvidenceWindow() {
    const item = state.activeCase;
    $("#evidenceWindow").innerHTML = `
      <div class="evidence-table">
        ${item.observations.map((obs) => `
          <article>
            <div class="evidence-meta">
              <span>${escapeHTML(obs.type)}</span>
              <strong>Level ${escapeHTML(obs.level)}</strong>
            </div>
            <p><strong>Observation:</strong> ${escapeHTML(obs.observation)}</p>
            <p><strong>Inference:</strong> ${escapeHTML(obs.inference)}</p>
            <p><strong>Limitation:</strong> ${escapeHTML(obs.limitation)}</p>
          </article>
        `).join("")}
      </div>
    `;
  }

  function renderArgumentWindow() {
    const argument = state.activeCase.argument;
    $("#argumentWindow").innerHTML = `
      <div class="argument-stack">
        ${argumentBlock("Claim", argument.claim)}
        ${argumentBlock("Warrant", argument.warrant)}
        ${argumentBlock("Counterpoint", argument.counter)}
        ${argumentBlock("Next test", argument.nextTest)}
      </div>
    `;
  }

  function renderSpectralWindow() {
    const item = state.activeCase;
    const spectral = item.observations.filter((obs) => /IR|NMR|MS|spect/i.test(obs.type));
    const levels = item.observations.reduce((acc, obs) => {
      acc[obs.level] = (acc[obs.level] || 0) + 1;
      return acc;
    }, {});
    $("#spectralWindow").innerHTML = `
      <div class="confidence-meter" aria-label="Case confidence">
        <span style="width: ${item.confidence}%"></span>
      </div>
      <div class="score-grid research-score">
        <div><strong>${levels.A || 0}</strong><span>level A</span></div>
        <div><strong>${levels.C || 0}</strong><span>level C</span></div>
        <div><strong>${levels.D || 0}</strong><span>level D</span></div>
      </div>
      <div class="spectral-list">
        ${(spectral.length ? spectral : item.observations).map((obs) => `
          <div>
            <span class="tag">${escapeHTML(obs.type)}</span>
            <p>${escapeHTML(obs.observation)}</p>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderCitationWindow() {
    const style = $("#citationStyle")?.value || "harvard";
    const sources = getSources(state.activeCase.sourceRefs);
    $("#citationWindow").innerHTML = `
      <div class="citation-list">
        ${sources.map((source, index) => `<p>${formatCitation(source, index + 1, style)}</p>`).join("")}
      </div>
    `;
  }

  function renderReportDraft() {
    const item = state.activeCase;
    $("#reportDraft").value = [
      `Title: ${item.title}`,
      `Research question: ${item.question}`,
      "",
      `Aim: ${item.report.aim}`,
      `Method: ${item.report.method}`,
      "",
      `Claim: ${item.argument.claim}`,
      `Warrant: ${item.argument.warrant}`,
      `Counterargument: ${item.argument.counter}`,
      "",
      "Evidence summary:",
      ...item.observations.map((obs) => `- [Level ${obs.level}] ${obs.observation} Inference: ${obs.inference}`),
      "",
      `Conclusion: ${item.report.conclusion}`,
      `Limitations: ${item.report.limitations}`
    ].join("\n");
  }

  function renderReviewChecklist() {
    const total = research.checklist.length;
    $("#reviewScore").textContent = `${state.reviewChecks.size} / ${total}`;
    $("#reviewWindow").innerHTML = `
      <div class="review-list">
        ${research.checklist.map((item, index) => `
          <label class="review-item">
            <input type="checkbox" data-review-index="${index}" ${state.reviewChecks.has(index) ? "checked" : ""} />
            <span>${escapeHTML(item)}</span>
          </label>
        `).join("")}
      </div>
    `;
    $$("#reviewWindow [data-review-index]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const index = Number(checkbox.dataset.reviewIndex);
        if (checkbox.checked) state.reviewChecks.add(index);
        else state.reviewChecks.delete(index);
        $("#reviewScore").textContent = `${state.reviewChecks.size} / ${total}`;
      });
    });
  }

  function toggleWindow(name) {
    const windowEl = document.querySelector(`[data-window="${name}"]`);
    if (!windowEl) return;
    windowEl.classList.toggle("collapsed");
  }

  function restoreWindows() {
    $$(".research-window.collapsed").forEach((item) => item.classList.remove("collapsed"));
  }

  function saveAcademicNote() {
    const notes = readJSON("chemvault-notes", []);
    notes.unshift({
      id: String(Date.now()),
      title: `Academic note: ${state.activeCase.title}`,
      body: $("#reportDraft").value.trim(),
      date: new Date().toLocaleDateString()
    });
    localStorage.setItem("chemvault-notes", JSON.stringify(notes.slice(0, 12)));
    $("#researchStatus").insertAdjacentHTML("beforeend", `<div class="saved-flash"><span class="label">Notebook</span><strong>Saved</strong></div>`);
  }

  function argumentBlock(title, text) {
    return `<div><span class="label">${escapeHTML(title)}</span><p>${escapeHTML(text)}</p></div>`;
  }

  function getSources(ids) {
    return chem.sources.filter((source) => ids.includes(source.id));
  }

  function formatCitation(source, index, style) {
    if (style === "vancouver") return `${index}. ${source.title}. Available at: ${source.url}.`;
    if (style === "lab") return `${source.short}: ${source.reliability}; used as ${source.family.toLowerCase()} support. ${source.url}`;
    return `${source.title}. ${source.reliability}. Available at: ${source.url}`;
  }

  function readJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return [...document.querySelectorAll(selector)];
  }

  function updateQueryParam(key, value) {
    if (!location.pathname.endsWith("/research.html")) return;
    const url = new URL(location.href);
    url.searchParams.set(key, value);
    history.replaceState(null, "", url);
  }
}());
