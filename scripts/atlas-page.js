(function () {
  const data = window.CHEMVAULT_DATA;
  let selected = null;

  document.addEventListener("DOMContentLoaded", () => {
    if (!data) return;
    renderAtlasList();
    selectMechanism(new URLSearchParams(location.search).get("id") || data.mechanisms[0].id);
    drawGraph();
  });

  function renderAtlasList() {
    $("#atlasList").innerHTML = data.mechanisms.map((item) => `
      <button class="list-button${item.id === selected ? " active" : ""}" type="button" data-id="${item.id}">
        <span>${escapeHTML(item.className)}</span>
        <strong>${escapeHTML(item.name)}</strong>
      </button>
    `).join("");
    document.querySelectorAll("#atlasList [data-id]").forEach((button) => {
      button.addEventListener("click", () => selectMechanism(button.dataset.id));
    });
  }

  function selectMechanism(id) {
    const item = data.mechanisms.find((mechanism) => mechanism.id === id);
    if (!item) return;
    selected = id;
    updateQueryParam("id", id);
    $("#atlasDetail").innerHTML = `
      <section class="data-window">
        <span class="tag">${escapeHTML(item.className)}</span>
        <h2>${escapeHTML(item.name)}</h2>
        <p>${escapeHTML(item.summary)}</p>
      </section>
      <section class="data-window">
        <h3>Academic descriptors</h3>
        <div class="micro-table">
          <div class="micro-row"><span>Rate law</span><strong>${escapeHTML(item.rateLaw)}</strong></div>
          <div class="micro-row"><span>Stereochemistry</span><strong>${escapeHTML(item.stereo)}</strong></div>
          <div class="micro-row"><span>Best fit</span><strong>${escapeHTML(item.bestFor.join("; "))}</strong></div>
        </div>
      </section>
      <section class="data-window">
        <h3>Mechanistic sequence</h3>
        <ol class="detail-list">${item.steps.map((step) => `<li>${escapeHTML(step)}</li>`).join("")}</ol>
      </section>
      <section class="data-window">
        <h3>Critical cautions</h3>
        <ul class="detail-list">${item.traps.map((trap) => `<li>${escapeHTML(trap)}</li>`).join("")}</ul>
      </section>
    `;
    renderAtlasList();
    drawGraph();
  }

  function drawGraph() {
    const canvas = $("#mechanismGraph");
    const ctx = canvas.getContext("2d");
    const nodes = data.mechanisms.map((item, index) => ({
      id: item.id,
      label: item.name.split(" ")[0],
      x: 120 + (index % 3) * 210,
      y: 120 + Math.floor(index / 3) * 180
    }));
    const edges = [
      ["sn1", "e2"], ["sn2", "e2"], ["carbonyl-addition", "grignard-addition"], ["eas", "grignard-addition"], ["sn1", "carbonyl-addition"]
    ];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(232,188,85,0.45)";
    ctx.lineWidth = 2;
    edges.forEach(([a, b]) => {
      const from = nodes.find((node) => node.id === a);
      const to = nodes.find((node) => node.id === b);
      if (!from || !to) return;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });
    nodes.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.id === selected ? 46 : 38, 0, Math.PI * 2);
      ctx.fillStyle = node.id === selected ? "#e8bc55" : "#52c7b8";
      ctx.fill();
      ctx.fillStyle = "#0b0c0d";
      ctx.font = "800 14px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.label, node.x, node.y);
    });
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

  document.addEventListener("click", (event) => {
    const canvas = $("#mechanismGraph");
    if (!canvas || event.target !== canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    const nodes = data.mechanisms.map((item, index) => ({
      id: item.id,
      x: 120 + (index % 3) * 210,
      y: 120 + Math.floor(index / 3) * 180
    }));
    const hit = nodes.find((node) => Math.hypot(node.x - x, node.y - y) < 50);
    if (hit) selectMechanism(hit.id);
  });

  function updateQueryParam(key, value) {
    const url = new URL(location.href);
    url.searchParams.set(key, value);
    history.replaceState(null, "", url);
  }
}());
