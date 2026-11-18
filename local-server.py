#!/usr/bin/env python3
# Tiny static server with CORS for entry page ping from file://
# + /api/yt-viewers?v=VIDEO_ID  (YouTube live_stats / innertube, no Data API quota)
# + /api/yt-chat?v=VIDEO_ID[&continuation=…]  (Innertube chat with custom emoji)
import json
import os
import re
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse, urljoin, quote

PORT = int(os.environ.get("PORT", "8765"))
ROOT = os.path.dirname(os.path.abspath(__file__))
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)
INNERTUBE_CLIENT = {
    "clientName": "WEB",
    "clientVersion": "2.20250323.01.00",
    "hl": "zh-TW",
    "gl": "TW",
}
FALLBACK_INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8"
HEADERS = {
    "User-Agent": UA,
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
    "Cookie": "CONSENT=YES+1; SOCS=CAI",
}


def http_get_text(url, redirects_left=4):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            body = resp.read().decode("utf-8", "replace")
            return {"url": resp.geturl(), "body": body, "status": resp.status}
    except urllib.error.HTTPError as err:
        if 300 <= err.code < 400 and err.headers.get("Location") and redirects_left > 0:
            nxt = urljoin(url, err.headers.get("Location"))
            return http_get_text(nxt, redirects_left - 1)
        raise


def http_post_json(url, payload):
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            **HEADERS,
            "Content-Type": "application/json",
            "Origin": "https://www.youtube.com",
            "Referer": "https://www.youtube.com/",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=12) as resp:
        return json.loads(resp.read().decode("utf-8", "replace"))


def extract_json_assign(html, name):
    m = re.search(re.escape(name) + r"\s*=\s*(\{)", html or "")
    if not m:
        return None
    i = m.start(1)
    depth = 0
    in_str = False
    esc = False
    while i < len(html):
        ch = html[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            i += 1
            continue
        if ch == '"':
            in_str = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(html[m.start(1) : i + 1])
                except Exception:
                    return None
        i += 1
    return None


def extract_video_id_from_url(raw):
    try:
        u = urlparse(raw or "")
        qs = parse_qs(u.query or "")
        v = (qs.get("v") or [""])[0]
        if re.fullmatch(r"[\w-]{11}", v or ""):
            return v
        parts = [p for p in (u.path or "").split("/") if p]
        if parts and parts[0] in ("live", "shorts") and len(parts) > 1:
            if re.fullmatch(r"[\w-]{11}", parts[1]):
                return parts[1]
    except Exception:
        pass
    return ""


def fetch_yt_viewers(video_id):
    # 1) live_stats
    try:
        got = http_get_text("https://www.youtube.com/live_stats?v=" + video_id)
        text = (got.get("body") or "").strip()
        if re.fullmatch(r"\d+", text):
            n = int(text)
            return {"live": True, "viewers": n, "source": "live_stats"}
    except Exception:
        pass

    # 2) innertube player
    try:
        data = http_post_json(
            "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
            {"context": {"client": INNERTUBE_CLIENT}, "videoId": video_id},
        )
        details = (data or {}).get("videoDetails") or {}
        if details.get("isLive") or details.get("isLiveContent"):
            n = int(str(details.get("viewCount") or "0"))
            return {"live": True, "viewers": n, "source": "innertube"}
        if details.get("videoId"):
            return {"live": False, "viewers": 0, "source": "innertube"}
    except Exception:
        pass

    raise RuntimeError("yt web viewers unavailable")


def pick_continuation(obj_list):
    for c in obj_list or []:
        data = (
            c.get("timedContinuationData")
            or c.get("invalidationContinuationData")
            or c.get("reloadContinuationData")
            or {}
        )
        cont = data.get("continuation")
        if cont:
            return {
                "continuation": cont,
                "timeoutMs": int(data.get("timeoutMs") or 5000),
            }
    return None


def parse_message_runs(runs):
    parts = []
    text = ""
    for run in runs or []:
        if not isinstance(run, dict):
            continue
        emoji = run.get("emoji")
        if emoji:
            thumbs = ((emoji.get("image") or {}).get("thumbnails")) or []
            url = (thumbs[-1].get("url") if thumbs else "") or ""
            shortcuts = emoji.get("shortcuts") or []
            label = shortcuts[0] if shortcuts else (emoji.get("emojiId") or "emoji")
            part = {
                "type": "emoji",
                "text": str(label),
                "url": str(url),
                "isCustom": bool(emoji.get("isCustomEmoji")),
            }
            text += part["text"]
            parts.append(part)
            continue
        if "text" in run and run.get("text") is not None:
            t = str(run.get("text"))
            text += t
            parts.append({"type": "text", "text": t})
    return text, parts


def parse_author_badges(badges):
    is_mod = False
    is_sub = False
    is_owner = False
    for b in badges or []:
        r = (b or {}).get("liveChatAuthorBadgeRenderer") or {}
        tip = str(
            r.get("tooltip")
            or ((r.get("accessibility") or {}).get("accessibilityData") or {}).get("label")
            or ""
        ).lower()
        icon = str(((r.get("icon") or {}).get("iconType")) or "").upper()
        if icon == "MODERATOR" or "moderator" in tip or "管理員" in tip or "版主" in tip:
            is_mod = True
        if icon == "OWNER" or "owner" in tip or "擁有者" in tip or "creator" in tip:
            is_owner = True
            is_mod = True
        if (
            r.get("customThumbnail")
            or "member" in tip
            or "會員" in tip
            or "sponsor" in tip
        ):
            is_sub = True
    return {"isMod": is_mod, "isSub": is_sub, "isOwner": is_owner, "isVip": False}


def parse_chat_actions(payload):
    actions = (
        ((payload or {}).get("continuationContents") or {})
        .get("liveChatContinuation", {})
        .get("actions")
        or []
    )
    messages = []
    for action in actions:
        item = ((action or {}).get("addChatItemAction") or {}).get("item")
        if not item:
            replay = (action or {}).get("replayChatItemAction") or {}
            nested = (replay.get("actions") or [{}])[0]
            item = ((nested or {}).get("addChatItemAction") or {}).get("item")
        if not item:
            continue
        renderer = item.get("liveChatTextMessageRenderer") or item.get(
            "liveChatPaidMessageRenderer"
        )
        if not renderer or not renderer.get("id"):
            continue
        text, parts = parse_message_runs(((renderer.get("message") or {}).get("runs")) or [])
        if not text and not parts:
            continue
        thumbs = ((renderer.get("authorPhoto") or {}).get("thumbnails")) or []
        avatar = (thumbs[-1].get("url") if thumbs else "") or ""
        flags = parse_author_badges(renderer.get("authorBadges") or [])
        messages.append(
            {
                "id": renderer.get("id"),
                "user": ((renderer.get("authorName") or {}).get("simpleText")) or "youtube",
                "text": text,
                "parts": parts,
                "avatar": avatar,
                "isMod": flags["isMod"],
                "isSub": flags["isSub"],
                "isVip": False,
                "isOwner": flags["isOwner"],
            }
        )
    return messages


def bootstrap_yt_chat(video_id):
    got = http_get_text("https://www.youtube.com/watch?v=" + quote(video_id))
    html = got.get("body") or ""
    key_m = re.search(r'"INNERTUBE_API_KEY":"([^"]+)"', html)
    api_key = key_m.group(1) if key_m else FALLBACK_INNERTUBE_KEY
    data = extract_json_assign(html, "ytInitialData") or {}
    live_chat = (
        ((data.get("contents") or {}).get("twoColumnWatchNextResults") or {})
        .get("conversationBar", {})
        .get("liveChatRenderer")
    )
    picked = pick_continuation((live_chat or {}).get("continuations") or [])
    if not picked:
        raise RuntimeError("yt web chat unavailable (no live chat)")
    return {
        "apiKey": api_key,
        "continuation": picked["continuation"],
        "timeoutMs": picked["timeoutMs"],
    }


def resolve_yt_live_video_id(channel_raw):
    raw = (channel_raw or "").strip()
    if not raw:
        raise RuntimeError("bad channel")
    if re.fullmatch(r"UC[\w-]{20,}", raw, flags=re.I):
        path_part = "/channel/" + raw
    elif raw.startswith("@"):
        path_part = "/" + raw
    elif re.fullmatch(r"[\w.-]+", raw):
        path_part = "/@" + raw
    else:
        raise RuntimeError("bad channel")
    got = http_get_text("https://www.youtube.com" + path_part + "/live")
    vid = extract_video_id_from_url(got.get("url") or "")
    if vid:
        return vid
    m = re.search(
        r'canonical"\s+href="(https://www\.youtube\.com/watch\?v=[\w-]{11})"',
        got.get("body") or "",
    )
    if m:
        vid = extract_video_id_from_url(m.group(1))
        if vid:
            return vid
    m2 = re.search(r'"videoId":"([\w-]{11})"', got.get("body") or "")
    if m2:
        return m2.group(1)
    raise RuntimeError("yt channel not live")


def fetch_yt_chat(video_id, continuation=""):
    api_key = FALLBACK_INNERTUBE_KEY
    cont = (continuation or "").strip()
    bootstrapped = False
    if not cont:
        boot = bootstrap_yt_chat(video_id)
        api_key = boot["apiKey"]
        cont = boot["continuation"]
        bootstrapped = True
    url = (
        "https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key="
        + quote(api_key)
        + "&prettyPrint=false"
    )
    payload = None
    try:
        payload = http_post_json(
            url, {"context": {"client": INNERTUBE_CLIENT}, "continuation": cont}
        )
    except Exception:
        if bootstrapped:
            raise
        boot = bootstrap_yt_chat(video_id)
        api_key = boot["apiKey"]
        url = (
            "https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key="
            + quote(api_key)
            + "&prettyPrint=false"
        )
        payload = http_post_json(
            url,
            {
                "context": {"client": INNERTUBE_CLIENT},
                "continuation": boot["continuation"],
            },
        )
    next_c = pick_continuation(
        (
            ((payload or {}).get("continuationContents") or {})
            .get("liveChatContinuation", {})
            .get("continuations")
        )
        or []
    )
    if not next_c:
        raise RuntimeError("yt web chat ended")
    return {
        "videoId": video_id,
        "messages": parse_chat_actions(payload),
        "continuation": next_c["continuation"],
        "timeoutMs": max(1500, int(next_c.get("timeoutMs") or 5000)),
        "source": "innertube",
    }


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

    def _send_json(self, status, obj):
        raw = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/yt-viewers":
            qs = parse_qs(parsed.query or "")
            video_id = (qs.get("v") or [""])[0].strip()
            if not re.fullmatch(r"[\w-]{11}", video_id):
                self._send_json(400, {"error": "bad video id"})
                return
            try:
                self._send_json(200, fetch_yt_viewers(video_id))
            except Exception as err:
                self._send_json(502, {"error": str(err)})
            return
        if parsed.path == "/api/yt-chat":
            qs = parse_qs(parsed.query or "")
            video_id = (qs.get("v") or [""])[0].strip()
            channel = (qs.get("c") or qs.get("channel") or [""])[0].strip()
            continuation = (qs.get("continuation") or [""])[0].strip()
            try:
                if not video_id and channel:
                    video_id = resolve_yt_live_video_id(channel)
                if not re.fullmatch(r"[\w-]{11}", video_id or ""):
                    self._send_json(400, {"error": "bad video id"})
                    return
                self._send_json(200, fetch_yt_chat(video_id, continuation))
            except Exception as err:
                self._send_json(502, {"error": str(err)})
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
    print("  YT chat:    /api/yt-chat?v=VIDEO_ID[&continuation=…]")
    print("  Keep this window open.")
    print("")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
