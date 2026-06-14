(function () {
  const data = window.CHEMVAULT_SPECTROSCOPY;
  const state = { selected: null };

  document.addEventListener("DOMContentLoaded", () => {
    if (!data) return;
    populateFilters();
    wireControls();
    renderStaticPanels();
    renderCaseList();
    selectCase(new URLSearchParams(location.search).get("id") || data.cases[0].id);
  });

  function populateFilters() {
    const families = unique(data.cases.map((item) => item.family)).sort();
    $("#spectroscopyFamily").innerHTML = `<option value="all">All evidence families</option>${families.map((item) => `<option>${escapeHTML(item)}</option>`).join("")}`;
  }

  function wireControls() {
    $("#spectroscopySearch").addEventListener("input", renderCaseList);
    $("#spectroscopyFamily").addEventListener("change", renderCaseList);
  }

  function filteredCases() {
    const query = normalise($("#spectroscopySearch").value);
    const family = $("#spectroscopyFamily").value;
    return data.cases.filter((item) => {
      const text = normalise([
        item.title,
        item.family,
        item.question,
        item.conclusion,
        item.missing,
        ...item.signals.flatMap((signal) => [signal.technique, signal.signal, signal.interpretation, signal.strength])
      ].join(" "));
      return (!query || text.includes(query)) && (family === "all" || item.family === family);
    });
  }

  function renderCaseList() {
    const items = filteredCases();
    $("#spectroscopyCount").textContent = `${items.length} ${items.length === 1 ? "case" : "cases"}`;
    $("#spectroscopyList").innerHTML = items.length ? items.map((item) => `
      <button class="list-button${item.id === state.selected ? " active" : ""}" type="button" data-id="${item.id}">
        <span>${escapeHTML(item.family)} · ${item.confidence}%</span>
        <strong>${escapeHTML(item.title)}</strong>
      </button>
    `).join("") : `<div class="empty-state">No spectroscopy case matches this filter.</div>`;
    document.querySelectorAll("#spectroscopyList [data-id]").forEach((button) => {
      button.addEventListener("click", () => selectCase(button.dataset.id));
    });
  }

  function selectCase(id) {
    const item = data.cases.find((caseFile) => caseFile.id === id);
    if (!item) return;
    state.selected = id;
    updateQueryParam("id", id);
    $("#spectroscopyDetail").innerHTML = `
      <header class="manuscript-head">
        <div>
          <span class="tag">${escapeHTML(item.family)}</span>
          <h2>${escapeHTML(item.title)}</h2>
          <p>${escapeHTML(item.question)}</p>
        </div>
        <div class="readiness-gauge" style="--value: ${item.confidence}%" aria-label="Confidence ${item.confidence}%">
          <span></span>
          <strong>${item.confidence}%</strong>
          <small>confidence</small>
        </div>
      </header>
      <section class="data-window">
        <h3>Signal-to-claim matrix</h3>
        <div class="signal-matrix">
          ${item.signals.map((signal) => `
            <article>
              <span class="tag">${escapeHTML(signal.technique)}</span>
              <strong>${escapeHTML(signal.signal)}</strong>
              <p>${escapeHTML(signal.interpretation)}</p>
              <small>${escapeHTML(signal.strength)} evidence</small>
            </article>
          `).join("")}
        </div>
      </section>
      <div class="manuscript-grid">
        <section class="data-window">
          <h3>Conclusion</h3>
          <p>${escapeHTML(item.conclusion)}</p>
        </section>
        <section class="data-window">
          <h3>Missing evidence</h3>
          <p>${escapeHTML(item.missing)}</p>
        </section>
      </div>
    `;
    renderCaseList();
  }

  function renderStaticPanels() {
    $("#spectroscopyInstruments").innerHTML = data.instruments.map((item) => `
      <article class="instrument-card">
        <strong>${escapeHTML(item.name)}</strong>
        <p>${escapeHTML(item.evidenceType)}</p>
        <small>${escapeHTML(item.strengths[0])}</small>
      </article>
    `).join("");
    $("#uncertaintyRules").innerHTML = `<ol>${data.uncertaintyRules.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ol>`;
  }

  function unique(values) {
    return [...new Set(values)];
  }

  function normalise(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9.+-]/g, "");
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

  function updateQueryParam(key, value) {
    const url = new URL(location.href);
    url.searchParams.set(key, value);
    history.replaceState(null, "", url);
  }
}());
