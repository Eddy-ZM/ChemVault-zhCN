(function () {
  const h = React.createElement;
  const C = window.ChemVaultReact;

  function PanelShowcase({ payload, query, selectedRecord }) {
    const term = String(query || "").toLowerCase();
    const cards = [
      ...(payload.chem?.reactionSystems || []).map((item) => ({ type: "Reaction", title: item.name, body: item.className, tags: [item.domain] })),
      ...(payload.research?.caseStudies || []).map((item) => ({ type: "Research", title: item.title, body: item.question, tags: [item.discipline] })),
      ...(payload.dossiers?.dossiers || []).map((item) => ({ type: "Dossier", title: item.title, body: item.abstract, tags: item.keywords || [] })),
      ...(payload.materials?.materials || []).map((item) => ({ type: "Material", title: item.name, body: item.synthesis, tags: [item.family] }))
    ].filter((item) => !term || `${item.type} ${item.title} ${item.body} ${item.tags.join(" ")}`.toLowerCase().includes(term)).slice(0, 12);
    const queue = payload.workbench?.evidenceQueue || [];
    const sources = payload.external?.sources || [];

    return h("section", { className: "react-view-grid" }, [
      h("div", { className: "react-record-column", key: "list" }, [
        h("div", { className: "react-section-head", key: "head" }, [
          h("div", { key: "copy" }, [
            h("span", { className: "eyebrow", key: "eyebrow" }, "component · panel ui"),
            h("h2", { key: "title" }, "Panel UI System")
          ]),
          h("strong", { key: "count" }, `${cards.length} panels`)
        ]),
        ...cards.map((item) => h(C.PanelCard, {
          key: `${item.type}-${item.title}`,
          eyebrow: item.type,
          title: item.title,
          body: item.body,
          tags: item.tags
        }))
      ]),
      h("article", { className: "react-manuscript-window", key: "main" }, [
        h("span", { className: "eyebrow", key: "eyebrow" }, "reusable inspector"),
        h("h2", { key: "title" }, "Selected Record Panel"),
        h(C.RecordInspector, { record: selectedRecord, key: "inspector" }),
        h("div", { className: "react-argument-grid", key: "queue" }, queue.map((item) => h("section", { className: "react-data-panel", key: item.id }, [
          h("span", { className: "eyebrow", key: "eyebrow" }, `${item.domain} · ${item.severity}`),
          h("h3", { key: "title" }, item.title),
          h("p", { key: "body" }, item.action)
        ])))
      ]),
      h("aside", { className: "react-side-stack", key: "side" }, h("section", { className: "react-data-panel" }, [
        h("span", { className: "eyebrow", key: "eyebrow" }, "external source panels"),
        h("h3", { key: "title" }, "Academic Handoff"),
        ...sources.map((source) => h("article", { className: "react-mini-record", key: source.id }, [
          h("strong", { key: "name" }, source.name),
          h("p", { key: "scope" }, source.bestFor || source.scope)
        ]))
      ]))
    ]);
  }

  C.PanelShowcase = PanelShowcase;
}());
