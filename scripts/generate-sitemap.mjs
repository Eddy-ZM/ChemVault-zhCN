import fs from "node:fs";
import vm from "node:vm";

const SITE_ORIGIN = process.env.CHEMVAULT_SITE_ORIGIN || "https://chemvault-zh.pages.dev";
const LASTMOD = "2026-06-26";

const dataFiles = [
  "data/chem-data.js",
  "data/reagent-extension.js",
  "data/research-data.js",
  "data/dossier-data.js",
  "data/method-data.js",
  "data/spectroscopy-data.js",
  "data/materials-data.js",
  "data/database-expansion.js",
  "data/reagent-megalibrary.js",
  "data/knowledge-expansion.js",
  "data/local-catalog-10000.js",
  "data/external-sources.js",
  "scripts/record-utils.js"
];

const staticUrls = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/pages/app.html", priority: "0.9", changefreq: "weekly" },
  { path: "/pages/workbench.html", priority: "0.9", changefreq: "weekly" },
  { path: "/pages/search.html", priority: "0.9", changefreq: "weekly" },
  { path: "/compounds", priority: "0.9", changefreq: "weekly" },
  { path: "/pages/research.html", priority: "0.8", changefreq: "monthly" },
  { path: "/pages/platform.html", priority: "0.8", changefreq: "monthly" },
  { path: "/pages/projects.html", priority: "0.8", changefreq: "monthly" },
  { path: "/pages/notes.html", priority: "0.7", changefreq: "monthly" },
  { path: "/pages/dossiers.html", priority: "0.8", changefreq: "monthly" },
  { path: "/pages/methods.html", priority: "0.8", changefreq: "monthly" },
  { path: "/pages/spectroscopy.html", priority: "0.8", changefreq: "monthly" },
  { path: "/pages/materials.html", priority: "0.8", changefreq: "monthly" },
  { path: "/pages/reagents.html", priority: "0.8", changefreq: "monthly" },
  { path: "/pages/atlas.html", priority: "0.7", changefreq: "monthly" },
  { path: "/pages/library.html", priority: "0.7", changefreq: "monthly" },
  { path: "/pages/about.html", priority: "0.5", changefreq: "monthly" },
  { path: "/pages/filing.html", priority: "0.5", changefreq: "monthly" },
  { path: "/pages/team.html", priority: "0.5", changefreq: "monthly" },
  { path: "/pages/developer.html", priority: "0.5", changefreq: "monthly" },
  { path: "/pages/contact.html", priority: "0.5", changefreq: "monthly" },
  { path: "/pages/public-data.html", priority: "0.6", changefreq: "weekly" },
  { path: "/pages/sitemap.html", priority: "0.4", changefreq: "monthly" },
  { path: "/data/public-record-index.json", priority: "0.6", changefreq: "weekly" }
];

const context = {
  window: {},
  location: { pathname: "/pages/search.html" },
  localStorage: {
    getItem() {
      return "[]";
    }
  },
  encodeURIComponent,
  console
};

context.globalThis = context.window;
context.window.location = context.location;
context.window.localStorage = context.localStorage;
vm.createContext(context);

for (const file of dataFiles) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
}

const api = context.window.CHEMVAULT_RECORDS;
if (!api?.buildRecords) {
  throw new Error("CHEMVAULT_RECORDS.buildRecords was not available.");
}

const seen = new Set();
const recordUrls = api.buildRecords({ includeImported: false })
  .filter((record) => {
    const key = `${record.type}:${record.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })
  .map((record) => ({
    path: `/pages/record.html?type=${encodeURIComponent(record.type)}&id=${encodeURIComponent(record.id)}`,
    priority: record.type === "compound" || record.type === "reagent" ? "0.6" : "0.5",
    changefreq: "monthly"
  }));

const urls = [...staticUrls, ...recordUrls];
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((url) => `  <url>
    <loc>${xmlEscape(`${SITE_ORIGIN}${url.path}`)}</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`),
  "</urlset>"
].join("\n");

fs.writeFileSync("sitemap.xml", `${xml}\n`);

console.log(JSON.stringify({
  origin: SITE_ORIGIN,
  urls: urls.length,
  staticUrls: staticUrls.length,
  recordUrls: recordUrls.length,
  lastmod: LASTMOD
}, null, 2));

function xmlEscape(value) {
  return String(value).replace(/[<>&'"]/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    "\"": "&quot;"
  }[char]));
}
