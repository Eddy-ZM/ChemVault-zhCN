(function () {
  const h = React.createElement;
  const C = window.ChemVaultReact;
  const text = (value) => String(value || "").toLowerCase();
  const compoundCategoryPatterns = {
    reactants: /\b(reactant|substrate|alkane|alkene|alkyne|cycloalkane|alcohol|aldehyde|ketone|carboxylic acid|ester|amine|alkyl halide|carbonyl|hydrocarbon|oxygenate|nitrogen compound)\b/,
    reagents: /\b(reagent|solvent|acid|base|oxidizer|catalyst|halogen|alcohol|aldehyde|ketone|ester|amine|alkyl halide|chloride|bromide|iodide|fluoride)\b/,
    materials: /\b(material|polymer|nanomaterial|oxide|salt|metal|inorganic|graphene|silica|alumina|zeolite|hydrogel|mof|alloy|ceramic)\b/,
    mechanisms: /\b(mechanism|substitution|elimination|addition|oxidation|reduction|hydrolysis|polymerization|carbonyl|alkene|alkyne|acid|base|amine|ester|halide|pi bond)\b/
  };

  function classifiedMetrics(payload) {
    const chem = payload.chem || {};
    const materials = payload.materials || {};
    const buckets = {
      reactants: new Set((chem.reactants || []).map((item, index) => `reactant:${item.id || item.name || index}`)),
      reagents: new Set((chem.reagents || []).map((item, index) => `reagent:${item.id || item.name || index}`)),
      materials: new Set((materials.materials || []).map((item, index) => `material:${item.id || item.name || index}`)),
      mechanisms: new Set((chem.mechanisms || []).map((item, index) => `mechanism:${item.id || item.name || index}`))
    };

    (chem.compounds || []).forEach((compound, index) => {
      const key = `compound:${compound.id || compound.name || index}`;
      const haystack = text([
        compound.name,
        compound.formula,
        compound.family,
        compound.summary,
        compound.evidenceNote,
        ...(compound.tags || []),
        ...(compound.synonyms || [])
      ].filter(Boolean).join(" "));
      if (compoundCategoryPatterns.reactants.test(haystack)) buckets.reactants.add(key);
      if (compoundCategoryPatterns.reagents.test(haystack)) buckets.reagents.add(key);
      if (compoundCategoryPatterns.materials.test(haystack)) buckets.materials.add(key);
      if (compoundCategoryPatterns.mechanisms.test(haystack)) buckets.mechanisms.add(key);
    });

    return {
      reactionSystems: chem.reactionSystems?.length || 0,
      reactants: buckets.reactants.size,
      reagents: buckets.reagents.size,
      compounds: chem.compounds?.length || 0,
      materials: buckets.materials.size,
      mechanisms: buckets.mechanisms.size
    };
  }

  function FrameworkApp() {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const [payload, setPayload] = React.useState(null);
    const [dataSource, setDataSource] = React.useState("runtime");
    const [query, setQuery] = React.useState("");
    const [domain, setDomain] = React.useState("all");
    const [activeView, setActiveView] = React.useState("reaction-workbench");
    const [selectedRecord, setSelectedRecord] = React.useState(null);

    React.useEffect(() => {
      const hydrate = (json, source) => {
        const normalized = normalisePayload(json);
        if (!normalized) {
          setError("Failed to normalise chemistry dataset payload.");
          setLoading(false);
          return;
        }
        setPayload(normalized);
        setDataSource(source);
        const params = new URLSearchParams(location.search);
        setQuery(params.get("q") || "");
        setDomain(params.get("domain") || "all");
        setActiveView(params.get("view") || "reaction-workbench");
        setLoading(false);
      };

      const runtimePayload = payloadFromRuntime();
      if (runtimePayload) {
        hydrate(runtimePayload, "runtime data bundle");
        return;
      }

      fetch("../data/chemvault-data.json?v=20260603a")
        .then((response) => {
          if (!response.ok) throw new Error(`Dataset request failed with ${response.status}`);
          return response.json();
        })
        .then((json) => hydrate(json, "static JSON"))
        .catch((err) => {
          setError(err.message || "Unable to load chemistry dataset.");
          setLoading(false);
        });
    }, []);

    React.useEffect(() => {
      if (!payload) return;
      const url = new URL(location.href);
      if (query) url.searchParams.set("q", query);
      else url.searchParams.delete("q");
      if (domain !== "all") url.searchParams.set("domain", domain);
      else url.searchParams.delete("domain");
      if (activeView !== "reaction-workbench") url.searchParams.set("view", activeView);
      else url.searchParams.delete("view");
      history.replaceState(null, "", url);
    }, [query, domain, activeView, payload]);

    if (loading) return h("div", { className: "page-panel" }, "Loading JSON chemistry dataset...");
    if (error) return h("div", { className: "page-panel" }, error);
    if (!payload) return null;

    const domains = ["all", ...new Set((payload.chem?.reactionSystems || []).map((item) => item.domain).filter(Boolean))];
    const metricCounts = classifiedMetrics(payload);
    const metrics = [
      { label: "Reaction systems", value: metricCounts.reactionSystems, note: "dynamic systems" },
      { label: "Reactants", value: metricCounts.reactants, note: "classified records" },
      { label: "Reagents", value: metricCounts.reagents, note: "classified records" },
      { label: "Compounds", value: metricCounts.compounds, note: "molecule records" },
      { label: "Materials", value: metricCounts.materials, note: "classified records" },
      { label: "Mechanisms", value: metricCounts.mechanisms, note: "classified records" }
    ];
    const sourceLinks = (payload.external?.sources || []).slice(0, 5).map((source) => {
      const term = encodeURIComponent(query || "chemistry reaction mechanism");
      return {
        name: source.name,
        href: source.queryUrl ? source.queryUrl.replace("{query}", term) : source.baseUrl
      };
    });
    const views = [
      ["reaction-workbench", "Reaction Matrix"],
      ["research-desk", "Research Desk"],
      ["dossier-system", "Dossier System"],
      ["molecule-explorer", "Molecule Explorer"],
      ["panel-ui", "Panel UI"]
    ];
    const activeComponent = {
      "reaction-workbench": h(C.ReactionWorkbench, { payload, query, domain, onSelect: setSelectedRecord }),
      "research-desk": h(C.ResearchDesk, { payload, query, onSelect: setSelectedRecord }),
      "dossier-system": h(C.DossierSystem, { payload, query, onSelect: setSelectedRecord }),
      "molecule-explorer": h(C.MoleculeExplorer, { payload, query, onSelect: setSelectedRecord }),
      "panel-ui": h(C.PanelShowcase, { payload, query, selectedRecord })
    }[activeView];

    return h(React.Fragment, null, [
      h("section", { className: "framework-control-deck", key: "controls" }, [
        h("div", { className: "framework-search-panel", key: "search" }, [
          h("label", { htmlFor: "frameworkSearch", key: "label" }, "Dynamic Search"),
          h("div", { className: "framework-search-row", key: "row" }, [
            h("input", {
              id: "frameworkSearch",
              type: "search",
              placeholder: "photoredox, diazonium, graphene, aldehyde...",
              autoComplete: "off",
              value: query,
              onChange: (event) => setQuery(event.target.value),
              key: "input"
            }),
            h("select", {
              value: domain,
              "aria-label": "Research domain",
              onChange: (event) => setDomain(event.target.value),
              key: "domain"
            }, domains.map((item) => h("option", { key: item, value: item }, item === "all" ? "All domains" : item))),
            h("button", {
              className: "small-button",
              type: "button",
              onClick: () => {
                setQuery("");
                setDomain("all");
              },
              key: "reset"
            }, "Reset")
          ])
        ]),
        h(C.MetricStrip, { metrics, key: "metrics" })
      ]),
      h("section", { className: "framework-main-grid", key: "main" }, [
        h("aside", { className: "framework-nav-panel", key: "nav" }, [
          h("span", { className: "eyebrow", key: "eyebrow" }, "component routes"),
          ...views.map(([id, label]) => h("button", {
            type: "button",
            className: activeView === id ? "active" : "",
            onClick: () => setActiveView(id),
            key: id
          }, label)),
          h("section", { className: "react-data-panel", key: "json" }, [
            h("span", { className: "eyebrow", key: "eyebrow" }, "json status"),
            h("h3", { key: "title" }, `Data ${payload.version}`),
            h("p", { key: "body" }, `Loaded from ${dataSource}.`)
          ])
        ]),
        h(React.Fragment, { key: "active" }, activeComponent),
        h("aside", { className: "framework-inspector-panel", key: "inspector" }, [
          h(C.RecordInspector, { record: selectedRecord, key: "record" }),
          h("section", { className: "react-data-panel", key: "sources" }, [
            h("span", { className: "eyebrow", key: "eyebrow" }, "source handoff"),
            h("h3", { key: "title" }, "Academic Links"),
            h("div", { className: "source-action-row", key: "links" }, sourceLinks.map((source) => h("a", {
              className: "secondary-button",
              href: source.href,
              target: "_blank",
              rel: "noreferrer",
              key: source.name
            }, source.name)))
          ])
        ])
      ])
    ]);
  }

  function payloadFromRuntime() {
    const chem = window.CHEMVAULT_DATA;
    if (!chem || typeof chem !== "object") return null;
    return normalisePayload({
      version: "0.2.4",
      chem,
      research: window.CHEMVAULT_RESEARCH || {},
      dossiers: window.CHEMVAULT_DOSSIERS || {},
      methods: window.CHEMVAULT_METHODS || {},
      spectroscopy: window.CHEMVAULT_SPECTROSCOPY || {},
      materials: window.CHEMVAULT_MATERIALS || {},
      external: window.CHEMVAULT_EXTERNAL || {},
      workbench: window.CHEMVAULT_WORKBENCH || {}
    });
  }

  function normalisePayload(json) {
    if (!json || typeof json !== "object") return null;

    const asArray = (value) => (Array.isArray(value) ? value : []);
    const asObject = (value) => (value && typeof value === "object" ? value : {});

    const chem = asObject(json.chem);
    const research = asObject(json.research);
    const dossiers = asObject(json.dossiers);
    const methods = asObject(json.methods);
    const spectroscopy = asObject(json.spectroscopy);
    const materials = asObject(json.materials);
    const external = asObject(json.external);
    const workbench = asObject(json.workbench);

    return {
      version: json.version || "0.2.4",
      generatedAt: json.generatedAt || new Date().toISOString(),
      chem: {
        ...chem,
        reactionSystems: asArray(chem.reactionSystems),
        reactants: asArray(chem.reactants),
        compounds: asArray(chem.compounds),
        compoundsIndex: asObject(chem.compoundsIndex),
        routes: asArray(chem.routes),
        mechanisms: asArray(chem.mechanisms),
        concepts: asArray(chem.concepts),
        conceptsIndex: asObject(chem.conceptsIndex),
        sources: asArray(chem.sources),
        sourcesIndex: asObject(chem.sourcesIndex)
      },
      research: {
        ...research,
        caseStudies: asArray(research.caseStudies)
      },
      dossiers: {
        ...dossiers,
        dossiers: asArray(dossiers.dossiers)
      },
      methods: {
        ...methods,
        protocols: asArray(methods.protocols)
      },
      spectroscopy: {
        ...spectroscopy,
        cases: asArray(spectroscopy.cases)
      },
      materials: {
        ...materials,
        materials: asArray(materials.materials)
      },
      external: {
        ...external,
        sources: asArray(external.sources)
      },
      workbench: {
        ...workbench,
        evidenceQueue: asArray(workbench.evidenceQueue)
      }
    };
  }

  ReactDOM.createRoot(document.getElementById("frameworkApp")).render(h(FrameworkApp));
}());
