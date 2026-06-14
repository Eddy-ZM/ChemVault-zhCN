(() => {
  const data = window.CHEMVAULT_DATA || {};
  const materials = window.CHEMVAULT_MATERIALS || {};
  const external = window.CHEMVAULT_EXTERNAL || { sources: [] };
  const workbench = window.CHEMVAULT_WORKBENCH || { lenses: [], evidenceQueue: [] };

  const state = {
    query: "",
    domain: "all",
    evidence: 80,
    selected: null,
    activeTab: "systems",
    suggestStart: "",
    suggestGoal: ""
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const esc = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
  const normalise = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9.+-]/g, "");
  const encode = (value) => encodeURIComponent(String(value || "").trim());

  document.addEventListener("DOMContentLoaded", () => {
    if (!data.reactionSystems) return;
    readInitialState();
    populateControls();
    wireControls();
    renderAll();
  });

  function readInitialState() {
    const params = new URLSearchParams(location.search);
    state.query = params.get("q") || "";
    state.domain = params.get("domain") || "all";
    state.selected = params.get("id");
    state.activeTab = params.get("tab") || "systems";
    state.suggestStart = params.get("start") || "";
    state.suggestGoal = params.get("goal") || "";
    const evidence = Number(params.get("maturity"));
    if (Number.isFinite(evidence) && evidence >= 70 && evidence <= 95) state.evidence = evidence;
  }

  function populateControls() {
    const queryInput = $("#workbenchQuery");
    const evidenceInput = $("#workbenchEvidence");
    if (queryInput) queryInput.value = state.query;
    if (evidenceInput) evidenceInput.value = state.evidence;
    if ($("#suggestStart")) $("#suggestStart").value = state.suggestStart;
    if ($("#suggestGoal")) $("#suggestGoal").value = state.suggestGoal;

    const domains = unique((data.reactionSystems || []).map((item) => item.domain)).sort();
    $("#workbenchDomain").innerHTML = `<option value="all">All research domains</option>${domains.map((domain) => `<option value="${esc(domain)}">${esc(domain)}</option>`).join("")}`;
    $("#workbenchDomain").value = domains.includes(state.domain) ? state.domain : "all";

    $("#lensGrid").innerHTML = (workbench.lenses || []).map((lens) => `
      <button class="lens-button" type="button" data-query="${esc(lens.query)}">
        <span>${esc(lens.id)}</span>
        <strong>${esc(lens.label)}</strong>
      </button>
    `).join("");

    setActiveTab(state.activeTab, false);
  }

  function wireControls() {
    $("#workbenchQuery")?.addEventListener("input", (event) => {
      state.query = event.target.value;
      renderAll();
    });
    $("#workbenchDomain")?.addEventListener("change", (event) => {
      state.domain = event.target.value;
      state.selected = null;
      renderAll();
    });
    $("#workbenchEvidence")?.addEventListener("input", (event) => {
      state.evidence = Number(event.target.value);
      renderAll();
    });
    $("#suggestStart")?.addEventListener("input", (event) => {
      state.suggestStart = event.target.value;
      renderSuggestions(selectedSystem());
      syncUrl();
    });
    $("#suggestGoal")?.addEventListener("input", (event) => {
      state.suggestGoal = event.target.value;
      renderSuggestions(selectedSystem());
      syncUrl();
    });
    $$("#lensGrid [data-query]").forEach((button) => {
      button.addEventListener("click", () => {
        state.query = button.dataset.query || "";
        $("#workbenchQuery").value = state.query;
        state.selected = null;
        renderAll();
      });
    });
    $$(".workbench-tab").forEach((button) => {
      button.addEventListener("click", () => {
        setActiveTab(button.dataset.tab);
        renderPanels(selectedSystem());
      });
    });
    $$("[data-workbench-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.workbenchAction;
        if (action === "focus-reactions") {
          state.query = "cross-coupling carbonyl amide alkene";
          state.activeTab = "systems";
        }
        if (action === "focus-materials") {
          state.query = "MOF sol-gel polymer battery surface";
          state.activeTab = "materials";
        }
        if (action === "focus-mechanisms") {
          state.query = "oxidative addition hydride pericyclic polymer mechanism";
          state.activeTab = "mechanisms";
        }
        if (action === "run-suggester") {
          state.query = [state.suggestStart, state.suggestGoal].filter(Boolean).join(" ");
          state.activeTab = "routes";
        }
        $("#workbenchQuery").value = state.query;
        setActiveTab(state.activeTab, false);
        state.selected = null;
        renderAll();
      });
    });
  }

  function renderAll() {
    const systems = filteredSystems();
    if (!state.selected || !systems.some((item) => item.id === state.selected)) {
      state.selected = systems[0]?.id || null;
    }
    const selected = selectedSystem();
    $("#evidenceReadout").textContent = `${state.evidence}%`;
    renderKpis(systems);
    renderSystemList(systems);
    renderNetwork(selected, systems);
    renderPanels(selected);
    renderSelectedRecord(selected);
    renderExternalLinks(selected);
    renderSuggestions(selected);
    syncUrl();
  }

  function filteredSystems() {
    const query = normalise(state.query);
    return (data.reactionSystems || []).filter((system) => {
      const text = normalise([
        system.name,
        system.className,
        system.domain,
        ...(system.substrates || []).map((id) => reactantName(id)),
        ...(system.reagents || []).map((id) => reagentName(id)),
        ...(system.mechanisms || []).map((id) => mechanismName(id)),
        ...(system.conditions || []),
        ...(system.readouts || []),
        ...(system.limitations || []),
        ...(system.nextQuestions || [])
      ].join(" "));
      return (!query || matchesQuery(text, state.query))
        && (state.domain === "all" || system.domain === state.domain)
        && Number(system.maturity || 0) >= state.evidence;
    }).sort((a, b) => Number(b.maturity || 0) - Number(a.maturity || 0));
  }

  function selectedSystem() {
    return (data.reactionSystems || []).find((system) => system.id === state.selected) || null;
  }

  function renderKpis(systems) {
    const materialCount = (materials.materials || []).length;
    const kpis = [
      ["systems", systems.length, "filtered systems"],
      ["reactants", (data.reactants || []).length, "reactant classes"],
      ["reagents", (data.reagents || []).length, "reagent records"],
      ["compounds", (data.compounds || []).length, "compound records"],
      ["materials", materialCount, "material profiles"],
      ["mechanisms", (data.mechanisms || []).length, "mechanism nodes"]
    ];
    $("#workbenchRecordCount").textContent = `${sum(kpis.map((item) => item[1]))} records`;
    $("#workbenchKpis").innerHTML = kpis.map(([key, value, label]) => `
      <div>
        <span>${esc(key)}</span>
        <strong>${value}</strong>
        <small>${esc(label)}</small>
      </div>
    `).join("");
  }

  function renderSystemList(systems) {
    $("#systemCount").textContent = `${systems.length} visible`;
    $("#systemList").innerHTML = systems.length ? systems.map((system) => `
      <button class="list-button${system.id === state.selected ? " active" : ""}" type="button" data-id="${esc(system.id)}">
        <span>${esc(system.domain)} · ${system.maturity}% maturity</span>
        <strong>${esc(system.name)}</strong>
        <small>${esc(system.className)}</small>
      </button>
    `).join("") : `
      <div class="empty-state">
        <span class="eyebrow">Filter boundary</span>
        <h3>No system above this maturity threshold</h3>
        <p>Lower the evidence threshold or broaden the research query.</p>
      </div>
    `;
    $$("#systemList [data-id]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selected = button.dataset.id;
        renderAll();
      });
    });
  }

  function renderNetwork(selected, systems) {
    const board = $("#networkBoard");
    if (!board) return;
    if (!selected) {
      board.innerHTML = `<div class="empty-state">No network can be rendered for the current filter.</div>`;
      return;
    }

    const nodes = [
      { id: selected.id, label: selected.name, type: "system", x: 50, y: 50 },
      ...(selected.substrates || []).slice(0, 4).map((id, index) => ({ id, label: reactantName(id), type: "reactant", x: 14, y: 22 + index * 18 })),
      ...(selected.reagents || []).slice(0, 4).map((id, index) => ({ id, label: reagentName(id), type: "reagent", x: 82, y: 20 + index * 17 })),
      ...(selected.mechanisms || []).slice(0, 4).map((id, index) => ({ id, label: mechanismName(id), type: "mechanism", x: 30 + index * 14, y: 84 })),
      ...systems.filter((item) => item.id !== selected.id).slice(0, 4).map((item, index) => ({ id: item.id, label: item.name, type: "neighbor", x: 22 + index * 18, y: 8 }))
    ];
    const lines = nodes.filter((node) => node.id !== selected.id).map((node) => `
      <line x1="50%" y1="50%" x2="${node.x}%" y2="${node.y}%" />
    `).join("");
    board.innerHTML = `
      <svg class="network-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
      ${nodes.map((node) => `
        <button class="network-node network-node-${esc(node.type)}" type="button" style="left:${node.x}%;top:${node.y}%;" data-network-id="${esc(node.id)}" data-network-type="${esc(node.type)}">
          <span>${esc(node.type)}</span>
          <strong>${esc(node.label)}</strong>
        </button>
      `).join("")}
    `;
    $$("#networkBoard [data-network-id]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.networkType === "neighbor" || button.dataset.networkType === "system") {
          state.selected = button.dataset.networkId;
          renderAll();
        } else {
          state.query = button.textContent.trim();
          $("#workbenchQuery").value = state.query;
          renderAll();
        }
      });
    });
  }

  function renderPanels(system) {
    setActiveTab(state.activeTab, false);
    renderSystemDetail(system);
    renderRoutePlanner(system);
    renderMechanismBoard(system);
    renderMaterialInterface(system);
    renderEvidenceQueue(system);
  }

  function renderSystemDetail(system) {
    const panel = $("#systemDetail");
    if (!panel) return;
    if (!system) {
      panel.innerHTML = `<div class="empty-state">Select a reaction system to inspect.</div>`;
      return;
    }
    panel.innerHTML = `
      <article class="workbench-detail-card">
        <header class="manuscript-head">
          <div>
            <span class="tag">${esc(system.domain)}</span>
            <h2>${esc(system.name)}</h2>
            <p>${esc(system.className)}</p>
          </div>
          <div class="readiness-gauge" style="--value:${Number(system.maturity || 0)}%" aria-label="System maturity ${Number(system.maturity || 0)}%">
            <span></span>
            <strong>${Number(system.maturity || 0)}%</strong>
            <small>maturity</small>
          </div>
        </header>
        <div class="workbench-detail-grid">
          ${listBlock("Reactant classes", (system.substrates || []).map((id) => reactantLink(id)))}
          ${listBlock("Reagent and catalyst links", (system.reagents || []).map((id) => reagentLink(id)))}
          ${listBlock("Typical conditions", system.conditions || [])}
          ${listBlock("Observable readouts", system.readouts || [])}
          ${listBlock("Known limitations", system.limitations || [])}
          ${listBlock("Research questions", system.nextQuestions || [])}
        </div>
      </article>
    `;
  }

  function renderRoutePlanner(system) {
    const panel = $("#routePlanner");
    if (!panel) return;
    const queryText = [
      state.query,
      system?.name,
      system?.className,
      ...(system?.substrates || []).map((id) => reactantName(id)),
      ...(system?.reagents || []).map((id) => reagentName(id))
    ].join(" ");
    const routes = (data.routes || [])
      .map((route) => ({ route, score: routeScore(route, queryText) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((item) => item.route);
    panel.innerHTML = `
      <div class="route-planner-grid">
        ${routes.length ? routes.map((route) => `
          <article class="route-card">
            <span class="eyebrow">${esc(route.start)} -> ${esc(route.target)}</span>
            <h3>${esc(route.start)} to ${esc(route.target)}</h3>
            <ol>${(route.route || []).map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
            <p>${esc(route.note)}</p>
            <a class="secondary-button" href="${recordUrl("route", routeId(route))}">Open route record</a>
          </article>
        `).join("") : `<div class="empty-state">No route matched this system. Broaden the query to inspect the full route index.</div>`}
      </div>
    `;
  }

  function renderMechanismBoard(system) {
    const panel = $("#mechanismBoard");
    if (!panel) return;
    const ids = new Set(system?.mechanisms || []);
    const related = (data.mechanisms || [])
      .filter((item) => ids.has(item.id) || normalise(`${item.name} ${item.className} ${item.summary} ${(item.bestFor || []).join(" ")}`).includes(normalise(state.query)))
      .slice(0, 8);
    panel.innerHTML = `
      <div class="mechanism-board-grid">
        ${related.length ? related.map((item) => `
          <article class="mechanism-audit-card">
            <span class="eyebrow">${esc(item.className)}</span>
            <h3>${esc(item.name)}</h3>
            <p>${esc(item.summary)}</p>
            <div class="micro-table">
              <div class="micro-row"><span>Rate law</span><strong>${esc(item.rateLaw)}</strong></div>
              <div class="micro-row"><span>Stereochemistry</span><strong>${esc(item.stereo)}</strong></div>
            </div>
            <a class="secondary-button" href="${recordUrl("mechanism", item.id)}">Open mechanism record</a>
          </article>
        `).join("") : `<div class="empty-state">No mechanism node matched the current filter.</div>`}
      </div>
    `;
  }

  function renderMaterialInterface(system) {
    const panel = $("#materialInterface");
    if (!panel) return;
    const queryText = [
      state.query,
      system?.domain,
      system?.name,
      system?.className,
      ...(system?.conditions || []),
      ...(system?.readouts || [])
    ].join(" ");
    const rows = (materials.materials || [])
      .map((item) => ({ item, score: materialScore(item, queryText) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((row) => row.item);
    panel.innerHTML = `
      <div class="material-interface-grid">
        ${rows.length ? rows.map((item) => `
          <article class="material-interface-card">
            <span class="eyebrow">${esc(item.family)} · ${Number(item.maturity || 0)}%</span>
            <h3>${esc(item.name)}</h3>
            <p>${esc(item.synthesis)}</p>
            <div class="tag-row">${(item.characterization || []).slice(0, 4).map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}</div>
            <a class="secondary-button" href="${recordUrl("material", item.id)}">Open material record</a>
          </article>
        `).join("") : `<div class="empty-state">No material profile matched this system.</div>`}
      </div>
    `;
  }

  function renderEvidenceQueue(system) {
    const panel = $("#evidenceQueue");
    if (!panel) return;
    const domain = normalise(system?.domain || state.query);
    const queue = (workbench.evidenceQueue || [])
      .filter((item) => !domain || normalise(`${item.domain} ${item.title} ${item.action}`).includes(domain) || normalise(state.query).includes(normalise(item.domain)))
      .concat((workbench.evidenceQueue || []).filter((item) => domain && !normalise(`${item.domain} ${item.title} ${item.action}`).includes(domain)).slice(0, 3))
      .slice(0, 6);
    panel.innerHTML = `
      <div class="evidence-queue-grid">
        ${queue.map((item) => `
          <article class="evidence-item evidence-${esc(item.severity)}">
            <span class="eyebrow">${esc(item.domain)} · ${esc(item.severity)}</span>
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.action)}</p>
          </article>
        `).join("")}
      </div>
    `;
  }

  function renderSelectedRecord(system) {
    const badge = $("#selectedBadge");
    const panel = $("#selectedRecord");
    if (!badge || !panel) return;
    if (!system) {
      badge.textContent = "No selection";
      panel.innerHTML = `<div class="empty-state">No selected record.</div>`;
      return;
    }
    badge.textContent = `${system.maturity}% maturity`;
    panel.innerHTML = `
      <h3>${esc(system.name)}</h3>
      <p>${esc(system.className)}</p>
      <div class="selected-meta">
        <span>${esc(system.domain)}</span>
        <span>${(system.substrates || []).length} substrates</span>
        <span>${(system.mechanisms || []).length} mechanisms</span>
      </div>
      <div class="tag-row">
        ${(system.substrates || []).map((id) => `<span class="tag">${esc(reactantName(id))}</span>`).join("")}
      </div>
    `;
  }

  function renderExternalLinks(system) {
    const panel = $("#workbenchExternalLinks");
    if (!panel) return;
    const query = state.query || system?.name || "reaction mechanism chemistry";
    panel.innerHTML = (external.sources || []).slice(0, 5).map((source) => `
      <a class="secondary-button" href="${externalUrl(source, query)}" target="_blank" rel="noreferrer">${esc(source.name)}</a>
    `).join("");
  }

  function renderSuggestions(system) {
    const panel = $("#workbenchSuggestions");
    if (!panel) return;
    const queryText = [
      state.suggestStart,
      state.suggestGoal,
      state.query,
      system?.name,
      system?.className,
      system?.domain
    ].filter(Boolean).join(" ");
    if (!queryText.trim()) {
      panel.innerHTML = `<div class="empty-state">Enter a starting motif and goal to generate first-pass reaction, reagent, route and evidence suggestions.</div>`;
      return;
    }
    const systems = (data.reactionSystems || [])
      .map((item) => ({ item, score: systemScore(item, queryText) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((row) => row.item);
    const reagents = (data.reagents || [])
      .map((item) => ({ item, score: reagentScore(item, queryText) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((row) => row.item);
    const routes = (data.routes || [])
      .map((route) => ({ route, score: routeScore(route, queryText) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((row) => row.route);
    const mechanisms = (data.mechanisms || [])
      .map((item) => ({ item, score: mechanismScore(item, queryText) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((row) => row.item);

    panel.innerHTML = `
      ${suggestionBlock("Systems", systems, (item) => `
        <a href="${recordUrl("reaction", item.id)}"><strong>${esc(item.name)}</strong><small>${esc(item.domain)} · ${Number(item.maturity || 0)}% maturity</small></a>
      `)}
      ${suggestionBlock("Reagents", reagents, (item) => `
        <a href="${recordUrl("reagent", item.id)}"><strong>${esc(item.formula)} · ${esc(item.name)}</strong><small>${esc(item.focus || item.category)}</small></a>
      `)}
      ${suggestionBlock("Routes", routes, (item) => `
        <a href="${recordUrl("route", routeId(item))}"><strong>${esc(item.start)} to ${esc(item.target)}</strong><small>${esc((item.route || []).join(" -> "))}</small></a>
      `)}
      ${suggestionBlock("Mechanisms", mechanisms, (item) => `
        <a href="${recordUrl("mechanism", item.id)}"><strong>${esc(item.name)}</strong><small>${esc(item.className)}</small></a>
      `)}
      <button class="secondary-button" type="button" data-suggest-apply="${esc(queryText)}">Apply phrase to Workbench</button>
    `;
    panel.querySelector("[data-suggest-apply]")?.addEventListener("click", (event) => {
      state.query = event.currentTarget.dataset.suggestApply || "";
      $("#workbenchQuery").value = state.query;
      state.selected = null;
      renderAll();
    });
  }

  function suggestionBlock(title, items, renderer) {
    return `
      <section class="suggestion-block">
        <h3>${esc(title)}</h3>
        <div>${items.length ? items.map(renderer).join("") : `<span class="muted">No initial match.</span>`}</div>
      </section>
    `;
  }

  function setActiveTab(tab, update = true) {
    const valid = ["systems", "routes", "mechanisms", "materials", "evidence"];
    state.activeTab = valid.includes(tab) ? tab : "systems";
    $$(".workbench-tab").forEach((button) => {
      const active = button.dataset.tab === state.activeTab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    $$(".workbench-tab-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.panel === state.activeTab);
    });
    if (update) syncUrl();
  }

  function syncUrl() {
    const url = new URL(location.href);
    if (state.query) url.searchParams.set("q", state.query);
    else url.searchParams.delete("q");
    if (state.domain !== "all") url.searchParams.set("domain", state.domain);
    else url.searchParams.delete("domain");
    if (state.selected) url.searchParams.set("id", state.selected);
    else url.searchParams.delete("id");
    if (state.activeTab !== "systems") url.searchParams.set("tab", state.activeTab);
    else url.searchParams.delete("tab");
    if (state.evidence !== 80) url.searchParams.set("maturity", String(state.evidence));
    else url.searchParams.delete("maturity");
    if (state.suggestStart) url.searchParams.set("start", state.suggestStart);
    else url.searchParams.delete("start");
    if (state.suggestGoal) url.searchParams.set("goal", state.suggestGoal);
    else url.searchParams.delete("goal");
    history.replaceState(null, "", url);
  }

  function routeScore(route, queryText) {
    const text = normalise([route.start, route.target, route.note, ...(route.route || [])].join(" "));
    if (!queryText) return 1;
    let score = 0;
    queryTokens(queryText).forEach((token) => {
      if (token.length > 2 && text.includes(token)) score += 1;
    });
    return score;
  }

  function materialScore(item, queryText) {
    const text = normalise([
      item.name,
      item.family,
      item.formula,
      item.synthesis,
      item.evidenceLevel,
      ...(item.applications || []),
      ...(item.properties || []),
      ...(item.characterization || []),
      ...(item.limitations || [])
    ].join(" "));
    if (!queryText) return 1;
    let score = 0;
    queryTokens(queryText).forEach((token) => {
      if (token.length > 2 && text.includes(token)) score += 1;
    });
    const normalisedQuery = normalise(queryText);
    if (text.includes("mof") && normalisedQuery.includes("mof")) score += 4;
    if (text.includes("polymer") && normalisedQuery.includes("polymer")) score += 3;
    if (text.includes("battery") && normalisedQuery.includes("battery")) score += 3;
    return score;
  }

  function systemScore(system, queryText) {
    const text = normalise([
      system.name,
      system.className,
      system.domain,
      ...(system.substrates || []).map((id) => reactantName(id)),
      ...(system.reagents || []).map((id) => reagentName(id)),
      ...(system.mechanisms || []).map((id) => mechanismName(id)),
      ...(system.conditions || []),
      ...(system.readouts || []),
      ...(system.limitations || [])
    ].join(" "));
    return scoreText(text, queryText) + Number(system.maturity || 0) / 100;
  }

  function reagentScore(item, queryText) {
    return scoreText(normalise([
      item.name,
      item.formula,
      item.category,
      item.focus,
      item.scope,
      item.mechanism,
      ...(item.tags || []),
      ...(item.transformations || []),
      ...(item.conditions || [])
    ].join(" ")), queryText);
  }

  function mechanismScore(item, queryText) {
    return scoreText(normalise([
      item.name,
      item.className,
      item.summary,
      item.rateLaw,
      item.stereo,
      ...(item.tags || []),
      ...(item.bestFor || []),
      ...(item.steps || [])
    ].join(" ")), queryText);
  }

  function scoreText(text, queryText) {
    return queryTokens(queryText).reduce((total, token) => total + (text.includes(token) ? 1 : 0), 0);
  }

  function listBlock(title, items) {
    return `
      <section class="data-window">
        <h3>${esc(title)}</h3>
        <ul class="detail-list">${items.map((item) => `<li>${typeof item === "string" && item.startsWith("<a ") ? item : esc(item)}</li>`).join("")}</ul>
      </section>
    `;
  }

  function reactantLink(id) {
    return `<a href="${recordUrl("reactant", id)}">${esc(reactantName(id))}</a>`;
  }

  function reagentLink(id) {
    const reagent = (data.reagents || []).find((item) => item.id === id);
    if (reagent) return `<a href="${recordUrl("reagent", reagent.id)}">${esc(reagent.formula)} · ${esc(reagent.name)}</a>`;
    return `<a href="search.html?q=${encode(reagentName(id))}">${esc(reagentName(id))}</a>`;
  }

  function reactantName(id) {
    return (data.reactants || []).find((item) => item.id === id)?.name || idToTitle(id);
  }

  function reagentName(id) {
    return (data.reagents || []).find((item) => item.id === id)?.name || idToTitle(id);
  }

  function mechanismName(id) {
    return (data.mechanisms || []).find((item) => item.id === id)?.name || idToTitle(id);
  }

  function externalUrl(source, query) {
    const encoded = encode(query);
    return encoded && source.queryUrl ? source.queryUrl.replace("{query}", encoded) : source.baseUrl;
  }

  function recordUrl(type, id) {
    return window.CHEMVAULT_RECORDS?.recordUrl(type, id) || `record.html?type=${encode(type)}&id=${encode(id)}`;
  }

  function routeId(route) {
    return window.CHEMVAULT_RECORDS?.routeId(route) || `route-${idToSlug(route?.start)}-${idToSlug(route?.target)}`;
  }

  function matchesQuery(normalisedText, rawQuery) {
    const tokens = queryTokens(rawQuery);
    if (!tokens.length) return true;
    return tokens.some((token) => normalisedText.includes(token));
  }

  function queryTokens(value) {
    return String(value || "")
      .toLowerCase()
      .split(/[^a-z0-9.+-]+/)
      .map((token) => normalise(token))
      .filter((token) => token.length > 2);
  }

  function idToTitle(id) {
    return String(id || "").split("-").filter(Boolean).map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ");
  }

  function idToSlug(value) {
    return String(value || "record").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function sum(values) {
    return values.reduce((total, value) => total + Number(value || 0), 0);
  }
})();
