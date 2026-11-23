#!/usr/bin/env node
/**
 * Tiny static server for media playlist (YouTube needs http:// not file://)
 * + /api/yt-viewers?v=VIDEO_ID  （網頁 live_stats，不耗 Data API 配額）
 * + /api/yt-chat?v=VIDEO_ID[&continuation=…]  （Innertube 聊天含自訂貼圖）
 * Usage: node local-server.js
 */
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const root = __dirname;
const port = Number(process.env.PORT || 8765);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".bat": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".py": "text/plain; charset=utf-8",
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const INNERTUBE_CLIENT = {
  clientName: "WEB",
  clientVersion: "2.20250323.01.00",
  hl: "zh-TW",
  gl: "TW",
};
const FALLBACK_INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

function sendCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Cache-Control", "no-store");
}

function sendJson(res, status, obj) {
  sendCors(res);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

function httpsGetText(url, redirectsLeft) {
  const left = redirectsLeft == null ? 4 : redirectsLeft;
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": UA,
          "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
          Cookie: "CONSENT=YES+1; SOCS=CAI",
        },
      },
      (r) => {
        if (
          r.statusCode &&
          r.statusCode >= 300 &&
          r.statusCode < 400 &&
          r.headers.location &&
          left > 0
        ) {
          const next = new URL(r.headers.location, url).toString();
          r.resume();
          httpsGetText(next, left - 1).then(resolve, reject);
          return;
        }
        const chunks = [];
        r.on("data", (c) => chunks.push(c));
        r.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (r.statusCode && r.statusCode >= 400) {
            reject(new Error("http " + r.statusCode));
            return;
          }
          resolve({ url: url, body: body, statusCode: r.statusCode || 200 });
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(12000, () => {
      req.destroy(new Error("timeout"));
    });
  });
}

function httpsPostJson(url, payload) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(payload);
    const req = https.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "User-Agent": UA,
          "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
          Origin: "https://www.youtube.com",
          Referer: "https://www.youtube.com/",
        },
      },
      (r) => {
        const chunks = [];
        r.on("data", (c) => chunks.push(c));
        r.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          if (r.statusCode && r.statusCode >= 400) {
            reject(new Error("http " + r.statusCode));
            return;
          }
          try {
            resolve(JSON.parse(text));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(12000, () => {
      req.destroy(new Error("timeout"));
    });
    req.write(body);
    req.end();
  });
}

function extractJsonAssign(html, name) {
  const re = new RegExp(name + "\\s*=\\s*(\\{)");
  const m = String(html || "").match(re);
  if (!m) return null;
  let i = m.index + m[0].length - 1;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(m.index + m[0].length - 1, i + 1));
        } catch (_) {
          return null;
        }
      }
    }
  }
  return null;
}

function extractVideoIdFromUrl(raw) {
  try {
    const u = new URL(String(raw || ""), "https://www.youtube.com");
    const v = u.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) return v;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0] === "live" && parts[1] && /^[\w-]{11}$/.test(parts[1])) {
      return parts[1];
    }
    if (parts[0] === "shorts" && parts[1] && /^[\w-]{11}$/.test(parts[1])) {
      return parts[1];
    }
  } catch (_) {}
  return "";
}

async function fetchYtViewers(videoId) {
  // 先確認「正在直播」；已結束／一般影片的 viewCount＝累計觀看，不能當同時人數
  let details = null;
  try {
    const j = await httpsPostJson(
      "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
      {
        context: { client: INNERTUBE_CLIENT },
        videoId,
      }
    );
    details = j && j.videoDetails;
  } catch (_) {}

  const isLiveNow = !!(details && details.isLive);
  if (details && details.videoId && !isLiveNow) {
    // isLiveContent 仍可能是過去直播／首播 VOD → 人數顯示 0
    return { live: false, viewers: 0, source: "innertube" };
  }

  // 確認直播中：優先 live_stats（同時人數）
  if (isLiveNow) {
    try {
      const got = await httpsGetText(
        "https://www.youtube.com/live_stats?v=" + encodeURIComponent(videoId)
      );
      const text = String(got.body || "").trim();
      if (/^\d+$/.test(text)) {
        const n = parseInt(text, 10);
        if (Number.isFinite(n)) {
          return { live: true, viewers: n, source: "live_stats" };
        }
      }
    } catch (_) {}

    // live_stats 失敗時：僅在 isLive 時才用 viewCount（此時才是同時觀看）
    const n = parseInt(String((details && details.viewCount) || "0"), 10);
    if (Number.isFinite(n)) {
      return { live: true, viewers: n, source: "innertube" };
    }
  }

  throw new Error("yt web viewers unavailable");
}

function pickContinuationFromLiveChat(liveChatRenderer) {
  const conts = (liveChatRenderer && liveChatRenderer.continuations) || [];
  for (let i = 0; i < conts.length; i++) {
    const c = conts[i] || {};
    const data =
      c.timedContinuationData ||
      c.invalidationContinuationData ||
      c.reloadContinuationData;
    if (data && data.continuation) {
      return {
        continuation: data.continuation,
        timeoutMs: Number(data.timeoutMs) || 5000,
      };
    }
  }
  return null;
}

function pickContinuationFromPayload(payload) {
  const conts =
    (payload &&
      payload.continuationContents &&
      payload.continuationContents.liveChatContinuation &&
      payload.continuationContents.liveChatContinuation.continuations) ||
    [];
  for (let i = 0; i < conts.length; i++) {
    const c = conts[i] || {};
    const data =
      c.timedContinuationData ||
      c.invalidationContinuationData ||
      c.reloadContinuationData;
    if (data && data.continuation) {
      return {
        continuation: data.continuation,
        timeoutMs: Number(data.timeoutMs) || 5000,
      };
    }
  }
  return null;
}

function parseEmojiRun(run) {
  const emoji = run && run.emoji;
  if (!emoji) return null;
  const thumbs = (emoji.image && emoji.image.thumbnails) || [];
  const last = thumbs.length ? thumbs[thumbs.length - 1] : null;
  const url = (last && last.url) || "";
  const label =
    (emoji.shortcuts && emoji.shortcuts[0]) ||
    emoji.emojiId ||
    (run && run.text) ||
    "emoji";
  return {
    type: "emoji",
    text: String(label),
    url: String(url || ""),
    isCustom: !!emoji.isCustomEmoji,
  };
}

function parseMessageRuns(runs) {
  const parts = [];
  let text = "";
  (runs || []).forEach((run) => {
    if (!run) return;
    if (run.text != null && !run.emoji) {
      const t = String(run.text);
      text += t;
      parts.push({ type: "text", text: t });
      return;
    }
    const em = parseEmojiRun(run);
    if (em) {
      text += em.text;
      parts.push(em);
      return;
    }
    if (run.text != null) {
      const t = String(run.text);
      text += t;
      parts.push({ type: "text", text: t });
    }
  });
  return { text, parts };
}

function parseAuthorBadges(badges) {
  let isMod = false;
  let isSub = false;
  let isOwner = false;
  (badges || []).forEach((b) => {
    const r = (b && b.liveChatAuthorBadgeRenderer) || {};
    const tip = String(r.tooltip || r.accessibility?.accessibilityData?.label || "").toLowerCase();
    const icon = String((r.icon && r.icon.iconType) || "").toUpperCase();
    if (
      icon === "MODERATOR" ||
      tip.includes("moderator") ||
      tip.includes("管理員") ||
      tip.includes("版主")
    ) {
      isMod = true;
    }
    if (
      icon === "OWNER" ||
      tip.includes("owner") ||
      tip.includes("擁有者") ||
      tip.includes("creator")
    ) {
      isOwner = true;
      isMod = true;
    }
    if (
      tip.includes("member") ||
      tip.includes("會員") ||
      tip.includes("sponsor") ||
      !!r.customThumbnail
    ) {
      // 自訂會員徽章常只有 thumbnail
      if (r.customThumbnail || tip.includes("member") || tip.includes("會員")) {
        isSub = true;
      }
    }
  });
  return { isMod, isSub, isOwner, isVip: false };
}

function parseChatActions(payload) {
  const actions =
    (payload &&
      payload.continuationContents &&
      payload.continuationContents.liveChatContinuation &&
      payload.continuationContents.liveChatContinuation.actions) ||
    [];
  const messages = [];
  actions.forEach((action) => {
    const item =
      (action && action.addChatItemAction && action.addChatItemAction.item) ||
      (action &&
        action.replayChatItemAction &&
        action.replayChatItemAction.actions &&
        action.replayChatItemAction.actions[0] &&
        action.replayChatItemAction.actions[0].addChatItemAction &&
        action.replayChatItemAction.actions[0].addChatItemAction.item) ||
      null;
    if (!item) return;
    const renderer =
      item.liveChatTextMessageRenderer ||
      item.liveChatPaidMessageRenderer ||
      null;
    if (!renderer || !renderer.id) return;
    const parsed = parseMessageRuns(
      (renderer.message && renderer.message.runs) || []
    );
    if (!parsed.text && !(parsed.parts && parsed.parts.length)) return;
    const thumbs =
      (renderer.authorPhoto && renderer.authorPhoto.thumbnails) || [];
    const avatar = thumbs.length ? thumbs[thumbs.length - 1].url || "" : "";
    const flags = parseAuthorBadges(renderer.authorBadges);
    messages.push({
      id: renderer.id,
      user:
        (renderer.authorName && renderer.authorName.simpleText) || "youtube",
      text: parsed.text,
      parts: parsed.parts,
      avatar: avatar,
      isMod: flags.isMod,
      isSub: flags.isSub,
      isVip: false,
      isOwner: flags.isOwner,
    });
  });
  return messages;
}

async function bootstrapYtChat(videoId) {
  const got = await httpsGetText(
    "https://www.youtube.com/watch?v=" + encodeURIComponent(videoId)
  );
  const html = got.body || "";
  const keyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  const apiKey = (keyMatch && keyMatch[1]) || FALLBACK_INNERTUBE_KEY;
  const data = extractJsonAssign(html, "ytInitialData");
  const liveChat =
    data &&
    data.contents &&
    data.contents.twoColumnWatchNextResults &&
    data.contents.twoColumnWatchNextResults.conversationBar &&
    data.contents.twoColumnWatchNextResults.conversationBar.liveChatRenderer;
  const picked = pickContinuationFromLiveChat(liveChat);
  if (!picked || !picked.continuation) {
    throw new Error("yt web chat unavailable (no live chat)");
  }
  return {
    apiKey,
    continuation: picked.continuation,
    timeoutMs: picked.timeoutMs || 5000,
  };
}

async function resolveYtLiveVideoId(channelRaw) {
  const raw = String(channelRaw || "").trim();
  if (!raw) throw new Error("bad channel");
  let pathPart = "";
  if (/^UC[\w-]{20,}$/i.test(raw)) pathPart = "/channel/" + raw;
  else if (raw.startsWith("@")) pathPart = "/" + raw;
  else if (/^[\w.-]+$/.test(raw)) pathPart = "/@" + raw;
  else throw new Error("bad channel");
  const got = await httpsGetText("https://www.youtube.com" + pathPart + "/live");
  const fromFinal = extractVideoIdFromUrl(got.url);
  if (fromFinal) return fromFinal;
  const fromBody = extractVideoIdFromUrl(
    (got.body.match(
      /canonical"\s+href="(https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11})"/
    ) || [])[1] || ""
  );
  if (fromBody) return fromBody;
  const m = got.body.match(/"videoId":"([\w-]{11})"/);
  if (m) return m[1];
  throw new Error("yt channel not live");
}

async function fetchYtChat(videoId, continuation) {
  let apiKey = FALLBACK_INNERTUBE_KEY;
  let cont = String(continuation || "").trim();
  let bootstrapped = false;
  if (!cont) {
    const boot = await bootstrapYtChat(videoId);
    apiKey = boot.apiKey;
    cont = boot.continuation;
    bootstrapped = true;
  }
  let payload;
  try {
    payload = await httpsPostJson(
      "https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=" +
        encodeURIComponent(apiKey) +
        "&prettyPrint=false",
      {
        context: { client: INNERTUBE_CLIENT },
        continuation: cont,
      }
    );
  } catch (err) {
    if (!bootstrapped) {
      const boot = await bootstrapYtChat(videoId);
      apiKey = boot.apiKey;
      payload = await httpsPostJson(
        "https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=" +
          encodeURIComponent(apiKey) +
          "&prettyPrint=false",
        {
          context: { client: INNERTUBE_CLIENT },
          continuation: boot.continuation,
        }
      );
    } else {
      throw err;
    }
  }
  const next = pickContinuationFromPayload(payload);
  if (!next || !next.continuation) {
    throw new Error("yt web chat ended");
  }
  return {
    videoId,
    messages: parseChatActions(payload),
    continuation: next.continuation,
    timeoutMs: Math.max(1500, next.timeoutMs || 5000),
    source: "innertube",
  };
}

const server = http.createServer((req, res) => {
  try {
    if (req.method === "OPTIONS") {
      sendCors(res);
      res.writeHead(204);
      res.end();
      return;
    }
    const u = new URL(req.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(u.pathname || "/");

    if (pathname === "/api/yt-viewers") {
      const videoId = String(u.searchParams.get("v") || "").trim();
      if (!/^[\w-]{11}$/.test(videoId)) {
        sendJson(res, 400, { error: "bad video id" });
        return;
      }
      fetchYtViewers(videoId)
        .then((data) => sendJson(res, 200, data))
        .catch((err) =>
          sendJson(res, 502, {
            error: String(err && err.message ? err.message : err),
          })
        );
      return;
    }

    if (pathname === "/api/yt-chat") {
      const videoIdParam = String(u.searchParams.get("v") || "").trim();
      const channelParam = String(
        u.searchParams.get("c") || u.searchParams.get("channel") || ""
      ).trim();
      const continuation = String(u.searchParams.get("continuation") || "").trim();
      const run = async () => {
        let videoId = videoIdParam;
        if (!videoId && channelParam) {
          videoId = await resolveYtLiveVideoId(channelParam);
        }
        if (!/^[\w-]{11}$/.test(videoId || "")) {
          throw Object.assign(new Error("bad video id"), { status: 400 });
        }
        return fetchYtChat(videoId, continuation);
      };
      run()
        .then((data) => sendJson(res, 200, data))
        .catch((err) =>
          sendJson(res, err && err.status === 400 ? 400 : 502, {
            error: String(err && err.message ? err.message : err),
          })
        );
      return;
    }

    if (pathname === "/") pathname = "/入口.html";
    const fp = path.normalize(path.join(root, pathname.replace(/^\//, "")));
    if (!fp.startsWith(root)) {
      sendCors(res);
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    fs.readFile(fp, (err, buf) => {
      sendCors(res);
      if (err) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      const type =
        mime[path.extname(fp).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": type });
      res.end(buf);
    });
  } catch (err) {
    sendCors(res);
    res.writeHead(500);
    res.end(String(err && err.message ? err.message : err));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log("");
  console.log("  Local media server");
  console.log("  http://127.0.0.1:" + port + "/");
  console.log("  YT viewers: /api/yt-viewers?v=VIDEO_ID");
  console.log("  YT chat:    /api/yt-chat?v=VIDEO_ID[&continuation=…]");
  console.log("");
  console.log("  Keep this window open.");
  console.log("  Copy media URL from entry -> paste into OBS.");
  console.log("");
});
