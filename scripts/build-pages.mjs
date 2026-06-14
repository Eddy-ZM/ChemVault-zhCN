import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "dist");

const entries = [
  "404.html",
  "BingSiteAuth.xml",
  "_headers",
  "_redirects",
  "assets",
  "data",
  "favicon.ico",
  "index.html",
  "pages",
  "robots.txt",
  "scripts",
  "sitemap.xml",
  "site.webmanifest"
];

const excluded = new Set([
  "data/chemvault-data.json",
  "scripts/build-pages.mjs",
  "scripts/export-d1-seed.mjs",
  "scripts/export-data-json.mjs",
  "scripts/generate-public-index.mjs",
  "scripts/generate-sitemap.mjs"
]);

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const entry of entries) {
  const source = path.join(root, entry);
  if (!fs.existsSync(source)) continue;
  copyRecursive(source, path.join(outDir, entry), entry);
}

const summary = scan(outDir);
const manifest = {
  generatedAt: new Date().toISOString(),
  outputDir: "dist",
  files: summary.files,
  bytes: summary.bytes,
  excluded: [...excluded]
};
fs.writeFileSync(path.join(outDir, "deploy-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(JSON.stringify({
  outputDir: "dist",
  files: summary.files + 1,
  bytes: summary.bytes + Buffer.byteLength(JSON.stringify(manifest, null, 2)) + 1,
  skipped: [...excluded]
}, null, 2));

function copyRecursive(source, target, relativePath) {
  if (shouldSkip(relativePath)) return;

  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const child of fs.readdirSync(source)) {
      copyRecursive(
        path.join(source, child),
        path.join(target, child),
        path.posix.join(relativePath, child)
      );
    }
    return;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function shouldSkip(relativePath) {
  const normalized = relativePath.split(path.sep).join(path.posix.sep);
  return excluded.has(normalized) || path.basename(normalized) === ".DS_Store";
}

function scan(directory) {
  let files = 0;
  let bytes = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const child = scan(fullPath);
      files += child.files;
      bytes += child.bytes;
    } else {
      files += 1;
      bytes += fs.statSync(fullPath).size;
    }
  }
  return { files, bytes };
}
