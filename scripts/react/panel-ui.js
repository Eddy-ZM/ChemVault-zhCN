(function () {
  const h = React.createElement;
  window.ChemVaultReact = window.ChemVaultReact || {};

  function tagList(tags) {
    const rows = (tags || []).filter(Boolean).slice(0, 6);
    if (!rows.length) return null;
    return h("div", { className: "tag-row" }, rows.map((tag) => h("span", { className: "tag", key: tag }, tag)));
  }

  function PanelCard({ eyebrow, title, body, meta, tags, active, onSelect }) {
    return h("button", {
      type: "button",
      className: `react-panel-card${active ? " active" : ""}`,
      onClick: onSelect
    }, [
      eyebrow ? h("span", { className: "eyebrow", key: "eyebrow" }, eyebrow) : null,
      h("strong", { key: "title" }, title),
      meta ? h("small", { key: "meta" }, meta) : null,
      body ? h("p", { key: "body" }, body) : null,
      h(React.Fragment, { key: "tags" }, tagList(tags))
    ]);
  }

  function MetricStrip({ metrics }) {
    return h("div", { className: "react-metric-strip" }, metrics.map((metric) => h("div", { key: metric.label }, [
      h("span", { key: "label" }, metric.label),
      h("strong", { key: "value" }, metric.value),
      h("small", { key: "note" }, metric.note)
    ])));
  }

  function DataPanel({ title, items, empty }) {
    const rows = (items || []).filter(Boolean);
    return h("section", { className: "react-data-panel" }, [
      h("h3", { key: "title" }, title),
      rows.length
        ? h("ul", { key: "list" }, rows.map((item) => h("li", { key: item }, item)))
        : h("p", { className: "muted", key: "empty" }, empty || "No records available.")
    ]);
  }

  function RecordInspector({ record }) {
    if (!record) {
      return h("section", { className: "react-inspector" }, h("div", { className: "empty-state" }, [
        h("span", { className: "eyebrow", key: "eyebrow" }, "selection"),
        h("h3", { key: "title" }, "No active record"),
        h("p", { key: "body" }, "Select a case, dossier, reaction system or molecule record from the component views.")
      ]));
    }
    return h("section", { className: "react-inspector" }, [
      h("span", { className: "eyebrow", key: "type" }, record.type),
      h("h3", { key: "title" }, record.title),
      h("p", { key: "body" }, record.body),
      h(React.Fragment, { key: "tags" }, tagList(record.tags))
    ]);
  }

  window.ChemVaultReact.PanelCard = PanelCard;
  window.ChemVaultReact.MetricStrip = MetricStrip;
  window.ChemVaultReact.DataPanel = DataPanel;
  window.ChemVaultReact.RecordInspector = RecordInspector;
  window.ChemVaultReact.tagList = tagList;
}());
