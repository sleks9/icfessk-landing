// JS mínimo: scroll suave + copiar número + gate para TikTok in-app browser
// (sin emojis en strings)

(() => {
    const prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  
    const smoothScrollTo = (targetSelector) => {
      const el = document.querySelector(targetSelector);
      if (!el) return;
  
      const top = el.getBoundingClientRect().top + window.scrollY - 72; // offset header
      window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
    };
  
    const showToast = (msg) => {
      const toast = document.getElementById("globalToast");
      if (!toast) return;
  
      const textEl = toast.querySelector(".toast-text");
      if (textEl) textEl.textContent = msg;
      else toast.textContent = msg;
  
      toast.hidden = false;
      window.clearTimeout(toast.__t);
      toast.__t = window.setTimeout(() => {
        toast.hidden = true;
      }, 1600);
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
  
    // -------------------------
    // Sticky height -> CSS var (--sticky-h)
    // -------------------------
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
  
    // -------------------------
    // Gate TikTok (in-app browser)
    // -------------------------
    const isTikTokInApp = () => {
      const ua = navigator.userAgent || "";
      return /tiktok|musical\.ly|bytedance/i.test(ua);
    };
  
    const gateEl = document.getElementById("inAppGate");
  
    const openGate = () => {
      if (!gateEl) return;
  
      gateEl.hidden = false;
      document.body.classList.add("gate-open");
  
      const copyBtn = gateEl.querySelector("[data-copy-link]");
      if (copyBtn) copyBtn.focus();
    };
  
    const closeGate = () => {
      if (!gateEl) return;
      gateEl.hidden = true;
      document.body.classList.remove("gate-open");
    };
  
    // -------------------------
    // Un solo listener global (click delegation)
    // -------------------------
    document.addEventListener("click", async (e) => {
      // 0) Si se hace click en un link a WhatsApp dentro de TikTok -> gate
      const waLink = e.target.closest('a[href*="wa.me/"]');
      if (waLink && isTikTokInApp() && gateEl) {
        e.preventDefault();
        openGate();
        return;
      }
  
      // 1) Scroll suave
      const scrollBtn = e.target.closest("[data-scroll-to]");
      if (scrollBtn) {
        const sel = scrollBtn.getAttribute("data-scroll-to");
        smoothScrollTo(sel);
        return;
      }
  
      // 2) Copiar número
      const copyNumberBtn = e.target.closest("[data-copy-number]");
      if (copyNumberBtn) {
        const number = "+57 3137478899";
        const ok = await copyText(number, "Copia el número:");
        if (ok) showToast("Número copiado");
        return;
      }
  
      // 3) Gate: copiar enlace de la landing
      const copyLinkBtn = e.target.closest("[data-copy-link]");
      if (copyLinkBtn) {
        const url = window.location.href;
        const ok = await copyText(url, "Copia el enlace:");
        if (ok) showToast("Enlace copiado");
        return;
      }
  
      // 4) Gate: cerrar (botón o backdrop)
      const closeBtn = e.target.closest("[data-close-gate]");
      if (closeBtn) {
        closeGate();
        return;
      }
    });
  
    document.documentElement.style.scrollBehavior = prefersReduced ? "auto" : "smooth";
  
    setupLogoFallback();
  })();