(() => {
  const FAMILY = "Material Symbols Outlined";
  // 以本腳本所在目錄為基準（入口在根目錄、子頁在 子頁/ 都能找到 fonts/）
  const SCRIPT_BASE = document.currentScript
    ? new URL(".", document.currentScript.src).href
    : new URL(".", location.href).href;
  const LOCAL_FONT = new URL("fonts/MaterialSymbolsOutlined.ttf", SCRIPT_BASE).href;
  const CACHE_NAME = "my-obs-tools-ms-fonts-v1";
  const GOOGLE_TIMEOUT_MS = 3000;

  // 常用預設圖：本機精簡 TTF／file:// 缺 glyph 時用 SVG，避免露出 event_upcoming 文字
  const SVG_PATHS = {
    event_upcoming:
      "M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM12 10v4.17l2.59-2.58L16 13l-4 4-4-4 1.41-1.41L11 14.17V10h1z",
    hourglass_empty:
      "M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4zm-4-5l-4-4V4h8v3.5l-4 4z",
    sports_esports:
      "M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-1h2V8h1v2h2v1zm4-1.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z",
    visibility:
      "M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    videocam:
      "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z",
    calendar_month:
      "M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5zm2 4h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z",
    schedule:
      "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
    plus_one:
      "M10 8H8v4H4v2h4v4h2v-4h4v-2h-4zm4.5-1.92.66-1.33H18v7.25h-1.5V7.5h-1.92zM19.5 14v-1.5h-3.81l2.66-3.19-.84-.81L13.5 12.66V14H19.5z",
  };

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
}
.ms-svg-icon {
  width: 1em;
  height: 1em;
  display: block;
  fill: currentColor;
  flex: 0 0 auto;
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

  function mountSvgIcon(slot, name, className) {
    const n = normalizeMsName(name);
    const d = SVG_PATHS[n];
    if (!slot || !d) return false;
    slot.innerHTML = "";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", className || "ms-svg-icon icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("d", d);
    svg.appendChild(path);
    slot.appendChild(svg);
    return true;
  }

  function ligatureLooksBroken(el) {
    try {
      const r = el.getBoundingClientRect();
      if (!r.height || r.height < 2) return true;
      // 圖示應接近正方形；露出 event_upcoming 文字會明顯變寬
      if (r.width > r.height * 1.65) return true;
      if (r.width < 2) return true;
      return false;
    } catch (_) {
      return true;
    }
  }

  /**
   * 掛 Material 圖示。
   * 讀不到／缺 glyph：改 SVG（若有）；連 SVG 也沒有就留空，絕不露出英文名文字。
   * @returns {Promise<'google'|'cache'|'local'|'svg'|'hidden'>}
   */
  async function mountIcon(slot, rawName, opts = {}) {
    if (!slot) return "hidden";
    const name = normalizeMsName(rawName);
    if (!name) {
      slot.innerHTML = "";
      return "hidden";
    }
    injectCss(localFontFaceCss(), "ms-symbols-local");

    // 已知預設：直接 SVG（OBS／file:// 最穩），不算「補文字」
    if (opts.forceSvg && SVG_PATHS[name]) {
      mountSvgIcon(slot, name, opts.svgClass);
      return "svg";
    }

    slot.innerHTML = "";
    const span = document.createElement("span");
    span.className = opts.spanClass || "material-symbols-outlined icon";
    span.setAttribute("aria-hidden", "true");
    span.textContent = name;
    // 成功前保持隱藏，避免缺字時把 icon 名稱叠上去
    span.style.visibility = "hidden";
    slot.appendChild(span);

    let source = "local";
    try {
      source = await ensureMaterialSymbols([name]);
    } catch (_) {
      source = "local";
    }
    if (document.fonts && document.fonts.load) {
      try {
        await document.fonts.load(`500 24px "${FAMILY}"`);
      } catch (_) {}
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const broken = ligatureLooksBroken(span) || source === "local";
    if (!broken) {
      span.style.visibility = "";
      return source;
    }
    if (SVG_PATHS[name]) {
      mountSvgIcon(slot, name, opts.svgClass);
      return "svg";
    }
    // 讀不到就留空，不補文字
    slot.innerHTML = "";
    return "hidden";
  }

  window.MyObsMaterialIcons = {
    FAMILY,
    LOCAL_FONT,
    SVG_PATHS,
    normalizeMsName,
    ensureMaterialSymbols,
    mountSvgIcon,
    mountIcon,
  };
})();
