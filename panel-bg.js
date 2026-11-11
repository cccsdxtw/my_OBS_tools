/**
 * 覆蓋頁共用：底圖／顯示方式／外推
 * 網址參數：panelImg、panelFit（stretch|contain|cover）、panelInset
 */
(() => {
  function cssUrl(raw) {
    const s = String(raw || "").trim();
    if (!s) return "";
    const safe = s.replace(/["'\\)]/g, "");
    return `url("${safe}")`;
  }

  function bgFitToCss(raw) {
    const s = String(raw || "")
      .trim()
      .toLowerCase();
    if (s === "contain" || s === "full" || s === "fit") return "contain";
    if (s === "cover" || s === "crop") return "cover";
    return "100% 100%";
  }

  function insetToCss(raw, fallbackPx) {
    const parts = String(raw || "")
      .trim()
      .split(/[\s,，]+/)
      .filter(Boolean)
      .map((n) => Math.max(0, Math.min(200, parseInt(n, 10) || 0)));
    if (!parts.length) {
      return fallbackPx == null ? "" : `${fallbackPx}px`;
    }
    return parts
      .slice(0, 4)
      .map((n) => `${n}px`)
      .join(" ");
  }

  /**
   * @param {URLSearchParams} params
   * @param {(name: string, value: string) => void} setVar  設定 CSS 變數
   * @param {{ defaultInset?: number }} [opts]
   */
  function applyOverlayPanelBg(params, setVar, opts) {
    const panelImg = (params.get("panelImg") || "").trim();
    if (panelImg) setVar("--panel-img", cssUrl(panelImg));
    if (panelImg || params.get("panelFit")) {
      setVar("--panel-fit", bgFitToCss(params.get("panelFit")));
    }
    const fallback =
      opts && opts.defaultInset != null
        ? opts.defaultInset
        : panelImg
          ? 12
          : null;
    const insetCss = insetToCss(params.get("panelInset"), fallback);
    if (insetCss) setVar("--panel-inset", insetCss);
  }

  window.ObsPanelBg = {
    cssUrl,
    bgFitToCss,
    insetToCss,
    applyOverlayPanelBg,
  };
})();
