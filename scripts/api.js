(function () {
  const defaultBase = "/api";
  const fallbackRecords = [
    {
      id: "nabh4",
      type: "reagent",
      typeLabel: "Reagent",
      title: "Sodium borohydride",
      subtitle: "NaBH4 · Carbonyl reduction",
      body: "Mild hydride donor for reducing aldehydes and ketones to alcohols in teaching-lab contexts.",
      domain: "Reduction",
      family: "Carbonyl reduction",
      risk: "standard",
      formula: "NaBH4",
      tags: ["hydride", "carbonyl", "selective", "alcohol"],
      href: "/pages/record.html?type=reagent&id=nabh4",
      sourceHref: "/pages/reagents.html?id=nabh4",
      imageUrl: placeholderImage("Reagent", "NaBH4", "Reduction")
    },
    {
      id: "graphene-oxide",
      type: "material",
      typeLabel: "Material",
      title: "Graphene oxide",
      subtitle: "oxidized graphene sheet · Carbon nanomaterial",
      body: "Oxidized graphite-derived material with oxygenated groups; evidence claims need composition and reduction history.",
      family: "Carbon nanomaterial",
      maturity: 82,
      tags: ["graphene oxide", "carbon", "dispersion", "surface chemistry"],
      href: "/pages/record.html?type=material&id=graphene-oxide",
      sourceHref: "/pages/materials.html?id=graphene-oxide",
      imageUrl: placeholderImage("Material", "Graphene oxide", "Surface chemistry")
    }
  ];
  const state = {
    records: null,
    meta: null,
    preloadPromise: null
  };

  async function request(path, options = {}) {
    const url = new URL(`${apiBase()}${path}`, window.location.origin);
    Object.entries(options.query || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
    const hasBody = options.body !== undefined;
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: options.signal
    });
    if (!response.ok) {
      throw new Error(`ChemVault API request failed: ${response.status}`);
    }
    return response.json();
  }

  async function health(options = {}) {
    try {
      return await request("/health", options);
    } catch (error) {
      return {
        ok: true,
        service: "chemvault-api",
        backend: "browser-fallback",
        status: "fallback local data",
        features: {
          d1: false,
          fallbackLocalData: true,
          academicEnrichment: false
        },
        warning: error.message
      };
    }
  }

  async function listRecords(params = {}, options = {}) {
    try {
      const payload = await request("/records", { ...options, query: params });
      remember(payload);
      return payload;
    } catch (error) {
      const payload = browserFallback(params, error);
      remember(payload);
      return payload;
    }
  }

  async function getRecord(type, id, options = {}) {
    try {
      return await request(`/records/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, options);
    } catch (error) {
      const record = localRecords().find((item) => item.type === type && String(item.id) === String(id)) || null;
      return {
        source: "browser-fallback",
        record,
        meta: {
          warning: error.message
        }
      };
    }
  }

  async function facets(options = {}) {
    try {
      return await request("/facets", options);
    } catch (error) {
      const tags = new Map();
      const types = new Map();
      localRecords().forEach((record) => {
        const type = record.type || "record";
        const label = record.typeLabel || type;
        const key = `${type}::${label}`;
        types.set(key, (types.get(key) || 0) + 1);
        (record.tags || []).forEach((tag) => tags.set(tag, (tags.get(tag) || 0) + 1));
      });
      return {
        source: "browser-fallback",
        facets: {
          types: [...types].map(([key, count]) => {
            const [type, label] = key.split("::");
            return { type, label, count };
          }),
          tags: [...tags].map(([value, count]) => ({ value, count }))
        },
        meta: {
          warning: error.message
        }
      };
    }
  }

  async function enrichRecords(params = {}, options = {}) {
    const query = typeof params === "string" ? params : params.q || params.query || "";
    try {
      const payload = await request("/enrich", {
        ...options,
        method: "POST",
        body: {
          ...(typeof params === "object" ? params : {}),
          q: query
        }
      });
      remember(payload);
      return payload;
    } catch (error) {
      const payload = browserFallback({ q: query, limit: params.limit || 8 }, error);
      remember(payload);
      return {
        ...payload,
        meta: {
          ...payload.meta,
          status: "browser-fallback",
          stored: 0
        }
      };
    }
  }

  function preloadRecords(params = {}) {
    state.preloadPromise = state.preloadPromise || listRecords(params);
    return state.preloadPromise;
  }

  function remember(payload) {
    state.records = Array.isArray(payload.records) ? payload.records : [];
    state.meta = payload.meta || {};
    window.dispatchEvent(new CustomEvent("chemvault:api-records", { detail: payload }));
  }

  function browserFallback(params = {}, error) {
    const query = normalise(params.q || params.query || "");
    const type = String(params.type || "").trim().toLowerCase();
    const limit = clamp(Number(params.limit || 24), 1, 100);
    const offset = Math.max(0, Number(params.offset || 0));
    const rows = localRecords().filter((record) => {
      if (type && record.type !== type) return false;
      if (!query) return true;
      return normalise([
        record.type,
        record.typeLabel,
        record.title,
        record.subtitle,
        record.body,
        record.domain,
        record.family,
        record.hazardLevel,
        record.signalWord,
        ...(record.hazardStatements || []),
        record.disposalMethod,
        ...(record.tags || [])
      ].join(" ")).includes(query);
    });
    return {
      source: "browser-fallback",
      records: rows.slice(offset, offset + limit),
      meta: {
        count: rows.length,
        limit,
        offset,
        query,
        type,
        warning: error?.message || null
      }
    };
  }

  function localRecords() {
    const records = window.CHEMVAULT_RECORDS;
    if (records?.buildRecords) {
      return records.buildRecords({ includeImported: true }).map((record) => {
        const rawSource = record.raw?.source || record.raw?.raw?.source;
        return ({
          id: record.id,
          type: record.type,
          typeLabel: record.typeLabel || record.type,
          title: record.title,
          subtitle: record.subtitle || "",
          body: record.body || "",
          domain: record.domain || "",
          family: record.family || "",
          risk: record.risk || "",
          maturity: Number(record.maturity || 0),
          formula: record.formula || "",
          tags: record.tags || [],
          href: record.external ? record.href : records.recordUrl(record.type, record.id),
          sourceHref: record.sourceHref || "",
          imageUrl: record.imageUrl || record.raw?.imageUrl || placeholderImage(record.typeLabel || record.type, record.title, record.family || record.domain),
          hazardStatements: record.hazardStatements || record.raw?.hazardStatements || [],
          hazardLevel: record.hazardLevel || record.raw?.hazardLevel || "",
          signalWord: record.signalWord || record.raw?.signalWord || "",
          precautionaryStatements: record.precautionaryStatements || record.raw?.precautionaryStatements || [],
          disposalMethod: record.disposalMethod || record.raw?.disposalMethod || "",
          safetySource: record.safetySource || record.raw?.safetySource || "",
          checkStatus: record.checkStatus || record.raw?.checkStatus || (rawSource ? "accepted" : "curated"),
          checkedAt: record.checkedAt || record.raw?.checkedAt || "",
          raw: record.raw || {},
          searchText: record.searchText || ""
        });
      });
    }
    return fallbackRecords;
  }

  function apiBase() {
    return window.CHEMVAULT_API_BASE || defaultBase;
  }

  function getCachedRecords() {
    return state.records || [];
  }

  function getLastMeta() {
    return state.meta || {};
  }

  function normalise(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9.+-]/g, " ").replace(/\s+/g, " ").trim();
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, Math.trunc(value)));
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
    if (key.includes("source") || key.includes("article") || key.includes("pubmed")) return { bg: "#f5f5f7", bg2: "#fff7ed", border: "#d2d2d7", line: "#52525b", accent: "#0071e3", accent2: "#f59e0b", text: "#1d1d1f", muted: "#6e6e73" };
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

  window.CHEMVAULT_API = {
    request,
    health,
    listRecords,
    searchRecords: listRecords,
    getRecord,
    facets,
    enrichRecords,
    enrich: enrichRecords,
    preloadRecords,
    getCachedRecords,
    getLastMeta
  };
}());
