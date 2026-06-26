(function () {
  const themeQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
  const searchIntent = () => window.CHEMVAULT_SEARCH_INTENT;
  const importedStoreKey = "chemvault-imported-records";
  let shellSearchItemsCache = null;
  let shellSearchImportSignature = "";
  let shellSearchFrame = 0;

  document.addEventListener("DOMContentLoaded", () => {
    wireShellNav();
    wireShellTheme();
    wireShellSearch();
    upgradeAcademicNavigation();
    markActivePage();
    adaptShellLayout();
    ensureDeveloperFooter();
  });

  function wireShellNav() {
    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".menu-toggle");
    toggle?.addEventListener("click", () => {
      const open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  function wireShellTheme() {
    applyTheme(readThemeSetting());
    themeQuery?.addEventListener?.("change", () => {
      if (readThemeSetting() === "system") applyTheme("system", { persist: false });
    });
    document.querySelectorAll("[data-shell-action='theme']").forEach((button) => {
      button.addEventListener("click", () => {
        const next = nextThemeSetting(button.dataset.themeState || readThemeSetting());
        startThemeTransition(button, next);
        applyTheme(next);
      });
    });
  }

  function wireShellSearch() {
    const input = document.querySelector("#shellSearch");
    const panel = document.querySelector("#shellSearchResults");
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

    const renderShellResults = () => {
      const rawQuery = input.value.trim();
      const query = normalise(rawQuery);
      if (!query) {
        panel.classList.remove("active");
        panel.innerHTML = "";
        return;
      }

      const external = window.CHEMVAULT_EXTERNAL;
      const localItems = shellSearchItems();
      const localHits = rankedLocalHits(localItems, rawQuery, 6);
      const externalHits = (external?.sources || []).slice(0, 4).map((source) => ({
        type: "外部来源",
        title: `检索 ${source.name}`,
        body: source.bestFor,
        href: source.queryUrl.replace("{query}", encodeURIComponent(rawQuery)),
        external: true,
        imageUrl: placeholderImage("External", source.name, source.family)
      }));
      const hits = [...localHits, ...externalHits].slice(0, 8);
      panel.classList.add("active");
      panel.innerHTML = hits.length ? hits.map((hit) => `
        <a class="search-hit" href="${hit.href}"${hit.external ? ' target="_blank" rel="noopener noreferrer"' : ""}>
          <img src="${escapeHTML(thumbnailFor(hit))}" data-fallback-src="${escapeHTML(placeholderImage(hit.type, hit.title, hit.formula || hit.family || hit.domain || ""))}" alt="" loading="lazy" referrerpolicy="no-referrer" />
          <span>${escapeHTML(hit.type)}</span>
          <strong>${escapeHTML(hit.title)}</strong>
          <small>${escapeHTML(hit.body)}</small>
        </a>
      `).join("") : `<div class="empty-state">未找到匹配的学术记录。</div>`;
      wireImageFallbacks(panel);
    };

    input.addEventListener("input", () => {
      syncShell();
      if (shellSearchFrame) cancelAnimationFrame(shellSearchFrame);
      shellSearchFrame = requestAnimationFrame(() => {
        shellSearchFrame = 0;
        renderShellResults();
      });
    });
    syncShell();
  }

  function shellSearchItems() {
    const importSignature = shellSearchImportedSignature();
    if (shellSearchItemsCache && shellSearchImportSignature === importSignature) {
      return shellSearchItemsCache;
    }

    const data = window.CHEMVAULT_DATA;
    const research = window.CHEMVAULT_RESEARCH;
    const dossiers = window.CHEMVAULT_DOSSIERS;
    const methods = window.CHEMVAULT_METHODS;
    const spectroscopy = window.CHEMVAULT_SPECTROSCOPY;
    const materials = window.CHEMVAULT_MATERIALS;
    const records = window.CHEMVAULT_RECORDS;
    shellSearchItemsCache = records?.buildRecords ? records.buildRecords({ includeImported: true }).map((item) => ({
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
      text: item.searchText
    })) : [
      ...(data?.reactionSystems || []).map((item) => ({ id: item.id, recordType: "reaction", type: "Reaction", title: item.name, body: item.className, href: `workbench.html?id=${encodeURIComponent(item.id)}`, text: [item.name, item.className, item.domain, ...(item.conditions || []), ...(item.readouts || []), ...(item.limitations || [])].join(" ") })),
      ...(data?.reactants || []).map((item) => ({ id: item.id, recordType: "reactant", type: "Reactant", title: item.name, body: item.className, href: `workbench.html?q=${encodeURIComponent(item.name)}`, text: [item.name, item.className, ...(item.functionalGroups || []), ...(item.compatibleMethods || []), ...(item.constraints || [])].join(" ") })),
      ...(data?.reagents || []).map((item) => ({ id: item.id, recordType: "reagent", type: "Reagent", title: `${item.formula} · ${item.name}`, body: item.focus, formula: item.formula, tags: item.tags || [], href: `reagents.html?id=${encodeURIComponent(item.id)}`, text: [item.formula, item.name, item.focus, item.category, ...(item.tags || []), ...(item.transformations || [])].join(" ") })),
      ...(data?.compounds || []).map((item) => ({ id: item.id, recordType: "compound", type: "Compound", title: `${item.formula} · ${item.name}`, body: item.summary, formula: item.formula, tags: [...(item.synonyms || []), ...(item.tags || [])], href: `search.html?q=${encodeURIComponent(item.name)}`, text: [item.formula, item.name, item.family, item.cas, item.summary, ...(item.synonyms || []), ...(item.tags || [])].join(" ") })),
      ...(research?.caseStudies || []).map((item) => ({ id: item.id, recordType: "research-case", type: "Case", title: item.title, body: item.question, href: `research.html?case=${encodeURIComponent(item.id)}`, text: [item.title, item.discipline, item.question, item.thesis].join(" ") })),
      ...(dossiers?.dossiers || []).map((item) => ({ id: item.id, recordType: "dossier", type: "Dossier", title: item.title, body: item.abstract, href: `dossiers.html?id=${encodeURIComponent(item.id)}`, text: [item.title, item.field, item.status, item.abstract, ...(item.keywords || []), ...(item.claims || [])].join(" ") })),
      ...(methods?.protocols || []).map((item) => ({ id: item.id, recordType: "method", type: "Method", title: item.title, body: item.summary, href: `methods.html?id=${encodeURIComponent(item.id)}`, text: [item.title, item.domain, item.level, item.summary, ...(item.inputs || []), ...(item.outputs || [])].join(" ") })),
      ...(spectroscopy?.cases || []).map((item) => ({ id: item.id, recordType: "spectroscopy", type: "Spectroscopy", title: item.title, body: item.question, href: `spectroscopy.html?id=${encodeURIComponent(item.id)}`, text: [item.title, item.family, item.question, item.conclusion, ...(item.signals || []).flatMap((signal) => [signal.technique, signal.signal, signal.interpretation])].join(" ") })),
      ...(materials?.materials || []).map((item) => ({ id: item.id, recordType: "material", type: "Material", title: item.name, body: item.synthesis, formula: item.formula, tags: item.tags || [], href: `materials.html?id=${encodeURIComponent(item.id)}`, text: [item.name, item.family, item.formula, item.synthesis, ...(item.applications || []), ...(item.properties || []), ...(item.characterization || [])].join(" ") })),
      ...(data?.routes || []).map((item) => ({ recordType: "route", type: "Route", title: `${item.start} to ${item.target}`, body: item.note, href: `library.html?q=${encodeURIComponent(`${item.start} ${item.target}`)}`, text: [item.start, item.target, item.note, ...(item.route || [])].join(" ") })),
      ...(data?.mechanisms || []).map((item) => ({ id: item.id, recordType: "mechanism", type: "Mechanism", title: item.name, body: item.summary, href: `atlas.html?id=${encodeURIComponent(item.id)}`, text: [item.name, item.className, item.summary, ...(item.bestFor || [])].join(" ") })),
      ...(data?.concepts || []).map((item) => ({ id: item.id, recordType: "concept", type: "Concept", title: item.term, body: item.definition, href: `library.html?q=${encodeURIComponent(item.term)}`, text: [item.term, item.family, item.definition, item.equation].join(" ") })),
      ...(data?.sources || []).map((item) => ({ id: item.id, recordType: "source", type: "Source", title: item.short, body: item.note, href: `library.html?q=${encodeURIComponent(item.short)}`, text: [item.title, item.short, item.family, item.note].join(" ") }))
    ];
    shellSearchImportSignature = importSignature;
    return shellSearchItemsCache;
  }

  function shellSearchImportedSignature() {
    try {
      return localStorage.getItem(importedStoreKey) || "";
    } catch {
      return "";
    }
  }

  function rankedLocalHits(items, rawQuery, limit) {
    const query = normalise(rawQuery);
    const seen = new Set();
    const hits = [];
    const addHit = (item) => {
      const key = searchIntent()?.recordKey?.(item) || `${item.type}:${item.id || item.title}`;
      if (seen.has(key)) return;
      seen.add(key);
      hits.push(item);
    };

    (searchIntent()?.rank?.(rawQuery, items, { limit }) || []).forEach((match) => addHit(match.item));
    items
      .filter((item) => normalise([item.text, item.title, item.type, item.body, item.formula, ...(item.tags || [])].filter(Boolean).join(" ")).includes(query))
      .slice(0, limit)
      .forEach(addHit);
    return hits.slice(0, limit);
  }

  function markActivePage() {
    const current = normalisePath(location.pathname);
    document.querySelectorAll(".site-nav a").forEach((link) => {
      const target = normalisePath(new URL(link.getAttribute("href") || "", location.href).pathname);
      if (target === current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.querySelectorAll(".nav-more").forEach((group) => {
      const summary = group.querySelector("summary");
      if (!summary) return;
      if (group.querySelector("a[aria-current]")) summary.setAttribute("aria-current", "page");
      else summary.removeAttribute("aria-current");
    });
  }

  function upgradeAcademicNavigation() {
    const nav = document.querySelector(".site-nav");
    if (!nav) return;
    nav.innerHTML = [
      ["首页", "/index.html"],
      ["研究", "/pages/research.html"],
      ["平台", "/pages/platform.html"],
      ["项目", "/pages/projects.html"],
      ["笔记", "/pages/notes.html"],
      ["化合物", "/pages/search.html"]
    ].map(([label, href]) => `<a href="${href}">${label}</a>`).join("") + `
      <details class="nav-more">
        <summary>更多</summary>
        <div class="nav-more-menu">
          <a href="/pages/app.html">应用</a>
          <a href="/pages/workbench.html">工作台</a>
          <a href="/pages/reagents.html">试剂</a>
          <a href="/pages/materials.html">材料</a>
          <a href="/pages/methods.html">方法</a>
          <a href="/pages/dossiers.html">档案</a>
          <a href="/pages/spectroscopy.html">谱学</a>
          <a href="/pages/atlas.html">图谱</a>
          <a href="/pages/library.html">资料库</a>
          <a href="/pages/about.html">关于</a>
          <a href="/pages/filing.html">备案信息</a>
          <a href="/pages/team.html">团队</a>
          <a href="/pages/developer.html">开发者</a>
          <a href="/pages/contact.html">联系</a>
        </div>
      </details>`;

    const brand = document.querySelector(".brand");
    const brandSmall = brand?.querySelector("small");
    if (brand) brand.setAttribute("href", "/index.html");
    if (brandSmall) brandSmall.textContent = "科学知识基础设施";
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
    document.querySelectorAll("[data-shell-action='theme']").forEach((button) => {
      button.dataset.themeSetting = setting;
      button.dataset.themeState = mode;
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
    return resolveTheme(normaliseTheme(setting)) === "dark" ? "light" : "dark";
  }

  function themeLabel(setting, mode) {
    return `${mode === "dark" ? "深色" : "浅色"}主题已启用。切换为${mode === "dark" ? "浅色" : "深色"}主题`;
  }

  function themeTitle(setting, mode) {
    return `切换为${mode === "dark" ? "浅色" : "深色"}主题`;
  }

  function normalisePath(pathname) {
    let path = String(pathname || "").replace(/\/+$/, "");
    if (!path || path === "/") return "index";
    const file = path.split("/").pop() || "index";
    return file.replace(/\.html$/i, "") || "index";
  }

  function ensureDeveloperFooter() {
    if (document.querySelector(".site-footer")) return;
    const versionLabel = "ChemVault v0.2.4";
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.setAttribute("aria-label", "ChemVault 页脚");
    footer.innerHTML = `
      <div class="footer-sticky-layer">
        <div class="footer-sticky-shell">
          <div class="footer-panel">
            <div class="footer-ambient" aria-hidden="true"><span></span><span></span><span></span></div>
            <div class="container footer-grid developer-footer-grid">
              <div class="footer-brand-block footer-reveal" style="--footer-delay: 0ms">
                <a class="footer-brand" href="/index.html">
                  <span class="footer-brand-mark" aria-hidden="true"><img src="/assets/chemvault-logo-mark.png" alt="" /></span>
                  <span><strong>ChemVault</strong><small>科学知识基础设施</small></span>
                </a>
                <p>面向化学、科学数据抽取、研究智能与 AI 辅助知识系统的学术技术项目。化学信息用于学习和资料整理，实际研究与安全判断请复核一手来源。</p>
                <div class="footer-social-row" aria-label="页脚快捷入口">
                  <a class="footer-social" href="/pages/search.html" aria-label="检索 ChemVault">化合物检索</a>
                  <a class="footer-social" href="/pages/platform.html" aria-label="打开平台页">平台</a>
                  <a class="footer-social" href="/pages/public-data.html" aria-label="打开公开数据说明">公开数据</a>
                </div>
              </div>
              <div class="footer-link-groups">
                <div class="footer-column footer-reveal" style="--footer-delay: 90ms">
                  <span class="footer-heading">探索</span>
                  <a href="/pages/research.html">研究</a>
                  <a href="/pages/platform.html">平台</a>
                  <a href="/pages/projects.html">项目</a>
                  <a href="/pages/notes.html">笔记</a>
                  <a href="/pages/about.html">关于</a>
                  <a href="/pages/team.html">团队</a>
                </div>
                <div class="footer-column footer-reveal" style="--footer-delay: 180ms">
                  <span class="footer-heading">工作区</span>
                  <a href="/pages/search.html">化合物检索</a>
                  <a href="/pages/workbench.html">研究工作台</a>
                  <a href="/pages/app.html">框架应用</a>
                  <a href="/pages/reagents.html">试剂</a>
                  <a href="/pages/materials.html">材料</a>
                  <a href="/pages/atlas.html">图谱</a>
                </div>
                <div class="footer-column footer-reveal" style="--footer-delay: 270ms">
                  <span class="footer-heading">资源</span>
                  <a href="/pages/library.html">资料库</a>
                  <a href="/pages/methods.html">方法</a>
                  <a href="/pages/spectroscopy.html">谱学</a>
                  <a href="/pages/dossiers.html">档案</a>
                  <a href="/pages/public-data.html">公开数据</a>
                  <a href="/pages/sitemap.html">站点地图</a>
                </div>
                <div class="footer-column footer-reveal" style="--footer-delay: 360ms">
                  <span class="footer-heading">联系</span>
                  <a href="mailto:contact@chemvault.science">联系 ChemVault</a>
                  <a href="/pages/contact.html">合作沟通</a>
                  <a href="https://github.com/Eddy-ZM" target="_blank" rel="noopener noreferrer">GitHub</a>
                  <a href="/pages/filing.html">网站说明与备案信息</a>
                  <span>ICP备案号：待填写</span>
                  <span>© 2026 ChemVault</span>
                </div>
              </div>
            </div>
            <div class="container footer-mobile-compact">
              <div class="footer-mobile-identity">
                <a class="footer-brand" href="/index.html">
                  <span class="footer-brand-mark" aria-hidden="true"><img src="/assets/chemvault-logo-mark.png" alt="" /></span>
                  <span><strong>ChemVault</strong><small>科学基础设施</small></span>
                </a>
                <p>面向化学和科学知识系统的学术技术项目。使用前请复核一手数据。</p>
              </div>
              <nav class="footer-mobile-links" aria-label="页脚导航">
                <a href="/pages/search.html">化合物</a>
                <a href="/pages/platform.html">平台</a>
                <a href="/pages/projects.html">项目</a>
                <a href="/pages/contact.html">联系</a>
              </nav>
            </div>
            <div class="container footer-bottom">
              <p>© 2026 ChemVault，保留所有权利。</p>
              <div class="footer-bottom-meta">
                <p>研究导向参考资料，不能替代一手文献、安全评估或机构规范。</p>
                <span class="footer-version">${versionLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(footer);
  }

  function adaptShellLayout() {
    const header = document.querySelector(".site-header");
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

  function normalise(value) {
    return String(value).normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}.+-]/gu, "");
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

  function thumbnailFor(hit) {
    if (hit.imageUrl) return hit.imageUrl;
    const cid = pubChemCidFrom(hit);
    if (cid && canUsePubChemName(hit.title)) {
      return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${encodeURIComponent(cid)}/PNG?record_type=2d&image_size=small`;
    }
    const type = String(hit.type || "").toLowerCase();
    if ((type.includes("compound") || type.includes("reagent")) && canUsePubChemName(hit.title)) {
      return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(hit.title.replace(/^.*·\s*/, ""))}/PNG?record_type=2d&image_size=small`;
    }
    return placeholderImage(hit.type, hit.title, hit.formula || hit.family || hit.domain || "");
  }

  function canUsePubChemName(title) {
    const text = String(title || "").trim();
    return Boolean(text)
      && !/\breference\b/i.test(text)
      && !/\b(panel|system|class|mixture|solution|buffer|assay|test|screen|candidate|reaction)\b/i.test(text)
      && !/^syscat-/i.test(text);
  }

  function pubChemCidFrom(hit = {}) {
    const raw = hit.raw || {};
    const cid = hit.cid || raw.cid || raw.CID;
    if (cid) return cid;
    const href = String(hit.sourceHref || raw.sourceHref || raw.href || raw.url || "");
    const match = href.match(/pubchem\.ncbi\.nlm\.nih\.gov\/compound\/(\d+)/i);
    return match?.[1] || "";
  }

  function placeholderImage(type, title, subtitle = "") {
    const palette = imagePalette(type);
    const formula = imageFormula(subtitle);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240" role="img" aria-label="${svgEsc(title)}"><rect width="360" height="240" fill="${palette.bg}"/><rect x="16" y="16" width="328" height="208" rx="18" fill="#fff" stroke="${palette.border}"/><text x="30" y="45" fill="${palette.accent}" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="800">${svgEsc(type).slice(0, 24)}</text><g transform="translate(45 68)" fill="none" stroke="${palette.line}" stroke-linecap="round" stroke-linejoin="round"><path d="M52 0 92 23v46l-40 23-40-23V23Z" stroke-width="6" opacity=".74"/><path d="M92 23h46M92 69h46M12 23l-30-18M12 69l-30 18" stroke-width="5" opacity=".46"/><circle cx="52" cy="0" r="10" fill="${palette.accent}" stroke="none"/><circle cx="92" cy="69" r="10" fill="${palette.accent2}" stroke="none"/></g><text x="210" y="100" fill="${palette.text}" font-family="SFMono-Regular,Menlo,Consolas,monospace" font-size="19" font-weight="800">${svgEsc(formula || "Chem").slice(0, 10)}</text><text x="30" y="198" fill="${palette.text}" font-family="Inter,Arial,sans-serif" font-size="21" font-weight="850">${svgEsc(title).slice(0, 24)}</text><text x="30" y="217" fill="${palette.muted}" font-family="Inter,Arial,sans-serif" font-size="12" font-weight="650">${svgEsc(subtitle).slice(0, 32)}</text></svg>`;
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
}());
