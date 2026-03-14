// ICFESSK — script.js
// scroll suave + copiar número + gate TikTok + tracking de eventos en Supabase

(() => {
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Config Supabase (tracking de eventos) ─────────────────
  const SUPABASE_URL  = 'https://viqrfcywlduojpacdjpg.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcXJmY3l3bGR1b2pwYWNkanBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTI3MDAsImV4cCI6MjA4OTAyODcwMH0.l08XVJBySwta7d69St-eEYEBpUgrTT7dCwBEzN5o8lk';

  // ── Registrar evento en Supabase ───────────────────────────
  // fire-and-forget: no bloquea ni muestra errores al usuario
  const logEvento = (evento, source = null) => {
    const pagina = window.location.pathname.split('/').pop() || 'index';
    fetch(`${SUPABASE_URL}/rest/v1/eventos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ evento, pagina, source })
    }).catch(() => {}); // silencia errores de red
  };

  // ── Utilidades ─────────────────────────────────────────────
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
    img.addEventListener("error", () => {
      img.style.display = "none";
      fallback.style.display = "inline-flex";
    }, { once: true });
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

  // ── TikTok in-app gate ─────────────────────────────────────
  const isTikTokInApp = () => {
    const ua = navigator.userAgent || "";
    const ref = document.referrer || "";
    const uaMatch = /tiktok|musical[._]ly|bytedance|BytedanceWebview|tt_webview/i.test(ua);
    const refMatch = /tiktok\.com/i.test(ref);
    const debugParam = new URLSearchParams(window.location.search).get("tiktok") === "1";
    return uaMatch || refMatch || debugParam;
  };

  const gateEl = document.getElementById("inAppGate");

  // trackEvent sigue funcionando para Vercel Analytics si está activo
  const trackEvent = (name, data = {}) => {
    if (typeof window.va !== "function") return;
    window.va('event', { name, data });
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
      logEvento('tiktok_gate_open', reason);
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

  if (isTikTokInApp()) {
    requestAnimationFrame(() => openGate('auto_detect_tiktok'));
  }

  // ── Registro de pageview ───────────────────────────────────
  // Sabe desde qué página viene cada visita
  logEvento('pageview');

  // ── Clicks ─────────────────────────────────────────────────
  document.addEventListener("click", async (e) => {

    // Click en WhatsApp
    const waLink = e.target.closest('a[href*="wa.me/"]');
    if (waLink) {
      const source = getWaSource(waLink);
      if (isTikTokInApp() && gateEl) {
        e.preventDefault();
        trackEvent('whatsapp_click_blocked_inapp', { source });
        logEvento('whatsapp_click_blocked', source);
        openGate('whatsapp_click');
        return;
      }
      e.preventDefault();
      trackEvent('whatsapp_click', { source });
      logEvento('whatsapp_click', source);
      window.setTimeout(() => goToWhatsApp(waLink), 120);
      return;
    }

    // Click en "Ver muestra gratuita"
    const muestraBtn = e.target.closest('a[href*="muestra.html"]');
    if (muestraBtn) {
      logEvento('click_ver_muestra', 'banner_landing');
    }

    // Click en "Ver qué incluye" (scroll)
    const scrollBtn = e.target.closest("[data-scroll-to]");
    if (scrollBtn) {
      const sel = scrollBtn.getAttribute("data-scroll-to");
      logEvento('click_ver_incluye', sel);
      smoothScrollTo(sel);
      return;
    }

    // Click en copiar número
    const copyNumberBtn = e.target.closest("[data-copy-number]");
    if (copyNumberBtn) {
      const number = "+57 3137478899";
      const ok = await copyText(number, "Copia el número:");
      if (ok) {
        showToast("Número copiado");
        logEvento('copiar_numero');
      }
      return;
    }

    // Click en copiar enlace (gate TikTok)
    const copyLinkBtn = e.target.closest("[data-copy-link]");
    if (copyLinkBtn) {
      const url = window.location.origin + window.location.pathname;
      const ok = await copyText(url, "Copia el enlace:");
      if (ok) {
        trackEvent('landing_link_copied', { source: 'tiktok_gate' });
        logEvento('copiar_enlace_tiktok');
        showToast("Enlace copiado", "cyan");
      }
      return;
    }

    // Cerrar gate
    const closeBtn = e.target.closest("[data-close-gate]");
    if (closeBtn) {
      closeGate();
      return;
    }

  });

  // ── Scroll reveal ──────────────────────────────────────────
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

  // ── Ripple en botones ──────────────────────────────────────
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