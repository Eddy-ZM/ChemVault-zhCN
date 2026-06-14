(() => {
  const themeQuery = window.matchMedia?.("(prefers-color-scheme: dark)");

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

  try {
    applyInitialTheme();
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const suppress = sessionStorage.getItem("chemvault-suppress-next-boot") === "true";
    if (suppress) {
      sessionStorage.removeItem("chemvault-suppress-next-boot");
      if (!reduce) document.documentElement.classList.add("motion-soft-enter");
    }
    if (!reduce && !suppress) boot();
  } catch {
    boot();
  }
})();
