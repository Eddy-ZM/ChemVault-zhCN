(() => {
  const data = window.CHEMVAULT_DATA || {};
  const research = window.CHEMVAULT_RESEARCH || {};
  const dossiers = window.CHEMVAULT_DOSSIERS || {};
  const methods = window.CHEMVAULT_METHODS || {};
  const spectroscopy = window.CHEMVAULT_SPECTROSCOPY || {};
  const materials = window.CHEMVAULT_MATERIALS || {};
  const external = window.CHEMVAULT_EXTERNAL || { sources: [] };
  const importedStoreKey = "chemvault-imported-records";
  const focusStoreKey = "chemvault-focus-record";
  const liveCache = new Map();
  let liveController = null;
  let latestLiveCandidates = [];
  let backendRecords = [];
  let latestSearchRun = 0;
  let currentResultMap = new Map();
  const $ = (selector) => document.querySelector(selector);
  const searchIntent = () => window.CHEMVAULT_SEARCH_INTENT;
  const esc = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
  const encode = (value) => encodeURIComponent((value || "").trim());
  const normalise = (value) => String(value || "").toLowerCase();
  const compact = (value) => normalise(value).replace(/[^a-z0-9.+-]/g, " ").replace(/\s+/g, " ").trim();
  const recordApi = () => window.CHEMVAULT_RECORDS;

  function externalUrl(source, query) {
    const encoded = encode(query);
    if (!encoded) return source.baseUrl;
    return source.queryUrl.replace("{query}", encoded);
  }

  function mergeIndexRows(localRows, remoteRows) {
    const seen = new Set();
    return [...(localRows || []), ...(remoteRows || [])].filter((item) => {
      const key = `${item.recordType || item.type}:${item.id || compact(item.title)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function toIndexRecord(record, fallbackSource = "imported", explicitDataSource = "") {
    const type = record.type || "imported";
    const typeLabel = record.typeLabel || record.type_label || type;
    const body = record.body || record.subtitle || "";
    const href = record.href || `record.html?type=${encode(type)}&id=${encode(record.id)}`;
    const external = /^https?:\/\//i.test(href);
    const raw = record.raw || {};
    const rawSource = raw.source || raw.raw?.source;
    const source = rawSource || explicitDataSource || dataSourceFromRecord(record, fallbackSource);
    return {
      id: record.id,
      recordType: type,
      type: typeLabel,
      title: record.title || record.id,
      subtitle: record.subtitle || "",
      body,
      tags: record.tags || [],
      href,
      external,
      domain: record.domain || "",
      family: record.family || "",
      risk: record.risk || "",
      maturity: Number(record.maturity || 0),
      formula: record.formula || raw.formula || "",
      sourceHref: record.sourceHref || record.source_href || "",
      sourceKind: source === "Curated" || source === "D1" || source === "Fallback" ? "curated" : "imported",
      dataSource: source,
      imageUrl: record.imageUrl || record.image_url || record.raw?.imageUrl || "",
      hazardStatements: record.hazardStatements || raw.hazardStatements || [],
      hazardLevel: record.hazardLevel || raw.hazardLevel || "",
      signalWord: record.signalWord || raw.signalWord || "",
      precautionaryStatements: record.precautionaryStatements || raw.precautionaryStatements || [],
      disposalMethod: record.disposalMethod || raw.disposalMethod || "",
      safetySource: record.safetySource || raw.safetySource || "",
      checkStatus: record.checkStatus || raw.checkStatus || (raw.source ? "accepted" : source.toLowerCase()),
      checkedAt: record.checkedAt || raw.checkedAt || record.updatedAt || record.updated_at || "",
      raw,
      updatedAt: record.updatedAt || record.updated_at || "",
      searchText: record.searchText || compact(`${typeLabel} ${record.title} ${record.subtitle || ""} ${body} ${record.formula || ""} ${(record.tags || []).join(" ")} ${(record.hazardStatements || raw.hazardStatements || []).join(" ")} ${record.disposalMethod || raw.disposalMethod || ""}`)
    };
  }

  function dataSourceFromRecord(record, fallbackSource) {
    const rawSource = record.raw?.source || record.raw?.raw?.source;
    if (rawSource === "PubChem" || rawSource === "PubMed") return rawSource;
    if (fallbackSource === "d1") return "D1";
    if (fallbackSource === "fallback" || fallbackSource === "browser-fallback") return "Fallback";
    if (fallbackSource === "session") return "Session import";
    if (fallbackSource === "curated") return "Curated";
    if (record.external) return "Session import";
    return rawSource || "Curated";
  }

  function thumbnailFor(item) {
    if (item.imageUrl) return displayImageUrl(item.imageUrl);
    const cid = pubChemCidFrom(item);
    if (cid && canUsePubChemName(item.title)) {
      return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${encodeURIComponent(cid)}/PNG?record_type=2d&image_size=large`;
    }
    const type = `${item.recordType || ""} ${item.type || ""}`.toLowerCase();
    if ((type.includes("compound") || type.includes("reagent")) && canUsePubChemName(item.title)) {
      return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(item.title)}/PNG?record_type=2d&image_size=large`;
    }
    return placeholderImage(item.type || item.recordType || "Record", item.title || "ChemVault", item.family || item.domain || "");
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

  function displayImageUrl(url) {
    return String(url || "").replace("image_size=small", "image_size=large");
  }

  function placeholderImage(type, title, subtitle = "") {
    const palette = imagePalette(type);
    const formula = imageFormula(subtitle);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420" role="img" aria-label="${svgEsc(title)}"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${palette.bg}"/><stop offset="1" stop-color="${palette.bg2}"/></linearGradient></defs><rect width="640" height="420" fill="url(#bg)"/><rect x="28" y="28" width="584" height="364" rx="28" fill="#fff" stroke="${palette.border}"/><text x="54" y="76" fill="${palette.accent}" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="800">${svgEsc(type).slice(0, 34)}</text><g transform="translate(74 112)" fill="none" stroke="${palette.line}" stroke-linecap="round" stroke-linejoin="round"><path d="M104 0 184 46v92l-80 46-80-46V46Z" stroke-width="10" opacity=".74"/><path d="M184 46h82M184 138h82M24 46l-54-32M24 138l-54 32" stroke-width="8" opacity=".48"/><path d="M266 46 318 16M266 138l52 30" stroke-width="7" opacity=".38"/><circle cx="104" cy="0" r="18" fill="${palette.accent}" stroke="none"/><circle cx="184" cy="138" r="18" fill="${palette.accent2}" stroke="none"/><circle cx="318" cy="16" r="15" fill="${palette.accent}" stroke="none"/></g><text x="372" y="168" fill="${palette.text}" font-family="SFMono-Regular,Menlo,Consolas,monospace" font-size="36" font-weight="800">${svgEsc(formula || "Chem record").slice(0, 18)}</text><text x="372" y="206" fill="${palette.muted}" font-family="Inter,Arial,sans-serif" font-size="18" font-weight="700">curated preview</text><text x="54" y="338" fill="${palette.text}" font-family="Inter,Arial,sans-serif" font-size="34" font-weight="850">${svgEsc(title).slice(0, 30)}</text><text x="54" y="370" fill="${palette.muted}" font-family="Inter,Arial,sans-serif" font-size="19" font-weight="650">${svgEsc(subtitle).slice(0, 48)}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function imagePalette(type) {
    const key = String(type || "").toLowerCase();
    if (key.includes("material")) return { bg: "#f5f5f7", bg2: "#ecf6f4", border: "#d2d2d7", line: "#64748b", accent: "#0071e3", accent2: "#2bbbad", text: "#1d1d1f", muted: "#6e6e73" };
    if (key.includes("article") || key.includes("source") || key.includes("pubmed")) return { bg: "#f5f5f7", bg2: "#fff7ed", border: "#d2d2d7", line: "#52525b", accent: "#0071e3", accent2: "#f59e0b", text: "#1d1d1f", muted: "#6e6e73" };
    return { bg: "#f5f5f7", bg2: "#eef4ff", border: "#d2d2d7", line: "#1d1d1f", accent: "#0071e3", accent2: "#2bbbad", text: "#1d1d1f", muted: "#6e6e73" };
  }

  function imageFormula(subtitle) {
    const value = String(subtitle || "").split("·")[0].trim();
    if (!value || value.length > 28) return "";
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

  function wireImageFallbacks(root = document) {
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

  function buildIndex() {
    const api = recordApi();
    if (api?.buildRecords) {
      const rows = api.buildRecords({ includeImported: true }).map((record) => {
        const rawSource = record.raw?.source || record.raw?.raw?.source;
        const dataSource = record.external ? "Session import" : rawSource === "PubChem" || rawSource === "PubMed" ? rawSource : "Curated";
        return ({
        id: record.id,
        recordType: record.type,
        type: record.typeLabel || record.type,
        title: record.title,
        body: record.body || record.subtitle || "",
        tags: record.tags || [],
        href: record.external ? record.href : api.recordUrl(record.type, record.id),
        external: record.external,
        domain: record.domain || "",
        family: record.family || "",
        risk: record.risk || "",
        maturity: Number(record.maturity || 0),
        formula: record.formula || "",
        subtitle: record.subtitle || "",
        sourceHref: record.sourceHref || "",
        raw: record.raw || {},
        hazardStatements: record.hazardStatements || record.raw?.hazardStatements || [],
        hazardLevel: record.hazardLevel || record.raw?.hazardLevel || "",
        signalWord: record.signalWord || record.raw?.signalWord || "",
        precautionaryStatements: record.precautionaryStatements || record.raw?.precautionaryStatements || [],
        disposalMethod: record.disposalMethod || record.raw?.disposalMethod || "",
        safetySource: record.safetySource || record.raw?.safetySource || "",
        checkStatus: record.checkStatus || record.raw?.checkStatus || (record.raw?.source ? "accepted" : "curated"),
        checkedAt: record.checkedAt || record.raw?.checkedAt || "",
        sourceKind: record.external || dataSource === "PubChem" || dataSource === "PubMed" ? "imported" : "curated",
        dataSource,
        imageUrl: record.imageUrl || record.raw?.imageUrl || "",
        searchText: record.searchText || compact(`${record.title} ${record.body} ${(record.tags || []).join(" ")}`)
      });
      });
      return mergeIndexRows(rows, backendRecords);
    }
    const rows = [];
    getImportedRecords().forEach((item) => rows.push(item));
    (data.reactionSystems || []).forEach((item) => rows.push({
      type: "Reaction",
      title: item.name,
      body: [item.className, item.domain, (item.conditions || []).join(", "), (item.readouts || []).join(", "), (item.limitations || []).join(", ")].filter(Boolean).join(" | "),
      tags: [item.domain, ...(item.substrates || []), ...(item.reagents || []), ...(item.mechanisms || [])].filter(Boolean),
      href: `workbench.html?id=${item.id}`
    }));
    (data.reactants || []).forEach((item) => rows.push({
      type: "Reactant",
      title: item.name,
      body: [item.className, (item.functionalGroups || []).join(", "), (item.compatibleMethods || []).join(", "), (item.constraints || []).join(", ")].filter(Boolean).join(" | "),
      tags: item.functionalGroups || [],
      href: `workbench.html?q=${encode(item.name)}`
    }));
    (data.reagents || []).forEach((item) => rows.push({
      type: "Reagent",
      title: item.name,
      body: [item.category, item.use, item.mechanism, item.hazards, (item.conditions || []).join(", ")].filter(Boolean).join(" | "),
      tags: item.tags || [],
      href: `reagents.html?id=${item.id}`
    }));
    (data.compounds || []).forEach((item) => rows.push({
      type: "Compound",
      title: item.name,
      body: [item.formula, item.family, item.summary, item.evidenceNote].filter(Boolean).join(" | "),
      tags: [item.formula, item.cas, ...(item.synonyms || []), ...(item.tags || [])].filter(Boolean),
      href: `search.html?q=${encode(item.name)}`
    }));
    (materials.materials || []).forEach((item) => rows.push({
      type: "Material",
      title: item.name,
      body: [item.family, item.summary, (item.applications || []).join(", "), (item.characterization || []).join(", ")].filter(Boolean).join(" | "),
      tags: item.tags || [],
      href: `materials.html?id=${item.id}`
    }));
    (data.routes || []).forEach((item) => rows.push({
      type: "Route",
      title: `${item.start} to ${item.target}`,
      body: [item.note, (item.route || []).join(" -> ")].filter(Boolean).join(" | "),
      tags: item.route || [],
      href: `library.html?q=${encode(`${item.start} ${item.target}`)}`
    }));
    (data.mechanisms || []).forEach((item) => rows.push({
      type: "Mechanism",
      title: item.name,
      body: [item.summary, (item.steps || []).join(" "), (item.tags || []).join(", ")].filter(Boolean).join(" | "),
      tags: item.tags || [],
      href: `atlas.html?id=${item.id}`
    }));
    (data.concepts || []).forEach((item) => rows.push({
      type: "Concept",
      title: item.term,
      body: item.definition,
      tags: item.tags || [],
      href: `library.html?q=${encode(item.term)}`
    }));
    (data.sources || []).forEach((item) => rows.push({
      type: "Source",
      title: item.short,
      body: [item.title, item.family, item.note].filter(Boolean).join(" | "),
      tags: [item.family].filter(Boolean),
      href: `library.html?q=${encode(item.short)}`
    }));
    (research.caseStudies || []).forEach((item) => rows.push({
      type: "Research case",
      title: item.title,
      body: [item.abstract, (item.techniques || []).join(", "), (item.reagents || []).join(", ")].filter(Boolean).join(" | "),
      tags: item.tags || [],
      href: `research.html?case=${item.id}`
    }));
    (dossiers.dossiers || []).forEach((item) => rows.push({
      type: "Dossier",
      title: item.title,
      body: [item.summary, (item.highlights || []).join(" "), (item.references || []).join(" ")].filter(Boolean).join(" | "),
      tags: item.tags || [],
      href: `dossiers.html?id=${item.id}`
    }));
    (methods.protocols || []).forEach((item) => rows.push({
      type: "Method",
      title: item.title,
      body: [item.summary, (item.workflow || []).join(" "), (item.qualityControls || []).join(" ")].filter(Boolean).join(" | "),
      tags: item.tags || [],
      href: `methods.html?id=${item.id}`
    }));
    (spectroscopy.cases || []).forEach((item) => rows.push({
      type: "Spectroscopy",
      title: item.title,
      body: [item.summary, (item.signals || []).join(" "), (item.assignments || []).join(" ")].filter(Boolean).join(" | "),
      tags: item.tags || [],
      href: `spectroscopy.html?id=${item.id}`
    }));
    return mergeIndexRows(rows, backendRecords);
  }

  function score(item, query) {
    const q = compact(query);
    const haystack = item.searchText || compact(`${item.title} ${item.type} ${item.body} ${(item.tags || []).join(" ")}`);
    if (!q) return 1;
    if (!haystack.includes(q)) return 0;
    let value = 10;
    if (compact(item.title).includes(q)) value += 12;
    if (compact(item.type).includes(q)) value += 5;
    return value;
  }

  function tokenScore(item, query) {
    const tokens = compact(query).split(" ").filter((token) => token.length > 2);
    const intentScore = searchIntent()?.score?.(item, query) || 0;
    if (!tokens.length) return 1;
    const haystack = item.searchText || compact(`${item.title} ${item.type} ${item.body} ${(item.tags || []).join(" ")}`);
    const matches = tokens.filter((token) => haystack.includes(token)).length;
    return matches ? matches + score(item, query) + intentScore : intentScore;
  }

  function renderExternal(query) {
    const panel = $("#externalSearchLinks");
    if (!panel) return;
    panel.innerHTML = external.sources.map((source) => `
      <a class="external-source-card" href="${externalUrl(source, query)}" target="_blank" rel="noreferrer">
        <span class="eyebrow">${esc(source.family)}</span>
        <strong>${esc(source.name)}</strong>
        <span>${esc(source.bestFor)}</span>
      </a>
    `).join("");
  }

  function readAdvancedFilters() {
    return {
      facet: $("#searchFacet")?.value || "all",
      tag: $("#searchTag")?.value || "all",
      source: $("#searchSource")?.value || "all",
      minMaturity: Number($("#searchEvidence")?.value || 0),
      sort: $("#searchSort")?.value || "relevance",
      exact: Boolean($("#searchExact")?.checked)
    };
  }

  function syncScopeChips(scopeValue = $("#searchScope")?.value || "all") {
    document.querySelectorAll("[data-scope-chip]").forEach((button) => {
      const active = button.dataset.scopeChip === scopeValue;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function updateAdvancedFilterSummary(filters = readAdvancedFilters()) {
    const summary = $("#advancedFilterSummary");
    if (!summary) return;
    const active = [
      filters.facet !== "all" ? "domain" : "",
      filters.tag !== "all" ? "tag" : "",
      filters.sort !== "relevance" ? "sort" : "",
      filters.exact ? "exact phrase" : ""
    ].filter(Boolean);
    summary.textContent = active.length ? `${active.length} active: ${active.join(", ")}` : "Domain, tags, sorting, exact phrase";
  }

  function renderAdvancedOptions(index) {
    const facet = $("#searchFacet");
    const tag = $("#searchTag");
    if (!facet || !tag) return;
    const selectedFacet = facet.value || "all";
    const selectedTag = tag.value || "all";
    const facets = unique(index.flatMap((item) => [item.domain, item.family, item.risk]).filter(Boolean))
      .sort((a, b) => a.localeCompare(b));
    const tags = unique(index.flatMap((item) => item.tags || []).filter(Boolean))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 160);
    facet.innerHTML = `<option value="all">All domains / families</option>${facets.map((item) => `<option value="${esc(item)}">${esc(item)}</option>`).join("")}`;
    tag.innerHTML = `<option value="all">All tags</option>${tags.map((item) => `<option value="${esc(item)}">${esc(item)}</option>`).join("")}`;
    facet.value = facets.includes(selectedFacet) ? selectedFacet : "all";
    tag.value = tags.includes(selectedTag) ? selectedTag : "all";
  }

  function passesAdvanced(item, filters, query) {
    if (filters.source !== "all" && item.sourceKind !== filters.source) return false;
    if (filters.facet !== "all") {
      const facet = compact(filters.facet);
      const values = [item.domain, item.family, item.risk, item.type, ...(item.tags || [])].map(compact);
      if (!values.includes(facet)) return false;
    }
    if (filters.tag !== "all" && !(item.tags || []).map(compact).includes(compact(filters.tag))) return false;
    if (filters.minMaturity && Number(item.maturity || 0) < filters.minMaturity) return false;
    if (filters.exact && query && !(item.searchText || "").includes(compact(query))) return false;
    return true;
  }

  function sortRows(rows, sort) {
    if (sort === "title") return rows.sort((a, b) => a.item.title.localeCompare(b.item.title));
    if (sort === "type") return rows.sort((a, b) => a.item.type.localeCompare(b.item.type) || a.item.title.localeCompare(b.item.title));
    if (sort === "evidence") return rows.sort((a, b) => Number(b.item.maturity || 0) - Number(a.item.maturity || 0) || b.score - a.score);
    return rows.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
  }

  function backendType(scope) {
    const value = String(scope || "all").trim();
    return ["reaction", "reactant", "reagent", "compound", "material", "route", "mechanism", "concept", "source", "dossier", "method", "spectroscopy", "literature"].includes(value)
      ? value
      : "";
  }

  function renderLocal(query, scope = "all", filters = readAdvancedFilters()) {
    const panel = $("#localSearchResults");
    const summary = $("#searchSummary");
    if (!panel) return;
    const index = buildIndex();
    renderAdvancedOptions(index);
    syncScopeChips(scope);
    updateAdvancedFilterSummary(filters);
    const rows = sortRows(index
      .filter((item) => scope === "all" || item.recordType === scope || item.type.toLowerCase() === scope || item.type.toLowerCase().includes(scope))
      .filter((item) => passesAdvanced(item, filters, query))
      .map((item) => ({ item, score: filters.exact ? score(item, query) : tokenScore(item, query) }))
      .filter((row) => query ? row.score > 0 : row.score > 0)
    , filters.sort)
      .slice(0, 24)
      .map((row) => row.item);

    if (summary) {
      const countText = `${rows.length} 条结果`;
      const filterText = [scope !== "all" ? scope : "", filters.facet !== "all" ? filters.facet : "", filters.tag !== "all" ? filters.tag : ""].filter(Boolean).join(" · ");
      const intent = searchIntent()?.detect?.(query);
      summary.textContent = `${query ? `"${query}" 的 ${countText}` : `ChemVault 与已检查学术导入中共有 ${countText}`}${intent ? ` · ${intent.label}` : ""}${filterText ? ` · ${filterText}` : ""}`;
    }

    if (!rows.length) {
      currentResultMap = new Map();
      panel.innerHTML = `
        <div class="empty-state">
          <span class="eyebrow">学术检索边界</span>
          <h3>暂未找到索引结果</h3>
          <p>当本地数据库没有强匹配时，ChemVault 会继续检查 NIH PubChem 和 PubMed。已接受的学术记录会出现在同一个结果列表中。</p>
        </div>
      `;
      return 0;
    }

    currentResultMap = new Map(rows.map((item) => [recordKey(item), item]));
    panel.innerHTML = rows.map((item) => academicResultItem(item)).join("");
    wireImageFallbacks(panel);
    return rows.length;
  }

  function academicResultItem(item) {
    const key = recordKey(item);
    const fallback = placeholderImage(item.type, item.title, item.formula || item.family || item.domain || "");
    const body = item.body || item.subtitle || "已检查的学术元数据。";
    const tags = resultTags(item);
    const hazards = hazardLines(item);
    return `
      <a class="local-result-card academic-result-item" href="${esc(focusRecordHref(item))}" data-record-key="${esc(key)}">
        <span class="result-thumb academic-result-media" aria-hidden="true">
          <img src="${esc(thumbnailFor(item))}" data-fallback-src="${esc(fallback)}" alt="" loading="lazy" referrerpolicy="no-referrer" />
        </span>
        <span class="local-result-copy academic-result-body">
          <span class="result-kicker">
            <span class="eyebrow">${esc(item.type)}</span>
            <span class="source-pill ${esc(sourcePillClass(item))}">${esc(resultSourceLabel(item))}</span>
          </span>
          <strong class="result-title">${esc(item.title)}</strong>
          <span class="result-snippet">${esc(body).slice(0, 420)}${body.length > 420 ? "..." : ""}</span>
          ${item.formula ? `<span class="result-formula"><span>分子式</span><code>${esc(item.formula)}</code></span>` : ""}
          ${item.hazardLevel ? `<span class="hazard-summary hazard-${esc(compact(item.hazardLevel))}"><strong>${esc(item.hazardLevel)}</strong>${hazards[0] ? `<span>${esc(hazards[0]).slice(0, 180)}</span>` : ""}</span>` : ""}
          ${item.disposalMethod ? `<span class="disposal-summary"><strong>Disposal</strong><span>${esc(item.disposalMethod).slice(0, 180)}</span></span>` : ""}
          <span class="result-meta">${resultMeta(item).map(esc).join(" · ")}</span>
          ${tags.length ? `<span class="result-tag-row">${tags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</span>` : ""}
          <span class="result-detail-link">查看详情</span>
        </span>
      </a>
    `;
  }

  function resultSourceLabel(item) {
    return item.dataSource || dataSourceFromRecord(item, item.sourceKind);
  }

  function sourcePillClass(item) {
    const source = resultSourceLabel(item).toLowerCase().replace(/\s+/g, "-");
    if (source.includes("pubchem")) return "source-pubchem";
    if (source.includes("pubmed")) return "source-pubmed";
    if (source.includes("session")) return "source-session";
    if (source.includes("d1")) return "source-d1";
    if (source.includes("fallback")) return "source-fallback";
    return "source-curated";
  }

  function resultMeta(item) {
    return [
      item.domain || item.family || "",
      item.maturity ? `${item.maturity}% maturity` : "",
      item.raw?.cid ? `CID ${item.raw.cid}` : "",
      item.raw?.pmid ? `PMID ${item.raw.pmid}` : "",
      item.hazardLevel ? `Hazard ${item.hazardLevel}` : "",
      item.checkStatus ? `checkStatus ${item.checkStatus}` : "",
      item.id ? `Record ${item.id}` : ""
    ].filter(Boolean);
  }

  function hazardLines(item) {
    return (item.hazardStatements || item.raw?.hazardStatements || [])
      .map((line) => String(line || "").trim())
      .filter(Boolean);
  }

  function resultTags(item) {
    return unique([
      item.formula,
      ...(item.tags || [])
    ]).slice(0, 6);
  }

  function recordKey(item) {
    return `${item.recordType || item.type || "record"}:${item.id || compact(item.title)}`;
  }

  function focusRecordHref(item) {
    return `record.html?focus=${encodeURIComponent(recordKey(item))}`;
  }

  function storeFocusRecord(record) {
    if (!record) return;
    const payload = {
      key: recordKey(record),
      record: {
        ...record,
        imageUrl: record.imageUrl || thumbnailFor(record),
        sourceHref: record.sourceHref || record.raw?.href || record.href || "",
        dataSource: resultSourceLabel(record)
      },
      storedAt: new Date().toISOString()
    };
    const serialized = JSON.stringify(payload);
    try {
      sessionStorage.setItem(focusStoreKey, serialized);
      localStorage.setItem(focusStoreKey, serialized);
    } catch {
      try {
        sessionStorage.setItem(focusStoreKey, serialized);
      } catch {}
    }
  }

  function setSearchStage(stage, detail = "") {
    const status = $("#liveEnrichmentStatus");
    if (!status) return;
    status.dataset.stage = stage;
    status.innerHTML = `
      <span class="stage-label">${esc(stage)}</span>
      ${detail ? `<span>${esc(detail)}</span>` : ""}
    `;
  }

  function recordCountText(count, unit = "条记录") {
    return `${count} ${unit}`;
  }

  function nextFrame() {
    return new Promise((resolve) => window.requestAnimationFrame(resolve));
  }

  async function runSearch() {
    const input = $("#academicSearch");
    const scope = $("#searchScope");
    const query = input ? input.value.trim() : "";
    const filters = readAdvancedFilters();
    const searchRun = ++latestSearchRun;
    if (liveController) liveController.abort();
    liveController = new AbortController();
    backendRecords = [];
    setSearchStage("正在检索本地记录", query ? `检索词：${query}` : "请输入检索词以查询 ChemVault 记录。");
    let localCount = renderLocal(query, scope ? scope.value : "all", filters);
    renderExternal(query);
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    if (scope && scope.value !== "all") url.searchParams.set("scope", scope.value);
    else url.searchParams.delete("scope");
    if (filters.facet !== "all") url.searchParams.set("facet", filters.facet);
    else url.searchParams.delete("facet");
    if (filters.tag !== "all") url.searchParams.set("tag", filters.tag);
    else url.searchParams.delete("tag");
    if (filters.source !== "all") url.searchParams.set("source", filters.source);
    else url.searchParams.delete("source");
    if (filters.minMaturity) url.searchParams.set("maturity", String(filters.minMaturity));
    else url.searchParams.delete("maturity");
    if (filters.sort !== "relevance") url.searchParams.set("sort", filters.sort);
    else url.searchParams.delete("sort");
    if (filters.exact) url.searchParams.set("exact", "1");
    else url.searchParams.delete("exact");
    window.history.replaceState({}, "", url);

    if (query.length >= 3 && window.CHEMVAULT_API?.searchRecords) {
      const status = $("#liveEnrichmentStatus");
      if (status) setSearchStage("正在检索本地记录", "在访问学术来源前，先检查 ChemVault API 和 D1。");
      try {
        const payload = await window.CHEMVAULT_API.searchRecords({
          q: query,
          type: backendType(scope?.value),
          limit: 24
        }, { signal: liveController.signal });
        if (searchRun !== latestSearchRun) return;
        const dataSource = payload.source === "d1" ? "D1" : payload.source === "fallback" || payload.source === "browser-fallback" ? "Fallback" : "";
        backendRecords = (payload.records || []).map((record) => toIndexRecord(record, payload.source === "d1" ? "d1" : payload.source, dataSource));
        localCount = renderLocal(query, scope ? scope.value : "all", filters);
        if (localCount > 0) {
          setSearchStage(payload.source === "d1" ? "ChemVault 已有记录" : "找到本地匹配", `${recordCountText(localCount)}可供查看。`);
        }
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }

    if (searchRun !== latestSearchRun) return;
    await runLiveEnrichment(query, localCount, liveController.signal);
  }

  async function runLiveEnrichment(query, localCount, signal) {
    const status = $("#liveEnrichmentStatus");
    const panel = $("#liveEnrichmentResults");
    if (!status || !panel) return;

    latestLiveCandidates = [];
    toggleImportAll(false);
    if (!query || query.length < 3) {
      setSearchStage("正在检索本地记录", "至少输入三个字符后，才会请求 NIH 和 PubChem 补充。");
      panel.innerHTML = "";
      renderImportedRecords();
      return;
    }

    if (localCount > 0) {
      if (status.dataset.stage !== "ChemVault 已有记录") {
        setSearchStage("找到本地匹配", `${localCount} 条 ChemVault 结果已显示在列表中，并包含结构或来源视觉信息。`);
      }
      panel.innerHTML = "";
      renderImportedRecords();
      return;
    }

    const cacheKey = normalise(query);
    if (liveCache.has(cacheKey)) {
      renderLiveResults(query, localCount, liveCache.get(cacheKey));
      return;
    }

    setSearchStage("未找到本地匹配", "ChemVault 将继续检查可信学术来源。");
    panel.innerHTML = fallbackCards(query, "正在请求 PubChem 化合物数据和 PubMed 文献元数据...");
    await nextFrame();
    if (signal.aborted) return;
    setSearchStage("正在检查学术来源", "未找到本地匹配，正在拉取 PubChem/PubMed 元数据；如可用，将保存已接受结果到 D1。");

    try {
      if (window.CHEMVAULT_API?.enrichRecords) {
        const payload = await window.CHEMVAULT_API.enrichRecords({ q: query, limit: 8 }, { signal });
        if (payload.records?.length) {
          backendRecords = mergeIndexRows(backendRecords, payload.records.map((record) => toIndexRecord(record, "imported")));
          localCount = renderLocal(query, $("#searchScope")?.value || "all");
        }
        if (payload.records?.length || payload.meta?.status !== "browser-fallback") {
          liveCache.set(cacheKey, payload);
          renderLiveResults(query, localCount, payload);
          return;
        }
      }

      const [compoundResult, literatureResult] = await Promise.allSettled([
        fetchPubChem(query, signal),
        fetchPubMed(query, signal)
      ]);
      if (compoundResult.status === "rejected" && literatureResult.status === "rejected") {
        throw compoundResult.reason;
      }
      const compound = compoundResult.status === "fulfilled" ? compoundResult.value : null;
      const literature = literatureResult.status === "fulfilled" ? literatureResult.value : [];
      const result = { compound, literature };
      liveCache.set(cacheKey, result);
      renderLiveResults(query, localCount, result);
    } catch (error) {
      if (error.name === "AbortError") return;
      setSearchStage("正在检查学术来源", "外部补充暂时不可用。");
      panel.innerHTML = fallbackCards(query, "实时导入被阻止或暂时不可用。请使用这些 NIH/PubChem 直达链接。");
    }
  }

  async function fetchPubChem(query, signal) {
    const propertyList = [
      "Title",
      "MolecularFormula",
      "MolecularWeight",
      "IUPACName",
      "CanonicalSMILES",
      "ConnectivitySMILES",
      "IsomericSMILES",
      "InChIKey",
      "XLogP",
      "TPSA",
      "HBondDonorCount",
      "HBondAcceptorCount",
      "RotatableBondCount",
      "ExactMass"
    ].join(",");
    const name = encodeURIComponent(query);
    const propertiesUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${name}/property/${propertyList}/JSON`;
    const properties = await fetchJSON(propertiesUrl, signal, true);
    const compound = properties?.PropertyTable?.Properties?.[0];
    if (!compound?.CID) return null;

    const [descriptionResult, synonymResult, safetyResult] = await Promise.allSettled([
      fetchJSON(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${compound.CID}/description/JSON`, signal, true),
      fetchJSON(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${compound.CID}/synonyms/JSON`, signal, true),
      fetchPubChemSafety(compound.CID, signal, compound)
    ]);

    const description = descriptionResult.status === "fulfilled"
      ? descriptionResult.value?.InformationList?.Information?.[0]?.Description
      : "";
    const synonyms = synonymResult.status === "fulfilled"
      ? synonymResult.value?.InformationList?.Information?.[0]?.Synonym?.slice(0, 8) || []
      : [];
    const safety = safetyResult.status === "fulfilled" ? safetyResult.value : {};

    return {
      source: "PubChem",
      cid: compound.CID,
      title: compound.Title || query,
      formula: compound.MolecularFormula,
      weight: compound.MolecularWeight,
      iupac: compound.IUPACName,
      smiles: compound.CanonicalSMILES || compound.ConnectivitySMILES || compound.IsomericSMILES || compound.SMILES,
      inchikey: compound.InChIKey,
      exactMass: compound.ExactMass,
      xlogp: compound.XLogP,
      tpsa: compound.TPSA,
      donors: compound.HBondDonorCount,
      acceptors: compound.HBondAcceptorCount,
      rotatable: compound.RotatableBondCount,
      description,
      synonyms,
      ...safety,
      imageUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${encodeURIComponent(compound.CID)}/PNG?record_type=2d&image_size=large`,
      href: `https://pubchem.ncbi.nlm.nih.gov/compound/${compound.CID}`
    };
  }

  async function fetchPubChemSafety(cid, signal, compound = {}) {
    const ghs = await fetchJSON(`https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${encodeURIComponent(cid)}/JSON?heading=${encodeURIComponent("GHS Classification")}`, signal, true);
    const infos = collectPubChemInfo(ghs);
    const hazardStatements = infoStrings(infos.find((item) => item.Name === "GHS Hazard Statements")).slice(0, 6);
    const signalWord = infoStrings(infos.find((item) => item.Name === "Signal"))[0] || "";
    const precautionaryStatements = infoStrings(infos.find((item) => item.Name === "Precautionary Statement Codes")).slice(0, 2);
    return {
      hazardStatements,
      hazardLevel: hazardLevelFrom(hazardStatements, signalWord),
      signalWord,
      precautionaryStatements,
      disposalMethod: disposalFromHazards(hazardStatements, compound),
      safetySource: "PubChem GHS summary"
    };
  }

  function collectPubChemInfo(payload) {
    const infos = [];
    const walk = (section) => {
      (section?.Information || []).forEach((item) => infos.push(item));
      (section?.Section || []).forEach(walk);
    };
    walk(payload?.Record);
    return infos;
  }

  function infoStrings(info) {
    return info?.Value?.StringWithMarkup?.map((item) => item.String.trim()).filter(Boolean) || [];
  }

  function hazardLevelFrom(statements = [], signalWord = "") {
    const text = `${signalWord} ${statements.join(" ")}`.toLowerCase();
    if (/fatal|cancer|mutagen|reproductive|damage to organs|explosive|pyrophoric/.test(text)) return "Severe";
    if (/toxic|corrosive|skin burns|serious eye damage|highly flammable|extremely flammable/.test(text)) return "High";
    if (/harmful|irritation|drowsiness|dizziness|flammable/.test(text)) return "Moderate";
    return statements.length ? "Low" : "Not classified";
  }

  function disposalFromHazards(statements = [], context = {}) {
    const text = `${context.Title || context.title || ""} ${context.MolecularFormula || context.formula || ""} ${statements.join(" ")}`.toLowerCase();
    if (/chlorinated|halogenated|chloroform|dichloromethane|methylene chloride|bromine|iodine|chlorine/.test(text)) return "Collect as halogenated or toxic hazardous waste in a compatible labelled container; do not pour to drain.";
    if (/silver|copper|manganese|chrom|osmium|lead|mercury|cadmium|nickel|metal/.test(text)) return "Collect as heavy-metal or oxidizing inorganic hazardous waste; prevent drain release.";
    if (/azide|cyanide|diazonium|energetic|explosive|pyrophoric/.test(text)) return "Collect as reactive/toxic hazardous waste and keep segregated under institutional EHS guidance.";
    if (/corrosive|skin burns|serious eye damage/.test(text)) return "Collect as corrosive hazardous waste or neutralize only under an approved institutional procedure.";
    if (/flammable|solvent|ether|acetone|ethanol|methanol|acetonitrile|tetrahydrofuran|ethyl acetate|dimethylformamide/.test(text) && !/oxidizer|hypochlorite|permanganate|nitrate|may intensify fire/.test(text)) return "Collect in a compatible flammable organic-waste container; do not pour to drain.";
    if (/oxidizer|peroxide|may intensify fire/.test(text)) return "Collect as oxidizing hazardous waste; keep separate from organics and reducers.";
    if (/flammable|solvent|ether|acetone|ethanol|methanol|acetonitrile|tetrahydrofuran|ethyl acetate|dimethylformamide/.test(text)) return "Collect in a compatible flammable organic-waste container; do not pour to drain.";
    if (/toxic|cancer|mutagen|reproductive|damage to organs|fatal/.test(text)) return "Collect as toxic hazardous waste; keep segregated and route through institutional EHS.";
    return "Dispose through approved chemical-waste channels according to SDS, institutional EHS guidance and local regulations.";
  }

  async function fetchPubMed(query, signal) {
    const term = encode(query);
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${term}&retmode=json&retmax=5&sort=relevance&tool=ChemVault`;
    const search = await fetchJSON(searchUrl, signal, false);
    const ids = search?.esearchresult?.idlist || [];
    if (!ids.length) return [];

    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json&tool=ChemVault`;
    const summary = await fetchJSON(summaryUrl, signal, false);
    return ids.map((id) => {
      const item = summary?.result?.[id] || {};
      const doi = (item.articleids || []).find((articleId) => articleId.idtype === "doi")?.value;
      return {
        source: "PubMed",
        pmid: id,
        title: item.title || `PubMed record ${id}`,
        journal: item.fulljournalname || item.source || "PubMed",
        date: item.pubdate || item.epubdate || "",
        authors: (item.authors || []).slice(0, 4).map((author) => author.name).filter(Boolean),
        doi,
        imageUrl: placeholderImage("PubMed", item.title || `PubMed record ${id}`, item.fulljournalname || item.source || "PubMed"),
        href: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
      };
    });
  }

  async function fetchJSON(url, signal, allowNotFound) {
    const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!response.ok) {
      if (allowNotFound && response.status === 404) return null;
      throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
  }

  function renderLiveResults(query, localCount, result) {
    const status = $("#liveEnrichmentStatus");
    const panel = $("#liveEnrichmentResults");
    const cards = [];
    latestLiveCandidates = [];

    if (Array.isArray(result.records)) {
      latestLiveCandidates = result.records.map((record) => toSessionRecord(record, query));
      const stored = Number(result.meta?.stored || 0);
      if (result.meta?.status === "local-first" || result.meta?.status === "fallback-local-first") {
        setSearchStage("ChemVault 已有记录", `找到 ${recordCountText(result.records.length)}。`);
      } else if (stored) {
        setSearchStage("已保存到 ChemVault 数据库", `${stored} 条 PubChem/PubMed 记录已保存到 D1。`);
      } else if (result.records.length) {
        setSearchStage("已从 PubChem/PubMed 导入", `${result.records.length} 条已检查学术记录已加入检索结果列表。`);
      } else {
        setSearchStage("正在检查学术来源", `"${query}" 没有返回已检查的 PubChem 或 PubMed 元数据。`);
      }
      panel.innerHTML = result.records.length ? academicSyncSummary(result.records.length, stored) : fallbackCards(query, "未返回元数据。请使用 NIH/PubChem 直达检索链接。");
      toggleImportAll(Boolean(latestLiveCandidates.length));
      wireImportButtons();
      wireImageFallbacks(panel);
      renderImportedRecords();
      return;
    }

    if (result.compound) {
      const compound = result.compound;
      const imported = toImportedCompound(compound, query);
      latestLiveCandidates.push(imported);
      backendRecords = mergeIndexRows(backendRecords, [sessionRecordToIndex(imported)]);
      cards.push(`
        <article class="live-card live-card-wide">
          <div class="live-card-media">
            <img src="${esc(compound.imageUrl || placeholderImage("PubChem", compound.title, compound.formula))}" data-fallback-src="${esc(placeholderImage("PubChem", compound.title, compound.formula))}" alt="" loading="lazy" referrerpolicy="no-referrer" />
          </div>
          <div class="live-card-head">
            <span class="eyebrow">NIH / NCBI PubChem 导入</span>
            <a href="${compound.href}" target="_blank" rel="noreferrer">CID ${esc(compound.cid)}</a>
          </div>
          <h3>${esc(compound.title)}</h3>
          <div class="compound-property-grid">
            ${property("分子式", compound.formula)}
            ${property("分子量", compound.weight)}
            ${property("精确质量", compound.exactMass)}
            ${property("XLogP", compound.xlogp)}
            ${property("TPSA", compound.tpsa)}
            ${property("氢键供体", compound.donors)}
            ${property("氢键受体", compound.acceptors)}
            ${property("可旋转键", compound.rotatable)}
          </div>
          ${compound.iupac ? `<p><strong>IUPAC:</strong> ${esc(compound.iupac)}</p>` : ""}
          ${compound.smiles ? `<p><strong>Canonical SMILES:</strong> <code>${esc(compound.smiles)}</code></p>` : ""}
          ${compound.description ? `<p>${esc(compound.description).slice(0, 420)}${compound.description.length > 420 ? "..." : ""}</p>` : ""}
          ${compound.synonyms.length ? `<div class="tag-row">${compound.synonyms.map((item) => `<span class="tag">${esc(item)}</span>`).join("")}</div>` : ""}
          <div class="source-action-row">
            <a class="secondary-button" href="${compound.href}" target="_blank" rel="noopener noreferrer">打开 NIH PubChem</a>
            <button class="secondary-button" type="button" data-import-external="0">保存化合物</button>
          </div>
        </article>
      `);
    }

    (result.literature || []).forEach((article) => {
      const imported = toImportedArticle(article, query);
      const index = latestLiveCandidates.push(imported) - 1;
      backendRecords = mergeIndexRows(backendRecords, [sessionRecordToIndex(imported)]);
      cards.push(`
        <article class="live-card">
          <div class="live-card-media">
            <img src="${esc(article.imageUrl || placeholderImage("PubMed", article.title, article.journal))}" data-fallback-src="${esc(placeholderImage("PubMed", article.title, article.journal))}" alt="" loading="lazy" referrerpolicy="no-referrer" />
          </div>
          <div class="live-card-head">
            <span class="eyebrow">NIH / NLM PubMed 元数据</span>
            <a href="${article.href}" target="_blank" rel="noreferrer">PMID ${esc(article.pmid)}</a>
          </div>
          <h3>${esc(article.title)}</h3>
          <p>${esc(article.journal)}${article.date ? ` · ${esc(article.date)}` : ""}</p>
          ${article.authors.length ? `<p><strong>作者：</strong> ${esc(article.authors.join(", "))}</p>` : ""}
          ${article.doi ? `<p><strong>DOI:</strong> ${esc(article.doi)}</p>` : ""}
          <div class="source-action-row">
            <a class="secondary-button" href="${article.href}" target="_blank" rel="noopener noreferrer">打开 NIH PubMed</a>
            <button class="secondary-button" type="button" data-import-external="${index}">保存文献</button>
          </div>
        </article>
      `);
    });

    const count = cards.length;
    if (count) renderLocal(query, $("#searchScope")?.value || "all");
    if (count) {
      setSearchStage("已从 PubChem/PubMed 导入", `${count} 条外部记录已加入检索结果列表。`);
    } else {
      setSearchStage("正在检查学术来源", `"${query}" 没有返回 PubChem 化合物或 PubMed 文献元数据。`);
    }
    panel.innerHTML = cards.length ? academicSyncSummary(count, 0) : fallbackCards(query, "未返回元数据。请使用 NIH/PubChem 直达检索链接。");
    toggleImportAll(Boolean(latestLiveCandidates.length));
    wireImportButtons();
    wireImageFallbacks(panel);
    renderImportedRecords();
  }

  function academicSyncSummary(count, stored) {
    return `
      <div class="academic-sync-card">
        <span class="eyebrow">NIH 学术同步</span>
        <strong>${count} 条已检查记录已显示在结果中</strong>
        <p>${stored ? `${stored} 条新记录已加入 D1。` : "记录已内联显示在检索结果中；下方仍可保存到当前会话。"}</p>
      </div>
    `;
  }

  function sessionRecordToIndex(record) {
    const isArticle = compact(record.type).includes("article");
    const source = isArticle ? "PubMed" : "PubChem";
    return toIndexRecord({
      id: record.id,
      type: isArticle ? "literature" : "compound",
      typeLabel: isArticle ? "PubMed article" : "PubChem compound",
      title: record.title,
      body: record.body,
      tags: record.tags,
      href: record.href,
      imageUrl: record.imageUrl,
      sourceHref: record.href,
      formula: record.formula || "",
      hazardStatements: record.hazardStatements || record.raw?.hazardStatements || [],
      hazardLevel: record.hazardLevel || record.raw?.hazardLevel || "",
      signalWord: record.signalWord || record.raw?.signalWord || "",
      precautionaryStatements: record.precautionaryStatements || record.raw?.precautionaryStatements || [],
      disposalMethod: record.disposalMethod || record.raw?.disposalMethod || "",
      safetySource: record.safetySource || record.raw?.safetySource || "",
      checkStatus: record.checkStatus || "accepted",
      checkedAt: record.checkedAt || record.importedAt || "",
      raw: {
        ...(record.raw || {}),
        source,
        hazardStatements: record.hazardStatements || record.raw?.hazardStatements || [],
        hazardLevel: record.hazardLevel || record.raw?.hazardLevel || "",
        signalWord: record.signalWord || record.raw?.signalWord || "",
        precautionaryStatements: record.precautionaryStatements || record.raw?.precautionaryStatements || [],
        disposalMethod: record.disposalMethod || record.raw?.disposalMethod || "",
        safetySource: record.safetySource || record.raw?.safetySource || "",
        checkStatus: record.checkStatus || record.raw?.checkStatus || "accepted",
        checkedAt: record.checkedAt || record.raw?.checkedAt || record.importedAt || ""
      }
    }, "imported");
  }

  function academicRecordCard(record, index) {
    const image = thumbnailFor(toIndexRecord(record));
    const fallback = placeholderImage(record.typeLabel || record.type, record.title, record.formula || record.family || record.domain);
    return `
      <article class="live-card live-card-imported">
        <div class="live-card-media">
          <img src="${esc(image)}" data-fallback-src="${esc(fallback)}" alt="" loading="lazy" referrerpolicy="no-referrer" />
        </div>
        <div class="live-card-head">
          <span class="eyebrow">${esc(record.typeLabel || record.type || "Academic import")}</span>
          ${record.href ? `<a href="${esc(record.href)}" target="_blank" rel="noreferrer">${esc(record.raw?.cid ? `CID ${record.raw.cid}` : record.raw?.pmid ? `PMID ${record.raw.pmid}` : "Open source")}</a>` : ""}
        </div>
        <h3>${esc(record.title)}</h3>
        <p>${esc(record.body || record.subtitle || "Checked academic metadata.").slice(0, 520)}${(record.body || "").length > 520 ? "..." : ""}</p>
        ${record.tags?.length ? `<div class="tag-row">${record.tags.slice(0, 8).map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}</div>` : ""}
        <div class="source-action-row">
          ${record.href ? `<a class="secondary-button" href="${esc(record.href)}" target="_blank" rel="noopener noreferrer">Open source</a>` : ""}
          <button class="secondary-button" type="button" data-import-external="${index}">Save session copy</button>
        </div>
      </article>
    `;
  }

  function property(label, value) {
    if (value === undefined || value === null || value === "") return "";
    return `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
  }

  function fallbackCards(query, message) {
    const q = encode(query);
    const links = [
      ["NIH PubChem", `https://pubchem.ncbi.nlm.nih.gov/#query=${q}`, "化合物标识符、分子式、同义词和性质记录。"],
      ["NIH PubMed", `https://pubmed.ncbi.nlm.nih.gov/?term=${q}`, "生物医学与化学文献元数据。"],
      ["PubMed Central", `https://pmc.ncbi.nlm.nih.gov/?term=${q}`, "可用时提供开放获取全文记录。"],
      ["NCBI Bookshelf", `https://www.ncbi.nlm.nih.gov/books/?term=${q}`, "参考章节和背景资料。"]
    ];
    return `
      <div class="empty-state">${esc(message)}</div>
      <div class="fallback-source-grid">
        ${links.map(([title, href, body]) => `
          <a class="fallback-source-card" href="${href}" target="_blank" rel="noopener noreferrer">
            <span class="eyebrow">外部直达链接</span>
            <strong>${esc(title)}</strong>
            <span>${esc(body)}</span>
          </a>
        `).join("")}
      </div>
    `;
  }

  function toImportedCompound(compound, query) {
    return {
      id: `pubchem-${compound.cid}`,
      type: "Imported compound",
      title: compound.title,
      body: [
        "PubChem",
        compound.formula,
        compound.weight ? `${compound.weight} g/mol` : "",
        compound.iupac,
        compound.description
      ].filter(Boolean).join(" | "),
      tags: [query, "PubChem", compound.formula, compound.inchikey].filter(Boolean),
      href: compound.href,
      sourceHref: compound.href,
      formula: compound.formula || "",
      imageUrl: compound.imageUrl,
      hazardStatements: compound.hazardStatements || [],
      hazardLevel: compound.hazardLevel || "",
      signalWord: compound.signalWord || "",
      precautionaryStatements: compound.precautionaryStatements || [],
      disposalMethod: compound.disposalMethod || "",
      safetySource: compound.safetySource || "",
      raw: {
        source: "PubChem",
        cid: compound.cid,
        href: compound.href,
        formula: compound.formula,
        imageUrl: compound.imageUrl,
        hazardStatements: compound.hazardStatements || [],
        hazardLevel: compound.hazardLevel || "",
        signalWord: compound.signalWord || "",
        precautionaryStatements: compound.precautionaryStatements || [],
        disposalMethod: compound.disposalMethod || "",
        safetySource: compound.safetySource || "",
        checkStatus: "accepted",
        checkedAt: new Date().toISOString()
      },
      checkStatus: "accepted",
      checkedAt: new Date().toISOString(),
      external: true,
      importedAt: new Date().toISOString()
    };
  }

  function toImportedArticle(article, query) {
    return {
      id: `pubmed-${article.pmid}`,
      type: "Imported article",
      title: article.title,
      body: [
        "PubMed",
        article.journal,
        article.date,
        article.authors.join(", "),
        article.doi ? `DOI ${article.doi}` : ""
      ].filter(Boolean).join(" | "),
      tags: [query, "PubMed", article.pmid, article.doi].filter(Boolean),
      href: article.href,
      sourceHref: article.href,
      imageUrl: article.imageUrl,
      raw: {
        source: "PubMed",
        pmid: article.pmid,
        href: article.href,
        journal: article.journal,
        doi: article.doi,
        checkStatus: "accepted",
        checkedAt: new Date().toISOString()
      },
      checkStatus: "accepted",
      checkedAt: new Date().toISOString(),
      external: true,
      importedAt: new Date().toISOString()
    };
  }

  function toSessionRecord(record, query) {
    return {
      id: record.id,
      type: record.typeLabel || record.type || "Imported record",
      title: record.title,
      body: record.body || record.subtitle || "",
      formula: record.formula || record.raw?.formula || "",
      tags: [query, ...(record.tags || [])].filter(Boolean),
      href: record.href,
      sourceHref: record.sourceHref || record.href || "",
      imageUrl: record.imageUrl || record.raw?.imageUrl || "",
      raw: record.raw || {},
      hazardStatements: record.hazardStatements || record.raw?.hazardStatements || [],
      hazardLevel: record.hazardLevel || record.raw?.hazardLevel || "",
      signalWord: record.signalWord || record.raw?.signalWord || "",
      precautionaryStatements: record.precautionaryStatements || record.raw?.precautionaryStatements || [],
      disposalMethod: record.disposalMethod || record.raw?.disposalMethod || "",
      safetySource: record.safetySource || record.raw?.safetySource || "",
      checkStatus: record.checkStatus || record.raw?.checkStatus || "accepted",
      checkedAt: record.checkedAt || record.raw?.checkedAt || new Date().toISOString(),
      external: /^https?:\/\//i.test(record.href || ""),
      importedAt: new Date().toISOString()
    };
  }

  function wireImportButtons() {
    document.querySelectorAll("[data-import-external]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = latestLiveCandidates[Number(button.dataset.importExternal)];
        if (!item) return;
        saveImportedRecord(item);
        button.textContent = "已保存到本地会话";
      });
    });
  }

  function toggleImportAll(show) {
    const button = document.querySelector("[data-import-all]");
    if (!button) return;
    button.hidden = !show;
    button.disabled = !show;
    button.textContent = "全部保存";
  }

  function getImportedRecords() {
    try {
      const records = JSON.parse(localStorage.getItem(importedStoreKey) || "[]");
      return Array.isArray(records) ? records : [];
    } catch {
      return [];
    }
  }

  function saveImportedRecord(item) {
    const records = getImportedRecords();
    const next = [item, ...records.filter((record) => record.id !== item.id)].slice(0, 40);
    try {
      localStorage.setItem(importedStoreKey, JSON.stringify(next));
    } catch {
      return;
    }
    renderImportedRecords();
    renderLocal($("#academicSearch")?.value.trim() || "", $("#searchScope")?.value || "all");
  }

  function saveImportedRecords(items) {
    const records = getImportedRecords();
    const merged = [...items, ...records].filter((record, index, all) => {
      return all.findIndex((item) => item.id === record.id) === index;
    }).slice(0, 60);
    try {
      localStorage.setItem(importedStoreKey, JSON.stringify(merged));
    } catch {
      return;
    }
    renderImportedRecords();
    renderLocal($("#academicSearch")?.value.trim() || "", $("#searchScope")?.value || "all");
  }

  function renderImportedRecords() {
    const panel = $("#savedExternalRecords");
    if (!panel) return;
    const records = getImportedRecords();
    if (!records.length) {
      panel.innerHTML = "";
      return;
    }
    panel.innerHTML = `
      <div class="library-toolbar">
        <span class="label">Session imports</span>
        <strong>${records.length} saved</strong>
      </div>
      <button class="small-button" type="button" data-clear-imports>Clear session imports</button>
      <div class="imported-record-list">
        ${records.slice(0, 8).map((record) => `
          <a href="${record.href}" target="_blank" rel="noreferrer">
            <img src="${esc(record.imageUrl || placeholderImage(record.type, record.title, record.formula || record.family || record.domain || ""))}" data-fallback-src="${esc(placeholderImage(record.type, record.title, record.formula || record.family || record.domain || ""))}" alt="" loading="lazy" referrerpolicy="no-referrer" />
            <span>${esc(record.type)}</span>
            <strong>${esc(record.title)}</strong>
          </a>
        `).join("")}
      </div>
    `;
    wireImageFallbacks(panel);
  }

  function unique(values) {
    return [...new Set((values || []).filter(Boolean).map(String))];
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = $("#academicSearchForm");
    const input = $("#academicSearch");
    const scope = $("#searchScope");
    const params = new URLSearchParams(window.location.search);
    if (input) input.value = params.get("q") || "";
    if (scope && params.get("scope")) scope.value = params.get("scope");
    renderAdvancedOptions(buildIndex());
    if ($("#searchFacet") && params.get("facet")) $("#searchFacet").value = params.get("facet");
    if ($("#searchTag") && params.get("tag")) $("#searchTag").value = params.get("tag");
    if ($("#searchSource") && params.get("source")) $("#searchSource").value = params.get("source");
    if ($("#searchEvidence") && params.get("maturity")) $("#searchEvidence").value = params.get("maturity");
    if ($("#searchSort") && params.get("sort")) $("#searchSort").value = params.get("sort");
    if ($("#searchExact")) $("#searchExact").checked = params.get("exact") === "1";
    const hasAdvancedFilters = ["facet", "tag", "sort", "exact"].some((key) => params.has(key));
    if (hasAdvancedFilters && $("#advancedSearchDisclosure")) $("#advancedSearchDisclosure").open = true;
    syncScopeChips(scope?.value || "all");
    updateAdvancedFilterSummary();

    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        runSearch();
      });
    }
    if (scope) {
      scope.addEventListener("change", () => {
        syncScopeChips(scope.value);
        runSearch();
      });
    }
    document.querySelectorAll("[data-scope-chip]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!scope) return;
        scope.value = button.dataset.scopeChip || "all";
        syncScopeChips(scope.value);
        runSearch();
      });
    });
    ["#searchFacet", "#searchTag", "#searchSource", "#searchEvidence", "#searchSort", "#searchExact"].forEach((selector) => {
      $(selector)?.addEventListener("change", () => {
        updateAdvancedFilterSummary();
        runSearch();
      });
    });
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const focusTrigger = target.closest("[data-record-key]");
      if (focusTrigger) {
        storeFocusRecord(currentResultMap.get(focusTrigger.dataset.recordKey));
        return;
      }
      const importAll = target.closest("[data-import-all]");
      if (importAll) {
        saveImportedRecords(latestLiveCandidates);
        importAll.textContent = "Saved";
        return;
      }
      const clearButton = target.closest("[data-clear-imports]");
      if (!clearButton) return;
      localStorage.removeItem(importedStoreKey);
      renderImportedRecords();
      runSearch();
    });
    if (input) input.addEventListener("input", () => {
      window.clearTimeout(input._chemvaultTimer);
      input._chemvaultTimer = window.setTimeout(runSearch, 750);
    });
    runSearch();
  });
})();
