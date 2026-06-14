(function () {
  const data = window.CHEMVAULT_METHODS;
  const state = { selected: null };

  document.addEventListener("DOMContentLoaded", () => {
    if (!data) return;
    populateFilters();
    wireControls();
    renderRubric();
    renderProtocolList();
    selectProtocol(new URLSearchParams(location.search).get("id") || data.protocols[0].id);
  });

  function populateFilters() {
    const domains = unique(data.protocols.map((item) => item.domain)).sort();
    const levels = unique(data.protocols.map((item) => item.level)).sort();
    $("#methodDomain").innerHTML = `<option value="all">All domains</option>${domains.map((item) => `<option>${escapeHTML(item)}</option>`).join("")}`;
    $("#methodLevel").innerHTML = `<option value="all">All levels</option>${levels.map((item) => `<option>${escapeHTML(item)}</option>`).join("")}`;
  }

  function wireControls() {
    $("#methodSearch").addEventListener("input", renderProtocolList);
    $("#methodDomain").addEventListener("change", renderProtocolList);
    $("#methodLevel").addEventListener("change", renderProtocolList);
  }

  function filteredProtocols() {
    const query = normalise($("#methodSearch").value);
    const domain = $("#methodDomain").value;
    const level = $("#methodLevel").value;
    return data.protocols.filter((item) => {
      const text = normalise([item.title, item.domain, item.level, item.summary, item.example, ...item.inputs, ...item.outputs, ...item.checklist].join(" "));
      return (!query || text.includes(query))
        && (domain === "all" || item.domain === domain)
        && (level === "all" || item.level === level);
    });
  }

  function renderProtocolList() {
    const items = filteredProtocols();
    $("#methodCount").textContent = `${items.length} ${items.length === 1 ? "protocol" : "protocols"}`;
    $("#methodList").innerHTML = items.length ? items.map((item) => `
      <button class="list-button${item.id === state.selected ? " active" : ""}" type="button" data-id="${item.id}">
        <span>${escapeHTML(item.level)} · ${escapeHTML(item.domain)}</span>
        <strong>${escapeHTML(item.title)}</strong>
      </button>
    `).join("") : `<div class="empty-state">No method protocol matches this filter.</div>`;
    document.querySelectorAll("#methodList [data-id]").forEach((button) => {
      button.addEventListener("click", () => selectProtocol(button.dataset.id));
    });
  }

  function selectProtocol(id) {
    const item = data.protocols.find((protocol) => protocol.id === id);
    if (!item) return;
    state.selected = id;
    updateQueryParam("id", id);
    $("#methodDetail").innerHTML = `
      <header class="manuscript-head">
        <div>
          <span class="tag">${escapeHTML(item.level)}</span>
          <h2>${escapeHTML(item.title)}</h2>
          <p>${escapeHTML(item.summary)}</p>
        </div>
        <div class="readiness-gauge" style="--value: 84%" aria-label="Protocol maturity 84%">
          <span></span>
          <strong>${escapeHTML(item.domain.split(" ")[0])}</strong>
          <small>domain</small>
        </div>
      </header>
      <div class="manuscript-grid">
        ${block("Required inputs", item.inputs, "ul")}
        ${block("Research outputs", item.outputs, "ul")}
        ${block("Audit checklist", item.checklist, "ol")}
        <section class="data-window">
          <h3>Scholarly example</h3>
          <p>${escapeHTML(item.example)}</p>
        </section>
      </div>
    `;
    renderProtocolList();
  }

  function renderRubric() {
    $("#rubricList").innerHTML = data.rubric.map((item) => `
      <article class="method-card">
        <span>Grade ${escapeHTML(item.grade)}</span>
        <strong>${escapeHTML(item.name)}</strong>
        <p>${escapeHTML(item.standard)}</p>
      </article>
    `).join("");
    $("#manuscriptList").innerHTML = data.manuscriptSections.map((item) => `
      <article class="method-card">
        <span>${escapeHTML(item.title)}</span>
        <strong>${escapeHTML(item.purpose)}</strong>
        <p>${escapeHTML(item.qualitySignal)}</p>
      </article>
    `).join("");
  }

  function block(title, items, listType) {
    const tagName = listType === "ol" ? "ol" : "ul";
    return `
      <section class="data-window">
        <h3>${escapeHTML(title)}</h3>
        <${tagName} class="detail-list">${items.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</${tagName}>
      </section>
    `;
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
