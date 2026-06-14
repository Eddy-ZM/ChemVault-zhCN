import fs from "node:fs";
import vm from "node:vm";

const SITE_ORIGIN = process.env.CHEMVAULT_SITE_ORIGIN || "https://chemvault.pages.dev";
const INDEX_PATH = "/data/public-record-index.json";

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

const records = api.buildRecords({ includeImported: false }).map((record) => publicRecord(record, api));
const counts = records.reduce((memo, record) => {
  memo.byType[record.type] = (memo.byType[record.type] || 0) + 1;
  memo.totalRecords += 1;
  return memo;
}, { totalRecords: 0, byType: {} });

const payload = {
  kind: "ChemVaultPublicRecordIndex",
  version: api.version || "unknown",
  generatedAt: new Date().toISOString(),
  site: {
    name: "ChemVault",
    origin: SITE_ORIGIN,
    href: absoluteUrl(INDEX_PATH),
    searchPage: absoluteUrl("/pages/search.html")
  },
  counts,
  searchExamples: [
    "ketone to alcohol",
    "NaBH4 reduction",
    "LiAlH4 hydride",
    "Meerwein-Ponndorf-Verley reduction",
    "H2/Pd hydrogenation"
  ],
  records
};

fs.writeFileSync("data/public-record-index.json", `${JSON.stringify(payload)}\n`);

console.log(JSON.stringify({
  output: "data/public-record-index.json",
  records: records.length,
  types: Object.keys(counts.byType).length,
  bytes: fs.statSync("data/public-record-index.json").size
}, null, 2));

function publicRecord(record, api) {
  const type = record.type || "record";
  const id = String(record.id || slug(record.title));
  const sourcePath = record.sourceHref || api.recordUrl(type, id);
  const sections = (record.sections || [])
    .map((section) => ({
      title: section.title || "",
      items: (section.items || []).map((item) => String(item || "").trim()).filter(Boolean)
    }))
    .filter((section) => section.title || section.items.length);

  const payload = {
    id,
    type,
    typeLabel: record.typeLabel || type,
    title: record.title || id,
    subtitle: record.subtitle || "",
    summary: record.body || "",
    formula: record.formula || "",
    domain: record.domain || "",
    family: record.family || "",
    risk: record.risk || "",
    maturity: Number(record.maturity || 0),
    tags: record.tags || [],
    hazardLevel: record.hazardLevel || "",
    signalWord: record.signalWord || "",
    hazardStatements: record.hazardStatements || [],
    disposalMethod: record.disposalMethod || "",
    safetySource: record.safetySource || "",
    sections,
    url: absoluteUrl(`/pages/record.html?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`),
    searchText: record.searchText || compact([
      type,
      record.typeLabel,
      record.title,
      record.subtitle,
      record.body,
      record.formula,
      record.domain,
      record.family,
      ...(record.tags || []),
      ...sections.flatMap((section) => [section.title, ...section.items])
    ].filter(Boolean).join(" "))
  };
  if (/^https?:\/\//i.test(String(sourcePath || ""))) {
    payload.sourceUrl = absoluteUrl(sourcePath);
  }
  return pruneEmpty(payload);
}

function absoluteUrl(path) {
  const value = String(path || "");
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return new URL(value, SITE_ORIGIN).href;
  if (/^[^/?#]+\.html(?:[?#].*)?$/i.test(value)) return new URL(`/pages/${value}`, SITE_ORIGIN).href;
  return new URL(value, SITE_ORIGIN).href;
}

function slug(value) {
  return String(value || "record").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function compact(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9.+-]/g, " ").replace(/\s+/g, " ").trim();
}

function pruneEmpty(value) {
  if (Array.isArray(value)) {
    const items = value.map(pruneEmpty).filter((item) => {
      if (item === "" || item === null || item === undefined) return false;
      if (Array.isArray(item)) return item.length > 0;
      if (typeof item === "object") return Object.keys(item).length > 0;
      return true;
    });
    return items;
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .map(([key, item]) => [key, pruneEmpty(item)])
    .filter(([key, item]) => {
      if (key === "maturity" && item === 0) return false;
      if (item === "" || item === null || item === undefined) return false;
      if (Array.isArray(item)) return item.length > 0;
      if (typeof item === "object") return Object.keys(item).length > 0;
      return true;
    }));
}
