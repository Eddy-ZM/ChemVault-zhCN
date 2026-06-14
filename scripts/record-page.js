(() => {
  const api = window.CHEMVAULT_RECORDS;
  const external = window.CHEMVAULT_EXTERNAL || { sources: [] };
  const focusStoreKey = "chemvault-focus-record";
  const $ = (selector) => document.querySelector(selector);
  const esc = api?.esc || ((value) => String(value || ""));
  const encode = api?.encode || encodeURIComponent;

  document.addEventListener("DOMContentLoaded", () => {
    if (!api) {
      renderMissing("Record utilities did not load.");
      return;
    }
    const params = new URLSearchParams(location.search);
    const records = api.buildRecords({ includeImported: true });
    const focusRecord = readFocusRecord(params.get("focus"));
    const record = focusRecord
      || api.findRecord(params.get("type"), params.get("id"), records)
      || findByQuery(params.get("q"), records);

    if (!record) {
      renderMissing(params.get("q") || params.get("id") || "unknown record", records);
      return;
    }

    document.title = `ChemVault | ${record.title}`;
    renderRecord(record, records);
  });

  function findByQuery(query, records) {
    const term = api.compact(query || "");
    if (!term) return null;
    return records
      .map((record) => ({ record, score: record.searchText.includes(term) ? (record.title.toLowerCase().includes(term) ? 20 : 8) : 0 }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((row) => row.record)[0] || null;
  }

  function renderRecord(record, records) {
    const related = api.relatedRecords(record, records, 10);
    const main = $("#recordMain");
    if (!main) return;
    const imageMeta = {
      type: record.typeLabel || record.type,
      title: record.title,
      subtitle: record.subtitle || record.family || record.domain || record.formula || ""
    };
    const image = record.imageUrl || api.recordImage(imageMeta.type, imageMeta.title, imageMeta.subtitle);
    const fallbackImage = api.fallbackImage
      ? api.fallbackImage(imageMeta.type, imageMeta.title, imageMeta.subtitle)
      : api.recordImage("Record", imageMeta.title, imageMeta.subtitle);
    const sourceHref = record.sourceHref || record.raw?.href || record.href || "";
    const trustStrip = renderTrustStrip(record, sourceHref);
    const safetyPanel = renderSafetyProfile(record);
    const nextSteps = renderNextSteps(record, related.length, sourceHref);
    main.innerHTML = `
      <section class="page-hero record-hero">
        <div class="container page-hero-grid">
          <div>
            <p class="eyebrow">${esc(record.typeLabel || record.type)} · ${esc(sourceLabel(record))}</p>
            <h1>${esc(record.title)}</h1>
            ${record.subtitle ? `<p>${esc(record.subtitle)}</p>` : ""}
            <div class="hero-actions record-actions">
              ${sourceHref ? `<a class="primary-button" href="${esc(sourceHref)}"${/^https?:\/\//i.test(sourceHref) ? ' target="_blank" rel="noreferrer"' : ""}>Open source page</a>` : ""}
              <a class="secondary-button" href="search.html?q=${encode(record.title)}">Search this topic</a>
              ${record.external && record.href ? `<a class="secondary-button" href="${record.href}" target="_blank" rel="noreferrer">Open external source</a>` : ""}
            </div>
            ${trustStrip}
          </div>
          <aside class="page-index-card record-index-card">
            <img class="record-focus-image" src="${esc(image)}" data-fallback-src="${esc(fallbackImage)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
            <strong>Record status</strong>
            <div class="record-fact-grid">
              ${fact("Type", record.typeLabel)}
              ${fact("Source", sourceLabel(record))}
              ${fact("Domain", record.domain || record.family || record.category)}
              ${fact("Formula", record.formula)}
              ${fact("Hazard", record.hazardLevel)}
              ${fact("Signal", record.signalWord)}
              ${fact("Maturity", record.maturity ? `${record.maturity}%` : "")}
              ${fact("Risk", record.risk)}
              ${fact("Check status", record.checkStatus)}
              ${fact("Checked at", record.checkedAt)}
              ${fact("Version", api.version)}
            </div>
          </aside>
        </div>
      </section>

      <section class="section record-section">
        <div class="container record-layout">
          <article class="record-primary">
            <section class="record-panel">
              <div class="library-toolbar">
                <span class="label">Scholarly overview</span>
                <strong>${esc(record.typeLabel || "Record")}</strong>
              </div>
              <p class="record-lead">${esc(record.body || record.subtitle || "No summary text is available for this record.")}</p>
              ${record.tags?.length ? `<div class="tag-row">${record.tags.slice(0, 18).map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}</div>` : ""}
            </section>

            ${safetyPanel}

            <section class="record-panel">
              <div class="library-toolbar">
                <span class="label">Focused fields</span>
                <strong>${esc(sourceLabel(record))}</strong>
              </div>
              <div class="record-field-grid">
                ${field("title", record.title)}
                ${field("subtitle", record.subtitle)}
                ${field("type", record.typeLabel || record.type)}
                ${field("formula", record.formula)}
                ${field("tags", (record.tags || []).join(", "))}
                ${field("body", record.body)}
                ${field("hazardStatements", (record.hazardStatements || []).join(" | "))}
                ${field("hazardLevel", record.hazardLevel)}
                ${field("signalWord", record.signalWord)}
                ${field("disposalMethod", record.disposalMethod)}
                ${field("safetySource", record.safetySource)}
                ${imageField(image)}
                ${field("sourceHref", sourceHref, true)}
                ${field("checkStatus", record.checkStatus)}
                ${field("checkedAt", record.checkedAt)}
              </div>
            </section>

            <div class="record-section-grid">
              ${(record.sections || []).filter((section) => section.items?.length).map((section) => `
                <section class="record-panel">
                  <h2>${esc(section.title)}</h2>
                  <ul class="detail-list">
                    ${section.items.map((item) => `<li>${esc(item)}</li>`).join("")}
                  </ul>
                </section>
              `).join("")}
            </div>
          </article>

          <aside class="record-secondary">
            ${nextSteps}

            <section class="record-panel" id="recordRelatedRecords">
              <div class="library-toolbar">
                <span class="label">Related records</span>
                <strong>${related.length} linked</strong>
              </div>
              <div class="related-record-grid">
                ${related.length ? related.map((item) => relatedCard(item)).join("") : `<div class="empty-state">No related records were scored for this item.</div>`}
              </div>
            </section>

            <section class="record-panel">
              <h2>External academic handoff</h2>
              <p class="muted">Use public scholarly databases to verify identifiers, provenance, primary literature and safety-critical claims.</p>
              <div class="source-action-row">
                ${(external.sources || []).slice(0, 6).map((source) => `
                  <a class="secondary-button" href="${externalUrl(source, record.title)}" target="_blank" rel="noreferrer">${esc(source.name)}</a>
                `).join("")}
              </div>
            </section>
          </aside>
        </div>
      </section>
    `;
    wireRecordImages(main);
  }

  function renderNextSteps(record, relatedCount, sourceHref) {
    const sourceAction = sourceHref
      ? "Open the source page and check identifiers, authorship, date and provenance before citing."
      : "Start with a ChemVault search, then confirm identifiers in an external database.";
    const relatedAction = relatedCount
      ? `Review ${relatedCount} linked records to compare mechanisms, reagents, methods and limitations.`
      : "Broaden the search query to find adjacent reagents, methods or case notes.";
    const safetyAction = hazardLabel(record) === "Not classified"
      ? "Treat the record as unclassified until an SDS or institutional EHS source is checked."
      : "Confirm the hazard level, disposal route and local controls against the current SDS.";

    return `
      <section class="record-panel record-next-steps" aria-labelledby="recordNextStepsTitle">
        <div class="library-toolbar">
          <span class="label">Next steps</span>
          <strong id="recordNextStepsTitle">Next research steps</strong>
        </div>
        <div class="record-step-list">
          ${stepCard("01", "Verify source", sourceAction)}
          ${stepCard("02", "Compare linked chemistry", relatedAction)}
          ${stepCard("03", "Plan safe handling", safetyAction)}
        </div>
        <div class="record-next-actions">
          ${sourceHref ? `<a class="secondary-button" href="${esc(sourceHref)}"${/^https?:\/\//i.test(sourceHref) ? ' target="_blank" rel="noreferrer"' : ""}>Open source</a>` : ""}
          <a class="secondary-button" href="#recordRelatedRecords">Review related</a>
          <a class="secondary-button" href="search.html?q=${encode(record.title)}">Search topic</a>
        </div>
      </section>
    `;
  }

  function stepCard(index, title, body) {
    return `
      <article class="record-step-card">
        <span class="record-step-index">${esc(index)}</span>
        <div>
          <h3>${esc(title)}</h3>
          <p>${esc(body)}</p>
        </div>
      </article>
    `;
  }

  function renderTrustStrip(record, sourceHref) {
    const maturity = record.maturity ? `${record.maturity}%` : "Not scored";
    const maturityDetail = record.maturity
      ? "Evidence coverage score for this indexed record."
      : "Evidence coverage has not been scored for this record.";
    const source = sourceLabel(record);
    const sourceDetail = sourceHref
      ? sourceHandoffLabel(sourceHref)
      : "No original source link is attached.";
    const hazard = hazardLabel(record);
    const safetyDetail = primarySafetyText(record) || "No safety statement is attached to this record.";
    const status = record.checkStatus || "Not available";
    const checked = formatDate(record.checkedAt);
    const statusDetail = checked === "Not checked"
      ? "No verification date is recorded."
      : `Last checked ${checked}.`;

    return `
      <div class="record-trust-strip" aria-label="Record credibility signals">
        ${trustCard("Evidence maturity", maturity, maturityDetail, "maturity")}
        ${trustCard("Source provenance", source, sourceDetail, "source")}
        ${trustCard("Safety profile", hazard, safetyDetail, "safety")}
        ${trustCard("Verification status", status, statusDetail, "verification")}
      </div>
    `;
  }

  function trustCard(label, value, detail, modifier) {
    return `
      <article class="record-trust-card record-trust-card--${modifier}">
        <span>${esc(label)}</span>
        <strong>${esc(value || "Not available")}</strong>
        <small>${esc(detail || "Not available")}</small>
      </article>
    `;
  }

  function renderSafetyProfile(record) {
    const hazards = listItems(record.hazardStatements);
    const precautions = listItems(record.precautionaryStatements);
    const hazard = hazardLabel(record);
    const source = record.safetySource || sourceLabel(record);

    return `
      <section class="record-panel record-safety-panel" aria-labelledby="recordSafetyTitle">
        <div class="library-toolbar">
          <span class="label">Safety profile</span>
          <strong>${esc(source || "Screening summary")}</strong>
        </div>
        <div class="record-safety-grid">
          <div class="hazard-summary hazard-${hazardClass(record)}">
            <strong id="recordSafetyTitle">${esc(hazard)}</strong>
            ${hazards.length
              ? hazards.slice(0, 4).map((item) => `<span>${esc(item)}</span>`).join("")
              : "<span>No hazard statement is attached to this record.</span>"}
          </div>
          <div class="disposal-summary">
            <strong>Disposal guidance</strong>
            <span>${esc(record.disposalMethod || "No disposal guidance is attached to this record.")}</span>
          </div>
        </div>
        <div class="record-source-meta">
          <span><strong>Signal word</strong>${esc(record.signalWord || "Not assigned")}</span>
          <span><strong>Safety source</strong>${esc(source || "Not recorded")}</span>
        </div>
        ${precautions.length ? `
          <div class="record-precaution-list">
            <strong>Precautionary statements</strong>
            <ul>
              ${precautions.slice(0, 5).map((item) => `<li>${esc(item)}</li>`).join("")}
            </ul>
          </div>
        ` : ""}
        <p class="record-safety-caveat">Verify the current SDS and institutional EHS guidance before handling or disposing of this material.</p>
      </section>
    `;
  }

  function relatedCard(record) {
    return `
      <a class="related-record-card" href="${record.external ? record.href : api.recordUrl(record.type, record.id)}"${record.external ? ' target="_blank" rel="noreferrer"' : ""}>
        <span class="eyebrow">${esc(record.typeLabel || record.type)}</span>
        <strong>${esc(record.title)}</strong>
        <small>${esc(record.body || record.subtitle || "").slice(0, 150)}${(record.body || "").length > 150 ? "..." : ""}</small>
      </a>
    `;
  }

  function renderMissing(term, records = []) {
    const main = $("#recordMain");
    if (!main) return;
    const query = String(term || "").trim();
    const suggestions = query && api
      ? records
        .map((record) => ({ record, score: api.queryTokens(query).filter((token) => record.searchText.includes(token)).length }))
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((row) => row.record)
      : [];
    main.innerHTML = `
      <section class="page-hero">
        <div class="container page-hero-grid">
          <div>
            <p class="eyebrow">record boundary</p>
            <h1>Record not found</h1>
            <p>No exact ChemVault record was found for ${esc(query)}. Search the local index or open a related suggestion below.</p>
            <div class="hero-actions">
              <a class="primary-button" href="search.html?q=${encode(query)}">Search ChemVault</a>
              <a class="secondary-button" href="workbench.html?q=${encode(query)}">Open Workbench</a>
            </div>
          </div>
          <aside class="page-index-card">
            <strong>${suggestions.length} suggestions</strong>
            <ol>${suggestions.slice(0, 4).map((item) => `<li>${esc(item.title)}</li>`).join("") || "<li>No local suggestions</li>"}</ol>
          </aside>
        </div>
      </section>
      <section class="section">
        <div class="container related-record-grid">
          ${suggestions.map((item) => relatedCard(item)).join("")}
        </div>
      </section>
    `;
  }

  function readFocusRecord(focusKey) {
    if (!focusKey) return null;
    const payload = readStoredFocus(sessionStorage) || readStoredFocus(localStorage);
    if (!payload || payload.key !== focusKey || !payload.record) return null;
    return normaliseFocusRecord(payload.record);
  }

  function readStoredFocus(store) {
    try {
      return JSON.parse(store.getItem(focusStoreKey) || "null");
    } catch {
      return null;
    }
  }

  function normaliseFocusRecord(record) {
    const raw = record.raw || {};
    const type = record.recordType || record.type || "search-result";
    const typeLabel = record.typeLabel || record.type || "Search result";
    const sourceHref = record.sourceHref || raw.href || record.href || "";
    return {
      ...record,
      id: record.id || "focused-record",
      type,
      typeLabel,
      title: record.title || "Focused record",
      subtitle: record.subtitle || "",
      body: record.body || record.subtitle || "",
      tags: record.tags || [],
      formula: record.formula || raw.formula || "",
      hazardStatements: record.hazardStatements || raw.hazardStatements || [],
      hazardLevel: record.hazardLevel || raw.hazardLevel || "",
      signalWord: record.signalWord || raw.signalWord || "",
      precautionaryStatements: record.precautionaryStatements || raw.precautionaryStatements || [],
      disposalMethod: record.disposalMethod || raw.disposalMethod || "",
      safetySource: record.safetySource || raw.safetySource || "",
      sourceHref,
      href: record.href || sourceHref,
      external: /^https?:\/\//i.test(record.href || sourceHref),
      imageUrl: record.imageUrl || raw.imageUrl || "",
      dataSource: record.dataSource || raw.source || raw.raw?.source || "Session import",
      checkStatus: record.checkStatus || raw.checkStatus || (raw.source || raw.raw?.source ? "accepted" : "Not available"),
      checkedAt: record.checkedAt || raw.checkedAt || "Not available",
      sections: [
        { title: "Tags", items: record.tags || [] },
        { title: "Safety", items: [record.hazardLevel || raw.hazardLevel, ...(record.hazardStatements || raw.hazardStatements || []), record.disposalMethod || raw.disposalMethod].filter(Boolean) },
        { title: "Source metadata", items: [raw.cid || raw.raw?.cid ? `CID ${raw.cid || raw.raw?.cid}` : "", raw.pmid ? `PMID ${raw.pmid}` : "", raw.doi ? `DOI ${raw.doi}` : ""].filter(Boolean) }
      ],
      raw
    };
  }

  function sourceLabel(record) {
    return record.dataSource || record.raw?.source || record.raw?.raw?.source || (record.external ? "Session import" : "Curated");
  }

  function sourceHandoffLabel(sourceHref) {
    if (/^https?:\/\//i.test(sourceHref)) return "Links to the original external source.";
    return "Links to a local ChemVault source page.";
  }

  function hazardLabel(record) {
    const value = String(record.hazardLevel || "").trim();
    return value || "Not classified";
  }

  function hazardClass(record) {
    const text = hazardLabel(record).toLowerCase();
    if (/severe|fatal|toxic|corrosive/.test(text)) return "severe";
    if (/high|danger/.test(text)) return "high";
    if (/moderate|warning/.test(text)) return "moderate";
    if (/low|minimal/.test(text)) return "low";
    return "not-classified";
  }

  function primarySafetyText(record) {
    return listItems(record.hazardStatements)[0] || record.disposalMethod || record.signalWord || "";
  }

  function listItems(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || "").trim()).filter(Boolean);
    }
    return String(value || "")
      .split(/\s*\|\s*|\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function formatDate(value) {
    const text = String(value || "").trim();
    if (!text || /^not available$/i.test(text)) return "Not checked";
    const date = new Date(text);
    if (Number.isNaN(date.valueOf())) return text;
    return date.toISOString().slice(0, 10);
  }

  function fact(label, value) {
    return value ? `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>` : "";
  }

  function field(label, value, link = false) {
    const text = String(value || "").trim() || "Not available";
    const content = link && /^https?:\/\//i.test(text)
      ? `<a href="${esc(text)}" target="_blank" rel="noreferrer">${esc(text)}</a>`
      : `<span>${esc(text)}</span>`;
    return `<div><strong>${esc(label)}</strong>${content}</div>`;
  }

  function imageField(value) {
    const text = String(value || "").trim();
    if (!text) return field("image", "");
    if (/^data:image\//i.test(text)) {
      return `<div><strong>image</strong><span>Generated ChemVault preview</span></div>`;
    }
    if (/^https?:\/\//i.test(text)) {
      return `<div><strong>image</strong><a href="${esc(text)}" target="_blank" rel="noreferrer">Open image source</a></div>`;
    }
    return `<div><strong>image</strong><span>${esc(text)}</span></div>`;
  }

  function wireRecordImages(root) {
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

  function externalUrl(source, query) {
    const encoded = encode(query);
    return encoded && source.queryUrl ? source.queryUrl.replace("{query}", encoded) : source.baseUrl;
  }
})();
