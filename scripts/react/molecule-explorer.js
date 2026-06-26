(function () {
  const h = React.createElement;
  const C = window.ChemVaultReact;
  const asArray = (value) => Array.isArray(value) ? value : [];
  const asObject = (value) => (value && typeof value === "object" ? value : {});
  const asString = (value) => String(value || "").toLowerCase();

  function lower(value) {
    return asString(value);
  }

  function MoleculeExplorer({ payload, query, onSelect }) {
    const [axis, setAxis] = React.useState("reagents");
    const [selectedKey, setSelectedKey] = React.useState("");
    const chem = asObject(payload?.chem);
    const materials = asObject(payload?.materials);
    const axes = [
      { id: "reagents", label: "Reagents", rows: asArray(chem.reagents) },
      { id: "compounds", label: "Compounds", rows: asArray(chem.compounds) },
      { id: "materials", label: "Materials", rows: asArray(materials.materials) },
      { id: "mechanisms", label: "Mechanisms", rows: asArray(chem.mechanisms) }
    ];
    const activeAxis = axes.find((item) => item.id === axis) || axes[0];
    const rows = asArray(activeAxis.rows).filter((rawItem) => {
      const item = asObject(rawItem);
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
        ...asArray(item.tags),
        ...asArray(item.applications),
        ...asArray(item.properties),
        ...asArray(item.characterization),
        ...asArray(item.bestFor)
      ].join(" "));
      return !query || text.includes(lower(query));
    }).slice(0, 80);
    const selected = rows.find((item) => rowKey(item) === selectedKey) || rows[0] || null;

    React.useEffect(() => {
      if (!rows.some((item) => rowKey(item) === selectedKey)) setSelectedKey(rows[0] ? rowKey(rows[0]) : "");
    }, [query, axis, rows.length]);

    function rowKey(item) {
      const safe = asObject(item);
      return safe.id || safe.name || safe.term || safe.formula || "";
    }

    function title(item) {
      const safe = asObject(item);
      return safe.name || safe.term || safe.title || safe.formula || "Untitled record";
    }

    function eyebrow(item) {
      const safe = asObject(item);
      return safe.category || safe.family || safe.className || (activeAxis ? activeAxis.label : "Record");
    }

    function body(item) {
      const safe = asObject(item);
      return safe.focus || safe.summary || safe.synthesis || safe.mechanism || safe.definition || "";
    }

    function tags(item) {
      const safe = asObject(item);
      return [safe.formula, ...asArray(safe.tags), ...asArray(safe.applications), ...asArray(safe.bestFor)].filter(Boolean);
    }

    function choose(item) {
      setSelectedKey(rowKey(item));
      const safe = asObject(item);
      onSelect({
        id: rowKey(item),
        type: (activeAxis.label || "").replace(/s$/, ""),
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
          meta: asObject(item).formula || asObject(item).cas || asObject(item).risk || "",
          tags: tags(item),
          onSelect: () => choose(item)
        }))
      ]),
      h("article", { className: "react-manuscript-window", key: "main" }, selected ? [
        h("span", { className: "eyebrow", key: "axis" }, activeAxis.label),
        h("h2", { key: "title" }, title(selected)),
        h("p", { key: "body" }, body(selected)),
        h("div", { className: "react-argument-grid", key: "grid" }, [
          h(C.DataPanel, { key: "a", title: "Transformations", items: asArray(selected?.transformations || selected?.applications || selected?.bestFor) }),
          h(C.DataPanel, { key: "b", title: "Conditions or Properties", items: asArray(selected?.conditions || selected?.properties) }),
          h(C.DataPanel, { key: "c", title: "Mechanism or Evidence", items: [asObject(selected).mechanism || asObject(selected).evidenceLevel || asObject(selected).rateLaw || asObject(selected).evidenceNote || "Evidence note not supplied."] }),
          h(C.DataPanel, { key: "d", title: "Traps and Limitations", items: asArray(selected?.traps || selected?.limitations) })
        ])
      ] : null),
      h("aside", { className: "react-side-stack", key: "side" }, h("section", { className: "react-data-panel" }, [
        h("span", { className: "eyebrow", key: "eyebrow" }, "json source"),
        h("h3", { key: "title" }, "Active Dataset"),
        h("div", { className: "react-ledger", key: "rows" }, axes.map((item) => h("div", { key: item.id }, [
          h("span", { key: "label" }, item.label),
          h("strong", { key: "count" }, asArray(item.rows).length)
        ])))
      ]))
    ]);
  }

  C.MoleculeExplorer = MoleculeExplorer;
}());
