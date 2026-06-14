(function () {
  const data = window.CHEMVAULT_DATA;
  const state = { selected: null };

  document.addEventListener("DOMContentLoaded", () => {
    if (!data) return;
    populateFilters();
    wireControls();
    renderReagentList();
    const initialId = new URLSearchParams(location.search).get("id") || data.reagents?.[0]?.id;
    if (initialId) selectReagent(initialId);
  });

  function populateFilters() {
    const categories = [...new Set((data.reagents || []).map((item) => item.category || "Uncategorized"))].sort();
    $("#reagentPageCategory").innerHTML = `<option value="all">All categories</option>${categories.map((item) => `<option>${escapeHTML(item)}</option>`).join("")}`;
  }

  function wireControls() {
    $("#reagentPageSearch").addEventListener("input", renderReagentList);
    $("#reagentPageCategory").addEventListener("change", renderReagentList);
    $("#reagentPageSort").addEventListener("change", renderReagentList);
  }

  function filteredReagents() {
    const query = normalise($("#reagentPageSearch").value);
    const category = $("#reagentPageCategory").value;
    const sort = $("#reagentPageSort").value;
    const items = (data.reagents || []).filter((item) => {
      const text = normalise([
        item.name,
        item.formula,
        item.category,
        item.focus,
        item.scope,
        item.mechanism,
        item.risk,
        item.safety,
        ...asList(item.tags),
        ...asList(item.transformations),
        ...asList(item.conditions),
        ...asList(item.traps)
      ].join(" "));
      return (!query || text.includes(query)) && (category === "all" || (item.category || "Uncategorized") === category);
    });
    return items.sort((a, b) => {
      if (sort === "risk") return safeText(a.risk).localeCompare(safeText(b.risk));
      if (sort === "category") return safeText(a.category).localeCompare(safeText(b.category));
      return safeText(a.name).localeCompare(safeText(b.name));
    });
  }

  function renderReagentList() {
    const items = filteredReagents();
    $("#reagentPageCount").textContent = `${items.length} records`;
    $("#reagentPageList").innerHTML = items.length ? items.map((item) => `
      <button class="list-button${item.id === state.selected ? " active" : ""}" type="button" data-id="${item.id}">
        <span>${escapeHTML(item.category || "Uncategorized")}</span>
        <strong>${escapeHTML([item.formula, item.name].filter(Boolean).join(" · ") || "Unnamed reagent")}</strong>
      </button>
    `).join("") : `<div class="empty-state">No reagent records match this filter.</div>`;
    document.querySelectorAll("#reagentPageList [data-id]").forEach((button) => {
      button.addEventListener("click", () => selectReagent(button.dataset.id));
    });
  }

  function selectReagent(id) {
    const item = (data.reagents || []).find((reagent) => reagent.id === id);
    if (!item) return;
    state.selected = id;
    updateQueryParam("id", id);
    const transformations = asList(item.transformations);
    const conditions = asList(item.conditions);
    const traps = asList(item.traps);
    const tags = asList(item.tags);
    $("#reagentPageDetail").innerHTML = `
      <section class="data-window">
        <span class="formula">${escapeHTML(item.formula || item.category || "Reagent")}</span>
        <h2>${escapeHTML(item.name || "Unnamed reagent")}</h2>
        <p>${escapeHTML(item.scope || item.focus || item.academicUse || "Indexed reagent record for academic search and comparison.")}</p>
        <div class="tag-row">${tags.length ? tags.map(tag).join("") : tag(item.category || "reagent")}</div>
      </section>
      <section class="data-window">
        <h3>Transformations</h3>
        <ul class="detail-list">${transformations.length ? transformations.map(li).join("") : li(item.focus || "No transformation note is available.")}</ul>
        <h3>Conditions</h3>
        <ul class="detail-list">${conditions.length ? conditions.map(li).join("") : li("Check source-specific procedures before comparing conditions.")}</ul>
      </section>
      <section class="data-window">
        <h3>Mechanistic claim</h3>
        <p>${escapeHTML(item.mechanism || "Mechanistic detail is not yet curated for this record.")}</p>
        <h3>Limitations and traps</h3>
        <ul class="detail-list">${traps.length ? traps.map(li).join("") : li("Treat search-index records as prompts for source review, not procedure-ready instructions.")}</ul>
      </section>
      <section class="data-window">
        <h3>Academic audit</h3>
        <div class="micro-table">
          <div class="micro-row"><span>Handling profile</span><strong>${escapeHTML(item.risk || "Not classified")}</strong></div>
          <div class="micro-row"><span>Evidence level</span><strong>D: teaching heuristic unless procedure-specific source is added</strong></div>
          <div class="micro-row"><span>Safety note</span><strong>${escapeHTML(item.safety || "Consult current SDS and institutional guidance.")}</strong></div>
        </div>
      </section>
    `;
    renderRouteNetwork(item);
    renderReagentList();
  }

  function renderRouteNetwork(item) {
    const formula = safeText(item.formula).toLowerCase();
    const nameToken = safeText(item.name).toLowerCase().split(" ")[0] || "";
    const hits = (data.routes || []).filter((route) => {
      const routeText = asList(route.route).join(" ").toLowerCase();
      return (formula && routeText.includes(formula)) || (nameToken && routeText.includes(nameToken));
    });
    $("#routeNetwork").innerHTML = hits.length ? hits.map((route) => `
      <article>
        <strong>${escapeHTML(route.start)} -> ${escapeHTML(route.target)}</strong>
        <p>${escapeHTML(route.route.join(" | "))}</p>
        <span>${escapeHTML(route.note)}</span>
      </article>
    `).join("") : `<div class="empty-state">No direct route map currently references this reagent.</div>`;
  }

  function tag(value) {
    return `<span class="tag">${escapeHTML(value)}</span>`;
  }

  function li(value) {
    return `<li>${escapeHTML(value)}</li>`;
  }

  function asList(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  function safeText(value) {
    return String(value || "");
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
