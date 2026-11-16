/* OBS 覆蓋頁：從網址參數套用字形（fontFamily / fontUrl） */
(function (global) {
  function cssVar(name, value) {
    if (value) document.documentElement.style.setProperty(name, value);
  }

  function guessFormat(url) {
    const s = String(url || "").toLowerCase();
    if (s.includes(".woff2")) return "woff2";
    if (s.includes(".woff")) return "woff";
    if (s.includes(".otf")) return "opentype";
    if (s.includes(".ttf") || s.includes(".ttc")) return "truetype";
    return "";
  }

  function escapeCssString(s) {
    return String(s || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  /**
   * @param {URLSearchParams} params
   * @param {{ cssVar?: Function }=} opts
   */
  function applyFromParams(params, opts) {
    const setVar = (opts && opts.cssVar) || cssVar;
    const family = String(
      params.get("fontFamily") || params.get("font") || ""
    ).trim();
    const fontUrl = String(params.get("fontUrl") || "").trim();
    if (!family && !fontUrl) return;

    let useFamily = family || "ObsCustomFont";
    if (fontUrl) {
      const fmt = guessFormat(fontUrl);
      const src = fmt
        ? `url('${escapeCssString(fontUrl)}') format('${fmt}')`
        : `url('${escapeCssString(fontUrl)}')`;
      const id = "obs-font-face-style";
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement("style");
        el.id = id;
        document.head.appendChild(el);
      }
      el.textContent =
        "@font-face{font-family:'" +
        escapeCssString(useFamily) +
        "';src:" +
        src +
        ";font-display:swap;}";
      useFamily = "'" + useFamily + "'";
    } else if (!/^['"]/.test(useFamily)) {
      // 多個後備字可用逗號；單一名稱加引號較穩
      if (useFamily.indexOf(",") < 0) useFamily = "'" + useFamily.replace(/'/g, "") + "'";
    }

    const stack = useFamily + ", sans-serif";
    const numStack = useFamily + ", monospace";
    setVar("--font-zh", stack);
    setVar("--font-num", numStack);
    setVar("--font", stack);
    try {
      document.body.style.fontFamily = stack;
    } catch (_) {}
  }

  global.ObsFontStyle = {
    applyFromParams: applyFromParams,
  };
})(typeof window !== "undefined" ? window : this);
