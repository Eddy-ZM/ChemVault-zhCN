(() => {
  const themeQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
  const suppressStartupKey = "chemvault-suppress-next-boot";
  const welcomeSeenKey = "chemvault-welcome-entered";

  function normaliseTheme(value) {
    return ["system", "light", "dark"].includes(value) ? value : "system";
  }

  function resolveTheme(setting) {
    return setting === "system" ? (themeQuery?.matches ? "dark" : "light") : setting;
  }

  function applyInitialTheme() {
    const setting = normaliseTheme(localStorage.getItem("chemvault-theme"));
    const mode = resolveTheme(setting);
    const dark = mode === "dark";
    document.documentElement.dataset.themeSetting = setting;
    document.documentElement.dataset.themeResolved = mode;
    document.documentElement.classList.toggle("dark-mode", dark);
    document.documentElement.classList.toggle("light-mode", !dark);
    document.documentElement.style.colorScheme = mode;
    document.querySelector("meta[name='theme-color']")?.setAttribute("content", dark ? "#101114" : "#f5f5f7");
  }

  function boot() {
    document.documentElement.classList.add("motion-boot");
    window.CHEMVAULT_BOOT_TIMEOUT = window.setTimeout(() => {
      document.documentElement.classList.add("motion-boot-timeout");
    }, 1800);
  }

  function isHomePage() {
    const pathname = window.location.pathname.replace(/\/+$/, "");
    return !pathname || pathname === "" || pathname === "/index.html";
  }

  function shouldShowStartupWelcome() {
    if (!isHomePage()) return false;
    try {
      return sessionStorage.getItem(welcomeSeenKey) !== "true";
    } catch {
      return true;
    }
  }

  function readSuppressStartup() {
    try {
      return sessionStorage.getItem(suppressStartupKey) === "true";
    } catch {
      return false;
    }
  }

  function clearSuppressStartup() {
    try {
      sessionStorage.removeItem(suppressStartupKey);
    } catch {
      // Session storage can be unavailable in private contexts.
    }
  }

  try {
    applyInitialTheme();
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const onHome = isHomePage();
    const shouldWelcome = shouldShowStartupWelcome();
    const suppress = readSuppressStartup();
    if (shouldWelcome) {
      document.documentElement.classList.add("startup-welcome-pending");
      clearSuppressStartup();
      return;
    }
    if (onHome) return;
    if (suppress) {
      clearSuppressStartup();
      if (!reduce) document.documentElement.classList.add("motion-soft-enter");
    }
    if (!reduce && !suppress) boot();
  } catch {
    if (shouldShowStartupWelcome()) document.documentElement.classList.add("startup-welcome-pending");
    else boot();
  }
})();
