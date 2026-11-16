#!/usr/bin/env node
/**
 * Tiny static server for media playlist (YouTube needs http:// not file://)
 * + /api/yt-viewers?v=VIDEO_ID  （網頁 live_stats，不耗 Data API 配額）
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

function httpsGetText(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": UA,
          "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
        },
      },
      (r) => {
        const chunks = [];
        r.on("data", (c) => chunks.push(c));
        r.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (r.statusCode && r.statusCode >= 400) {
            reject(new Error("http " + r.statusCode));
            return;
          }
          resolve(body);
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(8000, () => {
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
    req.setTimeout(8000, () => {
      req.destroy(new Error("timeout"));
    });
    req.write(body);
    req.end();
  });
}

async function fetchYtViewers(videoId) {
  // 1) 舊版 live_stats：回純數字＝正在看的人數
  try {
    const text = (
      await httpsGetText(
        "https://www.youtube.com/live_stats?v=" + encodeURIComponent(videoId)
      )
    ).trim();
    if (/^\d+$/.test(text)) {
      const n = parseInt(text, 10);
      return { live: n > 0 || text === "0", viewers: n, source: "live_stats" };
    }
  } catch (_) {}

  // 2) Innertube player：直播時 viewCount 常是同時觀看
  try {
    const j = await httpsPostJson(
      "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
      {
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20250323.01.00",
            hl: "zh-TW",
            gl: "TW",
          },
        },
        videoId,
      }
    );
    const details = j && j.videoDetails;
    if (details && (details.isLive || details.isLiveContent)) {
      const n = parseInt(String(details.viewCount || "0"), 10);
      if (Number.isFinite(n)) {
        return { live: true, viewers: n, source: "innertube" };
      }
    }
    if (details && details.videoId) {
      return { live: false, viewers: 0, source: "innertube" };
    }
  } catch (_) {}

  throw new Error("yt web viewers unavailable");
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
  console.log("");
  console.log("  Keep this window open.");
  console.log("  Copy media URL from entry -> paste into OBS.");
  console.log("");
});
