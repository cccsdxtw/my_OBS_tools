#!/usr/bin/env node
/**
 * Tiny static server for media playlist (YouTube needs http:// not file://).
 * Usage: node local-server.js
 */
const http = require("http");
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
};

const server = http.createServer((req, res) => {
  try {
    const u = new URL(req.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(u.pathname || "/");
    if (pathname === "/") pathname = "/入口.html";
    const fp = path.normalize(path.join(root, pathname.replace(/^\//, "")));
    if (!fp.startsWith(root)) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    fs.readFile(fp, (err, buf) => {
      if (err) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      const type = mime[path.extname(fp).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": type,
        "Cache-Control": "no-store",
      });
      res.end(buf);
    });
  } catch (err) {
    res.writeHead(500);
    res.end(String(err && err.message ? err.message : err));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log("");
  console.log("  Local media server");
  console.log("  http://127.0.0.1:" + port + "/");
  console.log("");
  console.log("  Keep this window open.");
  console.log("  Open 入口.html -> copy media URL -> paste into OBS.");
  console.log("  URL should start with http://127.0.0.1:" + port + "/");
  console.log("");
});
