/* 子頁讀取入口寫入的 資料/stream-live.js（file:// 用 script 載入較穩） */
(function (global) {
  var PATHS = ["../資料/stream-live.js", "資料/stream-live.js"];
  var last = null;

  function loadScript(src) {
    return new Promise(function (resolve) {
      var s = document.createElement("script");
      s.src = src + (src.indexOf("?") >= 0 ? "&" : "?") + "t=" + Date.now();
      s.onload = function () {
        resolve(true);
      };
      s.onerror = function () {
        resolve(false);
      };
      document.head.appendChild(s);
    });
  }

  async function fetchSharedStreamLive() {
    for (var i = 0; i < PATHS.length; i++) {
      var before = global.__MY_OBS_STREAM_LIVE__;
      var ok = await loadScript(PATHS[i]);
      if (!ok) continue;
      var cur = global.__MY_OBS_STREAM_LIVE__;
      if (cur && cur !== before) {
        last = cur;
        return last;
      }
      if (cur && (cur.mode || cur.ts)) {
        last = cur;
        return last;
      }
    }
    return last;
  }

  global.MyObsStreamLiveSync = {
    fetchSharedStreamLive: fetchSharedStreamLive,
    getLast: function () {
      return last || global.__MY_OBS_STREAM_LIVE__ || null;
    },
  };
})(typeof window !== "undefined" ? window : this);
