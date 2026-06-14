(function () {
  const h = React.createElement;
  const C = window.ChemVaultReact;

  function lower(value) {
    return String(value || "").toLowerCase();
  }

  function ReactionWorkbench({ payload, query, domain, onSelect }) {
    const [selectedId, setSelectedId] = React.useState("");
    const systems = (payload.chem?.reactionSystems || []).filter((item) => {
      const text = lower([
        item.name,
        item.className,
        item.domain,
        ...(item.conditions || []),
        ...(item.readouts || []),
        ...(item.limitations || []),
        ...(item.nextQuestions || [])
      ].join(" "));
      return (!query || text.includes(lower(query))) && (domain === "all" || item.domain === domain);
    });
    const selected = systems.find((item) => item.id === selectedId) || systems[0];
    const mechanisms = new Map((payload.chem?.mechanisms || []).map((item) => [item.id, item]));
    const reagents = new Map((payload.chem?.reagents || []).map((item) => [item.id, item]));
    const reactants = new Map((payload.chem?.reactants || []).map((item) => [item.id, item]));
    const relatedRoutes = selected ? (payload.chem?.routes || []).filter((route) => {
      const routeText = lower([route.start, route.target, route.note, ...(route.route || [])].join(" "));
      return [selected.name, selected.className, ...(selected.substrates || [])].some((token) => routeText.includes(lower(token).slice(0, 8)));
    }).slice(0, 5) : [];

    React.useEffect(() => {
      if (!systems.some((item) => item.id === selectedId)) setSelectedId(systems[0]?.id || "");
    }, [query, domain, systems.length]);

    function nameFrom(map, id) {
      return map.get(id)?.name || String(id).replaceAll("-", " ");
    }

    function choose(item) {
      setSelectedId(item.id);
      onSelect({
        id: item.id,
        type: "Reaction system",
        title: item.name,
        body: item.className,
        tags: [item.domain, `${item.maturity}% maturity`]
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
        ...systems.map((item) => h(C.PanelCard, {
          key: item.id,
          active: selected?.id === item.id,
          eyebrow: item.domain,
          title: item.name,
          body: item.className,
          meta: `${item.maturity}% maturity`,
          tags: item.conditions || [],
          onSelect: () => choose(item)
        }))
      ]),
      h("article", { className: "react-manuscript-window", key: "main" }, selected ? [
        h("header", { className: "react-record-header", key: "header" }, [
          h("div", { key: "copy" }, [
            h("span", { className: "eyebrow", key: "eyebrow" }, selected.domain),
            h("h2", { key: "title" }, selected.name),
            h("p", { key: "class" }, selected.className)
          ]),
          h("div", { className: "react-score-ring", style: { "--value": `${selected.maturity}%` }, key: "score" }, [
            h("span", { key: "ring" }),
            h("strong", { key: "value" }, `${selected.maturity}%`),
            h("small", { key: "label" }, "maturity")
          ])
        ]),
        h("div", { className: "react-network", key: "network" }, [
          h("div", { className: "react-network-core", key: "core" }, selected.name),
          ...(selected.substrates || []).map((id) => h("button", { type: "button", key: `s-${id}` }, nameFrom(reactants, id))),
          ...(selected.reagents || []).map((id) => h("button", { type: "button", key: `r-${id}` }, nameFrom(reagents, id))),
          ...(selected.mechanisms || []).map((id) => h("button", { type: "button", key: `m-${id}` }, nameFrom(mechanisms, id)))
        ]),
        h("div", { className: "react-argument-grid", key: "panels" }, [
          h(C.DataPanel, { key: "conditions", title: "Conditions", items: selected.conditions || [] }),
          h(C.DataPanel, { key: "readouts", title: "Readouts", items: selected.readouts || [] }),
          h(C.DataPanel, { key: "limitations", title: "Limitations", items: selected.limitations || [] }),
          h(C.DataPanel, { key: "questions", title: "Research Questions", items: selected.nextQuestions || [] })
        ])
      ] : h("div", { className: "empty-state" }, "No reaction system matches.")),
      h("aside", { className: "react-side-stack", key: "side" }, h("section", { className: "react-data-panel" }, [
        h("span", { className: "eyebrow", key: "eyebrow" }, "route component"),
        h("h3", { key: "title" }, "Linked Routes"),
        ...relatedRoutes.map((route) => h("article", { className: "react-mini-record", key: route.id }, [
          h("strong", { key: "title" }, `${route.start} -> ${route.target}`),
          h("p", { key: "note" }, route.note)
        ])),
        relatedRoutes.length ? null : h("p", { className: "muted", key: "empty" }, "No linked route in this filtered view.")
      ]))
    ]);
  }

  C.ReactionWorkbench = ReactionWorkbench;
}());
