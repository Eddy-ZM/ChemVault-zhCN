(function () {
  const data = window.CHEMVAULT_DATA;
  const dossiers = window.CHEMVAULT_DOSSIERS;
  const methods = window.CHEMVAULT_METHODS;
  const spectroscopy = window.CHEMVAULT_SPECTROSCOPY;
  const materials = window.CHEMVAULT_MATERIALS;
  const themeQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
  const state = {
    selectedReagent: null,
    compare: [],
    libraryView: "cards",
    selectedConcept: null,
    selectedMechanism: null,
    selectedElement: null,
    quiz: {
      current: null,
      answered: false,
      correct: 0,
      attempted: 0,
      streak: 0
    },
    calculator: "moles",
    calcHistory: []
  };

  const calculatorDefs = {
    moles: {
      title: "Moles",
      fields: [
        { id: "mass", label: "Mass / g", placeholder: "0.548" },
        { id: "mr", label: "Molar mass / g mol-1", placeholder: "122.12" }
      ],
      compute(values) {
        const mass = number(values.mass);
        const mr = number(values.mr);
        if (mass <= 0 || mr <= 0) return error("Enter positive mass and molar mass.");
        const result = mass / mr;
        return ok(`${format(result)} mol`, `${mass} / ${mr}`);
      }
    },
    dilution: {
      title: "Dilution",
      fields: [
        { id: "c1", label: "Stock concentration, C1", placeholder: "1.00" },
        { id: "v1", label: "Stock volume, V1", placeholder: "25.0" },
        { id: "v2", label: "Final volume, V2", placeholder: "250.0" }
      ],
      compute(values) {
        const c1 = number(values.c1);
        const v1 = number(values.v1);
        const v2 = number(values.v2);
        if (c1 <= 0 || v1 <= 0 || v2 <= 0) return error("Enter positive C1, V1 and V2.");
        return ok(`${format(c1 * v1 / v2)} concentration units`, `C2 = ${c1} x ${v1} / ${v2}`);
      }
    },
    yield: {
      title: "Percentage yield",
      fields: [
        { id: "actual", label: "Actual yield / g", placeholder: "0.0548" },
        { id: "theoretical", label: "Theoretical yield / g", placeholder: "0.120" }
      ],
      compute(values) {
        const actual = number(values.actual);
        const theoretical = number(values.theoretical);
        if (actual < 0 || theoretical <= 0) return error("Enter valid yield values.");
        return ok(`${(actual / theoretical * 100).toFixed(2)}%`, `${actual} / ${theoretical} x 100`);
      }
    },
    beer: {
      title: "Beer-Lambert",
      fields: [
        { id: "absorbance", label: "Absorbance, A", placeholder: "0.650" },
        { id: "epsilon", label: "Molar absorptivity, epsilon", placeholder: "12000" },
        { id: "path", label: "Path length / cm", placeholder: "1" }
      ],
      compute(values) {
        const absorbance = number(values.absorbance);
        const epsilon = number(values.epsilon);
        const path = number(values.path);
        if (absorbance < 0 || epsilon <= 0 || path <= 0) return error("Enter valid A, epsilon and path length.");
        return ok(`${(absorbance / (epsilon * path)).toExponential(3)} mol dm-3`, `${absorbance} / (${epsilon} x ${path})`);
      }
    },
    ph: {
      title: "Weak acid pH",
      fields: [
        { id: "ka", label: "Ka", placeholder: "1.8e-5" },
        { id: "concentration", label: "Acid concentration / mol dm-3", placeholder: "0.100" }
      ],
      compute(values) {
        const ka = number(values.ka);
        const concentration = number(values.concentration);
        if (ka <= 0 || concentration <= 0) return error("Enter positive Ka and concentration.");
        const h = Math.sqrt(ka * concentration);
        return ok(`pH ${(-Math.log10(h)).toFixed(2)}`, `[H+] approx sqrt(${ka} x ${concentration})`);
      }
    }
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    loadState();
    wireNavigation();
    wireGlobalActions();
    renderMetrics();
    renderDossierConsole();
    renderMethodSnapshots();
    renderMaterialsHome();
    populateAcademicFilters();
    renderAcademicLayer();
    selectConcept(data.concepts[0].id);
    populateFilters();
    renderReagents();
    selectReagent(data.reagents[0].id);
    renderRouteSelectors();
    renderMechanisms();
    selectMechanism(data.mechanisms[0].id);
    populateSpectraFilters();
    renderSpectra();
    renderCalculator();
    nextQuiz();
    populateElementFilters();
    renderElements();
    renderNotes();
    setupMoleculeCanvas();
  }

  function loadState() {
    const score = readJSON("chemvault-score", null);
    if (score) state.quiz = { ...state.quiz, ...score, current: null, answered: false };
    state.calcHistory = readJSON("chemvault-calc-history", []);
  }

  function wireNavigation() {
    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".menu-toggle");
    toggle?.addEventListener("click", () => {
      const open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    document.querySelectorAll(".site-nav a").forEach((link) => {
      link.addEventListener("click", () => {
        header.classList.remove("nav-open");
        toggle?.setAttribute("aria-expanded", "false");
      });
    });
  }

  function wireGlobalActions() {
    $("#globalSearch")?.addEventListener("input", renderGlobalSearch);
    $("#conceptQuery")?.addEventListener("input", renderAcademicLayer);
    $("#sourceFilter")?.addEventListener("change", renderAcademicLayer);
    $("#reagentQuery")?.addEventListener("input", renderReagents);
    $("#categoryFilter")?.addEventListener("change", renderReagents);
    $("#riskFilter")?.addEventListener("change", renderReagents);
    $("#spectraTechnique")?.addEventListener("change", renderSpectra);
    $("#spectraQuery")?.addEventListener("input", renderSpectra);
    $("#quizMode")?.addEventListener("change", nextQuiz);
    $("#elementQuery")?.addEventListener("input", renderElements);
    $("#elementGroup")?.addEventListener("change", renderElements);
    $("#noteForm")?.addEventListener("submit", saveNote);
    $("#questionForm")?.addEventListener("submit", prepareQuestion);

    document.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (!action) return;
      handleAction(action, event.target.closest("[data-id]")?.dataset.id);
    });

    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => {
        state.libraryView = button.dataset.view;
        document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item === button));
        renderReagents();
      });
    });

    document.querySelectorAll("[data-calc]").forEach((button) => {
      button.addEventListener("click", () => {
        state.calculator = button.dataset.calc;
        document.querySelectorAll("[data-calc]").forEach((item) => item.classList.toggle("active", item === button));
        renderCalculator();
      });
    });
  }

  function handleAction(action, id) {
    const handlers = {
      theme: toggleTheme,
      "random-reagent": randomReagent,
      "select-reagent": () => selectReagent(id),
      "save-reagent": () => toggleSaved(id),
      "compare-reagent": () => toggleCompare(id),
      "show-saved": showSavedReagents,
      "clear-saved": clearSaved,
      "clear-compare": clearCompare,
      "select-concept": () => selectConcept(id),
      "plan-route": planRoute,
      "select-mechanism": () => selectMechanism(id),
      "interpret-spectra": interpretSpectra,
      "next-quiz": nextQuiz,
      "reset-quiz": resetQuiz,
      "select-element": () => selectElement(id),
      "delete-note": () => deleteNote(id)
    };
    handlers[action]?.();
  }

  function renderMetrics() {
    $("#metricReagents").textContent = data.reagents.length;
    $("#metricMechanisms").textContent = data.mechanisms.length;
    $("#metricSpectra").textContent = data.spectra.length;
    $("#metricMaterials").textContent = materials?.materials?.length || 0;
    $("#metricSources").textContent = data.sources.length;
    updateSessionReadouts();
  }

  function renderDossierConsole() {
    if (!dossiers || !$("#dossierSpotlight")) return;
    const featured = [...dossiers.dossiers].sort((a, b) => b.maturity - a.maturity)[0];
    $("#dossierSpotlight").innerHTML = `
      <div class="spotlight-head">
        <div>
          <span class="tag">${escapeHTML(featured.status)}</span>
          <h3>${escapeHTML(featured.title)}</h3>
        </div>
        <strong>${featured.maturity}%</strong>
      </div>
      <p>${escapeHTML(featured.abstract)}</p>
      <div class="tag-row">${featured.keywords.map(tag).join("")}</div>
      <div class="paper-block">
        <span class="label">Central claim</span>
        <p>${escapeHTML(featured.claims[0])}</p>
      </div>
      <div class="linked-records">
        ${featured.linked.map((link) => `<a class="secondary-button" href="pages/${escapeHTML(link.href)}">${escapeHTML(link.label)}</a>`).join("")}
        <a class="primary-button" href="pages/dossiers.html?id=${encodeURIComponent(featured.id)}">Open dossier</a>
      </div>
    `;
    $("#methodLedger").innerHTML = dossiers.methods.map((method) => `
      <article class="method-card">
        <span>${escapeHTML(method.className)}</span>
        <strong>${escapeHTML(method.name)}</strong>
        <p>${escapeHTML(method.note)}</p>
        <div class="mini-meter"><span style="width: ${method.confidence}%"></span></div>
      </article>
    `).join("");
    $("#reviewQueue").innerHTML = dossiers.reviewQueue.map((item) => `
      <article class="queue-item">
        <span class="priority-${escapeHTML(item.priority)}">${escapeHTML(item.priority)}</span>
        <strong>${escapeHTML(item.item)}</strong>
        <small>${escapeHTML(item.due)}</small>
      </article>
    `).join("");
  }

  function renderMethodSnapshots() {
    if (!methods || !spectroscopy || !$("#methodSnapshot")) return;
    const protocol = methods.protocols.find((item) => item.id === "claim-audit") || methods.protocols[0];
    const spectralCase = spectroscopy.cases.find((item) => item.id === "aldehyde-vs-ketone") || spectroscopy.cases[0];
    $("#methodSnapshotTitle").textContent = protocol.title;
    $("#methodSnapshot").innerHTML = `
      <p>${escapeHTML(protocol.summary)}</p>
      <div class="paper-block">
        <span class="label">Protocol output</span>
        <p>${escapeHTML(protocol.outputs.slice(0, 3).join("; "))}</p>
      </div>
      <ol class="detail-list">${protocol.checklist.slice(0, 3).map(li).join("")}</ol>
    `;
    $("#methodRubricHome").innerHTML = methods.rubric.map((item) => `
      <div class="evidence-step">
        <span>${escapeHTML(item.grade)}</span>
        <div>
          <strong>${escapeHTML(item.name)}</strong>
          <p>${escapeHTML(item.standard)}</p>
        </div>
      </div>
    `).join("");
    $("#spectroscopySnapshotTitle").textContent = spectralCase.title;
    $("#spectroscopySnapshot").innerHTML = `
      <p>${escapeHTML(spectralCase.question)}</p>
      <div class="signal-matrix compact">
        ${spectralCase.signals.slice(0, 3).map((signal) => `
          <article>
            <span class="tag">${escapeHTML(signal.technique)}</span>
            <strong>${escapeHTML(signal.signal)}</strong>
            <p>${escapeHTML(signal.interpretation)}</p>
          </article>
        `).join("")}
      </div>
    `;
  }

  function renderMaterialsHome() {
    if (!materials || !$("#materialsHomeGrid")) return;
    const featured = materials.materials
      .filter((item) => ["graphene-oxide", "titania", "nafion-membrane", "lithium-iron-phosphate", "polyacrylamide-hydrogel", "zif-8"].includes(item.id));
    $("#materialsHomeGrid").innerHTML = featured.map((item) => `
      <a class="material-preview-card" href="pages/materials.html?id=${encodeURIComponent(item.id)}">
        <span>${escapeHTML(item.family)}</span>
        <strong>${escapeHTML(item.name)}</strong>
        <p>${escapeHTML(item.properties.slice(0, 2).join("; "))}</p>
        <small>${escapeHTML(item.characterization.slice(0, 2).join(" · "))}</small>
      </a>
    `).join("");
  }

  function updateSessionReadouts() {
    const saved = getSaved();
    $("#savedCount").textContent = saved.length;
    const accuracy = state.quiz.attempted ? Math.round(state.quiz.correct / state.quiz.attempted * 100) : 0;
    $("#accuracyReadout").textContent = `${accuracy}%`;
    $("#scoreCorrect").textContent = state.quiz.correct;
    $("#scoreAttempted").textContent = state.quiz.attempted;
    $("#scoreStreak").textContent = state.quiz.streak;
    $("#quizProgress").textContent = `${state.quiz.correct} / ${state.quiz.attempted}`;
  }

  function populateAcademicFilters() {
    const families = unique(data.sources.map((source) => source.family)).sort();
    $("#sourceFilter").innerHTML = `<option value="all">All source families</option>${families.map((family) => `<option>${escapeHTML(family)}</option>`).join("")}`;
  }

  function renderAcademicLayer(customConcepts) {
    const query = normalise($("#conceptQuery")?.value || "");
    const sourceFamily = $("#sourceFilter")?.value || "all";
    const allowedSources = sourceFamily === "all"
      ? data.sources
      : data.sources.filter((source) => source.family === sourceFamily);
    const allowedIds = new Set(allowedSources.map((source) => source.id));
    const concepts = Array.isArray(customConcepts) ? customConcepts : data.concepts.filter((concept) => {
      const sourceMatch = sourceFamily === "all" || concept.sourceRefs.some((id) => allowedIds.has(id));
      const text = normalise([concept.term, concept.family, concept.equation, concept.definition, concept.academicUse, concept.evidenceNote].join(" "));
      return sourceMatch && (!query || text.includes(query));
    });

    if (concepts.length && !concepts.some((concept) => concept.id === state.selectedConcept)) {
      selectConcept(concepts[0].id);
      return;
    }

    $("#conceptList").innerHTML = concepts.length ? concepts.map((concept) => `
      <button class="concept-item${concept.id === state.selectedConcept ? " selected" : ""}" type="button" data-action="select-concept" data-id="${concept.id}">
        <span>${escapeHTML(concept.family)}</span>
        <strong>${escapeHTML(concept.term)}</strong>
      </button>
    `).join("") : `<div class="empty-state">No concept matches this academic filter.</div>`;

    $("#evidenceLadder").innerHTML = data.evidenceStandards.map((item) => `
      <div class="evidence-step">
        <span>${escapeHTML(item.level)}</span>
        <div>
          <strong>${escapeHTML(item.name)}</strong>
          <p>${escapeHTML(item.claim)}</p>
          <small>${escapeHTML(item.standard)}</small>
        </div>
      </div>
    `).join("");

    renderSources(allowedSources);
  }

  function renderSources(sources = data.sources) {
    $("#sourceGrid").innerHTML = sources.map((source) => `
      <a class="source-card" href="${escapeHTML(source.url)}" target="_blank" rel="noreferrer">
        <span>${escapeHTML(source.family)}</span>
        <strong>${escapeHTML(source.short)}</strong>
        <p>${escapeHTML(source.note)}</p>
        <small>${escapeHTML(source.reliability)}</small>
      </a>
    `).join("");
  }

  function selectConcept(id) {
    const concept = data.concepts.find((item) => item.id === id);
    if (!concept) return;
    state.selectedConcept = id;
    const sources = data.sources.filter((source) => concept.sourceRefs.includes(source.id));
    $("#conceptDetail").innerHTML = `
      <div class="paper-head">
        <span class="tag">${escapeHTML(concept.family)}</span>
        <h3>${escapeHTML(concept.term)}</h3>
        <code>${escapeHTML(concept.equation)}</code>
      </div>
      <p>${escapeHTML(concept.definition)}</p>
      <div class="paper-block">
        <span class="label">Academic use</span>
        <p>${escapeHTML(concept.academicUse)}</p>
      </div>
      <div class="paper-block">
        <span class="label">Evidence note</span>
        <p>${escapeHTML(concept.evidenceNote)}</p>
      </div>
      <div class="reference-list">
        ${sources.map((source) => `
          <a href="${escapeHTML(source.url)}" target="_blank" rel="noreferrer">
            <strong>${escapeHTML(source.short)}</strong>
            <span>${escapeHTML(source.reliability)}</span>
          </a>
        `).join("")}
      </div>
    `;
    renderAcademicLayer();
  }

  function populateFilters() {
    const categories = unique(data.reagents.map((item) => item.category)).sort();
    $("#categoryFilter").innerHTML = `<option value="all">All categories</option>${categories.map((category) => `<option>${escapeHTML(category)}</option>`).join("")}`;
  }

  function filteredReagents() {
    const query = normalise($("#reagentQuery").value);
    const category = $("#categoryFilter").value;
    const risk = $("#riskFilter").value;
    return data.reagents.filter((item) => {
      const searchText = normalise([
        item.name,
        item.formula,
        item.category,
        item.focus,
        item.scope,
        item.mechanism,
        item.risk,
        ...item.tags,
        ...item.transformations,
        ...item.conditions,
        ...item.traps
      ].join(" "));
      return (!query || searchText.includes(query))
        && (category === "all" || item.category === category)
        && (risk === "all" || item.risk === risk);
    });
  }

  function renderReagents(customItems) {
    const items = Array.isArray(customItems) ? customItems : filteredReagents();
    const saved = getSaved();
    const grid = $("#reagentGrid");
    grid.classList.toggle("dense", state.libraryView === "dense");
    $("#libraryCount").textContent = `${items.length} ${items.length === 1 ? "match" : "matches"}`;
    grid.innerHTML = items.length ? items.map((item) => reagentCard(item, saved)).join("") : `<div class="empty-state">No reagent matches this filter.</div>`;
  }

  function reagentCard(item, saved) {
    const selected = item.id === state.selectedReagent ? " selected" : "";
    const compare = state.compare.includes(item.id) ? "Remove compare" : "Compare";
    const save = saved.includes(item.id) ? "Saved" : "Save";
    return `
      <article class="data-card${selected}">
        <div>
          <span class="formula">${escapeHTML(item.formula)}</span>
          <h3>${escapeHTML(item.name)}</h3>
          <span class="risk-${escapeHTML(item.risk)}">${riskLabel(item.risk)}</span>
        </div>
        <p>${escapeHTML(item.focus)}. ${escapeHTML(item.scope)}</p>
        <div class="tag-row">${item.tags.slice(0, 4).map(tag).join("")}</div>
        <div class="button-row">
          <button class="secondary-button" type="button" data-action="select-reagent" data-id="${item.id}">Open</button>
          <button class="secondary-button" type="button" data-action="save-reagent" data-id="${item.id}">${save}</button>
          <button class="secondary-button" type="button" data-action="compare-reagent" data-id="${item.id}">${compare}</button>
        </div>
      </article>
    `;
  }

  function selectReagent(id) {
    const item = data.reagents.find((reagent) => reagent.id === id);
    if (!item) return;
    state.selectedReagent = id;
    $("#focusReadout").textContent = item.focus;
    const saved = getSaved();
    $("#reagentDetail").innerHTML = `
      <span class="formula">${escapeHTML(item.formula)}</span>
      <h3>${escapeHTML(item.name)}</h3>
      <p><strong>${escapeHTML(item.category)}</strong> · <span class="risk-${escapeHTML(item.risk)}">${riskLabel(item.risk)}</span></p>
      <div class="tag-row">${item.tags.map(tag).join("")}</div>
      <h3>Transformations</h3>
      <ul class="detail-list">${item.transformations.map(li).join("")}</ul>
      <h3>Conditions</h3>
      <ul class="detail-list">${item.conditions.map(li).join("")}</ul>
      <h3>Mechanistic logic</h3>
      <p>${escapeHTML(item.mechanism)}</p>
      <h3>Exam traps</h3>
      <ul class="detail-list">${item.traps.map(li).join("")}</ul>
      <div class="route-output"><strong>Safety note:</strong> ${escapeHTML(item.safety)}</div>
      <div class="button-row">
        <button class="primary-button" type="button" data-action="save-reagent" data-id="${item.id}">${saved.includes(item.id) ? "Remove saved" : "Save reagent"}</button>
        <button class="secondary-button" type="button" data-action="compare-reagent" data-id="${item.id}">${state.compare.includes(item.id) ? "Remove comparison" : "Add to compare"}</button>
      </div>
    `;
    renderReagents();
    renderCompare();
  }

  function toggleSaved(id) {
    const saved = getSaved();
    const next = saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id];
    localStorage.setItem("chemvault-saved", JSON.stringify(next));
    updateSessionReadouts();
    renderReagents();
    if (state.selectedReagent === id) selectReagent(id);
  }

  function showSavedReagents() {
    const saved = getSaved();
    const items = data.reagents.filter((item) => saved.includes(item.id));
    renderReagents(items);
    $("#libraryCount").textContent = `${items.length} saved`;
  }

  function clearSaved() {
    localStorage.setItem("chemvault-saved", "[]");
    updateSessionReadouts();
    renderReagents();
    if (state.selectedReagent) selectReagent(state.selectedReagent);
  }

  function randomReagent() {
    const item = data.reagents[Math.floor(Math.random() * data.reagents.length)];
    selectReagent(item.id);
    document.location.hash = "reagents";
  }

  function toggleCompare(id) {
    if (state.compare.includes(id)) {
      state.compare = state.compare.filter((item) => item !== id);
    } else {
      state.compare = [...state.compare, id].slice(-3);
    }
    renderCompare();
    renderReagents();
  }

  function clearCompare() {
    state.compare = [];
    renderCompare();
    renderReagents();
  }

  function renderCompare() {
    const items = data.reagents.filter((item) => state.compare.includes(item.id));
    $("#comparePanel").innerHTML = items.length ? `
      <div class="compare-table">
        ${items.map((item) => `
          <div class="compare-row">
            <strong>${escapeHTML(item.formula)} · ${escapeHTML(item.name)}</strong>
            <p>${escapeHTML(item.transformations.slice(0, 2).join("; "))}</p>
            <span class="risk-${escapeHTML(item.risk)}">${riskLabel(item.risk)}</span>
          </div>
        `).join("")}
      </div>
    ` : `<div class="empty-state">Add up to three reagents for a compact comparison.</div>`;
  }

  function renderRouteSelectors() {
    const starts = unique(data.routes.map((route) => route.start)).sort();
    const targets = unique(data.routes.map((route) => route.target)).sort();
    $("#routeStart").innerHTML = starts.map((value) => `<option>${escapeHTML(value)}</option>`).join("");
    $("#routeTarget").innerHTML = targets.map((value) => `<option>${escapeHTML(value)}</option>`).join("");
  }

  function planRoute() {
    const start = $("#routeStart").value;
    const target = $("#routeTarget").value;
    const route = data.routes.find((item) => item.start === start && item.target === target);
    $("#routeOutput").innerHTML = route ? `
      <strong>${escapeHTML(start)} to ${escapeHTML(target)}</strong>
      <ol>${route.route.map(li).join("")}</ol>
      <p>${escapeHTML(route.note)}</p>
    ` : `<strong>No direct route in this static library.</strong><p>Try a different target or add this route in data/chem-data.js.</p>`;
  }

  function renderMechanisms() {
    $("#mechanismList").innerHTML = data.mechanisms.map((item) => `
      <button class="mechanism-card${item.id === state.selectedMechanism ? " selected" : ""}" type="button" data-action="select-mechanism" data-id="${item.id}">
        <span class="tag">${escapeHTML(item.className)}</span>
        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.summary)}</p>
      </button>
    `).join("");
  }

  function selectMechanism(id) {
    const item = data.mechanisms.find((mechanism) => mechanism.id === id);
    if (!item) return;
    state.selectedMechanism = id;
    $("#mechanismDetail").innerHTML = `
      <span class="tag">${escapeHTML(item.className)}</span>
      <h3>${escapeHTML(item.name)}</h3>
      <p>${escapeHTML(item.summary)}</p>
      <div class="tag-row">${item.bestFor.map(tag).join("")}</div>
      <div class="route-output"><strong>Rate law clue:</strong> ${escapeHTML(item.rateLaw)}<br><strong>Stereochemistry:</strong> ${escapeHTML(item.stereo)}</div>
      <div class="step-list">${item.steps.map((step, index) => `
        <div class="step-item"><span>${index + 1}</span><p>${escapeHTML(step)}</p></div>
      `).join("")}</div>
      <h3>Traps</h3>
      <ul class="detail-list">${item.traps.map(li).join("")}</ul>
    `;
    renderMechanisms();
  }

  function populateSpectraFilters() {
    const techniques = unique(data.spectra.map((item) => item.technique));
    $("#spectraTechnique").innerHTML = `<option value="all">All techniques</option>${techniques.map((value) => `<option>${escapeHTML(value)}</option>`).join("")}`;
  }

  function renderSpectra() {
    const technique = $("#spectraTechnique").value;
    const query = normalise($("#spectraQuery").value);
    const rows = data.spectra.filter((item) => {
      const text = normalise([item.technique, item.signal, item.assignment, item.clue, ...item.tags].join(" "));
      return (technique === "all" || item.technique === technique) && (!query || text.includes(query));
    });
    $("#spectraTable").innerHTML = rows.map((item) => `
      <tr>
        <td><strong>${escapeHTML(item.technique)}</strong></td>
        <td>${escapeHTML(item.signal)}</td>
        <td>${escapeHTML(item.assignment)}</td>
        <td>${escapeHTML(item.clue)}</td>
      </tr>
    `).join("") || `<tr><td colspan="4">No spectral reference matches this filter.</td></tr>`;
  }

  function interpretSpectra() {
    const text = $("#signalInput").value;
    const values = (text.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    if (!values.length) {
      $("#interpretationPanel").innerHTML = "Enter observed numeric signals first.";
      return;
    }
    const matches = data.spectra.filter((item) => item.max > 0 && values.some((value) => value >= item.min && value <= item.max));
    $("#interpretationPanel").innerHTML = matches.length ? `
      <strong>${matches.length} possible assignments</strong>
      <ul>${matches.slice(0, 8).map((item) => `<li>${escapeHTML(item.technique)} ${escapeHTML(item.signal)}: ${escapeHTML(item.assignment)}</li>`).join("")}</ul>
    ` : "No range matches found in the current reference table.";
  }

  function renderCalculator() {
    const def = calculatorDefs[state.calculator];
    $("#calculatorForm").innerHTML = `
      <div class="calc-field full"><h3>${escapeHTML(def.title)}</h3></div>
      ${def.fields.map((field) => `
        <div class="calc-field">
          <label for="calc-${field.id}">${escapeHTML(field.label)}</label>
          <input id="calc-${field.id}" name="${field.id}" type="number" step="any" placeholder="${escapeHTML(field.placeholder)}" />
        </div>
      `).join("")}
      <div class="calc-field full">
        <button class="primary-button" type="submit">Calculate</button>
      </div>
    `;
    $("#calculatorForm").onsubmit = runCalculator;
    renderCalcHistory();
  }

  function runCalculator(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    const def = calculatorDefs[state.calculator];
    const result = def.compute(values);
    $("#calculatorOutput").innerHTML = result.html;
    if (!result.failed) {
      state.calcHistory = [{ title: def.title, result: result.plain, detail: result.detail }, ...state.calcHistory].slice(0, 5);
      localStorage.setItem("chemvault-calc-history", JSON.stringify(state.calcHistory));
      renderCalcHistory();
    }
  }

  function renderCalcHistory() {
    $("#calcHistory").innerHTML = state.calcHistory.map((item) => `
      <div class="history-item"><strong>${escapeHTML(item.title)}:</strong> ${escapeHTML(item.result)}<br>${escapeHTML(item.detail)}</div>
    `).join("");
  }

  function nextQuiz() {
    const mode = $("#quizMode")?.value || "all";
    const bank = mode === "all" ? data.quiz : data.quiz.filter((item) => item.difficulty === mode);
    state.quiz.current = bank[Math.floor(Math.random() * bank.length)];
    state.quiz.answered = false;
    $("#quizDifficulty").textContent = state.quiz.current.difficulty;
    $("#quizQuestion").textContent = state.quiz.current.question;
    $("#quizOptions").innerHTML = state.quiz.current.options.map((option) => `
      <button class="quiz-option" type="button" data-answer="${escapeHTML(option)}">${escapeHTML(option)}</button>
    `).join("");
    $$("#quizOptions .quiz-option").forEach((button) => button.addEventListener("click", () => answerQuiz(button)));
    $("#quizFeedback").textContent = "Answer a question to see feedback.";
    updateSessionReadouts();
  }

  function answerQuiz(button) {
    if (state.quiz.answered) return;
    state.quiz.answered = true;
    const answer = button.dataset.answer;
    const correct = answer === state.quiz.current.answer;
    state.quiz.attempted += 1;
    if (correct) {
      state.quiz.correct += 1;
      state.quiz.streak += 1;
    } else {
      state.quiz.streak = 0;
      button.classList.add("wrong");
    }
    $$("#quizOptions .quiz-option").forEach((item) => {
      if (item.dataset.answer === state.quiz.current.answer) item.classList.add("correct");
    });
    $("#quizFeedback").innerHTML = `<strong>${correct ? "Correct." : "Not quite."}</strong><p>${escapeHTML(state.quiz.current.note)}</p>`;
    localStorage.setItem("chemvault-score", JSON.stringify({
      correct: state.quiz.correct,
      attempted: state.quiz.attempted,
      streak: state.quiz.streak
    }));
    updateSessionReadouts();
  }

  function resetQuiz() {
    state.quiz.correct = 0;
    state.quiz.attempted = 0;
    state.quiz.streak = 0;
    localStorage.removeItem("chemvault-score");
    nextQuiz();
  }

  function populateElementFilters() {
    const groups = unique(data.elements.map((item) => item.group)).sort();
    $("#elementGroup").innerHTML = `<option value="all">All groups</option>${groups.map((value) => `<option>${escapeHTML(value)}</option>`).join("")}`;
  }

  function renderElements() {
    const query = normalise($("#elementQuery").value);
    const group = $("#elementGroup").value;
    const items = data.elements.filter((item) => {
      const text = normalise([item.symbol, item.name, item.group, item.mass, item.notes].join(" "));
      return (group === "all" || item.group === group) && (!query || text.includes(query));
    });
    $("#elementGrid").innerHTML = items.map((item) => `
      <button class="element-tile${item.symbol === state.selectedElement ? " selected" : ""}" type="button" data-action="select-element" data-id="${escapeHTML(item.symbol)}">
        <span class="element-symbol">${escapeHTML(item.symbol)}</span>
        <h3>${escapeHTML(item.name)}</h3>
        <span class="element-meta">${item.number} · ${escapeHTML(item.group)}</span>
      </button>
    `).join("") || `<div class="empty-state">No element matches this filter.</div>`;
  }

  function selectElement(symbol) {
    const item = data.elements.find((element) => element.symbol === symbol);
    if (!item) return;
    state.selectedElement = symbol;
    $("#elementDetail").innerHTML = `
      <strong>${escapeHTML(item.name)} (${escapeHTML(item.symbol)})</strong>
      <p>Atomic number: ${item.number}<br>Relative atomic mass: ${escapeHTML(item.mass)}<br>Group: ${escapeHTML(item.group)}</p>
      <p>${escapeHTML(item.notes)}</p>
    `;
    renderElements();
  }

  function saveNote(event) {
    event.preventDefault();
    const title = $("#noteTitle").value.trim();
    const body = $("#noteBody").value.trim();
    if (!title || !body) return;
    const notes = readJSON("chemvault-notes", []);
    notes.unshift({ id: String(Date.now()), title, body, date: new Date().toLocaleDateString() });
    localStorage.setItem("chemvault-notes", JSON.stringify(notes.slice(0, 12)));
    event.currentTarget.reset();
    renderNotes();
  }

  function renderNotes() {
    const notes = readJSON("chemvault-notes", []);
    $("#notesPanel").innerHTML = notes.length ? notes.map((note) => `
      <article class="note-card">
        <span class="label">${escapeHTML(note.date)}</span>
        <h3>${escapeHTML(note.title)}</h3>
        <p>${escapeHTML(note.body)}</p>
        <button class="text-button" type="button" data-action="delete-note" data-id="${escapeHTML(note.id)}">delete</button>
      </article>
    `).join("") : `<div class="empty-state">No local notes yet.</div>`;
  }

  function deleteNote(id) {
    const notes = readJSON("chemvault-notes", []).filter((note) => note.id !== id);
    localStorage.setItem("chemvault-notes", JSON.stringify(notes));
    renderNotes();
  }

  function prepareQuestion(event) {
    event.preventDefault();
    const topic = $("#questionTopic").value;
    const body = $("#questionBody").value.trim();
    $("#questionPreview").innerHTML = body ? `
      <strong>${escapeHTML(topic)}</strong>
      <p>${escapeHTML(body)}</p>
      <p>Backend target: encrypt with a public key before storage, then moderate before publishing.</p>
    ` : "Write a draft first.";
  }

  function renderGlobalSearch() {
    const query = normalise($("#globalSearch").value);
    const panel = $("#globalResults");
    if (!query) {
      panel.classList.remove("active");
      panel.innerHTML = "";
      return;
    }
    const hits = [
      ...data.reagents.map((item) => ({ type: "Reagent", title: `${item.formula} · ${item.name}`, body: item.focus, href: `pages/reagents.html?id=${encodeURIComponent(item.id)}`, text: [item.formula, item.name, item.focus, item.category, ...item.tags].join(" ") })),
      ...(window.CHEMVAULT_RESEARCH?.caseStudies || []).map((item) => ({ type: "Case", title: item.title, body: item.question, href: `pages/research.html?case=${encodeURIComponent(item.id)}`, text: [item.title, item.discipline, item.question, item.thesis].join(" ") })),
      ...(dossiers?.dossiers || []).map((item) => ({ type: "Dossier", title: item.title, body: item.abstract, href: `pages/dossiers.html?id=${encodeURIComponent(item.id)}`, text: [item.title, item.field, item.status, item.abstract, ...item.keywords, ...item.claims].join(" ") })),
      ...(methods?.protocols || []).map((item) => ({ type: "Method", title: item.title, body: item.summary, href: `pages/methods.html?id=${encodeURIComponent(item.id)}`, text: [item.title, item.domain, item.level, item.summary, ...item.inputs, ...item.outputs].join(" ") })),
      ...(spectroscopy?.cases || []).map((item) => ({ type: "Spectroscopy", title: item.title, body: item.question, href: `pages/spectroscopy.html?id=${encodeURIComponent(item.id)}`, text: [item.title, item.family, item.question, item.conclusion, ...item.signals.flatMap((signal) => [signal.technique, signal.signal, signal.interpretation])].join(" ") })),
      ...(materials?.materials || []).map((item) => ({ type: "Material", title: item.name, body: item.synthesis, href: `pages/materials.html?id=${encodeURIComponent(item.id)}`, text: [item.name, item.family, item.formula, item.synthesis, ...item.applications, ...item.properties, ...item.characterization].join(" ") })),
      ...data.concepts.map((item) => ({ type: "Concept", title: item.term, body: item.definition, href: `pages/library.html?q=${encodeURIComponent(item.term)}`, text: [item.term, item.family, item.equation, item.definition, item.academicUse].join(" ") })),
      ...data.sources.map((item) => ({ type: "Source", title: item.short, body: item.note, href: `pages/library.html?q=${encodeURIComponent(item.short)}`, text: [item.title, item.short, item.family, item.note, item.reliability].join(" ") })),
      ...data.mechanisms.map((item) => ({ type: "Mechanism", title: item.name, body: item.summary, href: `pages/atlas.html?id=${encodeURIComponent(item.id)}`, text: [item.name, item.className, item.summary, ...item.bestFor].join(" ") })),
      ...data.spectra.map((item) => ({ type: "Spectra", title: `${item.technique} · ${item.signal}`, body: item.assignment, anchor: "#spectra", text: [item.technique, item.signal, item.assignment, item.clue, ...item.tags].join(" ") })),
      ...data.elements.map((item) => ({ type: "Element", title: `${item.symbol} · ${item.name}`, body: item.notes, anchor: "#elements", text: [item.symbol, item.name, item.group, item.notes].join(" ") }))
    ].filter((item) => normalise(item.text).includes(query)).slice(0, 8);
    panel.classList.toggle("active", true);
    panel.innerHTML = hits.length ? hits.map((hit) => `
      <a class="search-hit" href="${hit.href || hit.anchor}">
        <span>${escapeHTML(hit.type)}</span>
        <strong>${escapeHTML(hit.title)}</strong>
        <small>${escapeHTML(hit.body)}</small>
      </a>
    `).join("") : `<div class="empty-state">No matching chemistry resource.</div>`;
  }

  function setupMoleculeCanvas() {
    const canvas = $("#moleculeCanvas");
    if (!canvas) return;
    const context = canvas.getContext("2d");
    const atoms = Array.from({ length: 26 }, (_, index) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.55,
      label: ["C", "O", "N", "H", "Br", "Mg"][index % 6]
    }));

    function draw() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = getComputedStyle(document.body).getPropertyValue("--text").trim();
      context.strokeStyle = getComputedStyle(document.body).getPropertyValue("--line").trim();
      atoms.forEach((atom) => {
        atom.x += atom.vx;
        atom.y += atom.vy;
        if (atom.x < 18 || atom.x > canvas.width - 18) atom.vx *= -1;
        if (atom.y < 18 || atom.y > canvas.height - 18) atom.vy *= -1;
      });
      for (let i = 0; i < atoms.length; i += 1) {
        for (let j = i + 1; j < atoms.length; j += 1) {
          const dx = atoms[i].x - atoms[j].x;
          const dy = atoms[i].y - atoms[j].y;
          const distance = Math.hypot(dx, dy);
          if (distance < 138) {
            context.globalAlpha = 1 - distance / 138;
            context.beginPath();
            context.moveTo(atoms[i].x, atoms[i].y);
            context.lineTo(atoms[j].x, atoms[j].y);
            context.stroke();
          }
        }
      }
      context.globalAlpha = 1;
      atoms.forEach((atom) => {
        context.beginPath();
        context.arc(atom.x, atom.y, 15, 0, Math.PI * 2);
        context.fillStyle = atom.label === "O" ? "#ef6b61" : atom.label === "N" ? "#7ea7d8" : atom.label === "Br" ? "#80c96a" : atom.label === "Mg" ? "#e8bc55" : "#52c7b8";
        context.fill();
        context.fillStyle = "#0b0c0d";
        context.font = "800 12px ui-monospace, monospace";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(atom.label, atom.x, atom.y);
      });
      requestAnimationFrame(draw);
    }

    draw();
  }

  function toggleTheme() {
    const button = document.querySelector("[data-action='theme']");
    const next = nextThemeSetting(button?.dataset.themeState || readThemeSetting());
    startThemeTransition(button, next);
    applyLegacyTheme(next);
  }

  function applyLegacyTheme(theme, options = {}) {
    const setting = normaliseTheme(theme);
    const mode = resolveTheme(setting);
    const dark = mode === "dark";
    document.documentElement.dataset.themeSetting = setting;
    document.documentElement.dataset.themeResolved = mode;
    document.documentElement.classList.toggle("dark-mode", dark);
    document.documentElement.classList.toggle("light-mode", !dark);
    document.documentElement.style.colorScheme = mode;
    document.body.classList.toggle("dark-mode", dark);
    document.body.classList.toggle("light-mode", !dark);
    if (options.persist !== false) localStorage.setItem("chemvault-theme", setting);
    document.querySelector("meta[name='theme-color']")?.setAttribute("content", dark ? "#101114" : "#f5f5f7");
    document.querySelectorAll("[data-action='theme']").forEach((button) => {
      button.dataset.themeState = setting;
      button.dataset.themeResolved = mode;
      button.setAttribute("aria-label", themeLabel(setting, mode));
      button.setAttribute("title", themeTitle(setting, mode));
    });
  }

  function startThemeTransition(source, targetTheme) {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    const rect = source?.getBoundingClientRect?.();
    const targetMode = resolveTheme(normaliseTheme(targetTheme));
    root.style.setProperty("--theme-x", rect ? `${rect.left + rect.width / 2}px` : "50%");
    root.style.setProperty("--theme-y", rect ? `${rect.top + rect.height / 2}px` : "50%");
    root.dataset.themeTarget = targetMode;
    root.classList.remove("theme-switching");
    void root.offsetWidth;
    root.classList.add("theme-switching");
    window.clearTimeout(window.CHEMVAULT_THEME_TIMER);
    window.CHEMVAULT_THEME_TIMER = window.setTimeout(() => {
      root.classList.remove("theme-switching");
    }, 380);
  }

  function readThemeSetting() {
    return normaliseTheme(localStorage.getItem("chemvault-theme"));
  }

  function normaliseTheme(value) {
    return ["system", "light", "dark"].includes(value) ? value : "system";
  }

  function resolveTheme(setting) {
    return setting === "system" ? (themeQuery?.matches ? "dark" : "light") : setting;
  }

  function nextThemeSetting(setting) {
    const normalised = normaliseTheme(setting);
    if (normalised === "system") return resolveTheme("system") === "dark" ? "light" : "dark";
    return normalised === "light" ? "dark" : "system";
  }

  function themeLabel(setting, mode) {
    if (setting === "system") return `System theme, currently ${mode}. Switch to ${mode === "dark" ? "light" : "dark"} theme`;
    if (setting === "light") return "Light theme. Switch to dark theme";
    return "Dark theme. Switch to system theme";
  }

  function themeTitle(setting, mode) {
    if (setting === "system") return `System theme (${mode})`;
    return setting === "light" ? "Light theme" : "Dark theme";
  }

  function getSaved() {
    return readJSON("chemvault-saved", []);
  }

  function riskLabel(value) {
    return {
      standard: "standard caution",
      dry: "dry conditions",
      oxidizer: "oxidizer",
      corrosive: "corrosive profile"
    }[value] || value;
  }

  function ok(plain, detail) {
    return { plain, detail, html: `<strong>${escapeHTML(plain)}</strong><span>${escapeHTML(detail)}</span>` };
  }

  function error(message) {
    return { failed: true, plain: message, detail: "", html: escapeHTML(message) };
  }

  function format(value) {
    if (!Number.isFinite(value)) return "0";
    if (Math.abs(value) < 0.001 || Math.abs(value) >= 10000) return value.toExponential(3);
    return Number(value.toPrecision(4)).toString();
  }

  function number(value) {
    return Number.parseFloat(value);
  }

  function normalise(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9.+-]/g, "");
  }

  function unique(values) {
    return [...new Set(values)];
  }

  function tag(value) {
    return `<span class="tag">${escapeHTML(value)}</span>`;
  }

  function li(value) {
    return `<li>${escapeHTML(value)}</li>`;
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

  applyLegacyTheme(readThemeSetting());
  themeQuery?.addEventListener?.("change", () => {
    if (readThemeSetting() === "system") applyLegacyTheme("system", { persist: false });
  });
}());
