import fs from "node:fs";
import vm from "node:vm";

const files = [
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
  "data/external-sources.js"
];

const context = { window: {} };
context.globalThis = context.window;
vm.createContext(context);

for (const file of files) {
  const code = fs.readFileSync(file, "utf8");
  vm.runInContext(code, context, { filename: file });
}

const payload = {
  version: "0.2.4",
  generatedAt: new Date().toISOString(),
  chem: context.window.CHEMVAULT_DATA || {},
  research: context.window.CHEMVAULT_RESEARCH || {},
  dossiers: context.window.CHEMVAULT_DOSSIERS || {},
  methods: context.window.CHEMVAULT_METHODS || {},
  spectroscopy: context.window.CHEMVAULT_SPECTROSCOPY || {},
  materials: context.window.CHEMVAULT_MATERIALS || {},
  external: context.window.CHEMVAULT_EXTERNAL || {},
  workbench: context.window.CHEMVAULT_WORKBENCH || {}
};

fs.writeFileSync("data/chemvault-data.json", `${JSON.stringify(payload, null, 2)}\n`);

const counts = {
  reagents: payload.chem.reagents?.length || 0,
  reactionSystems: payload.chem.reactionSystems?.length || 0,
  reactants: payload.chem.reactants?.length || 0,
  compounds: payload.chem.compounds?.length || 0,
  materials: payload.materials.materials?.length || 0,
  mechanisms: payload.chem.mechanisms?.length || 0,
  dossiers: payload.dossiers.dossiers?.length || 0,
  researchCases: payload.research.caseStudies?.length || 0
};

console.log(JSON.stringify(counts, null, 2));
