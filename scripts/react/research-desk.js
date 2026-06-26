(function () {
  const h = React.createElement;
  const C = window.ChemVaultReact;
  const asArray = (value) => Array.isArray(value) ? value : [];
  const asObject = (value) => (value && typeof value === "object" ? value : {});
  const asString = (value) => String(value ?? "").toLowerCase();

  function hasQuery(value, query) {
    if (!query) return true;
    return asString(value).includes(asString(query));
  }

  function ResearchDesk({ payload, query, onSelect }) {
    const research = asObject(payload?.research);
    const cases = asArray(research.caseStudies).filter((rawItem) => {
      const item = asObject(rawItem);
      const observations = asArray(item.observations).flatMap((rawObservation) => {
        const observation = asObject(rawObservation);
        return [observation.type, observation.observation, observation.inference];
      });
      const text = [
        item.title,
        item.discipline,
        item.question,
        item.thesis,
        ...observations
      ].join(" ");
      return hasQuery(text, query);
    });
    const protocols = asArray(asObject(payload?.methods).protocols).filter((rawItem) => {
      const item = asObject(rawItem);
      const text = [
        item.title,
        item.domain,
        item.summary,
        ...asArray(item.inputs),
        ...asArray(item.outputs)
      ].join(" ");
      return hasQuery(text, query);
    }).slice(0, 5);
    const selected = cases[0] || null;

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
          eyebrow: item.discipline || "Research",
          title: item.title || "Unnamed case",
          body: item.question || "No question supplied.",
          meta: `${item.confidence || 0}% confidence`,
          tags: asArray(item.sourceRefs),
          onSelect: () => onSelect({
            id: item.id,
            type: "Research case",
            title: item.title || "Unnamed case",
            body: item.question || "",
            tags: [item.discipline || "Research", `${item.confidence || 0}% confidence`]
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
        h("h2", { key: "title" }, selected.title || "Research case"),
        h("p", { key: "thesis" }, selected.thesis || ""),
        h("div", { className: "react-evidence-grid", key: "evidence" }, asArray(selected.observations).slice(0, 4).map((rawObservation, index) => {
          const observation = asObject(rawObservation);
          return h("section", { className: "react-data-panel", key: `${observation.type || "obs"}-${observation.observation || index}` }, [
            h("span", { className: "eyebrow", key: "type" }, `${observation.type || "Observation"} · grade ${observation.level || "n/a"}`),
            h("h3", { key: "obs" }, observation.observation || "No observation text."),
            h("p", { key: "inf" }, observation.inference || ""),
            h("small", { key: "lim" }, observation.limitation || "")
          ]);
        })),
        h("div", { className: "react-argument-grid", key: "argument" }, [
          h(C.DataPanel, { key: "claim", title: "Claim", items: [selected.argument?.claim] }),
          h(C.DataPanel, { key: "counter", title: "Counterargument", items: [selected.argument?.counter] }),
          h(C.DataPanel, { key: "next", title: "Next validation", items: [selected.argument?.nextTest] })
        ])
      ] : null),
      h("aside", { className: "react-side-stack", key: "side" }, h("section", { className: "react-data-panel" }, [
        h("span", { className: "eyebrow", key: "eyebrow" }, "methods component"),
        h("h3", { key: "title" }, "Linked Protocols"),
        ...protocols.map((method, index) => h("article", { className: "react-mini-record", key: method.id || method.title || method.domain || `protocol-${index}` }, [
          h("strong", { key: "title" }, method.title || "Protocol"),
          h("p", { key: "summary" }, method.summary || "")
        ]))
      ]))
    ]);
  }

  C.ResearchDesk = ResearchDesk;
}());
