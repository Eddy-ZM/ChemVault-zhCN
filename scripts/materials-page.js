(function () {
  const data = window.CHEMVAULT_MATERIALS;
  const chem = window.CHEMVAULT_DATA;
  const state = { selected: null };

  document.addEventListener("DOMContentLoaded", () => {
    if (!data) return;
    populateFilters();
    wireControls();
    renderStaticPanels();
    renderMaterialList();
    selectMaterial(new URLSearchParams(location.search).get("id") || data.materials[0].id);
  });

  function populateFilters() {
    const families = unique(data.materials.map((item) => item.family)).sort();
    $("#materialFamily").innerHTML = `<option value="all">All material families</option>${families.map((item) => `<option>${escapeHTML(item)}</option>`).join("")}`;
    $("#materialProperty").innerHTML = `<option value="all">All property axes</option>${data.propertyAxes.map((item) => `<option>${escapeHTML(item)}</option>`).join("")}`;
  }

  function wireControls() {
    $("#materialSearch").addEventListener("input", renderMaterialList);
    $("#materialFamily").addEventListener("change", renderMaterialList);
    $("#materialProperty").addEventListener("change", renderMaterialList);
  }

  function filteredMaterials() {
    const query = normalise($("#materialSearch").value);
    const family = $("#materialFamily").value;
    const property = normalise($("#materialProperty").value);
    return data.materials.filter((item) => {
      const text = normalise([
        item.name,
        item.family,
        item.formula,
        item.synthesis,
        item.evidenceLevel,
        ...item.applications,
        ...item.properties,
        ...item.characterization,
        ...item.limitations,
        ...item.linkedReagents
      ].join(" "));
      return (!query || text.includes(query))
        && (family === "all" || item.family === family)
        && (property === "all" || text.includes(property));
    });
  }

  function renderMaterialList() {
    const items = filteredMaterials();
    $("#materialCount").textContent = `${items.length} ${items.length === 1 ? "material" : "materials"}`;
    $("#materialList").innerHTML = items.length ? items.map((item) => `
      <button class="list-button${item.id === state.selected ? " active" : ""}" type="button" data-id="${item.id}">
        <span>${escapeHTML(item.family)} · ${item.maturity}%</span>
        <strong>${escapeHTML(item.name)}</strong>
      </button>
    `).join("") : `<div class="empty-state">No material matches this academic filter.</div>`;
    document.querySelectorAll("#materialList [data-id]").forEach((button) => {
      button.addEventListener("click", () => selectMaterial(button.dataset.id));
    });
  }

  function selectMaterial(id) {
    const item = data.materials.find((material) => material.id === id);
    if (!item) return;
    state.selected = id;
    updateQueryParam("id", id);
    const reagents = (chem?.reagents || []).filter((reagent) => item.linkedReagents.includes(reagent.id));
    const missing = item.linkedReagents.filter((id) => !reagents.some((reagent) => reagent.id === id));
    $("#materialDetail").innerHTML = `
      <header class="manuscript-head">
        <div>
          <span class="tag">${escapeHTML(item.family)}</span>
          <h2>${escapeHTML(item.name)}</h2>
          <p><strong>${escapeHTML(item.formula)}</strong> · ${escapeHTML(item.synthesis)}</p>
        </div>
        <div class="readiness-gauge" style="--value: ${item.maturity}%" aria-label="Record maturity ${item.maturity}%">
          <span></span>
          <strong>${item.maturity}%</strong>
          <small>record depth</small>
        </div>
      </header>
      <div class="manuscript-grid">
        ${block("Applications", item.applications)}
        ${block("Property profile", item.properties)}
        ${block("Characterization evidence", item.characterization)}
        ${block("Limitations", item.limitations)}
      </div>
      <section class="data-window">
        <h3>Academic evidence boundary</h3>
        <p>${escapeHTML(item.evidenceLevel)}</p>
      </section>
      <section class="data-window">
        <h3>Linked reagent and precursor records</h3>
        <div class="linked-records">
          ${reagents.map((reagent) => `<a class="secondary-button" href="reagents.html?id=${encodeURIComponent(reagent.id)}">${escapeHTML(reagent.formula)} · ${escapeHTML(reagent.name)}</a>`).join("")}
          ${missing.map((id) => `<span class="tag">${escapeHTML(id)}</span>`).join("")}
        </div>
      </section>
    `;
    renderMaterialList();
  }

  function renderStaticPanels() {
    $("#characterizationList").innerHTML = data.characterizationMethods.map((item) => `
      <article class="method-card">
        <span>${escapeHTML(item.method)}</span>
        <p>${escapeHTML(item.purpose)}</p>
      </article>
    `).join("");
    $("#propertyAxisList").innerHTML = data.propertyAxes.map((item) => `<span class="tag">${escapeHTML(item)}</span>`).join("");
  }

  function block(title, items) {
    return `
      <section class="data-window">
        <h3>${escapeHTML(title)}</h3>
        <ul class="detail-list">${items.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>
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
