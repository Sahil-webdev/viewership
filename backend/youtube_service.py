import httpx
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlparse, parse_qs
import re

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3"


def _youtube_get(path: str, params: dict) -> Optional[dict]:
    if not YOUTUBE_API_KEY:
        return None
    req_params = {**params, "key": YOUTUBE_API_KEY}
    url = f"{YOUTUBE_API_URL}/{path}"
    try:
        with httpx.Client(timeout=12) as client:
            response = client.get(url, params=req_params)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        print(f"[YouTube API Error] {path}: {e}")
        return None


def extract_video_id(url: str) -> Optional[str]:
    url = url.strip()
    try:
        if "youtu.be/" in url:
            return url.split("youtu.be/")[-1].split("?")[0].split("&")[0].split("#")[0]
        if "youtube.com/shorts/" in url:
            return url.split("youtube.com/shorts/")[-1].split("?")[0].split("#")[0]
        if "youtube.com/embed/" in url:
            return url.split("youtube.com/embed/")[-1].split("?")[0].split("#")[0]
        if "youtube.com/watch" in url:
            parsed = urlparse(url)
            qs = parse_qs(parsed.query)
            return qs.get("v", [None])[0]
        if "youtube.com/v/" in url:
            return url.split("youtube.com/v/")[-1].split("?")[0].split("#")[0]
    except Exception:
        pass
    return None


def get_video_details(video_id: str) -> Optional[dict]:
    data = _youtube_get("videos", {
        "part": "snippet,statistics,contentDetails",
        "id": video_id,
    })
    if data and data.get("items"):
        item = data["items"][0]
        snippet = item["snippet"]
        statistics = item.get("statistics", {})

        return {
            "video_id": video_id,
            "title": snippet.get("title", "Unknown Title"),
            "thumbnail": snippet.get("thumbnails", {})
            .get("high", {})
            .get("url", snippet.get("thumbnails", {}).get("default", {}).get("url", "")),
            "channel_title": snippet.get("channelTitle", ""),
            "published_at": snippet.get("publishedAt", ""),
            "views": int(statistics.get("viewCount", 0)),
            "likes": int(statistics.get("likeCount", 0)),
            "comments": int(statistics.get("commentCount", 0)),
        }

    return None


def search_video_by_query(query: str) -> Optional[dict]:
    try:
        data = _youtube_get("search", {
            "part": "snippet",
            "q": query,
            "type": "video",
            "maxResults": 1,
        })
        if not data:
            return None

        if data.get("items"):
            item = data["items"][0]
            if item.get("id", {}).get("kind") == "youtube#video":
                real_id = item["id"]["videoId"]
                snippet = item["snippet"]

                stats_data = _youtube_get("videos", {
                    "part": "statistics,contentDetails",
                    "id": real_id,
                }) or {}

                statistics = {}
                if stats_data.get("items"):
                    statistics = stats_data["items"][0].get("statistics", {})

                return {
                    "video_id": real_id,
                    "title": snippet.get("title", "Unknown Title"),
                    "thumbnail": snippet.get("thumbnails", {})
                    .get("high", {})
                    .get("url", snippet.get("thumbnails", {}).get("default", {}).get("url", "")),
                    "channel_title": snippet.get("channelTitle", ""),
                    "published_at": snippet.get("publishedAt", ""),
                    "views": int(statistics.get("viewCount", 0)),
                    "likes": int(statistics.get("likeCount", 0)),
                    "comments": int(statistics.get("commentCount", 0)),
                }
    except Exception as e:
        print(f"[YouTube Search Error] {e}")

    return None


def get_video_views(video_id: str) -> Optional[int]:
    details = get_video_details(video_id)
    return details["views"] if details else None


def _extract_channel_hint(channel_url: str) -> Optional[tuple[str, str]]:
    raw = channel_url.strip()
    if not raw:
        return None

    if re.fullmatch(r"UC[0-9A-Za-z_-]{20,}", raw):
        return ("channel_id", raw)
    if raw.startswith("@"):
        return ("handle", raw)

    parsed = urlparse(raw)
    host = parsed.netloc.lower()
    if "youtube.com" not in host and "youtu.be" not in host:
        return None

    path = parsed.path.strip("/")
    if not path:
        return None

    segments = path.split("/")
    first = segments[0]

    if first.startswith("@"):
        return ("handle", first)
    if first == "channel" and len(segments) > 1:
        return ("channel_id", segments[1])
    if first == "user" and len(segments) > 1:
        return ("username", segments[1])
    if first == "c" and len(segments) > 1:
        return ("custom", segments[1])

    return None


def resolve_channel_id(channel_url: str) -> Optional[str]:
    hint = _extract_channel_hint(channel_url)
    if not hint:
        return None

    hint_type, value = hint
    if hint_type == "channel_id":
        return value

    if hint_type == "handle":
        candidates = [value]
        if value.startswith("@"):
            candidates.append(value[1:])
        for handle in candidates:
            data = _youtube_get("channels", {"part": "id", "forHandle": handle})
            if data and data.get("items"):
                return data["items"][0]["id"]

    if hint_type == "username":
        data = _youtube_get("channels", {"part": "id", "forUsername": value})
        if data and data.get("items"):
            return data["items"][0]["id"]

    if hint_type in {"custom", "username"}:
        data = _youtube_get("search", {
            "part": "snippet",
            "q": value,
            "type": "channel",
            "maxResults": 1,
        })
        if data and data.get("items"):
            return data["items"][0].get("snippet", {}).get("channelId")

    return None


def get_channel_video_urls(channel_url: str, max_videos: int = 20) -> list[str]:
    if max_videos < 1:
        max_videos = 1
    if max_videos > 100:
        max_videos = 100

    channel_id = resolve_channel_id(channel_url)
    if not channel_id:
        return []

    details = _youtube_get("channels", {
        "part": "contentDetails",
        "id": channel_id,
    })
    if not details or not details.get("items"):
        return []

    uploads_playlist = details["items"][0].get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")
    if not uploads_playlist:
        return []

    video_urls: list[str] = []
    seen: set[str] = set()
    next_page_token = None

    while len(video_urls) < max_videos:
        remaining = max_videos - len(video_urls)
        page_size = min(50, remaining)
        params = {
            "part": "snippet",
            "playlistId": uploads_playlist,
            "maxResults": page_size,
        }
        if next_page_token:
            params["pageToken"] = next_page_token

        page = _youtube_get("playlistItems", params)
        if not page:
            break

        for item in page.get("items", []):
            vid = item.get("snippet", {}).get("resourceId", {}).get("videoId")
            if not vid or vid in seen:
                continue
            seen.add(vid)
            video_urls.append(f"https://www.youtube.com/watch?v={vid}")
            if len(video_urls) >= max_videos:
                break

        next_page_token = page.get("nextPageToken")
        if not next_page_token:
            break

    return video_urls


def fetch_historical_view_estimates(video_id: str, current_views: int, published_at: str) -> list[dict]:
    if not published_at:
        return [{"date": datetime.utcnow().date().isoformat(), "views": current_views, "growth": 0}]

    try:
        published_date = datetime.fromisoformat(published_at.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return [{"date": datetime.utcnow().date().isoformat(), "views": current_views, "growth": 0}]

    today = datetime.utcnow().date()
    days_since_publish = (today - published_date.date()).days

    if days_since_publish <= 0:
        return [{"date": today.isoformat(), "views": current_views, "growth": 0}]

    max_days = min(days_since_publish, 90)
    history = []

    if max_days <= 1:
        return [{"date": published_date.date().isoformat(), "views": current_views, "growth": 0}]

    accumulated = 0
    for i in range(max_days - 1, -1, -1):
        date = today - timedelta(days=i)
        progress = (max_days - i) / max_days
        daily_share = (1 + progress * 3) / (max_days * 2)
        daily_views = max(1, int(current_views * daily_share))
        accumulated += daily_views

        if accumulated > current_views:
            accumulated = current_views

        growth = 0
        if len(history) > 0 and history[-1]["views"] > 0:
            growth = round(((accumulated - history[-1]["views"]) / history[-1]["views"]) * 100, 2)
            growth = max(0, min(growth, 50))

        history.append({
            "date": date.isoformat(),
            "views": accumulated,
            "growth": growth,
        })

    if history and history[-1]["views"] < current_views:
        history[-1]["views"] = current_views

    return history
