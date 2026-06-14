const API_VERSION = "0.2.0";
let schemaReady = false;

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
    imageUrl: placeholderImage("Reagent", "NaBH4", "Reduction"),
    raw: {
      transformations: ["Aldehyde to primary alcohol", "Ketone to secondary alcohol"],
      safety: "Use normal teaching-lab controls and consult the SDS before handling."
    }
  },
  {
    id: "dmp",
    type: "reagent",
    typeLabel: "Reagent",
    title: "Dess-Martin periodinane",
    subtitle: "DMP · Selective alcohol oxidation",
    body: "Hypervalent iodine oxidant commonly used for mild oxidation of alcohols to aldehydes or ketones.",
    domain: "Oxidation",
    family: "Alcohol oxidation",
    risk: "oxidizer",
    tags: ["oxidation", "alcohol", "aldehyde", "ketone"],
    href: "/pages/record.html?type=reagent&id=dmp",
    sourceHref: "/pages/reagents.html?id=dmp",
    imageUrl: placeholderImage("Reagent", "DMP", "Oxidation"),
    raw: {
      transformations: ["Primary alcohol to aldehyde", "Secondary alcohol to ketone"],
      safety: "Treat oxidizing reagents and iodine byproducts according to institutional procedures."
    }
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
    imageUrl: placeholderImage("Material", "Graphene oxide", "Surface chemistry"),
    raw: {
      applications: ["Composite fillers", "Membranes", "Surface-functional materials"],
      evidenceLevel: "Report oxidation route and elemental composition before claiming material identity."
    }
  },
  {
    id: "sn1",
    type: "mechanism",
    typeLabel: "Mechanism",
    title: "SN1 substitution",
    subtitle: "Carbocation substitution",
    body: "Stepwise substitution proceeding through ionization, carbocation formation and nucleophile capture.",
    family: "Substitution",
    tags: ["SN1", "carbocation", "solvolysis", "tertiary substrate"],
    href: "/pages/record.html?type=mechanism&id=sn1",
    sourceHref: "/pages/atlas.html?id=sn1",
    imageUrl: placeholderImage("Mechanism", "SN1", "Substitution"),
    raw: {
      limitations: ["Primary substrates usually do not favour SN1", "Competing E1 elimination can appear."]
    }
  },
  {
    id: "claim-audit",
    type: "method",
    typeLabel: "Method",
    title: "Claim audit workflow",
    subtitle: "Evidence review",
    body: "Separates observation, interpretation and unsupported claim before a chemistry record is accepted.",
    domain: "Reproducibility",
    family: "Review method",
    maturity: 90,
    tags: ["claims", "evidence", "reproducibility", "review"],
    href: "/pages/record.html?type=method&id=claim-audit",
    sourceHref: "/pages/methods.html?id=claim-audit",
    imageUrl: placeholderImage("Method", "Evidence", "Review"),
    raw: {
      workflow: ["List claims", "Attach observables", "Mark missing controls", "Assign evidence grade"]
    }
  },
  {
    id: "pubchem",
    type: "source",
    typeLabel: "Source",
    title: "PubChem",
    subtitle: "NIH / NCBI compound database",
    body: "Public compound identifiers, synonyms, structures and property records for chemistry search handoff.",
    family: "Compound database",
    tags: ["NIH", "NCBI", "compound", "identifier"],
    href: "https://pubchem.ncbi.nlm.nih.gov/",
    imageUrl: placeholderImage("Source", "PubChem", "NIH / NCBI"),
    raw: {
      bestFor: "Compound metadata and identifiers."
    }
  }
];

const jsonHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8"
};

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: jsonHeaders });
  }

  if (!["GET", "POST"].includes(request.method)) {
    return json({ error: "Method not allowed" }, 405);
  }

  const url = new URL(request.url);
  const segments = getPathSegments(context.params?.path);
  const hasDb = Boolean(env?.DB?.prepare);

  try {
    if (!segments.length || segments[0] === "health") {
      return json({
        ok: true,
        service: "chemvault-api",
        version: API_VERSION,
        backend: hasDb ? "d1" : "fallback",
        status: hasDb ? "D1 connected" : "fallback local data",
        features: {
          d1: hasDb,
          fallbackLocalData: true,
          academicEnrichment: true
        }
      });
    }

    if (segments[0] === "records") {
      if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
      if (segments.length >= 3) {
        return json(await getRecord(env, segments[1], segments[2], hasDb));
      }
      return json(await listRecords(env, url.searchParams, hasDb));
    }

    if (segments[0] === "enrich") {
      return json(await enrichRecords(env, request, url.searchParams, hasDb));
    }

    if (segments[0] === "facets" || segments[0] === "meta") {
      if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
      return json(await getFacets(env, hasDb));
    }

    return json({ error: "Not found", routes: ["/api/health", "/api/records", "/api/records/:type/:id", "/api/enrich", "/api/facets"] }, 404);
  } catch (error) {
    return json(fallbackEnvelope({
      warning: `D1 query failed; returned fallback records. ${error.message || error}`
    }));
  }
}

async function listRecords(env, params, hasDb) {
  const query = clean(params.get("q") || params.get("query"));
  const type = clean(params.get("type")).toLowerCase();
  const limit = clamp(Number(params.get("limit") || 24), 1, 100);
  const offset = Math.max(0, Number(params.get("offset") || 0));

  if (!hasDb) {
    return fallbackEnvelope({ query, type, limit, offset });
  }

  await ensureSchema(env.DB);

  const where = [];
  const values = [];

  if (type) {
    where.push("type = ?");
    values.push(type);
  }

  if (query) {
    where.push("(search_text LIKE ? OR title LIKE ? OR body LIKE ? OR tags_json LIKE ?)");
    const like = `%${query.toLowerCase()}%`;
    values.push(like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sql = `
    SELECT record_key, id, type, type_label, title, subtitle, body, domain, family, risk,
      maturity, formula, tags_json, href, source_href, image_url, raw_json, search_text, updated_at
    FROM records
    ${whereSql}
    ORDER BY title COLLATE NOCASE
    LIMIT ? OFFSET ?
  `;
  const countSql = `SELECT COUNT(*) AS count FROM records ${whereSql}`;
  const [rows, countRow] = await Promise.all([
    bindStatement(env.DB.prepare(sql), [...values, limit, offset]).all(),
    bindStatement(env.DB.prepare(countSql), values).first()
  ]);

  return {
    source: "d1",
    records: (rows.results || []).map(normaliseRow),
    meta: {
      count: Number(countRow?.count || 0),
      limit,
      offset,
      query,
      type,
      version: API_VERSION
    }
  };
}

async function getRecord(env, type, id, hasDb) {
  const wantedType = clean(type).toLowerCase();
  const wantedId = clean(id);

  if (!hasDb) {
    const record = findFallbackRecord(wantedType, wantedId);
    return record
      ? { source: "fallback", record, meta: { version: API_VERSION } }
      : { source: "fallback", record: null, meta: { version: API_VERSION } };
  }

  await ensureSchema(env.DB);

  const row = await env.DB.prepare(`
    SELECT record_key, id, type, type_label, title, subtitle, body, domain, family, risk,
      maturity, formula, tags_json, href, source_href, image_url, raw_json, search_text, updated_at
    FROM records
    WHERE type = ? AND id = ?
    LIMIT 1
  `).bind(wantedType, wantedId).first();

  return {
    source: "d1",
    record: row ? normaliseRow(row) : null,
    meta: { version: API_VERSION }
  };
}

async function enrichRecords(env, request, params, hasDb) {
  const body = request.method === "POST" ? await readJSONBody(request) : {};
  const query = clean(body.q || body.query || params.get("q") || params.get("query"));
  const limit = clamp(Number(body.limit || params.get("limit") || 8), 1, 12);

  if (query.length < 3) {
    return {
      source: hasDb ? "d1" : "fallback",
      records: [],
      meta: { query, status: "query-too-short", stored: 0, version: API_VERSION }
    };
  }

  if (hasDb) {
    const existing = await listRecords(env, new URLSearchParams({ q: query, limit: String(limit) }), true);
    if (existing.records.length) {
      return {
        ...existing,
        meta: {
          ...existing.meta,
          status: "local-first",
          stored: 0,
          message: "Local D1 records already exist; academic auto-import skipped."
        }
      };
    }
  } else {
    const existing = fallbackEnvelope({ query, limit });
    if (existing.records.length) {
      return {
        ...existing,
        meta: {
          ...existing.meta,
          status: "fallback-local-first",
          stored: 0
        }
      };
    }
  }

  const academicRecords = await fetchAcademicRecords(query, limit);
  const checkedRecords = academicRecords
    .filter(validateAcademicRecord)
    .map((record) => ({
      ...record,
      raw: {
        ...(record.raw || {}),
        checkedAt: new Date().toISOString(),
        checkStatus: "accepted",
        checkRules: ["recognized academic host", "stable identifier", "non-empty title"]
      }
    }));

  let stored = 0;
  let warning = null;
  if (hasDb && checkedRecords.length) {
    try {
      await upsertRecords(env.DB, checkedRecords);
      stored = checkedRecords.length;
    } catch (error) {
      warning = `Academic records were checked but not stored: ${error.message || error}`;
    }
  }

  return {
    source: hasDb ? "academic-auto-d1" : "academic-live",
    records: checkedRecords,
    meta: {
      query,
      count: checkedRecords.length,
      stored,
      status: checkedRecords.length ? "checked-academic-records" : "no-academic-records",
      warning,
      version: API_VERSION
    }
  };
}

async function getFacets(env, hasDb) {
  if (!hasDb) {
    return fallbackFacets();
  }

  await ensureSchema(env.DB);

  const [typeRows, domainRows, tagRows] = await Promise.all([
    env.DB.prepare("SELECT type, type_label, COUNT(*) AS count FROM records GROUP BY type, type_label ORDER BY type_label").all(),
    env.DB.prepare("SELECT domain, COUNT(*) AS count FROM records WHERE domain IS NOT NULL AND domain != '' GROUP BY domain ORDER BY domain").all(),
    env.DB.prepare("SELECT tags_json FROM records LIMIT 1000").all()
  ]);

  return {
    source: "d1",
    facets: {
      types: (typeRows.results || []).map((row) => ({ type: row.type, label: row.type_label, count: Number(row.count || 0) })),
      domains: (domainRows.results || []).map((row) => ({ value: row.domain, count: Number(row.count || 0) })),
      tags: countTags((tagRows.results || []).map((row) => row.tags_json))
    },
    meta: { version: API_VERSION }
  };
}

async function fetchAcademicRecords(query, limit) {
  const [compoundResult, literatureResult] = await Promise.allSettled([
    fetchPubChemRecord(query),
    fetchPubMedRecords(query, Math.max(1, Math.min(5, limit - 1)))
  ]);
  const records = [];
  if (compoundResult.status === "fulfilled" && compoundResult.value) {
    records.push(compoundResult.value);
  }
  if (literatureResult.status === "fulfilled") {
    records.push(...literatureResult.value);
  }
  return records.slice(0, limit);
}

async function fetchPubChemRecord(query) {
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
  const properties = await fetchJSON(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${name}/property/${propertyList}/JSON`, true);
  const compound = properties?.PropertyTable?.Properties?.[0];
  if (!compound?.CID) return null;

  const [descriptionResult, synonymResult, safetyResult] = await Promise.allSettled([
    fetchJSON(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${compound.CID}/description/JSON`, true),
    fetchJSON(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${compound.CID}/synonyms/JSON`, true),
    fetchPubChemSafety(compound.CID, compound)
  ]);

  const description = descriptionResult.status === "fulfilled"
    ? descriptionResult.value?.InformationList?.Information?.[0]?.Description
    : "";
  const synonyms = synonymResult.status === "fulfilled"
    ? synonymResult.value?.InformationList?.Information?.[0]?.Synonym?.slice(0, 10) || []
    : [];
  const safety = safetyResult.status === "fulfilled" ? safetyResult.value : {};
  const title = compound.Title || query;
  const cid = String(compound.CID);
  const href = `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`;
  const imageUrl = pubChemImageUrl(cid);
  const raw = {
    source: "PubChem",
    cid,
    query,
    formula: compound.MolecularFormula,
    molecularWeight: compound.MolecularWeight,
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
    imageUrl,
    href,
    ...safety
  };

  return withSearchText({
    id: `pubchem-${cid}`,
    type: "compound",
    typeLabel: "PubChem compound",
    title,
    subtitle: [compound.MolecularFormula, compound.MolecularWeight ? `${compound.MolecularWeight} g/mol` : ""].filter(Boolean).join(" · "),
    body: [description, compound.IUPACName, compound.CanonicalSMILES].filter(Boolean).join(" | ") || "Checked PubChem compound metadata.",
    domain: "Academic import",
    family: "Compound database",
    maturity: 70,
    formula: compound.MolecularFormula || "",
    tags: [query, "PubChem", compound.MolecularFormula, compound.InChIKey, ...synonyms.slice(0, 4)].filter(Boolean),
    href,
    sourceHref: href,
    imageUrl,
    ...safety,
    raw
  });
}

async function fetchPubChemSafety(cid, compound = {}) {
  const ghs = await fetchJSON(`https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${encodeURIComponent(cid)}/JSON?heading=${encodeURIComponent("GHS Classification")}`, true);
  const infos = collectPubChemInfo(ghs);
  const hazardStatements = infoStrings(infos.find((item) => item.Name === "GHS Hazard Statements")).slice(0, 6);
  const signalWord = infoStrings(infos.find((item) => item.Name === "Signal"))[0] || "";
  const precautionaryStatements = infoStrings(infos.find((item) => item.Name === "Precautionary Statement Codes")).slice(0, 2);
  return {
    hazardStatements,
    hazardLevel: hazardLevelFrom(hazardStatements, signalWord),
    signalWord,
    precautionaryStatements,
    disposalMethod: disposalFromHazards(hazardStatements, {
      title: compound.Title,
      formula: compound.MolecularFormula
    }),
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
  return info?.Value?.StringWithMarkup?.map((item) => String(item.String || "").trim()).filter(Boolean) || [];
}

async function fetchPubMedRecords(query, limit) {
  const term = encodeURIComponent(query);
  const search = await fetchJSON(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${term}&retmode=json&retmax=${limit}&sort=relevance&tool=ChemVault`, false);
  const ids = search?.esearchresult?.idlist || [];
  if (!ids.length) return [];

  const summary = await fetchJSON(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json&tool=ChemVault`, false);
  return ids.map((id) => {
    const item = summary?.result?.[id] || {};
    const doi = (item.articleids || []).find((articleId) => articleId.idtype === "doi")?.value;
    const authors = (item.authors || []).slice(0, 4).map((author) => author.name).filter(Boolean);
    const href = `https://pubmed.ncbi.nlm.nih.gov/${id}/`;
    const title = item.title || `PubMed record ${id}`;
    const journal = item.fulljournalname || item.source || "PubMed";
    const imageUrl = placeholderImage("Literature", "PubMed", journal);
    return withSearchText({
      id: `pubmed-${id}`,
      type: "literature",
      typeLabel: "PubMed article",
      title,
      subtitle: [journal, item.pubdate || item.epubdate].filter(Boolean).join(" · "),
      body: [journal, item.pubdate || item.epubdate, authors.join(", "), doi ? `DOI ${doi}` : ""].filter(Boolean).join(" | "),
      domain: "Academic import",
      family: "Literature metadata",
      maturity: 65,
      tags: [query, "PubMed", id, doi, journal].filter(Boolean),
      href,
      sourceHref: href,
      imageUrl,
      raw: {
        source: "PubMed",
        pmid: id,
        query,
        journal,
        date: item.pubdate || item.epubdate || "",
        authors,
        doi,
        href,
        imageUrl
      }
    });
  });
}

async function fetchJSON(url, allowNotFound) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    if (allowNotFound && response.status === 404) return null;
    throw new Error(`Academic request failed: ${response.status}`);
  }
  return response.json();
}

function validateAcademicRecord(record) {
  if (!record?.id || !record?.type || !record?.title || record.title.length < 3) return false;
  if (!record.href || !isAcademicHost(record.href)) return false;
  if (record.type === "compound") return Boolean(record.raw?.cid);
  if (record.type === "literature") return Boolean(record.raw?.pmid);
  return false;
}

function isAcademicHost(value) {
  try {
    const host = new URL(value).hostname;
    return host === "pubchem.ncbi.nlm.nih.gov"
      || host === "pubmed.ncbi.nlm.nih.gov"
      || host.endsWith(".ncbi.nlm.nih.gov");
  } catch {
    return false;
  }
}

async function upsertRecords(db, records) {
  await ensureSchema(db);
  for (const input of records) {
    const record = withSearchText({ ...input, imageUrl: imageForRecord(input) });
    await db.prepare(`
      INSERT OR REPLACE INTO records (
        record_key, id, type, type_label, title, subtitle, body, domain, family, risk,
        maturity, formula, tags_json, href, source_href, image_url, raw_json, search_text, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      `${record.type}:${record.id}`,
      record.id,
      record.type,
      record.typeLabel || record.type,
      record.title,
      record.subtitle || "",
      record.body || "",
      record.domain || "",
      record.family || "",
      record.risk || "",
      Number(record.maturity || 0),
      record.formula || "",
      JSON.stringify(record.tags || []),
      record.href || "",
      record.sourceHref || "",
      record.imageUrl || "",
      JSON.stringify(record.raw || {}),
      record.searchText || buildSearchText(record)
    ).run();
  }
}

async function ensureSchema(db) {
  if (schemaReady) return;
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS records (
      record_key TEXT PRIMARY KEY,
      id TEXT NOT NULL,
      type TEXT NOT NULL,
      type_label TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      body TEXT,
      domain TEXT,
      family TEXT,
      risk TEXT,
      maturity INTEGER DEFAULT 0,
      formula TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      href TEXT,
      source_href TEXT,
      image_url TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      search_text TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await db.prepare("ALTER TABLE records ADD COLUMN image_url TEXT").run().catch(() => {});
  await Promise.all([
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS records_type_id_idx ON records (type, id)").run(),
    db.prepare("CREATE INDEX IF NOT EXISTS records_type_idx ON records (type)").run(),
    db.prepare("CREATE INDEX IF NOT EXISTS records_title_idx ON records (title)").run(),
    db.prepare("CREATE INDEX IF NOT EXISTS records_search_idx ON records (search_text)").run()
  ]);
  schemaReady = true;
}

function fallbackEnvelope(options = {}) {
  const query = clean(options.query);
  const type = clean(options.type).toLowerCase();
  const limit = clamp(Number(options.limit || 24), 1, 100);
  const offset = Math.max(0, Number(options.offset || 0));
  const prepared = fallbackRecords.map((record) => withSearchText({ ...record, imageUrl: imageForRecord(record) }));
  const rows = prepared.filter((record) => {
    if (type && record.type !== type) return false;
    if (!query) return true;
    return record.searchText.includes(query.toLowerCase());
  });

  return {
    source: "fallback",
    records: rows.slice(offset, offset + limit),
    meta: {
      count: rows.length,
      limit,
      offset,
      query,
      type,
      version: API_VERSION,
      warning: options.warning || null
    }
  };
}

function fallbackFacets() {
  const types = new Map();
  const domains = new Map();
  const tags = new Map();

  fallbackRecords.forEach((record) => {
    const typeKey = `${record.type}::${record.typeLabel || record.type}`;
    types.set(typeKey, (types.get(typeKey) || 0) + 1);
    if (record.domain) domains.set(record.domain, (domains.get(record.domain) || 0) + 1);
    (record.tags || []).forEach((tag) => tags.set(tag, (tags.get(tag) || 0) + 1));
  });

  return {
    source: "fallback",
    facets: {
      types: [...types].map(([key, count]) => {
        const [type, label] = key.split("::");
        return { type, label, count };
      }),
      domains: [...domains].map(([value, count]) => ({ value, count })),
      tags: [...tags].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    },
    meta: { version: API_VERSION }
  };
}

function findFallbackRecord(type, id) {
  const record = fallbackRecords.find((item) => item.type === type && String(item.id) === id) || null;
  return record ? withSearchText({ ...record, imageUrl: imageForRecord(record) }) : null;
}

function normaliseRow(row) {
  const raw = safeJSON(row.raw_json, {});
  const record = {
    id: row.id,
    type: row.type,
    typeLabel: row.type_label || row.type,
    title: row.title,
    subtitle: row.subtitle || "",
    body: row.body || "",
    domain: row.domain || "",
    family: row.family || "",
    risk: row.risk || "",
    maturity: Number(row.maturity || 0),
    formula: row.formula || "",
    tags: safeJSON(row.tags_json, []),
    href: row.href || `/pages/record.html?type=${encodeURIComponent(row.type)}&id=${encodeURIComponent(row.id)}`,
    sourceHref: row.source_href || "",
    imageUrl: row.image_url || raw.imageUrl || "",
    checkStatus: raw.checkStatus || (raw.source || raw.raw?.source ? "accepted" : "curated"),
    checkedAt: raw.checkedAt || row.updated_at || "",
    hazardStatements: raw.hazardStatements || [],
    hazardLevel: raw.hazardLevel || "",
    signalWord: raw.signalWord || "",
    precautionaryStatements: raw.precautionaryStatements || [],
    disposalMethod: raw.disposalMethod || "",
    safetySource: raw.safetySource || "",
    raw,
    searchText: row.search_text || "",
    updatedAt: row.updated_at || ""
  };
  return withSearchText({ ...record, imageUrl: imageForRecord(record) });
}

function countTags(jsonRows) {
  const counts = new Map();
  jsonRows.forEach((value) => {
    safeJSON(value, []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
  });
  return [...counts]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function withSearchText(record) {
  const safety = normaliseSafety(record);
  const raw = {
    ...(record.raw || {}),
    ...(safety.hazardStatements.length ? { hazardStatements: safety.hazardStatements } : {}),
    ...(safety.hazardLevel ? { hazardLevel: safety.hazardLevel } : {}),
    ...(safety.signalWord ? { signalWord: safety.signalWord } : {}),
    ...(safety.precautionaryStatements.length ? { precautionaryStatements: safety.precautionaryStatements } : {}),
    ...(safety.disposalMethod ? { disposalMethod: safety.disposalMethod } : {}),
    ...(safety.safetySource ? { safetySource: safety.safetySource } : {})
  };
  const merged = { ...record, ...safety, raw };
  return {
    ...merged,
    imageUrl: imageForRecord(merged),
    checkStatus: record.checkStatus || raw.checkStatus || (raw.source || raw.raw?.source ? "accepted" : "curated"),
    checkedAt: record.checkedAt || raw.checkedAt || "",
    searchText: record.searchText || buildSearchText(merged)
  };
}

function buildSearchText(record) {
  return [
    record.type,
    record.typeLabel,
    record.title,
    record.subtitle,
    record.body,
    record.domain,
    record.family,
    record.risk,
    record.formula,
    record.hazardLevel,
    record.signalWord,
    ...(record.hazardStatements || []),
    ...(record.precautionaryStatements || []),
    record.disposalMethod,
    ...(record.tags || [])
  ].filter(Boolean).join(" ").toLowerCase();
}

function normaliseSafety(record) {
  const raw = record.raw || {};
  const explicitHazards = uniqueStrings([
    ...(record.hazardStatements || raw.hazardStatements || []),
    ...(record.ghsHazards || raw.ghsHazards || []),
    record.hazardStatement,
    raw.hazardStatement
  ]);
  const safetyNotes = uniqueStrings([
    record.safety,
    raw.safety
  ]);
  const hazardStatements = explicitHazards.length ? explicitHazards : safetyNotes;
  if (!hazardStatements.length && !isSafetyRelevant(record)) {
    return {
      hazardStatements: [],
      hazardLevel: "",
      signalWord: "",
      precautionaryStatements: [],
      disposalMethod: "",
      safetySource: ""
    };
  }
  const hazardLevel = record.hazardLevel || raw.hazardLevel || hazardLevelFrom(hazardStatements, record.signalWord || raw.signalWord || "");
  return {
    hazardStatements: hazardStatements.length ? hazardStatements : [fallbackHazardStatement(record, hazardLevel)],
    hazardLevel,
    signalWord: record.signalWord || raw.signalWord || signalFromLevel(hazardLevel),
    precautionaryStatements: uniqueStrings([...(record.precautionaryStatements || raw.precautionaryStatements || [])]),
    disposalMethod: record.disposalMethod || raw.disposalMethod || disposalFromHazards(hazardStatements, record),
    safetySource: record.safetySource || raw.safetySource || (raw.source === "PubChem" || raw.raw?.source === "PubChem" || record.sourceHref?.includes("pubchem") ? "PubChem GHS summary" : "Local safety summary")
  };
}

function isSafetyRelevant(record) {
  const text = `${record.type || ""} ${record.typeLabel || ""} ${record.family || ""} ${record.domain || ""} ${record.risk || ""}`.toLowerCase();
  return Boolean(record.formula || record.cas || record.risk || record.safety || record.raw?.safety)
    || /compound|reagent|reactant|material|solvent|acid|base|oxidizer|halogen|salt|polymer|nanomaterial|catalyst/.test(text);
}

function fallbackHazardStatement(record, level) {
  if (level === "Not classified") return "No local GHS hazard statement is currently classified for this record; verify the current SDS before use.";
  if (record.risk === "corrosive") return "Corrosive material or reagent system; may cause burns or serious eye damage depending on concentration.";
  if (record.risk === "oxidizer") return "Oxidizing material or reagent system; may intensify fire and react with incompatible reducing or organic materials.";
  if (record.risk === "dry") return "Moisture-sensitive or reactive material; contact with water, air or protic media may create additional hazards.";
  if (record.risk === "toxic") return "Toxic material or reagent system; avoid exposure and verify route-specific hazards from the SDS.";
  if (record.risk === "energetic") return "Potential energetic or instability hazard; avoid heat, friction, impact and incompatible storage conditions.";
  return "Hazard statement not fully classified in local data; verify the current SDS before handling.";
}

function hazardLevelFrom(statements = [], signalWord = "") {
  const text = `${signalWord} ${statements.join(" ")}`.toLowerCase();
  if (/fatal|cancer|mutagen|reproductive|damage to organs|explosive|pyrophoric|energetic/.test(text)) return "Severe";
  if (/toxic|corrosive|skin burns|serious eye damage|highly flammable|extremely flammable|oxidizer|may intensify fire/.test(text)) return "High";
  if (/harmful|irritation|drowsiness|dizziness|flammable/.test(text)) return "Moderate";
  return statements.length ? "Low" : "Not classified";
}

function signalFromLevel(level) {
  if (level === "Severe" || level === "High") return "Danger";
  if (level === "Moderate" || level === "Low") return "Warning";
  return "Not available";
}

function disposalFromHazards(statements = [], context = {}) {
  const text = `${context.title || ""} ${context.formula || ""} ${context.family || ""} ${context.domain || ""} ${context.risk || ""} ${statements.join(" ")}`.toLowerCase();
  if (/chlorinated|halogenated|chloroform|dichloromethane|methylene chloride|bromine|iodine|chlorine/.test(text)) return "Collect as halogenated or toxic hazardous waste in a compatible labelled container; do not pour to drain.";
  if (/chrom|osmium|lead|mercury|cadmium|nickel|silver|copper|manganese|metal|catalyst/.test(text)) return "Collect as heavy-metal or catalyst waste for institutional hazardous-waste pickup.";
  if (/azide|cyanide|diazonium|energetic|explosive|pyrophoric/.test(text)) return "Collect as reactive/toxic hazardous waste and keep segregated under institutional EHS guidance.";
  if (/corrosive|acid|base|amine|pyridine|anhydride|skin burns|serious eye damage/.test(text)) return "Collect as corrosive hazardous waste or neutralize only under an approved institutional procedure.";
  if (/flammable|solvent|ether|toluene|hexane|acetone|ethanol|methanol|acetonitrile|tetrahydrofuran|ethyl acetate|dimethylformamide/.test(text) && !/oxidizer|hypochlorite|permanganate|nitrate|may intensify fire/.test(text)) return "Collect in a compatible flammable organic-waste container; keep ignition sources excluded and do not pour to drain.";
  if (/oxidizer|peroxide|hypochlorite|permanganate|nitrate|may intensify fire/.test(text)) return "Collect as oxidizing hazardous waste; keep separate from organics, reducers and incompatible containers.";
  if (/flammable|solvent|ether|toluene|hexane|acetone|ethanol|methanol|acetonitrile|tetrahydrofuran|ethyl acetate|dimethylformamide/.test(text)) return "Collect in a compatible flammable organic-waste container; keep ignition sources excluded and do not pour to drain.";
  if (/toxic|cancer|mutagen|reproductive|damage to organs|fatal/.test(text)) return "Collect as toxic hazardous waste; keep segregated and route through institutional EHS.";
  if (/not classified/.test(text)) return "Use local non-hazardous or aqueous-waste rules only after checking the current SDS and institutional policy.";
  return "Dispose through approved chemical-waste channels according to SDS, institutional EHS guidance and local regulations.";
}

function uniqueStrings(values) {
  return [...new Set((values || []).flat().filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];
}

function imageForRecord(record) {
  if (record.imageUrl) return record.imageUrl;
  if (record.raw?.imageUrl) return record.raw.imageUrl;
  const cid = record.raw?.cid || record.cid || pubChemCidFrom(record);
  if (cid && canUsePubChemImage(record)) return pubChemImageUrl(cid);
  return placeholderImage(record.typeLabel || record.type || "Record", record.title || record.id || "ChemVault", record.family || record.domain || "");
}

function canUsePubChemImage(record) {
  const title = String(record.title || record.id || "").trim();
  return Boolean(title) && !/\breference\b/i.test(title) && !/^syscat-/i.test(title);
}

function pubChemImageUrl(cid) {
  return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${encodeURIComponent(cid)}/PNG?record_type=2d&image_size=large`;
}

function pubChemCidFrom(record = {}) {
  const raw = record.raw || {};
  const href = String(record.sourceHref || raw.sourceHref || raw.href || raw.url || "");
  const match = href.match(/pubchem\.ncbi\.nlm\.nih\.gov\/compound\/(\d+)/i);
  return match?.[1] || "";
}

function placeholderImage(type, title, subtitle = "") {
  const palette = imagePalette(type);
  const formula = imageFormula(subtitle);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420" role="img" aria-label="${svgEsc(title)}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.bg}"/>
      <stop offset="1" stop-color="${palette.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="640" height="420" fill="url(#bg)"/>
  <rect x="28" y="28" width="584" height="364" rx="28" fill="#fff" stroke="${palette.border}"/>
  <text x="54" y="76" fill="${palette.accent}" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="800">${svgEsc(type).slice(0, 34)}</text>
  <g transform="translate(74 112)" fill="none" stroke="${palette.line}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M104 0 184 46v92l-80 46-80-46V46Z" stroke-width="10" opacity=".74"/>
    <path d="M184 46h82M184 138h82M24 46l-54-32M24 138l-54 32" stroke-width="8" opacity=".48"/>
    <path d="M266 46 318 16M266 138l52 30" stroke-width="7" opacity=".38"/>
    <circle cx="104" cy="0" r="18" fill="${palette.accent}" stroke="none"/>
    <circle cx="184" cy="138" r="18" fill="${palette.accent2}" stroke="none"/>
    <circle cx="318" cy="16" r="15" fill="${palette.accent}" stroke="none"/>
  </g>
  <text x="372" y="168" fill="${palette.text}" font-family="SFMono-Regular,Menlo,Consolas,monospace" font-size="36" font-weight="800">${svgEsc(formula || "Chem record").slice(0, 18)}</text>
  <text x="372" y="206" fill="${palette.muted}" font-family="Inter,Arial,sans-serif" font-size="18" font-weight="700">curated preview</text>
  <text x="54" y="338" fill="${palette.text}" font-family="Inter,Arial,sans-serif" font-size="34" font-weight="850">${svgEsc(title).slice(0, 30)}</text>
  <text x="54" y="370" fill="${palette.muted}" font-family="Inter,Arial,sans-serif" font-size="19" font-weight="650">${svgEsc(subtitle).slice(0, 48)}</text>
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function imagePalette(type) {
  const key = String(type || "").toLowerCase();
  if (key.includes("compound") || key.includes("reagent")) {
    return { bg: "#f5f5f7", bg2: "#eef4ff", border: "#d2d2d7", line: "#1d1d1f", accent: "#0071e3", accent2: "#2bbbad", text: "#1d1d1f", muted: "#6e6e73" };
  }
  if (key.includes("literature") || key.includes("article") || key.includes("source")) {
    return { bg: "#f5f5f7", bg2: "#fff7ed", border: "#d2d2d7", line: "#52525b", accent: "#0071e3", accent2: "#f59e0b", text: "#1d1d1f", muted: "#6e6e73" };
  }
  if (key.includes("material")) {
    return { bg: "#f5f5f7", bg2: "#ecf6f4", border: "#d2d2d7", line: "#64748b", accent: "#0071e3", accent2: "#2bbbad", text: "#1d1d1f", muted: "#6e6e73" };
  }
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

async function readJSONBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function getPathSegments(pathParam) {
  const path = Array.isArray(pathParam) ? pathParam.join("/") : pathParam || "";
  return path.split("/").filter(Boolean);
}

function bindStatement(statement, values) {
  return values.length ? statement.bind(...values) : statement;
}

function clean(value) {
  return String(value || "").trim();
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function safeJSON(value, fallback) {
  try {
    const parsed = JSON.parse(value || "");
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), { status, headers: jsonHeaders });
}
