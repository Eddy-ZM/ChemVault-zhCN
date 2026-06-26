import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(file) {
  return fs.readFileSync(file, "utf8");
}

test("record detail page renders credibility and safety summary panels", () => {
  const script = read("scripts/record-page.js");

  for (const marker of [
    "record-trust-strip",
    "证据成熟度",
    "来源链路",
    "安全画像",
    "核验状态",
    "record-safety-panel"
  ]) {
    assert.match(script, new RegExp(marker), `record detail renderer includes ${marker}`);
  }
});

test("record detail page renders actionable next-step research guidance", () => {
  const script = read("scripts/record-page.js");

  for (const marker of [
    "record-next-steps",
    "后续研究动作",
    "核验来源",
    "对比关联化学",
    "规划安全处理"
  ]) {
    assert.match(script, new RegExp(marker), `record detail renderer includes ${marker}`);
  }
});

test("record detail page uses a fresh cache key for its changed script", () => {
  const html = read("pages/record.html");

  assert.doesNotMatch(html, /record-page\.js\?v=20260603a/, "record page does not pin the changed detail script to the old cache key");
  assert.match(html, /record-page\.js\?v=20260615a/, "record page references the upgraded detail script cache key");
});

test("record detail page busts the stylesheet cache for new detail styles", () => {
  const html = read("pages/record.html");

  assert.match(html, /portal\.css\?v=20260619c/, "record page references the upgraded portal stylesheet cache key");
});
