/**
 * Twitch IRC 貼圖（emotes tag）→ DOM
 * emotes 格式：id:start-end,start-end/id:start-end
 * 位置以 IRC 字串 UTF-16 代碼單元計（與 JS string 索引一致）。
 */
(function (global) {
  function parseIrcTags(tagStr) {
    const tags = {};
    String(tagStr || "")
      .split(";")
      .forEach((kv) => {
        if (!kv) return;
        const i = kv.indexOf("=");
        if (i < 0) tags[kv] = "";
        else tags[kv.slice(0, i)] = kv.slice(i + 1);
      });
    return tags;
  }

  function parseTwitchEmoteRanges(emotesTag) {
    const raw = String(emotesTag || "").trim();
    if (!raw) return [];
    const ranges = [];
    raw.split("/").forEach((part) => {
      if (!part) return;
      const colon = part.indexOf(":");
      if (colon < 0) return;
      const id = part.slice(0, colon);
      const spans = part.slice(colon + 1);
      if (!id || !spans) return;
      spans.split(",").forEach((span) => {
        const dash = span.indexOf("-");
        if (dash < 0) return;
        const start = parseInt(span.slice(0, dash), 10);
        const end = parseInt(span.slice(dash + 1), 10);
        if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return;
        ranges.push({ id, start, end });
      });
    });
    ranges.sort((a, b) => a.start - b.start || a.end - b.end);
    return ranges;
  }

  function twitchEmoteUrl(id, scale) {
    const s = scale === 1 || scale === "1.0" ? "1.0" : scale === 3 || scale === "3.0" ? "3.0" : "2.0";
    return (
      "https://static-cdn.jtvnw.net/emoticons/v2/" +
      encodeURIComponent(String(id)) +
      "/default/dark/" +
      s
    );
  }

  function fillTextWithTwitchEmotes(el, text, emotesTag, opts) {
    if (!el) return;
    const msg = text == null ? "" : String(text);
    el.textContent = "";
    const ranges = parseTwitchEmoteRanges(emotesTag);
    if (!ranges.length) {
      el.appendChild(document.createTextNode(msg));
      return;
    }
    const scale = (opts && opts.scale) || 2;
    const className = (opts && opts.className) || "emote";
    let cursor = 0;
    ranges.forEach((r) => {
      if (r.start > cursor) {
        el.appendChild(document.createTextNode(msg.slice(cursor, r.start)));
      }
      if (r.start < cursor) return;
      const name = msg.slice(r.start, r.end + 1) || "emote";
      const img = document.createElement("img");
      img.className = className;
      img.alt = name;
      img.title = name;
      img.decoding = "async";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.src = twitchEmoteUrl(r.id, scale);
      img.onerror = () => {
        try {
          img.replaceWith(document.createTextNode(name));
        } catch (_) {}
      };
      el.appendChild(img);
      cursor = r.end + 1;
    });
    if (cursor < msg.length) {
      el.appendChild(document.createTextNode(msg.slice(cursor)));
    }
  }

  global.ObsChatEmote = {
    parseIrcTags,
    parseTwitchEmoteRanges,
    twitchEmoteUrl,
    fillTextWithTwitchEmotes,
  };
})(window);
