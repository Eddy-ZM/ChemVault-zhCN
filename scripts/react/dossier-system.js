(function () {
  const h = React.createElement;
  const C = window.ChemVaultReact;

  function includes(value, query) {
    if (!query) return true;
    return String(value || "").toLowerCase().includes(query.toLowerCase());
  }

  function scoreLedger(rows) {
    const total = (rows || []).reduce((sum, row) => sum + (row.state === "complete" ? 1 : row.state === "partial" ? 0.5 : 0), 0);
    return Math.round((total / Math.max((rows || []).length, 1)) * 100);
  }

  function DossierSystem({ payload, query, onSelect }) {
    const [selectedId, setSelectedId] = React.useState("");
    const dossiers = (payload.dossiers?.dossiers || []).filter((item) => includes([
      item.title,
      item.field,
      item.status,
      item.abstract,
      ...(item.keywords || []),
      ...(item.methods || []),
      ...(item.claims || []),
      ...(item.limitations || [])
    ].join(" "), query));
    const selected = dossiers.find((item) => item.id === selectedId) || dossiers[0];
    const reproducibility = scoreLedger(selected?.reproducibility || []);

    React.useEffect(() => {
      if (!dossiers.some((item) => item.id === selectedId)) setSelectedId(dossiers[0]?.id || "");
    }, [query, dossiers.length]);

    function choose(item) {
      setSelectedId(item.id);
      onSelect({
        id: item.id,
        type: "Dossier",
        title: item.title,
        body: item.abstract,
        tags: [item.field, item.status, `${item.maturity}% maturity`]
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
          eyebrow: `${item.field} · ${item.status}`,
          title: item.title,
          body: item.abstract,
          meta: `${item.maturity}% maturity`,
          tags: item.keywords || [],
          onSelect: () => choose(item)
        }))
      ]),
      h("article", { className: "react-manuscript-window", key: "main" }, selected ? [
        h("header", { className: "react-record-header", key: "header" }, [
          h("div", { key: "copy" }, [
            h("span", { className: "eyebrow", key: "eyebrow" }, `${selected.field} · ${selected.status}`),
            h("h2", { key: "title" }, selected.title),
            h("p", { key: "abstract" }, selected.abstract)
          ]),
          h("div", { className: "react-score-ring", style: { "--value": `${reproducibility}%` }, key: "score" }, [
            h("span", { key: "ring" }),
            h("strong", { key: "value" }, `${reproducibility}%`),
            h("small", { key: "label" }, "reproducibility")
          ])
        ]),
        h("div", { className: "react-argument-grid", key: "grid" }, [
          h(C.DataPanel, { key: "claims", title: "Claims", items: selected.claims || [] }),
          h(C.DataPanel, { key: "methods", title: "Methods", items: selected.methods || [] }),
          h(C.DataPanel, { key: "limitations", title: "Limitations", items: selected.limitations || [] }),
          h("section", { className: "react-data-panel", key: "ledger" }, [
            h("h3", { key: "title" }, "Reproducibility Ledger"),
            h("div", { className: "react-ledger", key: "rows" }, (selected.reproducibility || []).map((row) => h("div", { key: row.item }, [
              h("span", { key: "item" }, row.item),
              h("strong", { "data-state": row.state, key: "state" }, row.state)
            ])))
          ])
        ])
      ] : null),
      h("aside", { className: "react-side-stack", key: "side" }, h(C.DataPanel, { title: "Observables", items: selected?.observables || [] }))
    ]);
  }

  C.DossierSystem = DossierSystem;
}());
