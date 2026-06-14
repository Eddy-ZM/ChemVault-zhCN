(() => {
  const data = window.CHEMVAULT_DATA || {};
  const materialsData = window.CHEMVAULT_MATERIALS || {};
  const external = window.CHEMVAULT_EXTERNAL || { sources: [] };
  const themeQuery = window.matchMedia?.("(prefers-color-scheme: dark)");

  const $ = (selector) => document.querySelector(selector);
  const encode = (value) => encodeURIComponent((value || "").trim());
  const normalise = (value) => String(value || "").toLowerCase();
  const searchIntent = () => window.CHEMVAULT_SEARCH_INTENT;

  const count = (items) => Array.isArray(items) ? items.length : 0;
  const typeKey = (record, index) => `${record.type || record.typeLabel || "record"}:${record.id || record.title || index}`;
  const compoundCategoryPatterns = {
    reactants: /\b(reactant|substrate|alkane|alkene|alkyne|cycloalkane|alcohol|aldehyde|ketone|carboxylic acid|ester|amine|alkyl halide|carbonyl|hydrocarbon|oxygenate|nitrogen compound)\b/,
    reagents: /\b(reagent|solvent|acid|base|oxidizer|catalyst|halogen|alcohol|aldehyde|ketone|ester|amine|alkyl halide|chloride|bromide|iodide|fluoride)\b/,
    materials: /\b(material|polymer|nanomaterial|oxide|salt|metal|inorganic|graphene|silica|alumina|zeolite|hydrogel|mof|alloy|ceramic)\b/,
    mechanisms: /\b(mechanism|substitution|elimination|addition|oxidation|reduction|hydrolysis|polymerization|carbonyl|alkene|alkyne|acid|base|amine|ester|halide|pi bond)\b/
  };

  function initShell() {
    const header = $(".site-header");
    const navToggle = $(".menu-toggle");
    if (header && navToggle) {
      navToggle.addEventListener("click", () => {
        const expanded = header.classList.toggle("nav-open");
        navToggle.setAttribute("aria-expanded", String(expanded));
      });
    }

    applyTheme(readThemeSetting());
    themeQuery?.addEventListener?.("change", () => {
      if (readThemeSetting() === "system") applyTheme("system", { persist: false });
    });
    document.querySelectorAll("[data-shell-action='theme'], [data-home-action='theme']").forEach((button) => {
      button.addEventListener("click", () => {
        const next = nextThemeSetting(button.dataset.themeState || readThemeSetting());
        startThemeTransition(button, next);
        applyTheme(next);
      });
    });

    document.querySelectorAll(".site-nav a").forEach((link) => {
      const target = normalisePath(new URL(link.getAttribute("href") || "", location.href).pathname);
      if (target === normalisePath(location.pathname)) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.querySelectorAll(".nav-more").forEach((group) => {
      const summary = group.querySelector("summary");
      if (!summary) return;
      if (group.querySelector("a[aria-current]")) summary.setAttribute("aria-current", "page");
      else summary.removeAttribute("aria-current");
    });
    adaptShellLayout();
  }

  function applyTheme(theme, options = {}) {
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
    document.querySelectorAll("[data-shell-action='theme'], [data-home-action='theme']").forEach((button) => {
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
    if (setting === "system") return `系统主题，当前为${mode === "dark" ? "深色" : "浅色"}。切换为${mode === "dark" ? "浅色" : "深色"}主题`;
    if (setting === "light") return "浅色主题。切换为深色主题";
    return "深色主题。切换为系统主题";
  }

  function themeTitle(setting, mode) {
    if (setting === "system") return `系统主题（${mode === "dark" ? "深色" : "浅色"}）`;
    return setting === "light" ? "浅色主题" : "深色主题";
  }

  function normalisePath(pathname) {
    let path = String(pathname || "").replace(/\/+$/, "");
    if (!path || path === "/") return "index";
    const file = path.split("/").pop() || "index";
    return file.replace(/\.html$/i, "") || "index";
  }

  function adaptShellLayout() {
    const header = $(".site-header");
    const shell = header?.querySelector(".nav-shell");
    const brand = shell?.querySelector(".brand");
    const nav = shell?.querySelector(".site-nav");
    const actions = shell?.querySelector(".header-actions");
    if (!header || !shell || !brand || !nav || !actions) return;

    let queued = false;
    const measure = () => {
      queued = false;
      if (window.matchMedia("(max-width: 900px)").matches) {
        header.classList.remove("nav-stacked");
        return;
      }

      const gap = parseFloat(getComputedStyle(shell).columnGap) || 0;
      const navGap = parseFloat(getComputedStyle(nav).columnGap) || 0;
      const navItems = [...nav.children].map((item) => item.matches(".nav-more") ? item.querySelector("summary") : item).filter(Boolean);
      const navWidth = navItems.reduce((total, item, index) => (
        total + item.scrollWidth + (index ? navGap : 0)
      ), 0);
      const requiredWidth = brand.scrollWidth + navWidth + actions.scrollWidth + (gap * 2) + 28;
      header.classList.toggle("nav-stacked", requiredWidth > shell.clientWidth);
    };
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener("load", schedule, { once: true });
    window.addEventListener("resize", schedule);
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(schedule);
      observer.observe(shell);
      observer.observe(nav);
      observer.observe(actions);
    }
  }

  function localIndex() {
    const records = window.CHEMVAULT_RECORDS;
    if (records?.buildRecords) {
      return records.buildRecords({ includeImported: true }).map((item) => ({
        id: item.id,
        recordType: item.type,
        type: item.typeLabel || item.type,
        title: item.title,
        body: item.body || item.subtitle || "",
        href: item.external ? item.href : records.recordUrl(item.type, item.id),
        external: item.external,
        imageUrl: item.imageUrl || item.raw?.imageUrl || "",
        formula: item.formula || "",
        tags: item.tags || [],
        domain: item.domain || "",
        family: item.family || "",
        raw: item.raw || {},
        searchText: item.searchText || ""
      }));
    }
    const rows = [];
    (data.reagents || []).forEach((item) => rows.push({
      id: item.id,
      recordType: "reagent",
      type: "Reagent dossier",
      title: item.name,
      body: [item.category, item.use, item.mechanism].filter(Boolean).join(" | "),
      formula: item.formula,
      tags: item.tags || [],
      searchText: [item.formula, item.name, item.focus, item.category, ...(item.tags || []), ...(item.transformations || [])].filter(Boolean).join(" "),
      href: `pages/reagents.html?id=${item.id}`
    }));
    (data.reactionSystems || []).forEach((item) => rows.push({
      id: item.id,
      recordType: "reaction",
      type: "Reaction system",
      title: item.name,
      body: [item.className, item.domain, ...(item.conditions || []), ...(item.readouts || [])].filter(Boolean).join(" | "),
      tags: [item.domain, ...(item.substrates || []), ...(item.reagents || []), ...(item.mechanisms || [])].filter(Boolean),
      href: `pages/workbench.html?id=${item.id}`
    }));
    (data.reactants || []).forEach((item) => rows.push({
      id: item.id,
      recordType: "reactant",
      type: "Reactant class",
      title: item.name,
      body: [item.className, ...(item.functionalGroups || []), ...(item.compatibleMethods || [])].filter(Boolean).join(" | "),
      tags: [...(item.functionalGroups || []), ...(item.compatibleMethods || [])],
      href: `pages/workbench.html?q=${encode(item.name)}`
    }));
    (data.compounds || []).forEach((item) => rows.push({
      id: item.id,
      recordType: "compound",
      type: "Compound record",
      title: item.name,
      body: [item.formula, item.family, item.summary, ...(item.synonyms || [])].filter(Boolean).join(" | "),
      formula: item.formula,
      tags: [...(item.synonyms || []), ...(item.tags || [])],
      href: `pages/search.html?q=${encode(item.name)}`
    }));
    (materialsData.materials || []).forEach((item) => rows.push({
      id: item.id,
      recordType: "material",
      type: "Material profile",
      title: item.name,
      body: [item.family, item.summary, (item.applications || []).slice(0, 2).join(", ")].filter(Boolean).join(" | "),
      formula: item.formula,
      tags: item.tags || [],
      href: `pages/materials.html?id=${item.id}`
    }));
    (data.mechanisms || []).forEach((item) => rows.push({
      id: item.id,
      recordType: "mechanism",
      type: "Mechanism atlas",
      title: item.name,
      body: [item.summary, (item.tags || []).join(", ")].filter(Boolean).join(" | "),
      tags: item.tags || [],
      href: `pages/atlas.html?id=${item.id}`
    }));
    (data.concepts || []).forEach((item) => rows.push({
      id: item.id,
      recordType: "concept",
      type: "Concept note",
      title: item.term,
      body: item.definition,
      tags: item.tags || [],
      href: `pages/library.html?q=${encode(item.term)}`
    }));
    return rows;
  }

  function renderMetrics() {
    const metrics = classifiedMetrics();
    Object.entries(metrics).forEach(([id, value]) => {
      const node = document.getElementById(id);
      if (node) node.textContent = value;
    });
  }

  function rawMetrics() {
    return {
      metricSystems: count(data.reactionSystems),
      metricReactants: count(data.reactants),
      metricReagents: count(data.reagents),
      metricCompounds: count(data.compounds),
      metricMaterials: count(materialsData.materials),
      metricMechanisms: count(data.mechanisms),
      metricSources: count(external.sources)
    };
  }

  function classifiedMetrics() {
    const records = metricRecords();
    if (!records.length) return rawMetrics();

    const buckets = {
      metricSystems: new Set(),
      metricReactants: new Set(),
      metricReagents: new Set(),
      metricCompounds: new Set(),
      metricMaterials: new Set(),
      metricMechanisms: new Set()
    };

    records.forEach((record, index) => {
      const type = normalise(record.type);
      const key = typeKey(record, index);
      const text = metricText(record);
      const compound = type === "compound";

      if (type === "reaction") buckets.metricSystems.add(key);
      if (type === "reactant" || (compound && compoundCategoryPatterns.reactants.test(text))) buckets.metricReactants.add(key);
      if (type === "reagent" || (compound && compoundCategoryPatterns.reagents.test(text))) buckets.metricReagents.add(key);
      if (compound) buckets.metricCompounds.add(key);
      if (type === "material" || (compound && compoundCategoryPatterns.materials.test(text))) buckets.metricMaterials.add(key);
      if (type === "mechanism" || (compound && compoundCategoryPatterns.mechanisms.test(text))) buckets.metricMechanisms.add(key);
    });

    const fallback = rawMetrics();
    return {
      metricSystems: buckets.metricSystems.size || fallback.metricSystems,
      metricReactants: buckets.metricReactants.size || fallback.metricReactants,
      metricReagents: buckets.metricReagents.size || fallback.metricReagents,
      metricCompounds: buckets.metricCompounds.size || fallback.metricCompounds,
      metricMaterials: buckets.metricMaterials.size || fallback.metricMaterials,
      metricMechanisms: buckets.metricMechanisms.size || fallback.metricMechanisms,
      metricSources: fallback.metricSources
    };
  }

  function metricRecords() {
    const records = window.CHEMVAULT_RECORDS;
    if (!records?.buildRecords) return [];
    try {
      return records.buildRecords({ includeImported: false });
    } catch {
      return [];
    }
  }

  function metricText(record) {
    const raw = record.raw || {};
    return normalise([
      record.type,
      record.typeLabel,
      record.title,
      record.subtitle,
      record.body,
      record.domain,
      record.family,
      record.category,
      record.formula,
      record.risk,
      ...(record.tags || []),
      raw.family,
      raw.category,
      raw.summary,
      raw.evidenceNote,
      ...(raw.tags || []),
      ...(raw.synonyms || [])
    ].filter(Boolean).join(" "));
  }

  async function renderBackendStatus() {
    const label = $("#backendStatusLabel");
    const mode = $("#backendStatusMode");
    const list = $("#backendStatusList");
    const setStatus = (items, code = "本地备用") => {
      if (label) label.textContent = items[0] || "本地备用数据";
      if (mode) mode.textContent = code;
      if (list) list.innerHTML = items.map((item) => `<span>${escapeHTML(item)}</span>`).join("");
    };

    setStatus(["本地备用数据"], "API 检查中");
    try {
      const health = await window.CHEMVAULT_API?.health?.();
      if (!health) {
        setStatus(["本地备用数据"], "API 不可用");
        return;
      }
      const items = [];
      if (health.backend === "d1" || health.features?.d1) items.push("D1 已连接");
      else items.push("本地备用数据");
      if (health.features?.academicEnrichment) items.push("学术来源补充可用");
      setStatus(items, health.backend === "d1" ? "D1" : "本地备用");
    } catch {
      setStatus(["本地备用数据"], "API 不可用");
    }
  }

  function externalUrl(source, query) {
    const encoded = encode(query);
    if (!encoded) return source.baseUrl;
    return source.queryUrl.replace("{query}", encoded);
  }

  function renderGateway(query = "") {
    const gateway = $("#externalGateway");
    if (!gateway) return;
    gateway.innerHTML = external.sources.map((source) => `
      <a class="external-source-card" href="${externalUrl(source, query)}" target="_blank" rel="noreferrer">
        <span class="eyebrow">${source.owner}</span>
        <strong>${source.name}</strong>
        <span>${source.scope}</span>
      </a>
    `).join("");
  }

  function localSearchText(item) {
    return normalise([
      item.searchText,
      item.title,
      item.type,
      item.body,
      item.formula,
      item.domain,
      item.family,
      ...(item.tags || [])
    ].filter(Boolean).join(" "));
  }

  function recordIdentity(item) {
    return searchIntent()?.recordKey?.(item) || `${item.type}:${item.id || item.title}`;
  }

  function localHitsFor(query, limit) {
    const term = normalise(query);
    if (!term) return [];
    const index = localIndex();
    const seen = new Set();
    const hits = [];
    const addHit = (item) => {
      const key = recordIdentity(item);
      if (seen.has(key)) return;
      seen.add(key);
      hits.push(item);
    };

    (searchIntent()?.rank?.(query, index, { limit }) || []).forEach((match) => addHit(match.item));
    index
      .filter((item) => localSearchText(item).includes(term))
      .slice(0, limit)
      .forEach(addHit);
    return hits.slice(0, limit);
  }

  function renderQuickLinks(query = "") {
    const panel = $("#homeQuickLinks");
    if (!panel) return;
    const term = normalise(query);
    if (!term) {
      panel.innerHTML = `
        <a href="pages/reagents.html">浏览试剂档案</a>
        <a href="pages/materials.html">浏览材料资料</a>
        <a href="pages/search.html">打开学术检索</a>
      `;
      return;
    }

    const hits = localHitsFor(query, 4);
    const localLinks = hits.map((item) => `
      <a class="home-quick-card" href="${item.href}">
        <img src="${escapeHTML(thumbnailFor(item))}" data-fallback-src="${escapeHTML(placeholderImage(item.type, item.title, item.formula || item.family || item.domain || ""))}" alt="" loading="lazy" referrerpolicy="no-referrer" />
        <span>${escapeHTML(item.type)}</span>
        <strong>${escapeHTML(item.title)}</strong>
      </a>
    `).join("");
    panel.innerHTML = `
      ${localLinks || `<a href="pages/search.html?q=${encode(query)}">未找到本地预览，打开学术检索。</a>`}
      <a href="${externalUrl(external.sources[0], query)}" target="_blank" rel="noreferrer">继续在 PubMed 检索</a>
      <a href="${externalUrl(external.sources[1], query)}" target="_blank" rel="noreferrer">继续在 PubChem 检索</a>
    `;
    wireImageFallbacks(panel);
  }

  function wireTopbarSearch() {
    const input = $("#shellSearch");
    const panel = $("#shellSearchResults");
    if (!input || !panel) return;
    const shell = input.closest(".search-shell");
    const syncShell = () => {
      const hasValue = Boolean(input.value.trim());
      shell?.classList.toggle("has-value", hasValue);
      shell?.classList.toggle("is-expanded", hasValue || document.activeElement === input);
    };
    input.addEventListener("focus", syncShell);
    input.addEventListener("blur", () => {
      window.setTimeout(syncShell, 120);
    });
    input.addEventListener("input", () => {
      syncShell();
      const rawQuery = input.value.trim();
      const term = normalise(rawQuery);
      if (!term) {
        panel.classList.remove("active");
        panel.innerHTML = "";
        return;
      }

      const localHits = localHitsFor(rawQuery, 6).map((item) => ({ ...item, external: false }));
      const externalHits = (external.sources || []).slice(0, 4).map((source) => ({
        type: "External",
        title: `Search ${source.name}`,
        body: source.bestFor,
        href: externalUrl(source, rawQuery),
        external: true,
        imageUrl: placeholderImage("External", source.name, source.family)
      }));
      const hits = [...localHits, ...externalHits].slice(0, 8);
      panel.classList.add("active");
      panel.innerHTML = hits.length ? hits.map((hit) => `
        <a class="search-hit" href="${hit.href}"${hit.external ? ' target="_blank" rel="noreferrer"' : ""}>
          <img src="${escapeHTML(thumbnailFor(hit))}" data-fallback-src="${escapeHTML(placeholderImage(hit.type, hit.title, hit.formula || hit.family || hit.domain || ""))}" alt="" loading="lazy" referrerpolicy="no-referrer" />
          <span>${escapeHTML(hit.type)}</span>
          <strong>${escapeHTML(hit.title)}</strong>
          <small>${escapeHTML(hit.body)}</small>
        </a>
      `).join("") : `<div class="empty-state">未找到匹配的学术记录。</div>`;
      wireImageFallbacks(panel);
    });
    syncShell();
  }

  function initSearch() {
    const form = $("#homeSearchForm");
    const input = $("#homeSearch");
    if (!form || !input) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("q")) {
      input.value = params.get("q");
      renderQuickLinks(input.value);
      renderGateway(input.value);
    } else {
      renderQuickLinks();
      renderGateway();
    }

    input.addEventListener("input", () => {
      renderQuickLinks(input.value);
      renderGateway(input.value);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = input.value.trim();
      const target = query ? `pages/search.html?q=${encode(query)}` : "pages/search.html";
      if (window.CHEMVAULT_MOTION?.navigate) {
        window.CHEMVAULT_MOTION.navigate(target, "Academic Search");
        return;
      }
      window.location.href = target;
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initShell();
    renderMetrics();
    renderBackendStatus();
    initSearch();
    wireTopbarSearch();
  });

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function thumbnailFor(item) {
    if (item.imageUrl) return item.imageUrl;
    const cid = pubChemCidFrom(item);
    if (cid && canUsePubChemName(item.title)) {
      return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${encodeURIComponent(cid)}/PNG?record_type=2d&image_size=small`;
    }
    if (/reagent|compound/i.test(item.type || "") && canUsePubChemName(item.title)) {
      return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(item.title.replace(/^.*·\s*/, ""))}/PNG?record_type=2d&image_size=small`;
    }
    return placeholderImage(item.type, item.title, item.formula || item.family || item.domain || "");
  }

  function canUsePubChemName(title) {
    const text = String(title || "").trim();
    return Boolean(text)
      && !/\breference\b/i.test(text)
      && !/\b(panel|system|class|mixture|solution|buffer|assay|test|screen|candidate|reaction)\b/i.test(text)
      && !/^syscat-/i.test(text);
  }

  function pubChemCidFrom(item = {}) {
    const raw = item.raw || {};
    const cid = item.cid || raw.cid || raw.CID;
    if (cid) return cid;
    const href = String(item.sourceHref || raw.sourceHref || raw.href || raw.url || "");
    const match = href.match(/pubchem\.ncbi\.nlm\.nih\.gov\/compound\/(\d+)/i);
    return match?.[1] || "";
  }

  function placeholderImage(type, title, subtitle = "") {
    const palette = imagePalette(type);
    const formula = imageFormula(subtitle);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240" role="img" aria-label="${svgEsc(title)}"><rect width="360" height="240" fill="${palette.bg}"/><rect x="16" y="16" width="328" height="208" rx="18" fill="#fff" stroke="${palette.border}"/><text x="30" y="45" fill="${palette.accent}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif" font-size="15" font-weight="800">${svgEsc(type).slice(0, 24)}</text><g transform="translate(45 68)" fill="none" stroke="${palette.line}" stroke-linecap="round" stroke-linejoin="round"><path d="M52 0 92 23v46l-40 23-40-23V23Z" stroke-width="6" opacity=".74"/><path d="M92 23h46M92 69h46M12 23l-30-18M12 69l-30 18" stroke-width="5" opacity=".46"/><circle cx="52" cy="0" r="10" fill="${palette.accent}" stroke="none"/><circle cx="92" cy="69" r="10" fill="${palette.accent2}" stroke="none"/></g><text x="210" y="100" fill="${palette.text}" font-family="SFMono-Regular,Menlo,Consolas,monospace" font-size="19" font-weight="800">${svgEsc(formula || "Chem").slice(0, 10)}</text><text x="30" y="198" fill="${palette.text}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif" font-size="21" font-weight="850">${svgEsc(title).slice(0, 24)}</text><text x="30" y="217" fill="${palette.muted}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif" font-size="12" font-weight="650">${svgEsc(subtitle).slice(0, 32)}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function imagePalette(type) {
    const key = String(type || "").toLowerCase();
    if (key.includes("material")) return { bg: "#f5f5f7", border: "#d2d2d7", line: "#64748b", accent: "#0071e3", accent2: "#2bbbad", text: "#1d1d1f", muted: "#6e6e73" };
    if (key.includes("external") || key.includes("source") || key.includes("article")) return { bg: "#f5f5f7", border: "#d2d2d7", line: "#52525b", accent: "#0071e3", accent2: "#f59e0b", text: "#1d1d1f", muted: "#6e6e73" };
    return { bg: "#f5f5f7", border: "#d2d2d7", line: "#1d1d1f", accent: "#0071e3", accent2: "#2bbbad", text: "#1d1d1f", muted: "#6e6e73" };
  }

  function imageFormula(subtitle) {
    const value = String(subtitle || "").split("·")[0].trim();
    if (!value || value.length > 18) return "";
    return /[A-Z][A-Za-z0-9()[\].+\-/ ]/.test(value) ? value : "";
  }

  function svgEsc(value) {
    return String(value || "").replace(/[&<>"]/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;"
    }[char]));
  }

  function wireImageFallbacks(root) {
    root.querySelectorAll("img[data-fallback-src]").forEach((image) => {
      const applyFallback = () => {
        if (image.dataset.fallbackApplied) return;
        image.dataset.fallbackApplied = "true";
        image.src = image.dataset.fallbackSrc;
      };
      image.addEventListener("error", applyFallback, { once: true });
      if (image.complete && image.naturalWidth === 0) applyFallback();
    });
  }
})();
