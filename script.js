// JS mínimo: scroll suave + copiar número + gate para TikTok in-app browser

(() => {
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const smoothScrollTo = (targetSelector) => {
    const el = document.querySelector(targetSelector);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
  };

  const showToast = (msg, variant = "default") => {
    const toast = document.getElementById("globalToast");
    if (!toast) return;
    const textEl = toast.querySelector(".toast-text");
    if (textEl) textEl.textContent = msg;
    else toast.textContent = msg;

    toast.classList.remove("toast-cyan");
    if (variant === "cyan") toast.classList.add("toast-cyan");

    toast.classList.add("is-open");
    window.clearTimeout(toast.__t);
    toast.__t = window.setTimeout(() => {
      toast.classList.remove("is-open");
      toast.classList.remove("toast-cyan");
    }, 2200);
  };

  const setupLogoFallback = () => {
    const img = document.querySelector(".logo");
    const fallback = document.querySelector(".logo-fallback");
    if (!img || !fallback) return;
    fallback.style.display = "none";
    img.addEventListener(
      "error",
      () => {
        img.style.display = "none";
        fallback.style.display = "inline-flex";
      },
      { once: true }
    );
    if (img.complete && img.naturalWidth === 0) {
      img.dispatchEvent(new Event("error"));
    }
  };

  const copyText = async (text, promptLabel) => {
    try {
      if (!navigator.clipboard || !window.isSecureContext)
        throw new Error("Clipboard no disponible");
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ok = window.prompt(promptLabel, text);
      return ok !== null;
    }
  };

  const syncStickyHeight = () => {
    const sticky = document.querySelector(".sticky-cta");
    if (!sticky) return;
    const h = Math.ceil(sticky.getBoundingClientRect().height);
    if (h > 0) {
      document.documentElement.style.setProperty("--sticky-h", `${h}px`);
    }
  };

  syncStickyHeight();
  requestAnimationFrame(syncStickyHeight);
  window.addEventListener("load", syncStickyHeight, { passive: true });
  window.addEventListener("resize", syncStickyHeight, { passive: true });
  window.addEventListener("orientationchange", syncStickyHeight, { passive: true });

  const isTikTokInApp = () => {
    const ua = navigator.userAgent || "";
    const ref = document.referrer || "";
    const uaMatch = /tiktok|musical[._]ly|bytedance|BytedanceWebview|tt_webview/i.test(ua);
    const refMatch = /tiktok\.com/i.test(ref);
    const debugParam = new URLSearchParams(window.location.search).get("tiktok") === "1";
    return uaMatch || refMatch || debugParam;
  };

  const gateEl = document.getElementById("inAppGate");

  const trackEvent = (name, data = {}) => {
    if (typeof window.va !== "function") return;
    window.va('event', {
      name,
      data
    });
  };

  const openGate = (reason = "unknown") => {
    if (!gateEl) return;
    const firstOpen = gateEl.hidden;
    gateEl.hidden = false;
    document.body.classList.add("gate-open");
    const copyBtn = gateEl.querySelector("[data-copy-link]");
    if (copyBtn) copyBtn.focus();
    if (firstOpen) {
      trackEvent('tiktok_gate_open', { reason });
    }
  };

  const closeGate = () => {
    if (!gateEl) return;
    gateEl.hidden = true;
    document.body.classList.remove("gate-open");
  };

  const getWaSource = (waLink) => {
    return (
      waLink.getAttribute('data-wa-source') ||
      (waLink.classList.contains('sticky-btn') && 'sticky') ||
      (waLink.classList.contains('nav-cta') && 'header') ||
      (waLink.classList.contains('footer-link') && 'footer') ||
      'unknown'
    );
  };

  const goToWhatsApp = (waLink) => {
    const href = waLink.getAttribute('href');
    if (!href) return;
    const target = waLink.getAttribute('target');
    if (target === '_blank') {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }
    window.location.href = href;
  };

  const trackWhatsAppClick = (waLink) => {
    const source = getWaSource(waLink);
    trackEvent('whatsapp_click', { source });
    return source;
  };

  if (isTikTokInApp()) {
    requestAnimationFrame(() => openGate('auto_detect_tiktok'));
  }

  document.addEventListener("click", async (e) => {
    const waLink = e.target.closest('a[href*="wa.me/"]');
    if (waLink) {
      const source = getWaSource(waLink);
      if (isTikTokInApp() && gateEl) {
        e.preventDefault();
        trackEvent('whatsapp_click_blocked_inapp', { source });
        openGate('whatsapp_click');
        return;
      }

      e.preventDefault();
      trackWhatsAppClick(waLink);
      window.setTimeout(() => goToWhatsApp(waLink), 120);
      return;
    }

    const scrollBtn = e.target.closest("[data-scroll-to]");
    if (scrollBtn) {
      const sel = scrollBtn.getAttribute("data-scroll-to");
      smoothScrollTo(sel);
      return;
    }

    const copyNumberBtn = e.target.closest("[data-copy-number]");
    if (copyNumberBtn) {
      const number = "+57 3137478899";
      const ok = await copyText(number, "Copia el número:");
      if (ok) showToast("Número copiado");
      return;
    }

    const copyLinkBtn = e.target.closest("[data-copy-link]");
    if (copyLinkBtn) {
      const url = window.location.origin + window.location.pathname + '?utm_source=tiktok&utm_medium=inapp';
      const ok = await copyText(url, "Copia el enlace:");
      if (ok) {
        trackEvent('landing_link_copied', { source: 'tiktok_gate' });
        showToast("Enlace copiado", "cyan");
      }
      return;
    }

    const closeBtn = e.target.closest("[data-close-gate]");
    if (closeBtn) {
      closeGate();
      return;
    }
  });


  // ── Scroll reveal ────────────────────────────────────────────
  const revealEls = document.querySelectorAll(".reveal, .reveal-group");
  if (revealEls.length && "IntersectionObserver" in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => obs.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("is-visible"));
  }

  // ── Ripple posicionado en botones ────────────────────────────
  document.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest(".btn, .sticky-btn, .sticky-copy, .inapp-copy-btn, .nav-cta");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const rx = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + "%";
    const ry = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + "%";
    btn.style.setProperty("--rx", rx);
    btn.style.setProperty("--ry", ry);
  }, { passive: true });

    document.documentElement.style.scrollBehavior = prefersReduced ? "auto" : "smooth";
  setupLogoFallback();
})();