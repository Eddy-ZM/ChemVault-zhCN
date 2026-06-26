(function () {
  const h = React.createElement;
  const C = window.ChemVaultReact;
  const asArray = (value) => Array.isArray(value) ? value : [];
  const asObject = (value) => (value && typeof value === "object" ? value : {});
  const asString = (value) => String(value || "").toLowerCase();

  function PanelShowcase({ payload, query, selectedRecord }) {
    const term = asString(query);
    const chem = asObject(payload?.chem);
    const research = asObject(payload?.research);
    const dossiers = asObject(payload?.dossiers);
    const materials = asObject(payload?.materials);
    const cards = [
      ...asArray(chem.reactionSystems).map((item) => {
        const safe = asObject(item);
        return { type: "Reaction", title: safe.name || "Reaction system", body: safe.className || "", tags: [safe.domain || ""] };
      }),
      ...asArray(research.caseStudies).map((item) => {
        const safe = asObject(item);
        return { type: "Research", title: safe.title || "Research case", body: safe.question || "", tags: [safe.discipline || ""] };
      }),
      ...asArray(dossiers.dossiers).map((item) => {
        const safe = asObject(item);
        return { type: "Dossier", title: safe.title || "Dossier", body: safe.abstract || "", tags: asArray(safe.keywords) };
      }),
      ...asArray(materials.materials).map((item) => {
        const safe = asObject(item);
        return { type: "Material", title: safe.name || "Material", body: safe.synthesis || "", tags: [safe.family || ""] };
      })
    ].filter((item) => !term || `${item.type} ${item.title} ${item.body} ${item.tags.join(" ")}`.toLowerCase().includes(term)).slice(0, 12);
    const queue = asArray(payload?.workbench?.evidenceQueue);
    const sources = asArray(payload?.external?.sources);

    return h("section", { className: "react-view-grid" }, [
      h("div", { className: "react-record-column", key: "list" }, [
        h("div", { className: "react-section-head", key: "head" }, [
          h("div", { key: "copy" }, [
            h("span", { className: "eyebrow", key: "eyebrow" }, "component · panel ui"),
            h("h2", { key: "title" }, "Panel UI System")
          ]),
          h("strong", { key: "count" }, `${cards.length} panels`)
        ]),
        ...cards.map((item, index) => h(C.PanelCard, {
          key: `${item.type}-${item.title || `panel-${index}`}`,
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
        h("div", { className: "react-argument-grid", key: "queue" }, queue.map((item, index) => {
          const safe = asObject(item);
          return h("section", { className: "react-data-panel", key: safe.id || `queue-${index}` }, [
            h("span", { className: "eyebrow", key: "eyebrow" }, `${safe.domain || "Domain"} · ${safe.severity || "info"}`),
            h("h3", { key: "title" }, safe.title || "Workbench item"),
            h("p", { key: "body" }, safe.action || "")
          ]);
        }))
      ]),
      h("aside", { className: "react-side-stack", key: "side" }, h("section", { className: "react-data-panel" }, [
        h("span", { className: "eyebrow", key: "eyebrow" }, "external source panels"),
        h("h3", { key: "title" }, "Academic Handoff"),
        ...sources.map((source, index) => {
          const item = asObject(source);
          return h("article", { className: "react-mini-record", key: item.id || `source-${index}` }, [
            h("strong", { key: "name" }, item.name || "External source"),
            h("p", { key: "scope" }, item.bestFor || item.scope || "")
          ]);
        })
      ]))
    ]);
  }

  C.PanelShowcase = PanelShowcase;
}());
