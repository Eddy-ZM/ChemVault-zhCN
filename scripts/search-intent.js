(function () {
  const reductionTerms = ["reduce", "reduces", "reduced", "reducing", "reduction", "hydride", "hydrogenation"];

  const intents = [
    {
      id: "ketone-to-alcohol",
      label: "酮到醇还原",
      description: "用于将酮转化为醇产物的羰基还原选择。",
      tokens: [["ketone", "ketones"], ["alcohol", "alcohols"]],
      actionTokens: ["to", "into", "from", ...reductionTerms],
      patterns: [
        /\bketones?\b.*\b(to|into)\b.*\b(secondary\s+)?alcohols?\b/,
        /\breduc(?:e|es|ed|ing|tion)\b.*\bketones?\b.*\b(secondary\s+)?alcohols?\b/,
        /\bketones?\b.*\breduc(?:e|es|ed|ing|tion)\b.*\b(secondary\s+)?alcohols?\b/
      ],
      expansions: [
        "ketone to secondary alcohol",
        "carbonyl reduction",
        "hydride reduction",
        "transfer hydrogenation",
        "Meerwein Ponndorf Verley reduction",
        "catalytic hydrogenation ketone alcohol"
      ],
      candidates: [
        {
          key: "reagent:nabh4",
          score: 400,
          aliases: ["sodium borohydride", "nabh4", "nabh", "borohydride"]
        },
        {
          key: "reagent:lialh4",
          score: 300,
          aliases: ["lithium aluminium hydride", "lithium aluminum hydride", "lialh4", "lah"]
        },
        {
          key: "reagent:h2pd",
          score: 200,
          aliases: ["h2 pd", "h2/pd", "h2 / pd", "pd c", "palladium hydrogenation", "catalytic hydrogenation"]
        },
        {
          key: "reagent:mpv-reduction",
          score: 100,
          aliases: ["meerwein ponndorf verley", "meerwein-ponndorf-verley", "mpv reduction", "aluminium isopropoxide"]
        }
      ]
    }
  ];

  function normalise(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/→|➜|⇒|=>|--?>/g, " to ")
      .replace(/\bh\s*2\s*\/\s*pd(?:-?c)?\b/g, "h2 pd catalytic hydrogenation")
      .replace(/\bnabh\b/g, "nabh4 nabh")
      .replace(/\blah\b/g, "lialh4 lah")
      .replace(/[^a-z0-9.+-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokens(value) {
    return normalise(value).split(" ").filter(Boolean);
  }

  function detect(query) {
    const text = normalise(query);
    if (!text) return null;
    const tokenSet = new Set(tokens(text));
    return intents.find((intent) => {
      if (intent.patterns.some((pattern) => pattern.test(text))) return true;
      const hasRequiredTokens = intent.tokens.every((group) => group.some((token) => tokenSet.has(token)));
      const hasAction = intent.actionTokens.some((token) => tokenSet.has(token));
      return hasRequiredTokens && hasAction;
    }) || null;
  }

  function recordKey(item = {}) {
    const type = compactType(item.recordType || item.type || item.typeLabel || "record");
    return `${type}:${String(item.id || normalise(item.title || "")).trim()}`;
  }

  function compactType(value) {
    const type = normalise(value).replace(/\s+/g, "-");
    if (type.includes("reagent")) return "reagent";
    if (type.includes("reaction")) return "reaction";
    if (type.includes("reactant")) return "reactant";
    if (type.includes("compound")) return "compound";
    if (type.includes("material")) return "material";
    if (type.includes("route")) return "route";
    if (type.includes("mechanism")) return "mechanism";
    if (type.includes("concept")) return "concept";
    if (type.includes("dossier")) return "dossier";
    if (type.includes("method")) return "method";
    if (type.includes("spectroscopy")) return "spectroscopy";
    if (type.includes("research")) return "research-case";
    return type || "record";
  }

  function itemText(item = {}) {
    const raw = item.raw || {};
    return normalise([
      item.id,
      item.recordType,
      item.type,
      item.typeLabel,
      item.title,
      item.name,
      item.formula,
      item.body,
      item.subtitle,
      item.domain,
      item.family,
      item.category,
      item.focus,
      ...(item.tags || []),
      ...(item.transformations || []),
      ...(raw.tags || []),
      ...(raw.transformations || [])
    ].filter(Boolean).join(" "));
  }

  function candidateFor(item, intent) {
    const key = recordKey(item);
    const hasStableKey = Boolean(item.id && (item.recordType || item.type || item.typeLabel));
    const exactCandidate = intent.candidates.find((candidate) => candidate.key === key);
    if (exactCandidate) return exactCandidate;
    if (hasStableKey) return null;
    const text = itemText(item);
    return intent.candidates.find((candidate) => candidate.aliases.some((alias) => text.includes(normalise(alias)))) || null;
  }

  function score(item, query) {
    const intent = detect(query);
    if (!intent) return 0;
    const candidate = candidateFor(item, intent);
    if (!candidate) return 0;
    const text = itemText(item);
    const affinity = intent.expansions.reduce((total, term) => {
      const termTokens = tokens(term);
      return total + termTokens.filter((token) => text.includes(token)).length;
    }, 0);
    return candidate.score + Math.min(affinity, 18);
  }

  function rank(query, index, options = {}) {
    const intent = detect(query);
    if (!intent) return [];
    const limit = Number(options.limit || 8);
    return (index || [])
      .map((item) => ({
        item,
        intent,
        score: score(item, query)
      }))
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
      .slice(0, limit);
  }

  function expand(query) {
    const intent = detect(query);
    if (!intent) return normalise(query);
    return normalise([query, intent.label, intent.expansions.join(" ")].join(" "));
  }

  window.CHEMVAULT_SEARCH_INTENT = {
    version: "2026-06-08",
    detect,
    score,
    rank,
    expand,
    recordKey,
    normalise
  };
})();
