(function () {
  const h = React.createElement;
  const C = window.ChemVaultReact;

  function hasQuery(value, query) {
    if (!query) return true;
    return String(value || "").toLowerCase().includes(query.toLowerCase());
  }

  function ResearchDesk({ payload, query, onSelect }) {
    const cases = (payload.research?.caseStudies || []).filter((item) => hasQuery([
      item.title,
      item.discipline,
      item.question,
      item.thesis,
      ...(item.observations || []).flatMap((observation) => [observation.type, observation.observation, observation.inference])
    ].join(" "), query));
    const protocols = (payload.methods?.protocols || []).filter((item) => hasQuery([
      item.title,
      item.domain,
      item.summary,
      ...(item.inputs || []),
      ...(item.outputs || [])
    ].join(" "), query)).slice(0, 5);
    const selected = cases[0];

    return h("section", { className: "react-view-grid" }, [
      h("div", { className: "react-record-column", key: "list" }, [
        h("div", { className: "react-section-head", key: "head" }, [
          h("div", { key: "copy" }, [
            h("span", { className: "eyebrow", key: "eyebrow" }, "component · research desk"),
            h("h2", { key: "title" }, "Research Desk")
          ]),
          h("strong", { key: "count" }, `${cases.length} cases`)
        ]),
        ...cases.map((item) => h(C.PanelCard, {
          key: item.id,
          eyebrow: item.discipline,
          title: item.title,
          body: item.question,
          meta: `${item.confidence}% confidence`,
          tags: item.sourceRefs || [],
          onSelect: () => onSelect({
            id: item.id,
            type: "Research case",
            title: item.title,
            body: item.question,
            tags: [item.discipline, `${item.confidence}% confidence`]
          })
        })),
        cases.length ? null : h("div", { className: "empty-state", key: "empty" }, [
          h("span", { className: "eyebrow", key: "eyebrow" }, "filter boundary"),
          h("h3", { key: "title" }, "No research case matches"),
          h("p", { key: "body" }, "Broaden the framework search query or switch to all records.")
        ])
      ]),
      h("article", { className: "react-manuscript-window", key: "main" }, selected ? [
        h("span", { className: "eyebrow", key: "eyebrow" }, "argument model"),
        h("h2", { key: "title" }, selected.title),
        h("p", { key: "thesis" }, selected.thesis),
        h("div", { className: "react-evidence-grid", key: "evidence" }, (selected.observations || []).slice(0, 4).map((observation) => h("section", { className: "react-data-panel", key: `${observation.type}-${observation.observation}` }, [
          h("span", { className: "eyebrow", key: "type" }, `${observation.type} · grade ${observation.level}`),
          h("h3", { key: "obs" }, observation.observation),
          h("p", { key: "inf" }, observation.inference),
          h("small", { key: "lim" }, observation.limitation)
        ]))),
        h("div", { className: "react-argument-grid", key: "argument" }, [
          h(C.DataPanel, { key: "claim", title: "Claim", items: [selected.argument?.claim] }),
          h(C.DataPanel, { key: "counter", title: "Counterargument", items: [selected.argument?.counter] }),
          h(C.DataPanel, { key: "next", title: "Next validation", items: [selected.argument?.nextTest] })
        ])
      ] : null),
      h("aside", { className: "react-side-stack", key: "side" }, h("section", { className: "react-data-panel" }, [
        h("span", { className: "eyebrow", key: "eyebrow" }, "methods component"),
        h("h3", { key: "title" }, "Linked Protocols"),
        ...protocols.map((method) => h("article", { className: "react-mini-record", key: method.id }, [
          h("strong", { key: "title" }, method.title),
          h("p", { key: "summary" }, method.summary)
        ]))
      ]))
    ]);
  }

  C.ResearchDesk = ResearchDesk;
}());
