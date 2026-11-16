#!/usr/bin/env python3
# Tiny static server with CORS for entry page ping from file://
# + /api/yt-viewers?v=VIDEO_ID  (YouTube live_stats / innertube, no Data API quota)
import json
import os
import re
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

PORT = int(os.environ.get("PORT", "8765"))
ROOT = os.path.dirname(os.path.abspath(__file__))
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)


def fetch_yt_viewers(video_id):
    headers = {"User-Agent": UA, "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8"}
    # 1) live_stats
    try:
        req = urllib.request.Request(
            "https://www.youtube.com/live_stats?v=" + video_id, headers=headers
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            text = resp.read().decode("utf-8", "replace").strip()
        if re.fullmatch(r"\d+", text):
            n = int(text)
            return {"live": True, "viewers": n, "source": "live_stats"}
    except Exception:
        pass

    # 2) innertube player
    try:
        payload = {
            "context": {
                "client": {
                    "clientName": "WEB",
                    "clientVersion": "2.20250323.01.00",
                    "hl": "zh-TW",
                    "gl": "TW",
                }
            },
            "videoId": video_id,
        }
        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
            data=body,
            headers={
                **headers,
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8", "replace"))
        details = (data or {}).get("videoDetails") or {}
        if details.get("isLive") or details.get("isLiveContent"):
            n = int(str(details.get("viewCount") or "0"))
            return {"live": True, "viewers": n, "source": "innertube"}
        if details.get("videoId"):
            return {"live": False, "viewers": 0, "source": "innertube"}
    except Exception:
        pass

    raise RuntimeError("yt web viewers unavailable")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/yt-viewers":
            qs = parse_qs(parsed.query or "")
            video_id = (qs.get("v") or [""])[0].strip()
            if not re.fullmatch(r"[\w-]{11}", video_id):
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(b'{"error":"bad video id"}')
                return
            try:
                data = fetch_yt_viewers(video_id)
                raw = json.dumps(data).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(raw)
            except Exception as err:
                raw = json.dumps({"error": str(err)}).encode("utf-8")
                self.send_response(502)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(raw)
            return
        return super().do_GET()

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print("")
    print("  Local media server")
    print("  http://127.0.0.1:%s/" % PORT)
    print("  YT viewers: /api/yt-viewers?v=VIDEO_ID")
    print("  Keep this window open.")
    print("")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
