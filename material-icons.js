(() => {
  const FAMILY = "Material Symbols Outlined";
  // 以本腳本所在目錄為基準（入口在根目錄、子頁在 子頁/ 都能找到 fonts/）
  const SCRIPT_BASE = document.currentScript
    ? new URL(".", document.currentScript.src).href
    : new URL(".", location.href).href;
  const LOCAL_FONT = new URL("fonts/MaterialSymbolsOutlined.ttf", SCRIPT_BASE).href;
  const CACHE_NAME = "my-obs-tools-ms-fonts-v1";
  const GOOGLE_TIMEOUT_MS = 3000;

  function normalizeMsName(raw) {
    return String(raw || "")
      .trim()
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/[\s-]+/g, "_")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
  }

  function injectCss(text, id) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = text;
  }

  function localFontFaceCss() {
    return `
@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 100 700;
  font-display: block;
  src: url('${LOCAL_FONT}') format('truetype');
}
.material-symbols-outlined {
  font-family: '${FAMILY}', sans-serif;
  font-weight: normal;
  font-style: normal;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: "liga";
  font-feature-settings: "liga";
}`;
  }

  function googleCssUrl(names) {
    const list = [
      ...new Set(
        (Array.isArray(names) ? names : [names])
          .map(normalizeMsName)
          .filter(Boolean)
      ),
    ].join(",");
    return (
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,500,0,0&icon_names=" +
      encodeURIComponent(list) +
      "&display=block"
    );
  }

  async function cacheGoogleCssAndFonts(cssText) {
    if (!("caches" in window)) return;
    const cache = await caches.open(CACHE_NAME);
    await cache.put(
      "material-symbols.css",
      new Response(cssText, { headers: { "Content-Type": "text/css" } })
    );
    const urls = [...cssText.matchAll(/url\(([^)]+)\)/g)].map((m) =>
      m[1].replace(/['"]/g, "").trim()
    );
    await Promise.all(
      urls.map(async (u) => {
        if (!u) return;
        try {
          const res = await fetch(u, { mode: "cors" });
          if (res.ok) await cache.put(u, res.clone());
        } catch (_) {}
      })
    );
  }

  async function loadCachedGoogleCss() {
    if (!("caches" in window)) return null;
    try {
      const cache = await caches.open(CACHE_NAME);
      const res = await cache.match("material-symbols.css");
      return res ? await res.text() : null;
    } catch (_) {
      return null;
    }
  }

  /**
   * Google Fonts 優先；成功會快取。失敗則用上次快取，再不行用內建 fonts/。
   * @returns {'google'|'cache'|'local'}
   */
  async function ensureMaterialSymbols(names) {
    // 先掛本機字型，確保離線／Google 掛了也有預設圖示
    injectCss(localFontFaceCss(), "ms-symbols-local");

    const url = googleCssUrl(names);
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), GOOGLE_TIMEOUT_MS);
      const res = await fetch(url, { signal: ctrl.signal, mode: "cors" });
      clearTimeout(timer);
      if (!res.ok) throw new Error("google css " + res.status);
      const cssText = await res.text();
      injectCss(cssText, "ms-symbols-google");
      cacheGoogleCssAndFonts(cssText).catch(() => {});
      if (document.fonts && document.fonts.load) {
        try {
          await document.fonts.load(`500 24px "${FAMILY}"`);
        } catch (_) {}
      }
      return "google";
    } catch (_) {
      const cached = await loadCachedGoogleCss();
      if (cached) {
        injectCss(cached, "ms-symbols-google");
        return "cache";
      }
      return "local";
    }
  }

  window.MyObsMaterialIcons = {
    FAMILY,
    LOCAL_FONT,
    normalizeMsName,
    ensureMaterialSymbols,
  };
})();
