/**
 * YouTube 聊天「網頁方式」：經本機 8765 /api/yt-chat 拉 Innertube（含自訂貼圖）。
 */
(function (global) {
  function proxyBases() {
    const bases = [];
    try {
      if (
        /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(location.origin)
      ) {
        bases.push(location.origin);
      }
    } catch (_) {}
    bases.push("http://127.0.0.1:8765");
    return bases;
  }

  async function fetchChat({ videoId, channel, continuation }) {
    const bases = proxyBases();
    let lastErr = null;
    for (let i = 0; i < bases.length; i++) {
      const base = bases[i];
      try {
        const url = new URL(base + "/api/yt-chat");
        if (videoId) url.searchParams.set("v", videoId);
        if (channel) url.searchParams.set("c", channel);
        if (continuation) url.searchParams.set("continuation", continuation);
        url.searchParams.set("t", String(Date.now()));
        const res = await fetch(url.toString(), { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            (json && json.error) || "yt-chat proxy " + res.status
          );
        }
        if (!json || !json.continuation) {
          throw new Error("bad yt-chat payload");
        }
        return json;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("網頁聊天需要本機伺服器（8765）");
  }

  /**
   * @param {object} opts
   * @param {() => Promise<string>} opts.getVideoId
   * @param {(msg: object) => void} opts.addMessage
   * @param {(connected: boolean, info?: object) => void} [opts.onStatus]
   * @param {string} [opts.label]
   * @param {string} [opts.channel] 無 video 時用頻道找 live
   * @param {() => boolean} [opts.shouldReset] 回 true 時清 continuation
   */
  function startPoll(opts) {
    const getVideoId = opts.getVideoId;
    const addMessage = opts.addMessage;
    const onStatus = opts.onStatus || function () {};
    const label = opts.label || "yt";
    const channel = opts.channel || "";
    const shouldReset = opts.shouldReset || function () {
      return false;
    };

    let continuation = "";
    let videoId = "";
    let seen = new Set();
    let fail = 0;
    let stopped = false;

    async function tick() {
      if (stopped) return;
      try {
        if (shouldReset()) {
          continuation = "";
          videoId = "";
        }
        if (!videoId && typeof getVideoId === "function") {
          videoId = (await getVideoId()) || "";
        }
        const payload = await fetchChat({
          videoId: videoId || "",
          channel: videoId ? "" : channel,
          continuation,
        });
        if (payload.videoId) videoId = payload.videoId;
        continuation = payload.continuation || "";
        const wait = Math.max(1500, Number(payload.timeoutMs) || 5000);
        (payload.messages || []).forEach((m) => {
          if (!m || !m.id || seen.has(m.id)) return;
          seen.add(m.id);
          if (seen.size > 500) {
            seen = new Set(Array.from(seen).slice(-200));
          }
          if (!m.text && !(m.parts && m.parts.length)) return;
          addMessage({
            platform: "yt",
            user: m.user || "youtube",
            text: m.text || "",
            parts: m.parts || [],
            avatar: m.avatar || "",
            channel: label,
            isMod: !!m.isMod,
            isSub: !!m.isSub,
            isVip: !!m.isVip,
            isOwner: !!m.isOwner,
          });
        });
        fail = 0;
        onStatus(true, { videoId, label });
        setTimeout(tick, wait);
      } catch (err) {
        console.warn(err);
        fail += 1;
        onStatus(false, { error: err, label });
        if (fail >= 3) {
          continuation = "";
          videoId = "";
        }
        setTimeout(tick, Math.min(15000, 3000 * fail));
      }
    }

    tick();
    return {
      stop: function () {
        stopped = true;
      },
    };
  }

  global.ObsYtChatWeb = {
    proxyBases,
    fetchChat,
    startPoll,
  };
})(typeof window !== "undefined" ? window : this);
