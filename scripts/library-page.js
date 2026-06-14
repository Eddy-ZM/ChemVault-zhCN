(function () {
  const data = window.CHEMVAULT_DATA;

  document.addEventListener("DOMContentLoaded", () => {
    if (!data) return;
    populateSourceFilters();
    applyDeepLink();
    renderLibrary();
    $("#librarySearch").addEventListener("input", renderLibrary);
    $("#libraryFamily").addEventListener("change", renderLibrary);
  });

  function populateSourceFilters() {
    const families = [...new Set(data.sources.map((item) => item.family))].sort();
    $("#libraryFamily").innerHTML = `<option value="all">All families</option>${families.map((item) => `<option>${escapeHTML(item)}</option>`).join("")}`;
  }

  function renderLibrary() {
    const query = normalise($("#librarySearch").value);
    const family = $("#libraryFamily").value;
    const sources = data.sources.filter((source) => {
      const text = normalise([source.title, source.short, source.family, source.note, source.reliability].join(" "));
      return (!query || text.includes(query)) && (family === "all" || source.family === family);
    });
    const concepts = data.concepts.filter((concept) => {
      const text = normalise([concept.term, concept.family, concept.equation, concept.definition, concept.academicUse].join(" "));
      return !query || text.includes(query);
    });
    $("#sourceBrowser").innerHTML = sources.map((source) => `
      <a class="source-browser-card" href="${escapeHTML(source.url)}" target="_blank" rel="noreferrer">
        <span>${escapeHTML(source.family)}</span>
        <h3>${escapeHTML(source.short)}</h3>
        <p>${escapeHTML(source.note)}</p>
        <strong>${escapeHTML(source.reliability)}</strong>
      </a>
    `).join("") || `<div class="empty-state">No source matches.</div>`;
    $("#conceptBrowser").innerHTML = concepts.map((concept) => `
      <article class="data-window">
        <span class="tag">${escapeHTML(concept.family)}</span>
        <h3>${escapeHTML(concept.term)}</h3>
        <code>${escapeHTML(concept.equation)}</code>
        <p>${escapeHTML(concept.definition)}</p>
      </article>
    `).join("") || `<div class="empty-state">No concept matches.</div>`;
  }

  function normalise(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9.+-]/g, "");
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function $(selector) {
    return document.querySelector(selector);
  }

  function applyDeepLink() {
    const params = new URLSearchParams(location.search);
    const query = params.get("q");
    const family = params.get("family");
    if (query) $("#librarySearch").value = query;
    if (family) $("#libraryFamily").value = family;
  }
}());
