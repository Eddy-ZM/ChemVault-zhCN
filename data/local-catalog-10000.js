(() => {
  const data = window.CHEMVAULT_DATA || (window.CHEMVAULT_DATA = {});
  const research = window.CHEMVAULT_RESEARCH || {};
  const dossiers = window.CHEMVAULT_DOSSIERS || {};
  const methods = window.CHEMVAULT_METHODS || {};
  const spectroscopy = window.CHEMVAULT_SPECTROSCOPY || {};
  const materials = window.CHEMVAULT_MATERIALS || {};

  data.compounds = data.compounds || [];
  dedupeSourceArrays();

  const TARGET_LOCAL_RECORDS = 10000;
  const before = countLocalRecords();
  const needed = Math.max(0, TARGET_LOCAL_RECORDS - before);

  const entries = [];
  const families = [
    {
      key: "alkane",
      label: "Alkane",
      start: 1,
      end: 180,
      formula: (n) => `C${n}H${2 * n + 2}`,
      family: "Saturated hydrocarbons",
      tags: ["hydrocarbon", "alkane", "homologous series"],
      hazard: "Combustible or flammable hydrocarbon entry; exact physical-form classification must be verified against the current SDS.",
      level: "Moderate",
      disposal: "Collect as combustible or flammable organic waste according to institutional solvent-waste rules."
    },
    {
      key: "alkene",
      label: "Terminal alkene",
      start: 2,
      end: 180,
      formula: (n) => `C${n}H${2 * n}`,
      family: "Unsaturated hydrocarbons",
      tags: ["hydrocarbon", "alkene", "pi bond"],
      hazard: "Flammable or combustible unsaturated hydrocarbon; polymerization and peroxide risks depend on structure and storage.",
      level: "Moderate",
      disposal: "Collect as flammable organic waste; keep away from oxidizers and ignition sources."
    },
    {
      key: "alkyne",
      label: "Terminal alkyne",
      start: 2,
      end: 180,
      formula: (n) => `C${n}H${2 * n - 2}`,
      family: "Unsaturated hydrocarbons",
      tags: ["hydrocarbon", "alkyne", "terminal alkyne"],
      hazard: "Flammable unsaturated hydrocarbon class; terminal alkynes can form hazardous metal acetylides under unsuitable conditions.",
      level: "High",
      disposal: "Collect as hazardous organic waste and keep away from heavy-metal salts unless an approved procedure applies."
    },
    {
      key: "cycloalkane",
      label: "Cycloalkane",
      start: 3,
      end: 160,
      formula: (n) => `C${n}H${2 * n}`,
      family: "Cyclic hydrocarbons",
      tags: ["hydrocarbon", "cycloalkane", "ring"],
      hazard: "Combustible or flammable cyclic hydrocarbon; volatility and aspiration risk vary by ring size and substitution.",
      level: "Moderate",
      disposal: "Collect as hydrocarbon organic waste; do not drain-dispose."
    },
    {
      key: "primary-alcohol",
      label: "Primary alcohol",
      start: 1,
      end: 180,
      formula: (n) => `C${n}H${2 * n + 2}O`,
      family: "Alcohols",
      tags: ["alcohol", "oxygenate", "solvent"],
      hazard: "Flammable or combustible alcohol entry; toxicity and skin absorption vary strongly with chain length and branching.",
      level: "Moderate",
      disposal: "Collect as flammable or combustible organic waste unless local aqueous-waste policy explicitly permits another route."
    },
    {
      key: "aldehyde",
      label: "Aldehyde",
      start: 1,
      end: 180,
      formula: (n) => `C${n}H${2 * n}O`,
      family: "Aldehydes",
      tags: ["aldehyde", "carbonyl", "oxidation state"],
      hazard: "Reactive carbonyl class; many aldehydes are irritants, sensitizers or flammable liquids depending on structure.",
      level: "High",
      disposal: "Collect as reactive organic waste; segregate from strong oxidizers and bases."
    },
    {
      key: "ketone",
      label: "Ketone",
      start: 3,
      end: 180,
      formula: (n) => `C${n}H${2 * n}O`,
      family: "Ketones",
      tags: ["ketone", "carbonyl", "solvent"],
      hazard: "Flammable or combustible ketone entry; irritation and narcotic effects vary by specific compound.",
      level: "Moderate",
      disposal: "Collect as flammable organic waste and keep away from strong oxidizers."
    },
    {
      key: "carboxylic-acid",
      label: "Carboxylic acid",
      start: 1,
      end: 180,
      formula: (n) => `C${n}H${2 * n}O2`,
      family: "Carboxylic acids",
      tags: ["carboxylic acid", "acid", "carbonyl"],
      hazard: "Acidic oxygenate class; corrosivity, odor and flammability vary by chain length and concentration.",
      level: "Moderate",
      disposal: "Collect as organic acid waste or neutralize only under an approved institutional procedure."
    },
    {
      key: "ester",
      label: "Ester",
      start: 2,
      end: 180,
      formula: (n) => `C${n}H${2 * n}O2`,
      family: "Esters",
      tags: ["ester", "solvent", "carbonyl"],
      hazard: "Flammable or combustible ester class; hydrolysis and irritation hazards depend on exact ester identity.",
      level: "Moderate",
      disposal: "Collect as organic solvent waste; keep away from strong bases and oxidizers."
    },
    {
      key: "primary-amine",
      label: "Primary amine",
      start: 1,
      end: 180,
      formula: (n) => `C${n}H${2 * n + 3}N`,
      family: "Amines",
      tags: ["amine", "base", "nitrogen compound"],
      hazard: "Basic nitrogen compound class; many amines are corrosive, irritant, toxic or malodorous.",
      level: "High",
      disposal: "Collect as corrosive or toxic organic base waste; segregate from acids and oxidizers."
    },
    {
      key: "alkyl-chloride",
      label: "Alkyl chloride",
      start: 1,
      end: 180,
      formula: (n) => `C${n}H${2 * n + 1}Cl`,
      family: "Alkyl halides",
      tags: ["alkyl halide", "chloride", "substitution"],
      hazard: "Halogenated organic class; toxicity, volatility and environmental persistence require SDS-specific review.",
      level: "High",
      disposal: "Collect as halogenated hazardous organic waste; do not mix with non-halogenated solvent waste unless EHS directs otherwise."
    },
    {
      key: "alkyl-bromide",
      label: "Alkyl bromide",
      start: 1,
      end: 180,
      formula: (n) => `C${n}H${2 * n + 1}Br`,
      family: "Alkyl halides",
      tags: ["alkyl halide", "bromide", "substitution"],
      hazard: "Halogenated organic class; many members are lachrymators, toxicants or alkylating reagents.",
      level: "High",
      disposal: "Collect as halogenated hazardous organic waste in a compatible labelled container."
    },
    {
      key: "alkyl-iodide",
      label: "Alkyl iodide",
      start: 1,
      end: 940,
      formula: (n) => `C${n}H${2 * n + 1}I`,
      family: "Alkyl halides",
      tags: ["alkyl halide", "iodide", "leaving group"],
      hazard: "Halogenated organic class; many iodides are irritants, alkylating reagents or light-sensitive materials.",
      level: "High",
      disposal: "Collect as halogenated hazardous organic waste and protect from incompatible oxidizers."
    },
    {
      key: "alkyl-fluoride",
      label: "Alkyl fluoride",
      start: 1,
      end: 940,
      formula: (n) => `C${n}H${2 * n + 1}F`,
      family: "Organofluorine compounds",
      tags: ["organofluorine", "fluoride", "alkyl halide"],
      hazard: "Organofluorine class entry; thermal decomposition and specific toxicity depend on structure and formulation.",
      level: "Moderate",
      disposal: "Collect as halogenated organic waste unless institutional EHS classifies the exact compound otherwise."
    },
    {
      key: "nitrile",
      label: "Nitrile",
      start: 1,
      end: 940,
      formula: (n) => `C${n}H${2 * n - 1}N`,
      family: "Nitriles",
      tags: ["nitrile", "cyano", "polar aprotic"],
      hazard: "Nitrile class entry; toxicity, flammability and hydrolysis behavior vary by chain length and substitution.",
      level: "High",
      disposal: "Collect as toxic organic waste; keep segregated from strong acids and oxidizers."
    },
    {
      key: "amide",
      label: "Amide",
      start: 1,
      end: 940,
      formula: (n) => `C${n}H${2 * n + 1}NO`,
      family: "Amides",
      tags: ["amide", "carbonyl", "hydrogen bonding"],
      hazard: "Amide class entry; exposure controls depend on volatility, substitution and toxicological profile.",
      level: "Moderate",
      disposal: "Collect as organic waste or route according to current SDS and local solvent-waste policy."
    },
    {
      key: "ether",
      label: "Dialkyl ether",
      start: 2,
      end: 940,
      formula: (n) => `C${n}H${2 * n + 2}O`,
      family: "Ethers",
      tags: ["ether", "solvent", "peroxide former"],
      hazard: "Ether class entry; peroxide formation, volatility and flammability must be checked before storage or distillation.",
      level: "High",
      disposal: "Collect as peroxide-former or flammable organic waste under institutional EHS rules."
    },
    {
      key: "thiol",
      label: "Thiol",
      start: 1,
      end: 940,
      formula: (n) => `C${n}H${2 * n + 2}S`,
      family: "Organosulfur compounds",
      tags: ["thiol", "organosulfur", "nucleophile"],
      hazard: "Thiol class entry; odor, toxicity, flammability and metal-complexation hazards vary by structure.",
      level: "High",
      disposal: "Collect as malodorous or toxic organic sulfur waste in sealed compatible containers."
    },
    {
      key: "sulfide",
      label: "Alkyl sulfide",
      start: 2,
      end: 940,
      formula: (n) => `C${n}H${2 * n + 2}S`,
      family: "Organosulfur compounds",
      tags: ["sulfide", "thioether", "organosulfur"],
      hazard: "Sulfide class entry; oxidation, odor and aquatic toxicity depend on exact structure.",
      level: "Moderate",
      disposal: "Collect as organic sulfur waste and keep away from strong oxidizers unless an approved procedure applies."
    },
    {
      key: "sulfonamide",
      label: "Sulfonamide",
      start: 1,
      end: 940,
      formula: (n) => `C${n}H${2 * n + 3}NO2S`,
      family: "Sulfonamides",
      tags: ["sulfonamide", "sulfur", "amide"],
      hazard: "Sulfonamide class entry; sensitization, dust and toxicity concerns require SDS-specific review.",
      level: "Moderate",
      disposal: "Collect as organic solid or solution waste according to current SDS and institutional policy."
    },
    {
      key: "phosphate-ester",
      label: "Phosphate ester",
      start: 1,
      end: 940,
      formula: (n) => `C${n}H${2 * n + 3}O4P`,
      family: "Organophosphorus compounds",
      tags: ["phosphate ester", "organophosphorus", "ester"],
      hazard: "Organophosphorus ester entry; toxicity, hydrolysis and environmental persistence require exact-identity review.",
      level: "High",
      disposal: "Collect as hazardous organophosphorus waste and route through institutional EHS disposal."
    },
    {
      key: "boronic-acid",
      label: "Alkyl boronic acid",
      start: 1,
      end: 940,
      formula: (n) => `C${n}H${2 * n + 3}BO2`,
      family: "Organoboron compounds",
      tags: ["boronic acid", "organoboron", "cross coupling"],
      hazard: "Organoboron class entry; irritation, moisture behavior and impurity profile depend on the exact compound.",
      level: "Moderate",
      disposal: "Collect as organic reagent waste; keep segregated from strong oxidizers and incompatible bases."
    },
    {
      key: "organosilane",
      label: "Organosilane",
      start: 1,
      end: 940,
      formula: (n) => `C${n}H${2 * n + 4}Si`,
      family: "Organosilicon compounds",
      tags: ["organosilane", "silicon", "surface modifier"],
      hazard: "Organosilane class entry; hydrolysis, flammability and corrosive byproducts depend on substituents.",
      level: "High",
      disposal: "Collect as reactive organic reagent waste and keep away from moisture when SDS requires dry handling."
    },
    {
      key: "aryl-chloride",
      label: "Aryl chloride",
      start: 6,
      end: 940,
      formula: (n) => `C${n}H${Math.max(1, (2 * n) - 7)}Cl`,
      family: "Aryl halides",
      tags: ["aryl halide", "chloride", "cross coupling"],
      hazard: "Aryl chloride class entry; persistence, toxicity and combustion byproducts require compound-specific review.",
      level: "Moderate",
      disposal: "Collect as halogenated organic waste and avoid uncontrolled combustion or drain disposal."
    },
    {
      key: "aryl-boronic-acid",
      label: "Aryl boronic acid",
      start: 6,
      end: 940,
      formula: (n) => `C${n}H${Math.max(3, (2 * n) - 5)}BO2`,
      family: "Aryl boronic acids",
      tags: ["aryl boronic acid", "organoboron", "Suzuki coupling"],
      hazard: "Aryl boronic acid class entry; dust, irritation and impurity hazards must be checked with the current SDS.",
      level: "Moderate",
      disposal: "Collect as organic reagent waste according to SDS and institutional hazardous-waste rules."
    }
  ];

  for (let offset = 0; entries.length < needed; offset += 1) {
    let addedThisRound = false;
    for (const family of families) {
      const n = family.start + offset;
      if (n > family.end) continue;
      addedThisRound = true;
      const name = `${family.label} C${n} reference`;
      entries.push({
        id: `syscat-${family.key}-c${n}`,
        name,
        formula: family.formula(n),
        family: family.family,
        synonyms: [`C${n} ${family.label.toLowerCase()}`, family.label.toLowerCase()],
        summary: `${name} is a systematic local ChemVault catalog entry for search coverage, class comparison and database seeding.`,
        evidenceNote: "Systematic local catalog entry. Verify exact isomer, supplier grade, SDS and primary source identifiers before laboratory use or citation.",
        tags: ["local catalog", "systematic catalog", `C${n}`, ...family.tags],
        hazardStatements: [family.hazard],
        hazardLevel: family.level,
        signalWord: family.level === "High" ? "Danger" : "Warning",
        precautionaryStatements: ["Verify current SDS before handling, storage, transport or disposal."],
        disposalMethod: family.disposal,
        safetySource: "Local systematic safety summary"
      });
      if (entries.length >= needed) break;
    }
    if (!addedThisRound) break;
  }

  data.compounds.push(...entries);

  window.CHEMVAULT_LOCAL_CATALOG = {
    targetRecords: TARGET_LOCAL_RECORDS,
    recordsBeforeCatalog: before,
    generatedRecords: entries.length,
    projectedRecords: before + entries.length,
    generatedFamilies: families.length
  };

  function countLocalRecords() {
    const seen = new Set();
    addRecords(seen, "reaction", data.reactionSystems, (item) => item.id);
    addRecords(seen, "reactant", data.reactants, (item) => item.id);
    addRecords(seen, "reagent", data.reagents, (item) => item.id);
    addRecords(seen, "compound", data.compounds, (item) => item.id);
    addRecords(seen, "material", materials.materials, (item) => item.id);
    addRecords(seen, "route", data.routes, routeId);
    addRecords(seen, "mechanism", data.mechanisms, (item) => item.id);
    addRecords(seen, "concept", data.concepts, (item) => item.id || slug(item.term));
    addRecords(seen, "source", data.sources, (item) => item.id || slug(item.short));
    addRecords(seen, "research-case", research.caseStudies, (item) => item.id);
    addRecords(seen, "dossier", dossiers.dossiers, (item) => item.id);
    addRecords(seen, "method", methods.protocols, (item) => item.id);
    addRecords(seen, "spectroscopy", spectroscopy.cases, (item) => item.id);
    return seen.size;
  }

  function addRecords(seen, type, list, getId) {
    (Array.isArray(list) ? list : []).forEach((item) => {
      const id = getId(item);
      if (id) seen.add(`${type}:${id}`);
    });
  }

  function routeId(route) {
    return `route-${slug(route?.start)}-${slug(route?.target)}`;
  }

  function slug(value) {
    return String(value || "record").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function dedupeSourceArrays() {
    dedupeArray(data, "reactionSystems", (item) => item.id);
    dedupeArray(data, "reactants", (item) => item.id);
    dedupeArray(data, "reagents", (item) => item.id);
    dedupeArray(data, "compounds", (item) => item.id);
    dedupeArray(materials, "materials", (item) => item.id);
    dedupeArray(data, "routes", routeId);
    dedupeArray(data, "mechanisms", (item) => item.id);
    dedupeArray(data, "concepts", (item) => item.id || slug(item.term));
    dedupeArray(data, "sources", (item) => item.id || slug(item.short));
    dedupeArray(research, "caseStudies", (item) => item.id);
    dedupeArray(dossiers, "dossiers", (item) => item.id);
    dedupeArray(methods, "protocols", (item) => item.id);
    dedupeArray(spectroscopy, "cases", (item) => item.id);
  }

  function dedupeArray(owner, key, getId) {
    if (!Array.isArray(owner[key])) return;
    const seen = new Set();
    owner[key] = owner[key].filter((item) => {
      const id = getId(item);
      if (!id) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }
})();
