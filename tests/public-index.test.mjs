import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("public record index exposes complete searchable data without page JavaScript", () => {
  execFileSync("node", ["scripts/generate-public-index.mjs"], { stdio: "pipe" });

  const bytes = fs.statSync("data/public-record-index.json").size;
  const payload = JSON.parse(fs.readFileSync("data/public-record-index.json", "utf8"));
  const reagentRecords = payload.records.filter((record) => record.type === "reagent");
  const ketoneAlcohol = reagentRecords.filter((record) => /ketone/i.test(record.searchText) && /alcohol/i.test(record.searchText));

  assert(bytes < 25 * 1024 * 1024, `public index is ${bytes} bytes, above Cloudflare Pages 25 MiB asset limit`);
  assert.equal(payload.kind, "ChemVaultPublicRecordIndex");
  assert(payload.generatedAt);
  assert(payload.site.href.endsWith("/data/public-record-index.json"));
  assert(payload.counts.totalRecords > 100);
  assert(reagentRecords.length > 50);
  assert(ketoneAlcohol.some((record) => record.id === "nabh4"));
  assert(ketoneAlcohol.some((record) => record.id === "lialh4"));
  assert(ketoneAlcohol.some((record) => record.id === "h2pd"));
  assert(ketoneAlcohol.some((record) => record.id === "mpv-reduction"));
  assert(payload.records.find((record) => record.id === "mpv-reduction").url.includes("/pages/record.html?type=reagent&id=mpv-reduction"));
  assert(payload.records.every((record) => record.url.startsWith("https://")));
  assert(payload.records.every((record) => record.searchText.length > 0));
});
