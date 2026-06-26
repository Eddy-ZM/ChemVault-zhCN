(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const revealSelector = [
    ".page-hero",
    ".home-hero-copy",
    ".home-search-card",
    ".home-status-panel",
    ".section-heading",
    ".portal-card",
    ".page-panel",
    ".page-index-card",
    ".data-window",
    ".detail-card",
    ".compare-card",
    ".table-card",
    ".calculator-shell",
    ".quiz-card",
    ".notes-panel",
    ".safety-section",
    ".local-result-card",
    ".external-source-card",
    ".gateway-card",
    ".list-button",
    ".search-hit",
    ".metric-strip > div",
    ".home-metric-grid > div",
    ".command-grid > div"
  ].join(",");
  const rippleSelector = [
    "button",
    ".primary-button",
    ".secondary-button",
    ".small-button",
    ".text-button",
    ".icon-button",
    ".portal-card",
    ".list-button",
    ".search-hit",
    ".local-result-card",
    ".external-source-card",
    ".gateway-card"
  ].join(",");

  let overlay;
  let startupWelcome;
  let cleanupWelcomeMorph;
  let revealObserver;
  let mutationObserver;
  let isNavigating = false;
  const visitedKey = "chemvault-visited-pages";
  const suppressStartupKey = "chemvault-suppress-next-boot";
  const welcomeSeenKey = "chemvault-welcome-entered";
  const heavyPageNames = new Set(["app.html", "workbench.html", "search.html", "record.html"]);
  const compactRevealPages = new Set(["app.html", "workbench.html", "search.html", "reagents.html", "materials.html", "methods.html", "spectroscopy.html", "dossiers.html"]);
  const genericLabels = new Set([
    "open page",
    "open source page",
    "view details",
    "search this topic",
    "search chemvault",
    "open workbench",
    "open source"
  ]);
  const pageLabels = {
    "index.html": "首页",
    "app.html": "应用",
    "workbench.html": "工作台",
    "search.html": "检索",
    "research.html": "研究",
    "dossiers.html": "档案",
    "methods.html": "方法",
    "spectroscopy.html": "谱学",
    "materials.html": "材料",
    "reagents.html": "试剂",
    "atlas.html": "图谱",
    "library.html": "资料库",
    "about.html": "关于",
    "team.html": "团队",
    "developer.html": "开发者",
    "record.html": "记录",
    "platform.html": "平台",
    "projects.html": "项目",
    "notes.html": "笔记",
    "contact.html": "联系",
    "public-data.html": "公开数据",
    "sitemap.html": "站点地图",
    "filing.html": "备案信息"
  };

  window.CHEMVAULT_MOTION = {
    showNavigation,
    hideNavigation,
    navigate,
    showStartupWelcome: () => wireStartupWelcome({ force: true }),
    refresh: () => prepareReveal(document)
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.classList.add("motion-available");
    ensureOverlay();
    const welcomeVisible = wireStartupWelcome();
    const bootVisible = !welcomeVisible && showStartupLoader();
    markVisited(new URL(window.location.href));
    wireNavigation();
    wireRipples();
    wireReveal();

    let didReady = false;
    const ready = () => {
      if (didReady) return;
      didReady = true;
      finishStartupLoader();
      document.body.classList.add("page-ready");
      hideNavigation();
    };

    if (bootVisible) {
      window.setTimeout(ready, 620);
      window.setTimeout(ready, 980);
      return;
    }
    requestAnimationFrame(ready);
    window.setTimeout(ready, 160);
  });

  window.addEventListener("pageshow", () => {
    isNavigating = false;
    markVisited(new URL(window.location.href));
    document.body.classList.remove("page-is-leaving", "page-is-soft-leaving");
    hideNavigation();
  });

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "page-transition";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="page-transition__panel" role="status" aria-live="polite">
        <img class="page-transition__logo" src="/assets/chemvault-logo-mark.png" alt="" decoding="async" />
        <span class="page-transition__copy">ChemVault</span>
        <span class="page-transition__rail" aria-hidden="true"><span class="page-transition__bar"></span></span>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function wireStartupWelcome(options = {}) {
    if (startupWelcome && document.body.contains(startupWelcome)) return true;
    if (!options.force && hasSeenStartupWelcome()) return false;
    if (!options.force && pageName(new URL(window.location.href)) !== "index.html") return false;

    startupWelcome = document.createElement("section");
    startupWelcome.className = "startup-welcome";
    startupWelcome.setAttribute("role", "dialog");
    startupWelcome.setAttribute("aria-modal", "true");
    startupWelcome.setAttribute("aria-labelledby", "startupWelcomeTitle");
    startupWelcome.innerHTML = `
      <div class="startup-welcome__panel">
        <img class="startup-welcome__logo" src="/assets/chemvault-logo-mark.png" alt="" decoding="async" />
        <h1 class="visually-hidden" id="startupWelcomeTitle">欢迎访问 ChemVault</h1>
        <div class="startup-welcome__gooey" aria-label="ChemVault 欢迎词">
          <svg class="startup-welcome__filter" aria-hidden="true" focusable="false">
            <defs>
              <filter id="chemvault-gooey-threshold">
                <feColorMatrix
                  in="SourceGraphic"
                  type="matrix"
                  values="1 0 0 0 0
                          0 1 0 0 0
                          0 0 1 0 0
                          0 0 0 255 -140"
                />
              </filter>
            </defs>
          </svg>
          <span data-gooey-text="first"></span>
          <span data-gooey-text="second"></span>
        </div>
        <p class="startup-welcome__copy">一个面向记录、试剂、材料、谱学和学术检索的专注化学工作区。</p>
        <button class="startup-welcome__enter" type="button" data-welcome-action="enter">进入网站</button>
      </div>
    `;

    document.body.appendChild(startupWelcome);
    document.body.classList.add("startup-welcome-active");
    document.documentElement.classList.remove("startup-welcome-pending");

    cleanupWelcomeMorph = startGooeyTextMorph(startupWelcome, [
      "ChemVault",
      "研究",
      "化学",
      "证据"
    ], {
      morphTime: 1,
      cooldownTime: 1.2
    });

    const button = startupWelcome.querySelector("[data-welcome-action=\"enter\"]");
    button?.addEventListener("click", dismissStartupWelcome);
    startupWelcome.addEventListener("keydown", (event) => {
      if (event.key === "Escape") dismissStartupWelcome();
    });
    window.setTimeout(() => button?.focus({ preventScroll: true }), 80);
    return true;
  }

  function dismissStartupWelcome() {
    if (!startupWelcome || startupWelcome.classList.contains("is-leaving")) return;
    markStartupWelcomeSeen();
    cleanupWelcomeMorph?.();
    cleanupWelcomeMorph = null;
    startupWelcome.querySelector("[data-welcome-action=\"enter\"]")?.setAttribute("disabled", "true");
    startupWelcome.classList.add("is-leaving");
    document.body.classList.remove("startup-welcome-active");
    window.setTimeout(() => {
      startupWelcome?.remove();
      startupWelcome = null;
      document.querySelector("#main")?.focus?.({ preventScroll: true });
    }, reduceMotion.matches ? 1 : 360);
  }

  function startGooeyTextMorph(root, texts, options = {}) {
    const text1 = root.querySelector("[data-gooey-text=\"first\"]");
    const text2 = root.querySelector("[data-gooey-text=\"second\"]");
    const availableTexts = texts.filter(Boolean);
    const morphTime = options.morphTime || 1;
    const cooldownTime = options.cooldownTime || 0.25;
    if (!text1 || !text2 || !availableTexts.length) return () => {};

    let animationFrame = 0;
    let textIndex = availableTexts.length - 1;
    let lastTime = performance.now();
    let morph = 0;
    let cooldown = cooldownTime;

    text1.textContent = availableTexts[textIndex % availableTexts.length];
    text2.textContent = availableTexts[(textIndex + 1) % availableTexts.length];

    const setMorph = (fraction) => {
      const next = Math.max(0.0001, Math.min(fraction, 1));
      const current = Math.max(0.0001, 1 - next);
      text2.style.filter = `blur(${Math.min(8 / next - 8, 100)}px)`;
      text2.style.opacity = `${Math.pow(next, 0.4)}`;
      text1.style.filter = `blur(${Math.min(8 / current - 8, 100)}px)`;
      text1.style.opacity = `${Math.pow(current, 0.4)}`;
    };

    const doCooldown = () => {
      morph = 0;
      text2.style.filter = "";
      text2.style.opacity = "1";
      text1.style.filter = "";
      text1.style.opacity = "0";
    };

    const doMorph = () => {
      morph -= cooldown;
      cooldown = 0;
      let fraction = morph / morphTime;
      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
      }
      setMorph(fraction);
    };

    function animate(now) {
      animationFrame = requestAnimationFrame(animate);
      const shouldIncrementIndex = cooldown > 0;
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      cooldown -= dt;

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          textIndex = (textIndex + 1) % availableTexts.length;
          text1.textContent = availableTexts[textIndex % availableTexts.length];
          text2.textContent = availableTexts[(textIndex + 1) % availableTexts.length];
        }
        doMorph();
      } else {
        doCooldown();
      }
    }

    if (reduceMotion.matches || availableTexts.length === 1) {
      text1.textContent = availableTexts[0];
      text1.style.opacity = "1";
      text2.style.opacity = "0";
      return () => {};
    }

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }

  function wireNavigation() {
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest("a[href]");
      if (!link || !shouldTransition(link, event)) return;

      const url = new URL(link.href, window.location.href);
      const label = destinationLabel(link, url);

      event.preventDefault();
      navigate(link.href, label, { loader: shouldUseNavigationLoader(link, url) });
    });
  }

  function shouldTransition(link, event) {
    if (event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download") || link.dataset.noTransition === "true") return false;

    const rawHref = link.getAttribute("href") || "";
    if (!rawHref || rawHref.startsWith("#")) return false;
    if (/^(mailto|tel|javascript):/i.test(rawHref)) return false;

    const url = new URL(rawHref, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return false;
    return true;
  }

  function navigate(href, label = "ChemVault", options = {}) {
    if (isNavigating) return;
    isNavigating = true;
    const url = new URL(href, window.location.href);
    const useLoader = options.loader ?? shouldUseNavigationLoader(null, url);

    const go = () => {
      markStartupSuppressed();
      window.location.href = href;
    };

    if (reduceMotion.matches) {
      go();
      return;
    }

    const slowJourney = isSlowConnection() || isSearchWork(url);
    const preferSoftJourney = reduceMotion.matches || !useLoader || slowJourney;

    if (preferSoftJourney) {
      showSoftNavigation();
      window.setTimeout(go, slowJourney ? 130 : 70);
      return;
    }

    showNavigation(label || destinationLabel(null, url));
    window.setTimeout(go, 110);
  }

  function showSoftNavigation() {
    document.body.classList.add("page-is-leaving", "page-is-soft-leaving");
  }

  function showNavigation(label = "ChemVault") {
    ensureOverlay();
    const copy = overlay.querySelector(".page-transition__copy");
    if (copy && label) copy.textContent = trimLabel(label);
    document.body.classList.add("page-is-leaving");
    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.add("is-active");
  }

  function hideNavigation() {
    overlay?.classList.remove("is-active");
    overlay?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("page-is-soft-leaving");
  }

  function showStartupLoader() {
    const isBooting = document.documentElement.classList.contains("motion-boot")
      && !document.documentElement.classList.contains("motion-boot-timeout");
    if (reduceMotion.matches || !isBooting) return false;
    document.body.dataset.bootLabel = trimLabel(document.body.dataset.bootLabel || pageLabels[pageName(new URL(window.location.href))] || "ChemVault");
    document.body.classList.add("site-is-booting");
    return true;
  }

  function finishStartupLoader() {
    if (window.CHEMVAULT_BOOT_TIMEOUT) {
      window.clearTimeout(window.CHEMVAULT_BOOT_TIMEOUT);
      window.CHEMVAULT_BOOT_TIMEOUT = null;
    }
    document.documentElement.classList.remove("motion-boot");
    document.documentElement.classList.remove("motion-boot-timeout");
    window.setTimeout(() => document.documentElement.classList.remove("motion-soft-enter"), 220);
    document.body.classList.remove("site-is-booting");
  }

  function markStartupSuppressed() {
    try {
      sessionStorage.setItem(suppressStartupKey, "true");
    } catch {
      // Session storage can be unavailable in private contexts.
    }
  }

  function hasSeenStartupWelcome() {
    try {
      return sessionStorage.getItem(welcomeSeenKey) === "true";
    } catch {
      return false;
    }
  }

  function markStartupWelcomeSeen() {
    try {
      sessionStorage.setItem(welcomeSeenKey, "true");
    } catch {
      // Session storage can be unavailable in private contexts.
    }
  }

  function shouldUseNavigationLoader(link, url) {
    if (reduceMotion.matches) return false;
    if (link?.dataset.transition === "none") return false;
    if (link?.dataset.transition === "loading") return true;
    if (isSlowConnection()) return true;
    if (isSearchWork(url)) return true;
    return isHeavyPage(url) && !hasVisited(url);
  }

  function isHeavyPage(url) {
    return heavyPageNames.has(pageName(url));
  }

  function isSearchWork(url) {
    return pageName(url) === "search.html" && Boolean(url.searchParams.get("q"));
  }

  function isSlowConnection() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return false;
    if (connection.saveData) return true;
    return ["slow-2g", "2g", "3g"].includes(connection.effectiveType);
  }

  function destinationLabel(link, url) {
    const text = trimLabel(link?.dataset.transitionLabel || link?.getAttribute("aria-label") || link?.textContent || "");
    const pageLabel = pageLabels[pageName(url)] || "ChemVault";
    if (!text || genericLabels.has(text.toLowerCase()) || text.toLowerCase().includes("chemvault home")) return pageLabel;
    return text;
  }

  function trimLabel(value) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > 32 ? `${text.slice(0, 29)}...` : text;
  }

  function pageName(url) {
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "index.html";
  }

  function pageVisitKey(url) {
    return url.pathname.replace(/\/index\.html$/i, "/");
  }

  function readVisited() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(visitedKey) || "[]");
      return Array.isArray(parsed) ? new Set(parsed) : new Set();
    } catch {
      return new Set();
    }
  }

  function hasVisited(url) {
    return readVisited().has(pageVisitKey(url));
  }

  function markVisited(url) {
    try {
      const visited = readVisited();
      visited.add(pageVisitKey(url));
      sessionStorage.setItem(visitedKey, JSON.stringify([...visited].slice(-32)));
    } catch {
      // Session storage can be unavailable in private contexts.
    }
  }

  function wireReveal() {
    if (reduceMotion.matches || !("IntersectionObserver" in window)) return;

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const delay = Number(entry.target.dataset.motionDelayMs || 0);
        if (!delay) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
          return;
        }

        window.setTimeout(() => {
          entry.target.classList.add("is-visible");
        }, delay);
        revealObserver.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.08
    });

    prepareReveal(document);
    mutationObserver = new MutationObserver((mutations) => {
      if (!mutations.some((mutation) => mutation.addedNodes.length)) return;
      window.requestAnimationFrame(() => prepareReveal(document));
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  function prepareReveal(root) {
    if (reduceMotion.matches || !revealObserver) return;
    const nodes = [...root.querySelectorAll(revealSelector)];
    const compact = shouldUseCompactReveal(nodes.length);
    const sectionAnchor = new Map();
    const sectionCounter = new Map();
    const stageGap = compact ? 170 : 280;
    const slotGap = compact ? 18 : 32;
    const baseDelay = compact ? 48 : 82;
    const profile = compact ? "compact" : "default";
    const capDelay = compact ? 680 : 1180;

    nodes.forEach((node) => {
      if (node.dataset.motionBound === "true") return;
      if (node.closest(".page-transition, .startup-welcome")) return;
      const anchor = node.closest("section, .academic-hero") || node.parentElement || root;
      let stage = sectionAnchor.get(anchor);
      let slot = sectionCounter.get(anchor) || 0;
      if (stage === undefined) {
        stage = sectionAnchor.size;
        sectionAnchor.set(anchor, stage);
      }
      sectionCounter.set(anchor, slot + 1);
      node.dataset.motionBound = "true";
      node.dataset.motionProfile = profile;
      const delay = Math.min(capDelay, baseDelay + (stage * stageGap) + (slot * slotGap));
      node.style.setProperty("--motion-order", String(slot));
      node.style.setProperty("--motion-reveal-delay", `${delay}ms`);
      node.dataset.motionDelayMs = String(delay);
      revealObserver.observe(node);
    });
    window.dispatchEvent(new CustomEvent("chemvault-motion-reveal-ready"));
  }

  function shouldUseCompactReveal(count) {
    const current = pageName(new URL(window.location.href));
    if (current === "index.html" || document.body.classList.contains("academic-home")) return false;
    if (document.body.classList.contains("page-ready")) return true;
    if (compactRevealPages.has(current)) return true;
    return count > 44;
  }

  function wireRipples() {
    if (reduceMotion.matches) return;
    const maxRipplePool = 12;
    const ripplePool = [];
    const hostedTargets = new WeakSet();
    const defaultRippleDuration = 640;
    const minRippleMs = 420;
    const maxRippleMs = 680;

    const releaseRipple = (ripple) => {
      if (ripple.parentElement) ripple.parentElement.removeChild(ripple);
      ripple.classList.remove("is-active");
      ripple.hidden = true;
      if (ripplePool.length < maxRipplePool) {
        ripplePool.push(ripple);
      } else {
        ripple.remove();
      }
    };

    const acquireRipple = (host) => {
      const ripple = ripplePool.pop() || document.createElement("span");
      if (!ripple.dataset.boundRipple) {
        ripple.className = "motion-ripple";
        ripple.dataset.boundRipple = "true";
        ripple.setAttribute("aria-hidden", "true");
        ripple.addEventListener("animationend", () => {
          releaseRipple(ripple);
        });
      }
      if (ripple.parentElement !== host) host.appendChild(ripple);
      ripple.hidden = false;
      ripple.classList.remove("is-active");
      return ripple;
    };

    document.addEventListener("pointerdown", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const control = target?.closest(rippleSelector);
      if (!control || control.closest(".page-transition, .startup-welcome")) return;
      if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) return;

      const rect = control.getBoundingClientRect();
      if (!hostedTargets.has(control)) {
        control.classList.add("is-motion-ripple-host");
        if (getComputedStyle(control).position === "static") control.style.position = "relative";
        if (getComputedStyle(control).overflow === "visible") control.style.overflow = "hidden";
        hostedTargets.add(control);
      }
      const size = Math.max(rect.width, rect.height) * 1.8;
      const ripple = acquireRipple(control);
      ripple.classList.remove("is-active");
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      const duration = Math.min(maxRippleMs, Math.max(minRippleMs, 520 + Math.sqrt(size) * 10));
      ripple.style.setProperty("--chemvault-ripple-duration", `${Math.min(defaultRippleDuration, duration)}ms`);
      void ripple.offsetWidth;
      ripple.classList.add("is-active");
    });
  }
})();
