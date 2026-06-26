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
const bootHtmlFiles = ["404.html", ...pageFiles].sort();

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

    for (const label of ["首页", "研究", "平台", "项目", "笔记", "化合物"]) {
      assert.match(nav, new RegExp(`>${label}<`), `${file} keeps ${label} as a primary destination`);
    }

    assert.match(nav, /<details class="nav-more"/, `${file} has a More disclosure for secondary destinations`);
    assert.match(nav, /<summary[^>]*>更多<\/summary>/, `${file} labels the secondary navigation disclosure`);

    for (const label of ["应用", "工作台", "试剂", "材料", "方法", "档案", "谱学", "图谱", "资料库", "关于", "备案信息", "团队", "开发者", "联系"]) {
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
  const hero = html.match(/<section class="academic-hero">([\s\S]*?)<\/section>/)?.[1] || "";

  assert.match(html, /class="academic-site academic-home"/, "home page uses the updated academic home shell");
  assert.match(hero, /class="hero-title"[\s\S]*化学知识基础设施/, "home hero keeps the updated academic title treatment in Chinese");
  assert.match(hero, /class="compound-search-panel command-search"/, "home hero includes the updated instrument search panel");
  assert.match(hero, /class="lab-console"/, "home hero includes the research OS console preview");
  assert.match(hero, /href="pages\/search\.html"[\s\S]*探索化合物/, "home hero links to compound search");
  assert.match(hero, /href="pages\/research\.html"[\s\S]*查看研究方向/, "home hero links to research directions");
});

test("updated shell assets use a fresh cache key", () => {
  const staleAssetPattern = /(styles\.css|portal\.css|home\.js|site-shell\.js|search-page\.js)\?v=20260603a|portal\.css\?v=20260611a/;

  for (const file of pageFiles) {
    assert.doesNotMatch(read(file), staleAssetPattern, `${file} does not pin changed shell assets to the previous cache key`);
  }
});

test("search page paginates local results instead of rendering the full default stack", () => {
  const html = read("pages/search.html");
  const script = read("scripts/search-page.js");
  const styles = read("assets/portal.css");

  assert.match(html, /id="localSearchPagination"/, "search page has a dedicated pagination region below local results");
  assert.match(html, /search-page\.js\?v=20260619b/, "search page refreshes the paginated search script");
  assert.match(script, /const searchResultsPerPage\s*=\s*3/, "search results render three records per page by default");
  assert.match(script, /let searchIndexCache\s*=\s*null/, "search page caches the mapped local index between searches");
  assert.match(script, /function importedRecordsSignature/, "search page invalidates the cached index when saved imports change");
  assert.match(script, /function renderSearchPagination/, "search script renders pagination controls");
  assert.match(script, /rows\.slice\(pageStart,\s*pageStart \+ searchResultsPerPage\)/, "local results render only the current page slice");
  assert.match(styles, /\.search-pagination-shell/, "pagination controls are styled with the search page shell");
});

test("home page search uses a clearable icon input adapted from the template", () => {
  const html = read("index.html");
  const script = read("scripts/home.js");
  const styles = read("assets/portal.css");

  assert.match(html, /home\.js\?v=20260624a/, "home page refreshes the search interaction script");
  assert.match(html, /class="home-search-input"/, "home search wraps the input in a component shell");
  assert.match(html, /class="home-search-icon"/, "home search includes a leading search icon");
  assert.match(html, /data-home-search-clear/, "home search includes a clear button");
  assert.match(html, /aria-label="清空首页检索"/, "clear button has a Chinese accessible name");
  assert.match(script, /function wireHomeSearchInput/, "home script wires the clearable input behavior");
  assert.match(styles, /\.home-search-input\s*{[\s\S]*position:\s*relative/, "home input shell positions icon and clear controls");
  assert.match(styles, /\.home-search-clear\[hidden\]/, "hidden clear button stays out of the accessible layout");
});

test("startup welcome is wired through the shared motion layer in Chinese", () => {
  const script = read("scripts/motion.js");
  const styles = read("assets/styles.css");
  const boot = read("scripts/boot.js");

  assert.match(boot, /function shouldShowStartupWelcome/, "boot layer decides when the home welcome should replace loading");
  assert.match(boot, /startup-welcome-pending/, "boot layer marks the welcome state before page scripts load");
  assert.match(script, /function wireStartupWelcome/, "motion layer owns startup welcome wiring");
  assert.match(script, /startup-welcome/, "motion layer injects the startup welcome overlay");
  assert.match(script, /一个面向记录、试剂、材料、谱学和学术检索的专注化学工作区。/, "startup welcome copy is localized");
  assert.match(script, />进入网站<\/button>/, "startup welcome enter action is localized");
  assert.match(styles, /html\.startup-welcome-pending/, "stylesheet hides the page chrome while the welcome is being mounted");
  assert.match(styles, /\.startup-welcome__enter/, "stylesheet defines the enter button styles");
});

test("startup welcome assets use a fresh cache key on every HTML entry", () => {
  for (const file of bootHtmlFiles) {
    const html = read(file);

    assert.match(html, /boot\.js\?v=20260618c/, `${file} references startup welcome boot`);
    assert.match(html, /styles\.css\?v=2026062(?:0a|2b)/, `${file} references current shared styles`);
    assert.match(html, /motion\.js\?v=20260618c/, `${file} references startup welcome motion`);
  }
});

test("footer uses a localized ChemVault sticky footer adapted from the template", () => {
  const index = read("index.html");
  const notFound = read("404.html");
  const shell = read("scripts/site-shell.js");
  const styles = read("assets/styles.css");

  for (const [file, source] of [
    ["index.html", index],
    ["404.html", notFound],
    ["scripts/site-shell.js", shell]
  ]) {
    assert.match(source, /class="footer-sticky-layer"/, `${file} includes the fixed sticky footer layer`);
    assert.match(source, /class="footer-sticky-shell"/, `${file} includes the sticky viewport shell`);
    assert.match(source, /class="footer-link-groups"/, `${file} includes grouped footer links`);
    assert.match(source, />探索</, `${file} localizes the explore footer group`);
    assert.match(source, />工作区</, `${file} localizes the workspace footer group`);
    assert.match(source, />项目</, `${file} localizes the project footer group`);
    assert.match(source, />联系</, `${file} keeps contact information reachable in Chinese`);
    assert.match(source, /ICP备案号：待填写/, `${file} preserves Chinese filing disclosure`);
    assert.match(source, /ChemVault v0\.2\.4/, `${file} exposes the current site version in the footer`);
    assert.match(source, /class="[^"]*footer-mobile-compact/, `${file} includes a dedicated compact mobile footer`);
  }

  assert.match(styles, /--footer-height:\s*620px/, "footer uses the updated reveal height");
  assert.match(styles, /\.footer-sticky-layer[\s\S]*position:\s*fixed/, "footer layer is fixed to the bottom");
  assert.match(styles, /@media \(max-width:\s*900px\)[\s\S]*\.site-footer\s*{[\s\S]*height:\s*auto[\s\S]*clip-path:\s*none/, "mobile footer uses natural height");
  assert.doesNotMatch(styles, /\.site-version\s*{/, "original standalone version strip styles are removed");
  assert.doesNotMatch(shell, /document\.querySelector\("\.site-version"\)/, "dynamic footer no longer depends on the removed version strip");

  for (const file of ["404.html", ...pageFiles]) {
    const html = read(file);
    assert.doesNotMatch(html, /class="site-version"/, `${file} removes the original standalone version strip`);
  }
});

test("theme switch presents a stable, resolved light/dark control", () => {
  const styles = read("assets/styles.css");

  for (const scriptFile of ["scripts/home.js", "scripts/site-shell.js", "scripts/app.js"]) {
    const script = read(scriptFile);
    assert.match(script, /button\.dataset\.themeSetting = setting/, `${scriptFile} preserves the stored theme preference`);
    assert.match(script, /button\.dataset\.themeState = mode/, `${scriptFile} exposes the resolved light/dark state to the control`);
    assert.match(script, /return resolveTheme\(normaliseTheme\(setting\)\) === "dark" \? "light" : "dark"/, `${scriptFile} toggles directly between light and dark`);
  }

  assert.match(styles, /\.theme-toggle\s*{[\s\S]*width:\s*64px[\s\S]*border-radius:\s*999px/, "theme control uses a compact switch rail");
  assert.doesNotMatch(styles, /\.theme-toggle\[data-theme-state="system"\]/, "theme control no longer renders a visually ambiguous system state");
});

test("new English-site pages exist with Chinese metadata", () => {
  const expected = [
    ["pages/platform.html", "平台能力"],
    ["pages/projects.html", "ChemVault 生态"],
    ["pages/notes.html", "学术笔记与研究日志"],
    ["pages/contact.html", "联系 ChemVault"],
    ["pages/public-data.html", "公开数据"],
    ["pages/sitemap.html", "站点地图"]
  ];

  for (const [file, heading] of expected) {
    const html = read(file);
    assert.match(html, /<html lang="zh-CN">/, `${file} declares Chinese locale`);
    assert.match(html, new RegExp(`<h1[^>]*>${heading}<|<h1[^>]*>[\\s\\S]*${heading}`), `${file} exposes a Chinese primary heading`);
    assert.doesNotMatch(html, /<title>[^<]*(Platform Capabilities|ChemVault Ecosystem|Publications and Notes|Collaborate with ChemVault|Public Data|Sitemap)/, `${file} does not keep English title text`);
  }
});
