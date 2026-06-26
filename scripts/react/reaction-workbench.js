(function () {
  const h = React.createElement;
  const C = window.ChemVaultReact;
  const asArray = (value) => Array.isArray(value) ? value : [];
  const asString = (value) => String(value || "").toLowerCase();
  const asObject = (value) => (value && typeof value === "object" ? value : {});

  function lower(value) {
    return asString(value);
  }

  function ReactionWorkbench({ payload, query, domain, onSelect }) {
    const [selectedId, setSelectedId] = React.useState("");
    const chem = asObject(payload?.chem);
    const systems = asArray(chem.reactionSystems).filter((item) => {
      const safe = asObject(item);
      const text = lower([
        safe.name,
        safe.className,
        safe.domain,
        ...asArray(safe.conditions),
        ...asArray(safe.readouts),
        ...asArray(safe.limitations),
        ...asArray(safe.nextQuestions)
      ].join(" "));
      return (!query || text.includes(lower(query))) && (domain === "all" || safe.domain === domain);
    });
    const selected = systems.find((item) => item && item.id === selectedId) || systems[0] || null;
    const mechanisms = new Map(asArray(chem.mechanisms).map((item) => {
      const safe = asObject(item);
      return [(safe.id || safe.term || safe.name), safe];
    }));
    const reagents = new Map(asArray(chem.reagents).map((item) => {
      const safe = asObject(item);
      return [(safe.id || safe.term || safe.name), safe];
    }));
    const reactants = new Map(asArray(chem.reactants).map((item) => {
      const safe = asObject(item);
      return [(safe.id || safe.term || safe.name), safe];
    }));
    const relatedRoutes = selected ? asArray(chem.routes).filter((route) => {
      const safeRoute = asObject(route);
      const routeText = lower([
        safeRoute.start,
        safeRoute.target,
        safeRoute.note,
        ...asArray(safeRoute.route)
      ].join(" "));
      const tokens = [selected.name, selected.className, ...asArray(selected.substrates)];
      return tokens.some((token) => routeText.includes(lower(token).slice(0, 8)));
    }).slice(0, 5) : [];

    React.useEffect(() => {
      if (!systems.some((item) => item.id === selectedId)) setSelectedId(systems[0]?.id || "");
    }, [query, domain, systems.length]);

    function nameFrom(map, id) {
      return asObject(map.get(id)).name || String(id || "").replaceAll("-", " ");
    }

    function choose(item) {
      if (!item || !item.id) return;
      setSelectedId(item.id);
      onSelect({
        id: item.id,
        type: "Reaction system",
        title: item.name || "Unnamed system",
        body: item.className || "",
        tags: [item.domain, `${item.maturity || 0}% maturity`]
      });
    }

    return h("section", { className: "react-view-grid" }, [
      h("div", { className: "react-record-column", key: "list" }, [
        h("div", { className: "react-section-head", key: "head" }, [
          h("div", { key: "copy" }, [
            h("span", { className: "eyebrow", key: "eyebrow" }, "component · reaction workbench"),
            h("h2", { key: "title" }, "Reaction Matrix")
          ]),
          h("strong", { key: "count" }, `${systems.length} systems`)
        ]),
        ...systems.map((item, index) => h(C.PanelCard, {
          key: item?.id || `system-${index}`,
          active: selected?.id === item?.id,
          eyebrow: item?.domain || "Reaction system",
          title: item?.name || "Unnamed system",
          body: item?.className || "",
          meta: `${item?.maturity || 0}% maturity`,
          tags: asArray(item?.conditions),
          onSelect: () => choose(item)
        }))
      ]),
      h("article", { className: "react-manuscript-window", key: "main" }, selected ? [
        h("header", { className: "react-record-header", key: "header" }, [
          h("div", { key: "copy" }, [
            h("span", { className: "eyebrow", key: "eyebrow" }, selected.domain || "Reaction system"),
            h("h2", { key: "title" }, selected.name || "Unnamed system"),
            h("p", { key: "class" }, selected.className || "")
          ]),
          h("div", { className: "react-score-ring", style: { "--value": `${selected.maturity || 0}%` }, key: "score" }, [
            h("span", { key: "ring" }),
            h("strong", { key: "value" }, `${selected.maturity || 0}%`),
            h("small", { key: "label" }, "maturity")
          ])
        ]),
        h("div", { className: "react-network", key: "network" }, [
          h("div", { className: "react-network-core", key: "core" }, selected.name || "Reaction system"),
          ...asArray(selected.substrates).map((id) => h("button", { type: "button", key: `s-${id}` }, nameFrom(reactants, id))),
          ...asArray(selected.reagents).map((id) => h("button", { type: "button", key: `r-${id}` }, nameFrom(reagents, id))),
          ...asArray(selected.mechanisms).map((id) => h("button", { type: "button", key: `m-${id}` }, nameFrom(mechanisms, id)))
        ]),
        h("div", { className: "react-argument-grid", key: "panels" }, [
          h(C.DataPanel, { key: "conditions", title: "Conditions", items: asArray(selected.conditions) }),
          h(C.DataPanel, { key: "readouts", title: "Readouts", items: asArray(selected.readouts) }),
          h(C.DataPanel, { key: "limitations", title: "Limitations", items: asArray(selected.limitations) }),
          h(C.DataPanel, { key: "questions", title: "Research Questions", items: asArray(selected.nextQuestions) })
        ])
      ] : h("div", { className: "empty-state" }, "No reaction system matches.")),
      h("aside", { className: "react-side-stack", key: "side" }, h("section", { className: "react-data-panel", key: "source" }, [
        h("span", { className: "eyebrow", key: "eyebrow" }, "route component"),
        h("h3", { key: "title" }, "Linked Routes"),
        ...relatedRoutes.map((route, index) => h("article", { className: "react-mini-record", key: route?.id || `route-${index}` }, [
          h("strong", { key: "title" }, `${route?.start || ""} -> ${route?.target || ""}`.trim()),
          h("p", { key: "note" }, route?.note || "No route note.")
        ])),
        relatedRoutes.length ? null : h("p", { className: "muted", key: "empty" }, "No linked route in this filtered view.")
      ]))
    ]);
  }

  C.ReactionWorkbench = ReactionWorkbench;
}());
