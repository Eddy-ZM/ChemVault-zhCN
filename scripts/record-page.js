(() => {
  const api = window.CHEMVAULT_RECORDS;
  const external = window.CHEMVAULT_EXTERNAL || { sources: [] };
  const focusStoreKey = "chemvault-focus-record";
  const $ = (selector) => document.querySelector(selector);
  const esc = api?.esc || ((value) => String(value || ""));
  const encode = api?.encode || encodeURIComponent;

  document.addEventListener("DOMContentLoaded", () => {
    if (!api) {
      renderMissing("记录工具未能加载。");
      return;
    }
    const params = new URLSearchParams(location.search);
    const records = api.buildRecords({ includeImported: true });
    const focusRecord = readFocusRecord(params.get("focus"));
    const record = focusRecord
      || api.findRecord(params.get("type"), params.get("id"), records)
      || findByQuery(params.get("q"), records);

    if (!record) {
      renderMissing(params.get("q") || params.get("id") || "未知记录", records);
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
      : api.recordImage("记录", imageMeta.title, imageMeta.subtitle);
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
              ${sourceHref ? `<a class="primary-button" href="${esc(sourceHref)}"${/^https?:\/\//i.test(sourceHref) ? ' target="_blank" rel="noopener noreferrer"' : ""}>打开来源页面</a>` : ""}
              <a class="secondary-button" href="search.html?q=${encode(record.title)}">检索此主题</a>
              ${record.external && record.href ? `<a class="secondary-button" href="${record.href}" target="_blank" rel="noopener noreferrer">打开外部来源</a>` : ""}
            </div>
            ${trustStrip}
          </div>
          <aside class="page-index-card record-index-card">
            <img class="record-focus-image" src="${esc(image)}" data-fallback-src="${esc(fallbackImage)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
            <strong>记录状态</strong>
            <div class="record-fact-grid">
              ${fact("类型", record.typeLabel)}
              ${fact("来源", sourceLabel(record))}
              ${fact("领域", record.domain || record.family || record.category)}
              ${fact("分子式", record.formula)}
              ${fact("危害", hazardLabel(record))}
              ${fact("信号词", statusLabel(record.signalWord))}
              ${fact("成熟度", record.maturity ? `${record.maturity}%` : "")}
              ${fact("风险", riskLabel(record.risk))}
              ${fact("核查状态", statusLabel(record.checkStatus))}
              ${fact("核查时间", record.checkedAt)}
              ${fact("版本", api.version)}
            </div>
          </aside>
        </div>
      </section>

      <section class="section record-section">
        <div class="container record-layout">
          <article class="record-primary">
            <section class="record-panel">
              <div class="library-toolbar">
                <span class="label">学术概览</span>
                <strong>${esc(record.typeLabel || "记录")}</strong>
              </div>
              <p class="record-lead">${esc(record.body || record.subtitle || "该记录暂无摘要文本。")}</p>
              ${record.tags?.length ? `<div class="tag-row">${record.tags.slice(0, 18).map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}</div>` : ""}
            </section>

            ${safetyPanel}

            <section class="record-panel">
              <div class="library-toolbar">
                <span class="label">关键字段</span>
                <strong>${esc(sourceLabel(record))}</strong>
              </div>
              <div class="record-field-grid">
                ${field("标题", record.title)}
                ${field("副标题", record.subtitle)}
                ${field("类型", record.typeLabel || record.type)}
                ${field("分子式", record.formula)}
                ${field("标签", (record.tags || []).join(", "))}
                ${field("正文", record.body)}
                ${field("危害声明", (record.hazardStatements || []).join(" | "))}
                ${field("危害等级", hazardLabel(record))}
                ${field("信号词", statusLabel(record.signalWord))}
                ${field("废弃处置", record.disposalMethod)}
                ${field("安全来源", record.safetySource)}
                ${imageField(image)}
                ${field("来源链接", sourceHref, true)}
                ${field("核查状态", statusLabel(record.checkStatus))}
                ${field("核查时间", record.checkedAt)}
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
                <span class="label">相关记录</span>
                <strong>${related.length} 条关联</strong>
              </div>
              <div class="related-record-grid">
                ${related.length ? related.map((item) => relatedCard(item)).join("") : `<div class="empty-state">该条目暂无可评分的相关记录。</div>`}
              </div>
            </section>

            <section class="record-panel">
              <h2>外部学术核验</h2>
              <p class="muted">使用公共学术数据库核验标识符、来源链路、一手文献和安全关键声明。</p>
              <div class="source-action-row">
                ${(external.sources || []).slice(0, 6).map((source) => `
                  <a class="secondary-button" href="${externalUrl(source, record.title)}" target="_blank" rel="noopener noreferrer">${esc(source.name)}</a>
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
      ? "引用前打开来源页面，核对标识符、作者、日期和来源链路。"
      : "先从 ChemVault 检索开始，再到外部数据库确认标识符。";
    const relatedAction = relatedCount
      ? `复核 ${relatedCount} 条关联记录，对比机理、试剂、方法和局限性。`
      : "扩大检索词，寻找相邻试剂、方法或案例笔记。";
    const safetyAction = hazardLabel(record) === "未分类"
      ? "在核对 SDS 或机构 EHS 来源前，将该记录视为未分类记录。"
      : "用当前 SDS 确认危害等级、处置路线和本地控制要求。";

    return `
      <section class="record-panel record-next-steps" aria-labelledby="recordNextStepsTitle">
        <div class="library-toolbar">
          <span class="label">下一步</span>
          <strong id="recordNextStepsTitle">后续研究动作</strong>
        </div>
        <div class="record-step-list">
          ${stepCard("01", "核验来源", sourceAction)}
          ${stepCard("02", "对比关联化学", relatedAction)}
          ${stepCard("03", "规划安全处理", safetyAction)}
        </div>
        <div class="record-next-actions">
          ${sourceHref ? `<a class="secondary-button" href="${esc(sourceHref)}"${/^https?:\/\//i.test(sourceHref) ? ' target="_blank" rel="noopener noreferrer"' : ""}>打开来源</a>` : ""}
          <a class="secondary-button" href="#recordRelatedRecords">查看关联</a>
          <a class="secondary-button" href="search.html?q=${encode(record.title)}">检索主题</a>
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
    const maturity = record.maturity ? `${record.maturity}%` : "未评分";
    const maturityDetail = record.maturity
      ? "该索引记录的证据覆盖评分。"
      : "该记录尚未评估证据覆盖。";
    const source = sourceLabel(record);
    const sourceDetail = sourceHref
      ? sourceHandoffLabel(sourceHref)
      : "该记录未附加原始来源链接。";
    const hazard = hazardLabel(record);
    const safetyDetail = primarySafetyText(record) || "该记录未附加安全声明。";
    const status = statusLabel(record.checkStatus || "未记录");
    const checked = formatDate(record.checkedAt);
    const statusDetail = checked === "未核查"
      ? "未记录核查日期。"
      : `最近核查：${checked}。`;

    return `
      <div class="record-trust-strip" aria-label="记录可信度信号">
        ${trustCard("证据成熟度", maturity, maturityDetail, "maturity")}
        ${trustCard("来源链路", source, sourceDetail, "source")}
        ${trustCard("安全画像", hazard, safetyDetail, "safety")}
        ${trustCard("核验状态", status, statusDetail, "verification")}
      </div>
    `;
  }

  function trustCard(label, value, detail, modifier) {
    return `
      <article class="record-trust-card record-trust-card--${modifier}">
        <span>${esc(label)}</span>
        <strong>${esc(value || "未记录")}</strong>
        <small>${esc(detail || "未记录")}</small>
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
          <span class="label">安全画像</span>
          <strong>${esc(source || "筛查摘要")}</strong>
        </div>
        <div class="record-safety-grid">
          <div class="hazard-summary hazard-${hazardClass(record)}">
            <strong id="recordSafetyTitle">${esc(hazard)}</strong>
            ${hazards.length
              ? hazards.slice(0, 4).map((item) => `<span>${esc(item)}</span>`).join("")
              : "<span>该记录未附加危害声明。</span>"}
          </div>
          <div class="disposal-summary">
            <strong>废弃处置建议</strong>
            <span>${esc(record.disposalMethod || "该记录未附加废弃处置建议。")}</span>
          </div>
        </div>
        <div class="record-source-meta">
          <span><strong>信号词</strong>${esc(statusLabel(record.signalWord || "未指定"))}</span>
          <span><strong>安全来源</strong>${esc(source || "未记录")}</span>
        </div>
        ${precautions.length ? `
          <div class="record-precaution-list">
            <strong>防范说明</strong>
            <ul>
              ${precautions.slice(0, 5).map((item) => `<li>${esc(item)}</li>`).join("")}
            </ul>
          </div>
        ` : ""}
        <p class="record-safety-caveat">处理或废弃该材料前，请核对当前 SDS 和机构 EHS 指南。</p>
      </section>
    `;
  }

  function relatedCard(record) {
    return `
      <a class="related-record-card" href="${record.external ? record.href : api.recordUrl(record.type, record.id)}"${record.external ? ' target="_blank" rel="noopener noreferrer"' : ""}>
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
            <p class="eyebrow">记录边界</p>
            <h1>未找到记录</h1>
            <p>没有找到与 ${esc(query)} 精确匹配的 ChemVault 记录。可以检索本地索引，或打开下方相关建议。</p>
            <div class="hero-actions">
              <a class="primary-button" href="search.html?q=${encode(query)}">检索 ChemVault</a>
              <a class="secondary-button" href="workbench.html?q=${encode(query)}">打开工作台</a>
            </div>
          </div>
          <aside class="page-index-card">
            <strong>${suggestions.length} 条建议</strong>
            <ol>${suggestions.slice(0, 4).map((item) => `<li>${esc(item.title)}</li>`).join("") || "<li>暂无本地建议</li>"}</ol>
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
    const typeLabel = record.typeLabel || record.type || "检索结果";
    const sourceHref = record.sourceHref || raw.href || record.href || "";
    return {
      ...record,
      id: record.id || "focused-record",
      type,
      typeLabel,
      title: record.title || "聚焦记录",
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
      dataSource: record.dataSource || raw.source || raw.raw?.source || "会话导入",
      checkStatus: record.checkStatus || raw.checkStatus || (raw.source || raw.raw?.source ? "accepted" : "未记录"),
      checkedAt: record.checkedAt || raw.checkedAt || "未记录",
      sections: [
        { title: "标签", items: record.tags || [] },
        { title: "安全", items: [record.hazardLevel || raw.hazardLevel, ...(record.hazardStatements || raw.hazardStatements || []), record.disposalMethod || raw.disposalMethod].filter(Boolean) },
        { title: "来源元数据", items: [raw.cid || raw.raw?.cid ? `CID ${raw.cid || raw.raw?.cid}` : "", raw.pmid ? `PMID ${raw.pmid}` : "", raw.doi ? `DOI ${raw.doi}` : ""].filter(Boolean) }
      ],
      raw
    };
  }

  function sourceLabel(record) {
    return sourceDisplay(record.dataSource || record.raw?.source || record.raw?.raw?.source || (record.external ? "Session import" : "Curated"));
  }

  function sourceHandoffLabel(sourceHref) {
    if (/^https?:\/\//i.test(sourceHref)) return "链接到原始外部来源。";
    return "链接到 ChemVault 本地来源页面。";
  }

  function hazardLabel(record) {
    const value = String(record.hazardLevel || "").trim();
    if (!value) return "未分类";
    return statusLabel(value);
  }

  function hazardClass(record) {
    const text = hazardLabel(record).toLowerCase();
    if (/severe|fatal|toxic|corrosive|严重|腐蚀|有毒|危险/.test(text)) return "severe";
    if (/high|danger|高/.test(text)) return "high";
    if (/moderate|warning|中等|警告/.test(text)) return "moderate";
    if (/low|minimal|低/.test(text)) return "low";
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
    if (!text || /^not available$/i.test(text) || text === "未记录") return "未核查";
    const date = new Date(text);
    if (Number.isNaN(date.valueOf())) return text;
    return date.toISOString().slice(0, 10);
  }

  function fact(label, value) {
    return value ? `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>` : "";
  }

  function field(label, value, link = false) {
    const text = String(value || "").trim() || "未记录";
    const content = link && /^https?:\/\//i.test(text)
      ? `<a href="${esc(text)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`
      : `<span>${esc(text)}</span>`;
    return `<div><strong>${esc(label)}</strong>${content}</div>`;
  }

  function imageField(value) {
    const text = String(value || "").trim();
    if (!text) return field("图像", "");
    if (/^data:image\//i.test(text)) {
      return `<div><strong>图像</strong><span>ChemVault 生成预览</span></div>`;
    }
    if (/^https?:\/\//i.test(text)) {
      return `<div><strong>图像</strong><a href="${esc(text)}" target="_blank" rel="noopener noreferrer">打开图像来源</a></div>`;
    }
    return `<div><strong>图像</strong><span>${esc(text)}</span></div>`;
  }

  function sourceDisplay(value) {
    const text = String(value || "").trim();
    const lower = text.toLowerCase();
    if (!text) return "本地整理";
    if (lower === "curated") return "本地整理";
    if (lower === "fallback" || lower === "browser-fallback") return "本地备用";
    if (lower === "session import" || lower === "imported") return "会话导入";
    return text;
  }

  function statusLabel(value) {
    const text = String(value || "").trim();
    const lower = text.toLowerCase();
    const map = {
      accepted: "已接受",
      curated: "本地整理",
      fallback: "本地备用",
      severe: "严重",
      high: "高",
      moderate: "中等",
      low: "低",
      "not classified": "未分类",
      danger: "危险",
      warning: "警告",
      "not available": "未记录",
      "not assigned": "未指定"
    };
    return map[lower] || text || "未记录";
  }

  function riskLabel(value) {
    const text = String(value || "").trim();
    const map = {
      corrosive: "腐蚀性",
      oxidizer: "氧化性",
      dry: "需干燥处理",
      toxic: "有毒",
      energetic: "潜在能量风险",
      standard: "常规"
    };
    return map[text.toLowerCase()] || text;
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
