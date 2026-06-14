(() => {
  const SITE_VERSION = "v0.2.4";
  const importedStoreKey = "chemvault-imported-records";

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
  const encode = (value) => encodeURIComponent(String(value ?? "").trim());
  const normalise = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9.+-]/g, " ");
  const compact = (value) => normalise(value).replace(/\s+/g, " ").trim();
  const pagePrefix = () => location.pathname.includes("/pages/") ? "" : "pages/";
  const recordUrl = (type, id) => `${pagePrefix()}record.html?type=${encode(type)}&id=${encode(id)}`;
  const originalUrl = (page, query) => `${pagePrefix()}${page}${query ? `?${query}` : ""}`;
  const unique = (values) => [...new Set((values || []).flat().filter(Boolean).map(String))];
  const routeId = (route) => `route-${slug(route?.start)}-${slug(route?.target)}`;
  const slug = (value) => String(value || "record").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let curatedRecordCache = null;

  function makeRecord(input) {
    const tags = unique(input.tags);
    const title = input.title || input.name || input.term || input.id;
    const body = input.body || input.summary || input.definition || input.subtitle || "";
    const safety = safetyProfile(input);
    const searchText = compact([
      input.type,
      input.typeLabel,
      title,
      input.subtitle,
      body,
      input.domain,
      input.family,
      input.category,
      input.risk,
      input.formula,
      input.cas,
      safety.hazardLevel,
      safety.signalWord,
      safety.hazardStatements.join(" "),
      safety.disposalMethod,
      tags.join(" "),
      (input.sections || []).flatMap((section) => [section.title, ...(section.items || [])]).join(" ")
    ].join(" "));
    return {
      ...input,
      title,
      body,
      tags,
      hazardStatements: safety.hazardStatements,
      hazardLevel: safety.hazardLevel,
      signalWord: safety.signalWord,
      precautionaryStatements: safety.precautionaryStatements,
      disposalMethod: safety.disposalMethod,
      safetySource: safety.safetySource,
      imageUrl: input.imageUrl || recordImage(input.typeLabel || input.type, title, input.subtitle || input.family || input.domain || input.formula || "", input),
      searchText,
      href: input.external ? input.href : recordUrl(input.type, input.id)
    };
  }

  function safetyProfile(input) {
    const raw = input.raw || input;
    const explicitHazards = unique([
      ...(input.hazardStatements || raw.hazardStatements || []),
      ...(input.ghsHazards || raw.ghsHazards || []),
      input.hazardStatement,
      raw.hazardStatement
    ]).map((item) => String(item).trim()).filter(Boolean);
    const safetyNotes = unique([
      input.safety || raw.safety
    ]).map((item) => String(item).trim()).filter(Boolean);
    const hazardStatements = explicitHazards.length ? explicitHazards : safetyNotes;
    if (!hazardStatements.length && !isSafetyRelevant(input)) {
      return {
        hazardStatements: [],
        hazardLevel: "",
        signalWord: "",
        precautionaryStatements: [],
        disposalMethod: "",
        safetySource: ""
      };
    }
    const level = input.hazardLevel || raw.hazardLevel || hazardLevelFrom(input.risk, hazardStatements);
    return {
      hazardStatements: hazardStatements.length ? hazardStatements : [fallbackHazardStatement(input, level)],
      hazardLevel: level,
      signalWord: input.signalWord || raw.signalWord || signalFromLevel(level),
      precautionaryStatements: unique([...(input.precautionaryStatements || raw.precautionaryStatements || [])]),
      disposalMethod: input.disposalMethod || raw.disposalMethod || disposalFor(input, hazardStatements, level),
      safetySource: input.safetySource || raw.safetySource || (raw.source === "PubChem" || raw.raw?.source === "PubChem" || input.sourceHref?.includes("pubchem") ? "PubChem GHS summary" : "Local safety summary")
    };
  }

  function isSafetyRelevant(input) {
    const text = `${input.type || ""} ${input.typeLabel || ""} ${input.family || ""} ${input.category || ""} ${input.domain || ""}`.toLowerCase();
    return Boolean(input.formula || input.cas || input.risk || input.safety || input.hazards)
      || /compound|reagent|reactant|material|solvent|acid|base|oxidizer|halogen|salt|polymer|nanomaterial|catalyst/.test(text);
  }

  function fallbackHazardStatement(input, level) {
    if (level === "Not classified") return "No local GHS hazard statement is currently classified for this record; verify the current SDS before use.";
    if (input.risk === "corrosive") return "Corrosive material or reagent system; may cause burns or serious eye damage depending on concentration.";
    if (input.risk === "oxidizer") return "Oxidizing material or reagent system; may intensify fire and react with incompatible reducing or organic materials.";
    if (input.risk === "dry") return "Moisture-sensitive or reactive material; contact with water, air or protic media may create additional hazards.";
    if (input.risk === "toxic") return "Toxic material or reagent system; avoid exposure and verify route-specific hazards from the SDS.";
    if (input.risk === "energetic") return "Potential energetic or instability hazard; avoid heat, friction, impact and incompatible storage conditions.";
    return "Hazard statement not fully classified in local data; verify the current SDS before handling.";
  }

  function hazardLevelFrom(risk, statements = []) {
    const text = `${risk || ""} ${statements.join(" ")}`.toLowerCase();
    if (/fatal|cancer|mutagen|reproductive|damage to organs|explosive|pyrophoric|energetic|toxic/.test(text)) return "Severe";
    if (/corrosive|skin burns|serious eye damage|oxidizer|highly flammable|extremely flammable|dry/.test(text)) return "High";
    if (/harmful|irritation|drowsiness|dizziness|flammable|standard/.test(text)) return "Moderate";
    if (/not classified|no local/.test(text)) return "Not classified";
    return statements.length ? "Low" : "Not classified";
  }

  function signalFromLevel(level) {
    if (level === "Severe" || level === "High") return "Danger";
    if (level === "Moderate" || level === "Low") return "Warning";
    return "Not available";
  }

  function disposalFor(input, statements = [], level = "") {
    const text = `${input.risk || ""} ${input.family || ""} ${input.category || ""} ${statements.join(" ")}`.toLowerCase();
    if (/halogen|chloroform|dichloromethane|bromine|iodine/.test(text)) return "Collect as halogenated or toxic hazardous waste in a compatible labelled container; do not pour to drain.";
    if (/chrom|osmium|lead|mercury|cadmium|nickel|metal|catalyst/.test(text)) return "Collect as heavy-metal or catalyst waste for institutional hazardous-waste pickup.";
    if (/azide|cyanide|diazonium|energetic|explosive|pyrophoric/.test(text)) return "Collect as reactive/toxic hazardous waste and keep segregated under institutional EHS guidance.";
    if (/corrosive|acid|base|skin burns|serious eye damage/.test(text)) return "Collect as corrosive hazardous waste or neutralize only under an approved institutional procedure.";
    if (/solvent|flammable|ether|toluene|hexane|acetone|ethanol|methanol|acetonitrile|tetrahydrofuran|ethyl acetate|dimethylformamide/.test(text) && !/oxidizer|hypochlorite|permanganate|nitrate|may intensify fire/.test(text)) return "Collect in a compatible flammable organic-waste container; keep ignition sources excluded and do not pour to drain.";
    if (/oxidizer|peroxide|hypochlorite|permanganate|nitrate/.test(text)) return "Collect as oxidizing hazardous waste; keep separate from organics, reducers and incompatible containers.";
    if (/flammable|solvent|ether|toluene|hexane|acetone|ethanol|methanol/.test(text)) return "Collect in a compatible flammable organic-waste container; keep ignition sources excluded and do not pour to drain.";
    if (level === "Not classified") return "Use local non-hazardous or aqueous-waste rules only after checking the current SDS and institutional policy.";
    return "Dispose through approved chemical-waste channels according to SDS, institutional EHS guidance and local regulations.";
  }

  function buildRecords(options = {}) {
    if (curatedRecordCache) {
      const cachedRecords = curatedRecordCache.slice();
      return options.includeImported ? appendImportedRecords(cachedRecords) : cachedRecords;
    }

    const data = window.CHEMVAULT_DATA || {};
    const research = window.CHEMVAULT_RESEARCH || {};
    const dossiers = window.CHEMVAULT_DOSSIERS || {};
    const methods = window.CHEMVAULT_METHODS || {};
    const spectroscopy = window.CHEMVAULT_SPECTROSCOPY || {};
    const materialsData = window.CHEMVAULT_MATERIALS || {};
    const records = [];

    (data.reactionSystems || []).forEach((item) => records.push(makeRecord({
      id: item.id,
      type: "reaction",
      typeLabel: "Reaction system",
      title: item.name,
      subtitle: item.className,
      body: [item.domain, ...(item.conditions || []), ...(item.readouts || []), ...(item.limitations || [])].join(" | "),
      domain: item.domain,
      maturity: item.maturity,
      tags: [item.domain, ...(item.substrates || []), ...(item.reagents || []), ...(item.mechanisms || [])],
      sourceHref: originalUrl("workbench.html", `id=${encode(item.id)}`),
      sections: [
        { title: "Reactant classes", items: (item.substrates || []).map((id) => lookupName(data.reactants, id)) },
        { title: "Reagent links", items: (item.reagents || []).map((id) => lookupName(data.reagents, id)) },
        { title: "Mechanism links", items: (item.mechanisms || []).map((id) => lookupName(data.mechanisms, id)) },
        { title: "Typical conditions", items: item.conditions || [] },
        { title: "Readouts", items: item.readouts || [] },
        { title: "Limitations", items: item.limitations || [] },
        { title: "Next questions", items: item.nextQuestions || [] }
      ],
      raw: item
    })));

    (data.reactants || []).forEach((item) => records.push(makeRecord({
      id: item.id,
      type: "reactant",
      typeLabel: "Reactant class",
      title: item.name,
      subtitle: item.className,
      body: [...(item.functionalGroups || []), ...(item.compatibleMethods || []), ...(item.constraints || [])].join(" | "),
      family: item.className,
      tags: [...(item.functionalGroups || []), ...(item.compatibleMethods || [])],
      sourceHref: originalUrl("workbench.html", `q=${encode(item.name)}`),
      sections: [
        { title: "Functional groups", items: item.functionalGroups || [] },
        { title: "Compatible methods", items: item.compatibleMethods || [] },
        { title: "Constraints", items: item.constraints || [] }
      ],
      raw: item
    })));

    (data.reagents || []).forEach((item) => records.push(makeRecord({
      id: item.id,
      type: "reagent",
      typeLabel: "Reagent",
      title: item.name,
      subtitle: [item.formula, item.focus].filter(Boolean).join(" · "),
      body: [item.category, item.use, item.mechanism, item.scope, item.safety, item.hazards].filter(Boolean).join(" | "),
      domain: item.category,
      family: item.focus,
      risk: item.risk,
      maturity: item.maturity,
      formula: item.formula,
      tags: item.tags || [],
      sourceHref: originalUrl("reagents.html", `id=${encode(item.id)}`),
      sections: [
        { title: "Transformations", items: item.transformations || [] },
        { title: "Conditions", items: item.conditions || [] },
        { title: "Scope", items: [item.scope || item.academicUse].filter(Boolean) },
        { title: "Mechanistic note", items: [item.mechanism].filter(Boolean) },
        { title: "Traps and limitations", items: item.traps || [] },
        { title: "Safety and evidence", items: [item.safety, item.evidenceNote, item.hazards].filter(Boolean) }
      ],
      raw: item
    })));

    (data.compounds || []).forEach((item) => records.push(makeRecord({
      id: item.id,
      type: "compound",
      typeLabel: "Compound",
      title: item.name,
      subtitle: [item.formula, item.family].filter(Boolean).join(" · "),
      body: [item.summary, item.evidenceNote, item.cas].filter(Boolean).join(" | "),
      family: item.family,
      formula: item.formula,
      cas: item.cas,
      tags: [...(item.synonyms || []), ...(item.tags || [])],
      sourceHref: originalUrl("search.html", `q=${encode(item.name)}`),
      sections: [
        { title: "Identifiers", items: [item.formula, item.cas, ...(item.synonyms || [])].filter(Boolean) },
        { title: "Summary", items: [item.summary].filter(Boolean) },
        { title: "Evidence note", items: [item.evidenceNote].filter(Boolean) }
      ],
      raw: item
    })));

    (materialsData.materials || []).forEach((item) => records.push(makeRecord({
      id: item.id,
      type: "material",
      typeLabel: "Material",
      title: item.name,
      subtitle: [item.formula, item.family].filter(Boolean).join(" · "),
      body: [item.summary, item.synthesis, item.evidenceLevel].filter(Boolean).join(" | "),
      family: item.family,
      maturity: item.maturity,
      formula: item.formula,
      tags: [...(item.tags || []), ...(item.applications || []), ...(item.characterization || [])],
      sourceHref: originalUrl("materials.html", `id=${encode(item.id)}`),
      sections: [
        { title: "Applications", items: item.applications || [] },
        { title: "Properties", items: item.properties || [] },
        { title: "Synthesis", items: [item.synthesis].filter(Boolean) },
        { title: "Characterization", items: item.characterization || [] },
        { title: "Limitations", items: item.limitations || [] },
        { title: "Evidence level", items: [item.evidenceLevel].filter(Boolean) }
      ],
      raw: item
    })));

    (data.routes || []).forEach((item) => records.push(makeRecord({
      id: routeId(item),
      type: "route",
      typeLabel: "Route",
      title: `${item.start} to ${item.target}`,
      subtitle: "Synthetic route",
      body: [item.note, ...(item.route || [])].join(" | "),
      tags: [item.start, item.target, ...(item.route || [])],
      sourceHref: originalUrl("library.html", `q=${encode(`${item.start} ${item.target}`)}`),
      sections: [
        { title: "Route steps", items: item.route || [] },
        { title: "Evidence note", items: [item.note].filter(Boolean) }
      ],
      raw: item
    })));

    (data.mechanisms || []).forEach((item) => records.push(makeRecord({
      id: item.id,
      type: "mechanism",
      typeLabel: "Mechanism",
      title: item.name,
      subtitle: item.className,
      body: [item.summary, item.rateLaw, item.stereo].filter(Boolean).join(" | "),
      family: item.className,
      tags: [...(item.tags || []), ...(item.bestFor || [])],
      sourceHref: originalUrl("atlas.html", `id=${encode(item.id)}`),
      sections: [
        { title: "Summary", items: [item.summary].filter(Boolean) },
        { title: "Steps", items: item.steps || [] },
        { title: "Best for", items: item.bestFor || [] },
        { title: "Rate law and stereochemistry", items: [item.rateLaw, item.stereo].filter(Boolean) }
      ],
      raw: item
    })));

    (data.concepts || []).forEach((item) => records.push(makeRecord({
      id: item.id || slug(item.term),
      type: "concept",
      typeLabel: "Concept",
      title: item.term,
      subtitle: item.family,
      body: [item.definition, item.equation, item.evidenceNote].filter(Boolean).join(" | "),
      family: item.family,
      tags: item.tags || [],
      sourceHref: originalUrl("library.html", `q=${encode(item.term)}`),
      sections: [
        { title: "Definition", items: [item.definition].filter(Boolean) },
        { title: "Equation", items: [item.equation].filter(Boolean) },
        { title: "Evidence note", items: [item.evidenceNote].filter(Boolean) }
      ],
      raw: item
    })));

    (data.sources || []).forEach((item) => records.push(makeRecord({
      id: item.id || slug(item.short),
      type: "source",
      typeLabel: "Source",
      title: item.short,
      subtitle: item.family,
      body: [item.title, item.note].filter(Boolean).join(" | "),
      family: item.family,
      tags: [item.family, item.short],
      href: item.href || item.url,
      external: Boolean(item.href || item.url),
      sourceHref: originalUrl("library.html", `q=${encode(item.short)}`),
      sections: [
        { title: "Source title", items: [item.title].filter(Boolean) },
        { title: "Use note", items: [item.note].filter(Boolean) }
      ],
      raw: item
    })));

    (research.caseStudies || []).forEach((item) => records.push(makeRecord({
      id: item.id,
      type: "research-case",
      typeLabel: "Research case",
      title: item.title,
      subtitle: item.discipline,
      body: [item.abstract, item.question, item.thesis].filter(Boolean).join(" | "),
      domain: item.discipline,
      tags: item.tags || [],
      sourceHref: originalUrl("research.html", `case=${encode(item.id)}`),
      sections: [
        { title: "Question", items: [item.question].filter(Boolean) },
        { title: "Thesis", items: [item.thesis].filter(Boolean) },
        { title: "Evidence", items: item.evidence || [] },
        { title: "Techniques", items: item.techniques || [] },
        { title: "Limitations", items: item.limitations || [] }
      ],
      raw: item
    })));

    (dossiers.dossiers || []).forEach((item) => records.push(makeRecord({
      id: item.id,
      type: "dossier",
      typeLabel: "Dossier",
      title: item.title,
      subtitle: [item.field, item.status].filter(Boolean).join(" · "),
      body: [item.summary, item.abstract, ...(item.highlights || []), ...(item.claims || [])].join(" | "),
      domain: item.field,
      tags: item.tags || item.keywords || [],
      sourceHref: originalUrl("dossiers.html", `id=${encode(item.id)}`),
      sections: [
        { title: "Summary", items: [item.summary || item.abstract].filter(Boolean) },
        { title: "Highlights", items: item.highlights || [] },
        { title: "Claims", items: item.claims || [] },
        { title: "References", items: item.references || [] }
      ],
      raw: item
    })));

    (methods.protocols || []).forEach((item) => records.push(makeRecord({
      id: item.id,
      type: "method",
      typeLabel: "Method",
      title: item.title,
      subtitle: [item.domain, item.level].filter(Boolean).join(" · "),
      body: [item.summary, ...(item.workflow || []), ...(item.qualityControls || [])].join(" | "),
      domain: item.domain,
      family: item.level,
      tags: item.tags || [],
      sourceHref: originalUrl("methods.html", `id=${encode(item.id)}`),
      sections: [
        { title: "Inputs", items: item.inputs || [] },
        { title: "Workflow", items: item.workflow || [] },
        { title: "Outputs", items: item.outputs || [] },
        { title: "Quality controls", items: item.qualityControls || [] }
      ],
      raw: item
    })));

    (spectroscopy.cases || []).forEach((item) => records.push(makeRecord({
      id: item.id,
      type: "spectroscopy",
      typeLabel: "Spectroscopy",
      title: item.title,
      subtitle: item.family,
      body: [item.summary, item.question, item.conclusion, ...(item.assignments || [])].join(" | "),
      family: item.family,
      tags: item.tags || [],
      sourceHref: originalUrl("spectroscopy.html", `id=${encode(item.id)}`),
      sections: [
        { title: "Question", items: [item.question].filter(Boolean) },
        { title: "Signals", items: (item.signals || []).map((signal) => `${signal.technique || ""} ${signal.signal || ""} ${signal.interpretation || ""}`.trim()) },
        { title: "Assignments", items: item.assignments || [] },
        { title: "Conclusion", items: [item.conclusion].filter(Boolean) }
      ],
      raw: item
    })));

    curatedRecordCache = dedupeRecords(records);
    const curatedRecords = curatedRecordCache.slice();
    return options.includeImported ? appendImportedRecords(curatedRecords) : curatedRecords;
  }

  function appendImportedRecords(records) {
    getImportedRecords().forEach((item) => records.push(makeRecord({
      id: item.id,
      type: item.type?.toLowerCase().replace(/\s+/g, "-") || "imported",
      typeLabel: item.type || "Imported record",
      title: item.title,
      body: item.body,
      tags: item.tags || [],
      external: true,
      href: item.href,
      importedAt: item.importedAt,
      sections: [
        { title: "Imported body", items: [item.body].filter(Boolean) },
        { title: "Session tags", items: item.tags || [] }
      ],
      raw: item
    })));
    return dedupeRecords(records);
  }

  function dedupeRecords(records) {
    const seen = new Set();
    return records.filter((record) => {
      const key = `${record.type}:${record.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function findRecord(type, id, records = buildRecords({ includeImported: true })) {
    const wantedType = compact(type).replace(/\s+/g, "-");
    const wantedId = String(id || "");
    return records.find((record) => record.type === wantedType && String(record.id) === wantedId)
      || records.find((record) => String(record.id) === wantedId)
      || null;
  }

  function relatedRecords(record, records = buildRecords({ includeImported: true }), limit = 8) {
    if (!record) return [];
    const baseTokens = new Set(queryTokens(`${record.title} ${record.body} ${record.tags.join(" ")} ${record.domain || ""} ${record.family || ""}`));
    return records
      .filter((item) => !(item.type === record.type && String(item.id) === String(record.id)))
      .map((item) => ({ item, score: relationScore(record, item, baseTokens) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
      .slice(0, limit)
      .map((row) => row.item);
  }

  function relationScore(base, item, baseTokens) {
    let score = 0;
    const itemTokens = new Set(queryTokens(`${item.title} ${item.body} ${item.tags.join(" ")} ${item.domain || ""} ${item.family || ""}`));
    baseTokens.forEach((token) => {
      if (itemTokens.has(token)) score += 1;
    });
    const baseTags = new Set((base.tags || []).map((tag) => compact(tag)));
    (item.tags || []).forEach((tag) => {
      if (baseTags.has(compact(tag))) score += 6;
    });
    if (base.domain && item.domain && compact(base.domain) === compact(item.domain)) score += 5;
    if (base.family && item.family && compact(base.family) === compact(item.family)) score += 4;
    if (base.type !== item.type && score) score += 1;
    return score;
  }

  function queryTokens(value) {
    return compact(value).split(" ").filter((token) => token.length > 2);
  }

  function lookupName(list, id) {
    return (list || []).find((item) => item.id === id)?.name || String(id || "").replace(/-/g, " ");
  }

  function recordImage(type, title, subtitle = "", input = {}) {
    const cid = pubChemCidFrom(input);
    if (cid && canUsePubChemName(title)) {
      return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${encodeURIComponent(cid)}/PNG?record_type=2d&image_size=large`;
    }
    const key = compact(`${type} ${title}`);
    if ((key.includes("reagent") || key.includes("compound")) && canUsePubChemName(title)) {
      return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(title)}/PNG?record_type=2d&image_size=large`;
    }
    return placeholderImage(type || "Record", title || "ChemVault", subtitle || "");
  }

  function fallbackImage(type, title, subtitle = "") {
    return placeholderImage(type || "Record", title || "ChemVault", subtitle || "");
  }

  function canUsePubChemName(title) {
    const text = String(title || "").trim();
    return Boolean(text)
      && !/\breference\b/i.test(text)
      && !/\b(panel|system|class|mixture|solution|buffer|assay|test|screen|candidate|reaction|oxidation|reduction|hydrogenation|addition|bromination|substitution|elimination|acylation|coupling|ozonolysis|olefination)\b/i.test(text)
      && !/^syscat-/i.test(text);
  }

  function pubChemCidFrom(input = {}) {
    const raw = input.raw || {};
    const cid = input.cid || raw.cid || raw.CID;
    if (cid) return cid;
    const href = String(input.sourceHref || raw.sourceHref || raw.href || raw.url || "");
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
  <text x="54" y="76" fill="${palette.accent}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif" font-size="22" font-weight="800" letter-spacing="0">${svgEsc(type).slice(0, 34)}</text>
  <g transform="translate(74 112)" fill="none" stroke="${palette.line}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M104 0 184 46v92l-80 46-80-46V46Z" stroke-width="10" opacity=".74"/>
    <path d="M184 46h82M184 138h82M24 46l-54-32M24 138l-54 32" stroke-width="8" opacity=".48"/>
    <path d="M266 46 318 16M266 138l52 30" stroke-width="7" opacity=".38"/>
    <circle cx="104" cy="0" r="18" fill="${palette.accent}" stroke="none"/>
    <circle cx="184" cy="138" r="18" fill="${palette.accent2}" stroke="none"/>
    <circle cx="318" cy="16" r="15" fill="${palette.accent}" stroke="none"/>
  </g>
  <text x="372" y="168" fill="${palette.text}" font-family="SFMono-Regular,Menlo,Consolas,monospace" font-size="36" font-weight="800">${svgEsc(formula || "Chem record").slice(0, 18)}</text>
  <text x="372" y="206" fill="${palette.muted}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif" font-size="18" font-weight="700">curated preview</text>
  <text x="54" y="338" fill="${palette.text}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif" font-size="34" font-weight="850">${svgEsc(title).slice(0, 30)}</text>
  <text x="54" y="370" fill="${palette.muted}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif" font-size="19" font-weight="650">${svgEsc(subtitle).slice(0, 48)}</text>
</svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function imagePalette(type) {
    const key = compact(type);
    if (key.includes("material")) return { bg: "#f5f5f7", bg2: "#ecf6f4", border: "#d2d2d7", line: "#64748b", accent: "#0071e3", accent2: "#2bbbad", text: "#1d1d1f", muted: "#6e6e73" };
    if (key.includes("source") || key.includes("article") || key.includes("case")) return { bg: "#f5f5f7", bg2: "#fff7ed", border: "#d2d2d7", line: "#52525b", accent: "#0071e3", accent2: "#f59e0b", text: "#1d1d1f", muted: "#6e6e73" };
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

  function getImportedRecords() {
    try {
      const records = JSON.parse(localStorage.getItem(importedStoreKey) || "[]");
      return Array.isArray(records) ? records : [];
    } catch {
      return [];
    }
  }

  window.CHEMVAULT_RECORDS = {
    version: SITE_VERSION,
    esc,
    encode,
    normalise,
    compact,
    queryTokens,
    recordUrl,
    recordImage,
    fallbackImage,
    placeholderImage,
    routeId,
    buildRecords,
    findRecord,
    relatedRecords
  };
})();
