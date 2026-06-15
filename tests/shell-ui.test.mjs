import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const pageFiles = [
  "index.html",
  ...fs.readdirSync("pages")
    .filter((file) => file.endsWith(".html"))
    .map((file) => path.join("pages", file))
].sort();

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function navMarkup(html) {
  const match = html.match(/<nav class="site-nav" aria-label="主导航">([\s\S]*?)<\/nav>/);
  assert(match, "page has a main navigation block");
  return match[1];
}

test("site navigation exposes core destinations and groups secondary pages under 更多", () => {
  for (const file of pageFiles) {
    const nav = navMarkup(read(file));

    for (const label of ["首页", "检索", "工作台", "试剂", "材料", "方法"]) {
      assert.match(nav, new RegExp(`>${label}<`), `${file} keeps ${label} as a primary destination`);
    }

    assert.match(nav, /<details class="nav-more"/, `${file} has a More disclosure for secondary destinations`);
    assert.match(nav, /<summary[^>]*>更多<\/summary>/, `${file} labels the secondary navigation disclosure`);

    for (const label of ["应用", "研究", "档案", "谱学", "图谱", "资料库", "关于", "备案信息", "团队", "开发者"]) {
      assert.match(nav, new RegExp(`>${label}<`), `${file} keeps ${label} reachable from More`);
    }
  }
});

test("search page keeps long-tail filters behind a collapsed advanced disclosure", () => {
  const html = read("pages/search.html");

  assert.match(html, /class="scope-chip-row"/, "search page has quick scope chips");
  assert.match(html, /class="primary-filter-grid"/, "search page has a compact primary filter grid");
  assert.match(html, /<details class="advanced-search-disclosure" id="advancedSearchDisclosure">/, "advanced filters use a details disclosure");
  assert.doesNotMatch(html, /<details class="advanced-search-disclosure" id="advancedSearchDisclosure"\s+open>/, "advanced filters are collapsed by default");

  const advanced = html.match(/<details class="advanced-search-disclosure" id="advancedSearchDisclosure">([\s\S]*?)<\/details>/)?.[1] || "";
  assert.match(advanced, /id="searchFacet"/, "domain/family filter is inside advanced filters");
  assert.match(advanced, /id="searchTag"/, "tag filter is inside advanced filters");
  assert.match(advanced, /id="searchExact"/, "exact phrase filter is inside advanced filters");
});

test("home page exposes trust shortcuts in the first viewport", () => {
  const html = read("index.html");
  const hero = html.match(/<section class="home-hero" id="top">([\s\S]*?)<\/section>/)?.[1] || "";

  assert.match(hero, /class="home-trust-rail"/, "home hero includes a compact trust shortcut rail");
  assert.match(hero, /href="data\/public-record-index\.json"[\s\S]*完整公开数据/, "home hero links to the public record index");
  assert.match(hero, /href="pages\/search\.html"[\s\S]*本地优先检索/, "home hero links to local-first search");
  assert.match(hero, /href="pages\/filing\.html"[\s\S]*合规边界/, "home hero links to filing and compliance information");
});

test("updated shell assets use a fresh cache key", () => {
  const staleAssetPattern = /(styles\.css|portal\.css|home\.js|site-shell\.js|search-page\.js)\?v=20260603a|portal\.css\?v=20260611a/;

  for (const file of pageFiles) {
    assert.doesNotMatch(read(file), staleAssetPattern, `${file} does not pin changed shell assets to the previous cache key`);
  }
});
