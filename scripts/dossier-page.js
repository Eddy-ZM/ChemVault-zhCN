(function () {
  const data = window.CHEMVAULT_DOSSIERS;
  const state = { selected: null };

  document.addEventListener("DOMContentLoaded", () => {
    if (!data) return;
    populateFilters();
    wireControls();
    renderStaticPanels();
    renderDossierList();
    selectDossier(new URLSearchParams(location.search).get("id") || data.dossiers[0].id);
  });

  function populateFilters() {
    const fields = unique(data.dossiers.map((item) => item.field)).sort();
    const statuses = unique(data.dossiers.map((item) => item.status)).sort();
    $("#dossierField").innerHTML = `<option value="all">All fields</option>${fields.map((field) => `<option>${escapeHTML(field)}</option>`).join("")}`;
    $("#dossierStatus").innerHTML = `<option value="all">All statuses</option>${statuses.map((status) => `<option>${escapeHTML(status)}</option>`).join("")}`;
  }

  function wireControls() {
    $("#dossierSearch").addEventListener("input", renderDossierList);
    $("#dossierField").addEventListener("change", renderDossierList);
    $("#dossierStatus").addEventListener("change", renderDossierList);
  }

  function filteredDossiers() {
    const query = normalise($("#dossierSearch").value);
    const field = $("#dossierField").value;
    const status = $("#dossierStatus").value;
    return data.dossiers.filter((item) => {
      const text = normalise([
        item.title,
        item.field,
        item.status,
        item.abstract,
        ...item.keywords,
        ...item.methods,
        ...item.claims,
        ...item.limitations
      ].join(" "));
      return (!query || text.includes(query))
        && (field === "all" || item.field === field)
        && (status === "all" || item.status === status);
    });
  }

  function renderDossierList() {
    const items = filteredDossiers();
    $("#dossierCount").textContent = `${items.length} ${items.length === 1 ? "dossier" : "dossiers"}`;
    $("#dossierList").innerHTML = items.length ? items.map((item) => `
      <button class="list-button${item.id === state.selected ? " active" : ""}" type="button" data-id="${item.id}">
        <span>${escapeHTML(item.status)} · ${escapeHTML(item.field)}</span>
        <strong>${escapeHTML(item.title)}</strong>
      </button>
    `).join("") : `<div class="empty-state">No dossier matches the current research filter.</div>`;
    document.querySelectorAll("#dossierList [data-id]").forEach((button) => {
      button.addEventListener("click", () => selectDossier(button.dataset.id));
    });
  }

  function selectDossier(id) {
    const item = data.dossiers.find((dossier) => dossier.id === id);
    if (!item) return;
    state.selected = id;
    updateQueryParam("id", id);
    $("#dossierDetail").innerHTML = `
      <header class="manuscript-head">
        <div>
          <span class="tag">${escapeHTML(item.status)}</span>
          <h2>${escapeHTML(item.title)}</h2>
          <p>${escapeHTML(item.abstract)}</p>
        </div>
        <div class="readiness-gauge" aria-label="Readiness ${item.maturity}%" style="--value: ${item.maturity}%">
          <span></span>
          <strong>${item.maturity}%</strong>
          <small>readiness</small>
        </div>
      </header>
      <div class="tag-row">${item.keywords.map(tag).join("")}</div>
      <div class="manuscript-grid">
        ${section("Method Stack", item.methods, "ol")}
        ${section("Observable Evidence", item.observables, "ul")}
        ${section("Claim Register", item.claims, "ul")}
        ${section("Limitations", item.limitations, "ul")}
      </div>
      <section class="data-window">
        <h3>Reproducibility Ledger</h3>
        <div class="ledger-table">
          ${item.reproducibility.map((entry) => `
            <div class="ledger-row">
              <span>${escapeHTML(entry.item)}</span>
              <strong class="state-${escapeHTML(entry.state)}">${escapeHTML(entry.state)}</strong>
            </div>
          `).join("")}
        </div>
      </section>
      <section class="data-window">
        <h3>Linked Workspace Records</h3>
        <div class="linked-records">${item.linked.map((link) => `<a class="secondary-button" href="${escapeHTML(link.href)}">${escapeHTML(link.label)}</a>`).join("")}</div>
      </section>
    `;
    renderDossierList();
  }

  function renderStaticPanels() {
    $("#dossierMethods").innerHTML = data.methods.map((method) => `
      <article class="method-card">
        <span>${escapeHTML(method.className)}</span>
        <strong>${escapeHTML(method.name)}</strong>
        <p>${escapeHTML(method.note)}</p>
        <div class="mini-meter"><span style="width: ${method.confidence}%"></span></div>
      </article>
    `).join("");
    $("#instrumentList").innerHTML = data.instruments.map((item) => `
      <article class="instrument-card">
        <strong>${escapeHTML(item.name)}</strong>
        <p>${escapeHTML(item.role)}</p>
        <small>${escapeHTML(item.output)}</small>
      </article>
    `).join("");
  }

  function section(title, items, listType) {
    const tagName = listType === "ol" ? "ol" : "ul";
    return `
      <section class="data-window">
        <h3>${escapeHTML(title)}</h3>
        <${tagName} class="detail-list">${items.map(li).join("")}</${tagName}>
      </section>
    `;
  }

  function tag(value) {
    return `<span class="tag">${escapeHTML(value)}</span>`;
  }

  function li(value) {
    return `<li>${escapeHTML(value)}</li>`;
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
