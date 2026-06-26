(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReduced = reduceMotion?.matches === true;
  const isFinePointer = window.matchMedia?.("(pointer: fine)")?.matches !== false;
  const lowMemoryDevice = Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory <= 3;
  const largeViewport = window.matchMedia?.("(min-width: 1024px)")?.matches !== false;
  const compactViewport = window.matchMedia?.("(max-width: 900px)")?.matches !== false;
  const enablePointerFx = !prefersReduced && isFinePointer && !lowMemoryDevice;
  const shouldThrottleSections = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  const enableTilt = enablePointerFx && largeViewport && !shouldThrottleSections;
  const enableMagnetic = enablePointerFx && !shouldThrottleSections;
  const compactMotionProfile = shouldThrottleSections || compactViewport;

  root.classList.add('cv-effects-ready');
  root.classList.toggle('cv-throttle-mode', compactMotionProfile || lowMemoryDevice);
  root.classList.toggle('cv-compact-mode', compactViewport);
  let pointerFrame = 0;
  let pointerEvent = null;
  let scrollRailFrame = 0;
  let scrollProgressFrame = 0;

  const setPointer = (event) => {
    root.style.setProperty('--cursor-x', `${event.clientX}px`);
    root.style.setProperty('--cursor-y', `${event.clientY}px`);
    const spotlightX = `${(event.clientX / Math.max(1, window.innerWidth)) * 100}%`;
    const spotlightY = `${(event.clientY / Math.max(1, window.innerHeight)) * 100}%`;
    root.style.setProperty('--cursor-spot-x', spotlightX);
    root.style.setProperty('--cursor-spot-y', spotlightY);
  };

  const flushPointer = () => {
    if (!pointerEvent) return;
    setPointer(pointerEvent);
    pointerEvent = null;
    pointerFrame = 0;
  };

  if (enablePointerFx) {
    window.addEventListener('pointermove', (event) => {
      pointerEvent = event;
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(flushPointer);
    }, { passive: true });
  }

  if (prefersReduced) {
    root.classList.add('cv-reduced-motion');
    return;
  }

  const resolveRevealDelay = (element, stageIndex, slotIndex) => {
    const motionDelay = Number.parseFloat(element.dataset.motionDelayMs);
    if (Number.isFinite(motionDelay)) return motionDelay;
    const cssDelay = Number.parseFloat(getComputedStyle(element).getPropertyValue("--motion-reveal-delay"));
    if (Number.isFinite(cssDelay)) return cssDelay;

    const stageGap = compactMotionProfile ? 168 : 224;
    const slotGap = compactMotionProfile ? 22 : 40;
    const baseDelay = compactMotionProfile ? 30 : 76;
    const capDelay = compactMotionProfile ? 760 : 1330;
    return Math.min(capDelay, baseDelay + stageIndex * stageGap + slotIndex * slotGap);
  };

  const getRevealSelector = () => [
    '.academic-hero-content',
    '.hero-title',
    '.hero-subtitle',
    '.hero-lead',
    '.hero-actions',
    '.template-stage',
    '.chem-orbit-shell',
    '.chem-orbit-shell span',
    '.hero-proof-row',
    '.hero-proof-row span',
    '.search-hint',
    '.search-row',
    '.quick-searches button',
    '.section-header',
    '.research-area-card',
    '.feature-card',
    '.platform-capability-card',
    '.project-card',
    '.academic-note-card',
    '.stat-block',
    '.module-tile',
    '.project-ledger-row',
    '.vision-panel',
    '.database-card',
    '.timeline-item',
    '.contact-card',
    '.hero-beam-field',
    '.hero-beam-field span',
    '.hero-signal-strip',
    '.hero-signal-strip span',
    '.lab-console',
    '.console-topbar',
    '.console-grid',
    '.console-panel',
    '.console-command',
    '.console-metrics',
    '.page-hero',
    '.page-panel',
    '.data-window',
    '.search-hit',
    '.portal-card',
    '.list-button',
    '.external-source-card',
    '.local-result-card',
    '.gateway-card'
  ].join(',');

  const stageAwareReveal = () => {
    const elements = document.querySelectorAll(getRevealSelector());
    const sectionAnchor = new Map();
    const sectionSlot = new Map();

    elements.forEach((element) => {
      const anchor = element.closest('section, .academic-hero') || element.parentElement || document.body;
      let stage = sectionAnchor.get(anchor);
      let slot = sectionSlot.get(anchor) || 0;
      if (stage === undefined) {
        stage = sectionAnchor.size;
        sectionAnchor.set(anchor, stage);
        if (!anchor.dataset.cvStageOrder) {
          anchor.dataset.cvStageOrder = String(stage);
          anchor.style.setProperty('--cv-stage-order', String(stage));
        }
      }
      sectionSlot.set(anchor, slot + 1);

      const delay = resolveRevealDelay(element, stage, slot);
      const stageDelay = Math.min(compactMotionProfile ? 680 : 1120, stage * (compactMotionProfile ? 132 : 198));
      const slotDelay = Math.min(compactMotionProfile ? 280 : 540, slot * (compactMotionProfile ? 24 : 42));

      element.classList.add('cv-reveal');
      element.style.setProperty('--cv-stage-index', String(stage));
      element.style.setProperty('--cv-slot-index', String(slot));
      element.style.setProperty('--cv-slot-delay', `${slotDelay}ms`);
      element.style.setProperty('--cv-stage-delay', `${stageDelay}ms`);
      element.style.setProperty('--cv-slot-count', String(Math.max(1, slot + 1)));
      element.style.setProperty('--reveal-delay', `${Math.min(compactMotionProfile ? 920 : 1520, delay + slotDelay)}ms`);
      if (!element.dataset.cvRevealBound) {
        element.dataset.cvRevealBound = "true";
        revealObserver.observe(element);
      }
    });
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.13, rootMargin: '0px 0px -12% 0px' });

  stageAwareReveal();
  window.addEventListener('chemvault-motion-reveal-ready', stageAwareReveal);
  window.addEventListener('pageshow', stageAwareReveal);

  const tiltTargets = document.querySelectorAll([
    '.lab-console',
    '.command-search',
    '.module-tile',
    '.research-area-card',
    '.platform-capability-card',
    '.project-card',
    '.academic-note-card',
    '.feature-card',
    '.portal-card',
    '.search-hit',
    '.external-source-card',
    '.local-result-card',
    '.gateway-card'
  ].join(','));

  let tiltFrame = 0;
  const pointerForTilt = { x: 0, y: 0 };
  const applyTilt = () => {
    if (!enableTilt) return;
    const pointerX = pointerForTilt.x;
    const pointerY = pointerForTilt.y;
    tiltTargets.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const x = pointerX - rect.left;
      const y = pointerY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

      const tiltX = ((y / Math.max(1, rect.height)) - 0.5) * -7;
      const tiltY = ((x / Math.max(1, rect.width)) - 0.5) * 7;

      element.style.setProperty('--spot-x', `${x}px`);
      element.style.setProperty('--spot-y', `${y}px`);
      element.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
      element.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
    });
    tiltFrame = 0;
  };

  tiltTargets.forEach((element) => {
    element.classList.add('cv-tilt');
    if (!enableTilt) return;
    element.addEventListener('pointerleave', () => {
      element.style.setProperty('--tilt-x', '0deg');
      element.style.setProperty('--tilt-y', '0deg');
      element.style.setProperty('--spot-x', '50%');
      element.style.setProperty('--spot-y', '18%');
    });
  });

  if (enableTilt) {
    window.addEventListener('pointermove', (event) => {
      pointerForTilt.x = event.clientX;
      pointerForTilt.y = event.clientY;
      if (tiltFrame) return;
      tiltFrame = requestAnimationFrame(applyTilt);
    }, { passive: true });
  }

  const bindMagnetics = () => {
    const magneticTargets = document.querySelectorAll([
      '.academic-button',
      '.site-nav a',
      '.nav-more > summary',
      '.hero-actions a',
      '.contact-card a',
      '.portal-card',
      '.list-button',
      '.search-hit',
      '.external-source-card',
      '.local-result-card',
      '.gateway-card'
    ].join(','));

    magneticTargets.forEach((element) => {
      if (element.classList.contains('cv-tilt')) return;
      if (element.dataset.cvMagneticBound === 'true') return;
      element.dataset.cvMagneticBound = 'true';
      element.classList.add('cv-magnetic');

      const reset = () => {
        element.style.setProperty('--magnetic-x', '0px');
        element.style.setProperty('--magnetic-y', '0px');
        element.style.setProperty('--magnetic-scale', '1');
      };

      if (!enableMagnetic) {
        return;
      }

      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = ((event.clientX - (rect.left + rect.width / 2)) / (rect.width || 1)) * 9;
        const y = ((event.clientY - (rect.top + rect.height / 2)) / (rect.height || 1)) * 9;
        const magneticX = Math.max(-10, Math.min(10, x));
        const magneticY = Math.max(-8, Math.min(8, y));

        element.style.setProperty('--magnetic-x', `${magneticX.toFixed(2)}px`);
        element.style.setProperty('--magnetic-y', `${magneticY.toFixed(2)}px`);
        element.style.setProperty('--magnetic-scale', '1');
      }, { passive: true });

      element.addEventListener('pointerleave', reset, { passive: true });
      element.addEventListener('pointerdown', () => {
        element.style.setProperty('--magnetic-scale', '0.985');
      });
      element.addEventListener('pointerup', reset);
      element.addEventListener('focus', () => {
        element.style.setProperty('--magnetic-scale', '1.01');
      }, true);
      element.addEventListener('blur', reset, true);
    });
  };

  const ensureScrollRail = () => {
    if (document.querySelector('.cv-scroll-rail')) return;
    const rail = document.createElement('div');
    rail.className = 'cv-scroll-rail';
    body.appendChild(rail);

    const updateProgress = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = window.scrollY / max;
      root.style.setProperty('--cv-scroll-progress', `${progress}`);
    };

    const scheduleUpdate = () => {
      if (scrollRailFrame) return;
      scrollRailFrame = requestAnimationFrame(() => {
        scrollRailFrame = 0;
        updateProgress();
      });
    };

    updateProgress();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
  };

  const syncParallax = () => {
    const apply = () => {
      const hero = document.querySelector('.academic-hero');
      const offset = Math.min(120, window.scrollY * 0.12);
      const scrollScale = shouldThrottleSections ? 0.08 : 0.12;
      const scaledOffset = Math.min(120, window.scrollY * scrollScale);
      root.style.setProperty('--cv-parallax-offset', `${-offset.toFixed(2)}px`);
      if (scaledOffset !== 0) {
        root.style.setProperty('--cv-parallax-offset', `${-scaledOffset.toFixed(2)}px`);
      }
    };

    const onScroll = () => {
      if (scrollProgressFrame) return;
      scrollProgressFrame = requestAnimationFrame(() => {
        scrollProgressFrame = 0;
        apply();
      });
    };

    const hero = document.querySelector('.academic-hero');
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    if (hero) hero.classList.add('cv-hero-parallax');
  };

  const searchPanel = document.querySelector('.command-search');
  const searchInput = document.querySelector('#homeSearch');
  if (searchPanel && searchInput) {
    searchPanel.classList.add('cv-magnetic');
    searchInput.addEventListener('focus', () => searchPanel.classList.add('is-command-active'));
    searchInput.addEventListener('blur', () => searchPanel.classList.remove('is-command-active'));
  }

  const quickSearches = document.querySelectorAll('.quick-searches button[data-query]');
  quickSearches.forEach((button) => {
    button.addEventListener('click', () => {
      const query = button.getAttribute('data-query');
      if (query && searchInput) {
        searchInput.value = query;
      }
    });
  });


  bindMagnetics();
  ensureScrollRail();
  syncParallax();
})();
