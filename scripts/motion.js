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
  let revealObserver;
  let mutationObserver;
  let isNavigating = false;
  const visitedKey = "chemvault-visited-pages";
  const suppressStartupKey = "chemvault-suppress-next-boot";
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
    "index.html": "Home",
    "app.html": "App",
    "workbench.html": "Workbench",
    "search.html": "Search",
    "research.html": "Research",
    "dossiers.html": "Dossiers",
    "methods.html": "Methods",
    "spectroscopy.html": "Spectroscopy",
    "materials.html": "Materials",
    "reagents.html": "Reagents",
    "atlas.html": "Atlas",
    "library.html": "Library",
    "about.html": "About",
    "team.html": "Team",
    "developer.html": "Developer",
    "record.html": "Record"
  };

  window.CHEMVAULT_MOTION = {
    showNavigation,
    hideNavigation,
    navigate,
    refresh: () => prepareReveal(document)
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.classList.add("motion-available");
    const bootVisible = showStartupLoader();
    ensureOverlay();
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

    if (!useLoader) {
      showSoftNavigation();
      window.setTimeout(go, 70);
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
    if (!connection || connection.saveData) return false;
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
        entry.target.classList.add("is-visible");
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
    const nodes = root.querySelectorAll(revealSelector);
    const compact = shouldUseCompactReveal(nodes.length);
    nodes.forEach((node, index) => {
      if (node.dataset.motionBound === "true") return;
      if (node.closest(".page-transition")) return;
      node.dataset.motionBound = "true";
      if (compact) node.dataset.motionProfile = "compact";
      node.style.setProperty("--motion-order", String(compact ? Math.min(index, 4) : index % 6));
      revealObserver.observe(node);
    });
  }

  function shouldUseCompactReveal(count) {
    if (document.body.classList.contains("page-ready")) return true;
    if (compactRevealPages.has(pageName(new URL(window.location.href)))) return true;
    return count > 44;
  }

  function wireRipples() {
    if (reduceMotion.matches) return;

    document.addEventListener("pointerdown", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const control = target?.closest(rippleSelector);
      if (!control || control.closest(".page-transition")) return;
      if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) return;

      const rect = control.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.8;
      const ripple = document.createElement("span");
      ripple.className = "motion-ripple";
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      control.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 650);
    });
  }
})();
