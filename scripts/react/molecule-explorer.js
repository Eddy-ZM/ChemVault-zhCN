(function () {
  const h = React.createElement;
  const C = window.ChemVaultReact;

  function lower(value) {
    return String(value || "").toLowerCase();
  }

  function MoleculeExplorer({ payload, query, onSelect }) {
    const [axis, setAxis] = React.useState("reagents");
    const [selectedKey, setSelectedKey] = React.useState("");
    const axes = [
      { id: "reagents", label: "Reagents", rows: payload.chem?.reagents || [] },
      { id: "compounds", label: "Compounds", rows: payload.chem?.compounds || [] },
      { id: "materials", label: "Materials", rows: payload.materials?.materials || [] },
      { id: "mechanisms", label: "Mechanisms", rows: payload.chem?.mechanisms || [] }
    ];
    const activeAxis = axes.find((item) => item.id === axis) || axes[0];
    const rows = activeAxis.rows.filter((item) => {
      const text = lower([
        item.name,
        item.formula,
        item.category,
        item.family,
        item.className,
        item.focus,
        item.summary,
        item.synthesis,
        item.mechanism,
        ...(item.tags || []),
        ...(item.applications || []),
        ...(item.properties || []),
        ...(item.characterization || []),
        ...(item.bestFor || [])
      ].join(" "));
      return !query || text.includes(lower(query));
    }).slice(0, 80);
    const selected = rows.find((item) => rowKey(item) === selectedKey) || rows[0];

    React.useEffect(() => {
      if (!rows.some((item) => rowKey(item) === selectedKey)) setSelectedKey(rows[0] ? rowKey(rows[0]) : "");
    }, [query, axis, rows.length]);

    function rowKey(item) {
      return item.id || item.name || item.term || item.formula;
    }

    function title(item) {
      return item.name || item.term || item.title || item.formula || "Untitled record";
    }

    function eyebrow(item) {
      return item.category || item.family || item.className || activeAxis.label;
    }

    function body(item) {
      return item.focus || item.summary || item.synthesis || item.mechanism || item.definition || "";
    }

    function tags(item) {
      return [item.formula, ...(item.tags || []), ...(item.applications || []), ...(item.bestFor || [])].filter(Boolean);
    }

    function choose(item) {
      setSelectedKey(rowKey(item));
      onSelect({
        id: rowKey(item),
        type: activeAxis.label.replace(/s$/, ""),
        title: title(item),
        body: body(item),
        tags: tags(item).slice(0, 6)
      });
    }

    return h("section", { className: "react-view-grid" }, [
      h("div", { className: "react-record-column", key: "list" }, [
        h("div", { className: "react-section-head", key: "head" }, [
          h("div", { key: "copy" }, [
            h("span", { className: "eyebrow", key: "eyebrow" }, "component · molecule explorer"),
            h("h2", { key: "title" }, "Molecule & Material Explorer")
          ]),
          h("strong", { key: "count" }, `${rows.length} visible`)
        ]),
        h("div", { className: "react-segmented", key: "axes" }, axes.map((item) => h("button", {
          key: item.id,
          type: "button",
          className: axis === item.id ? "active" : "",
          onClick: () => setAxis(item.id)
        }, item.label))),
        ...rows.map((item) => h(C.PanelCard, {
          key: rowKey(item),
          active: selected && rowKey(selected) === rowKey(item),
          eyebrow: eyebrow(item),
          title: title(item),
          body: body(item),
          meta: item.formula || item.cas || item.risk || "",
          tags: tags(item),
          onSelect: () => choose(item)
        }))
      ]),
      h("article", { className: "react-manuscript-window", key: "main" }, selected ? [
        h("span", { className: "eyebrow", key: "axis" }, activeAxis.label),
        h("h2", { key: "title" }, title(selected)),
        h("p", { key: "body" }, body(selected)),
        h("div", { className: "react-argument-grid", key: "grid" }, [
          h(C.DataPanel, { key: "a", title: "Transformations", items: selected.transformations || selected.applications || selected.bestFor || [] }),
          h(C.DataPanel, { key: "b", title: "Conditions or Properties", items: selected.conditions || selected.properties || [] }),
          h(C.DataPanel, { key: "c", title: "Mechanism or Evidence", items: [selected.mechanism || selected.evidenceLevel || selected.rateLaw || selected.evidenceNote || "Evidence note not supplied."] }),
          h(C.DataPanel, { key: "d", title: "Traps and Limitations", items: selected.traps || selected.limitations || [] })
        ])
      ] : null),
      h("aside", { className: "react-side-stack", key: "side" }, h("section", { className: "react-data-panel" }, [
        h("span", { className: "eyebrow", key: "eyebrow" }, "json source"),
        h("h3", { key: "title" }, "Active Dataset"),
        h("div", { className: "react-ledger", key: "rows" }, axes.map((item) => h("div", { key: item.id }, [
          h("span", { key: "label" }, item.label),
          h("strong", { key: "count" }, item.rows.length)
        ])))
      ]))
    ]);
  }

  C.MoleculeExplorer = MoleculeExplorer;
}());
