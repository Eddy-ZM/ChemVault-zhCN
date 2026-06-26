(function () {
  const h = React.createElement;
  const C = window.ChemVaultReact;
  const asArray = (value) => Array.isArray(value) ? value : [];
  const asObject = (value) => (value && typeof value === "object" ? value : {});

  function includes(value, query) {
    if (!query) return true;
    return String(value || "").toLowerCase().includes(query.toLowerCase());
  }

  function scoreLedger(rows) {
    const safeRows = asArray(rows);
    const total = safeRows.reduce((sum, row) => {
      const state = asObject(row).state;
      return sum + (state === "complete" ? 1 : state === "partial" ? 0.5 : 0);
    }, 0);
    return Math.round((total / Math.max(safeRows.length, 1)) * 100);
  }

  function DossierSystem({ payload, query, onSelect }) {
    const [selectedId, setSelectedId] = React.useState("");
    const dossierSource = asObject(payload?.dossiers);
    const dossiers = asArray(dossierSource.dossiers).filter((rawItem) => {
      const item = asObject(rawItem);
      const text = [
        item.title,
        item.field,
        item.status,
        item.abstract,
        ...asArray(item.keywords),
        ...asArray(item.methods),
        ...asArray(item.claims),
        ...asArray(item.limitations)
      ].join(" ");
      return includes(text, query);
    });
    const selected = dossiers.find((item) => item.id === selectedId) || dossiers[0] || null;
    const reproducibility = scoreLedger(selected?.reproducibility);

    React.useEffect(() => {
      if (!dossiers.some((item) => item.id === selectedId)) setSelectedId(dossiers[0]?.id || "");
    }, [query, dossiers.length]);

    function choose(item) {
      if (!item || !item.id) return;
      setSelectedId(item.id);
      onSelect({
        id: item.id,
        type: "Dossier",
        title: item.title || "Dossier",
        body: item.abstract || "",
        tags: [item.field || "Dossier", item.status || "unknown", `${item.maturity || 0}% maturity`]
      });
    }

    return h("section", { className: "react-view-grid" }, [
      h("div", { className: "react-record-column", key: "list" }, [
        h("div", { className: "react-section-head", key: "head" }, [
          h("div", { key: "copy" }, [
            h("span", { className: "eyebrow", key: "eyebrow" }, "component · dossier system"),
            h("h2", { key: "title" }, "Dossier System")
          ]),
          h("strong", { key: "count" }, `${dossiers.length} dossiers`)
        ]),
        ...dossiers.map((item) => h(C.PanelCard, {
          key: item.id,
          active: selected?.id === item.id,
          eyebrow: `${item.field || "Unknown"} · ${item.status || "Draft"}`,
          title: item.title || "Untitled dossier",
          body: item.abstract || "",
          meta: `${item.maturity || 0}% maturity`,
          tags: asArray(item.keywords),
          onSelect: () => choose(item)
        }))
      ]),
      h("article", { className: "react-manuscript-window", key: "main" }, selected ? [
        h("header", { className: "react-record-header", key: "header" }, [
          h("div", { key: "copy" }, [
            h("span", { className: "eyebrow", key: "eyebrow" }, `${selected.field || "Unknown"} · ${selected.status || "Draft"}`),
            h("h2", { key: "title" }, selected.title || "Untitled dossier"),
            h("p", { key: "abstract" }, selected.abstract || "")
          ]),
          h("div", { className: "react-score-ring", style: { "--value": `${reproducibility}%` }, key: "score" }, [
            h("span", { key: "ring" }),
            h("strong", { key: "value" }, `${reproducibility}%`),
            h("small", { key: "label" }, "reproducibility")
          ])
        ]),
        h("div", { className: "react-argument-grid", key: "grid" }, [
          h(C.DataPanel, { key: "claims", title: "Claims", items: asArray(selected.claims) }),
          h(C.DataPanel, { key: "methods", title: "Methods", items: asArray(selected.methods) }),
          h(C.DataPanel, { key: "limitations", title: "Limitations", items: asArray(selected.limitations) }),
          h("section", { className: "react-data-panel", key: "ledger" }, [
            h("h3", { key: "title" }, "Reproducibility Ledger"),
            h("div", { className: "react-ledger", key: "rows" }, asArray(selected.reproducibility).map((row, index) => {
              const entry = asObject(row);
              return h("div", { key: entry.item || `ledger-${index}` }, [
                h("span", { key: "item" }, entry.item || "Ledger item"),
                h("strong", { "data-state": entry.state || "missing", key: "state" }, entry.state || "missing")
              ]);
            }))
          ])
        ])
      ] : null),
      h("aside", { className: "react-side-stack", key: "side" }, h(C.DataPanel, { title: "Observables", items: asArray(selected?.observables) }))
    ]);
  }

  C.DossierSystem = DossierSystem;
}());
