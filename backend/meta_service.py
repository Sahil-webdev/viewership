import os
import re
import httpx
from urllib.parse import urlparse, parse_qs
from typing import Optional
from time import time

META_API_VERSION = "v21.0"
META_GRAPH_URL = f"https://graph.facebook.com/{META_API_VERSION}"

_ACCESS_TOKEN: Optional[str] = None
_BUSINESS_ID: Optional[str] = None
_APP_ID: Optional[str] = None
_APP_SECRET: Optional[str] = None
_BUSINESS_USERNAME: Optional[str] = None
_PAGE_TOKEN: Optional[str] = None
_PAGE_ID: Optional[str] = None
_DISCOVERY_CACHE: dict[str, tuple[float, dict[str, dict]]] = {}


def configure(app_id: str, app_secret: str, access_token: str, business_id: str):
    global _ACCESS_TOKEN, _BUSINESS_ID, _APP_ID, _APP_SECRET
    _ACCESS_TOKEN = access_token
    _BUSINESS_ID = business_id
    _APP_ID = app_id
    _APP_SECRET = app_secret


def configure_facebook(page_id: str, page_token: str):
    global _PAGE_ID, _PAGE_TOKEN
    _PAGE_ID = page_id
    _PAGE_TOKEN = page_token


def is_configured() -> bool:
    return bool(_ACCESS_TOKEN and _BUSINESS_ID)


def meta_feature_available() -> bool:
    return is_configured()


def meta_data_accuracy_note() -> str:
    return "View counts sourced from official Meta Graph API."


# ---------- URL helpers ----------

def is_instagram_url(url: str) -> bool:
    return bool(re.search(r"(?:^|\.)(instagram\.com)$", urlparse(url.strip()).netloc.lower()))


def is_instagram_post_url(url: str) -> bool:
    path = urlparse(url.strip()).path.lower()
    return "/p/" in path or "/reel/" in path or "/tv/" in path


def is_instagram_account_url(url: str) -> bool:
    parsed = urlparse(url.strip())
    host = parsed.netloc.lower()
    if "instagram.com" not in host:
        return False
    parts = [p for p in parsed.path.split("/") if p]
    if len(parts) != 1:
        return False
    username = parts[0]
    blocked = {"p", "reel", "tv", "explore", "accounts", "stories"}
    return username.lower() not in blocked


def is_facebook_url(url: str) -> bool:
    host = urlparse(url.strip()).netloc.lower()
    return "facebook.com" in host or "fb.watch" in host


def is_facebook_post_url(url: str) -> bool:
    parsed = urlparse(url.strip())
    host = parsed.netloc.lower()
    path = parsed.path.lower()
    if "fb.watch" in host:
        return True
    if "facebook.com" not in host:
        return False
    if "/reel/" in path or "/videos/" in path:
        return True
    if "/share/v/" in path or "/share/r/" in path or "/share/p/" in path:
        return True
    if path.startswith("/watch") and parse_qs(parsed.query).get("v"):
        return True
    return False


def extract_instagram_shortcode(url: str) -> Optional[str]:
    parsed = urlparse(url.strip())
    parts = [p for p in parsed.path.split("/") if p]
    if len(parts) < 2:
        return None
    if parts[0].lower() in {"p", "reel", "tv"}:
        return parts[1]
    return None


def extract_instagram_username(url: str) -> Optional[str]:
    parsed = urlparse(url.strip())
    parts = [p for p in parsed.path.split("/") if p]
    if len(parts) != 1:
        return None
    username = parts[0].strip()
    if not username:
        return None
    return username


# ---------- Generic Meta API helpers ----------

def _meta_get(path: str, params: dict = None, use_page_token: bool = False) -> Optional[dict]:
    if not _ACCESS_TOKEN:
        return None
    if params is None:
        params = {}
    params["access_token"] = _PAGE_TOKEN if (use_page_token and _PAGE_TOKEN) else _ACCESS_TOKEN
    try:
        with httpx.Client(timeout=30) as client:
            url = f"{META_GRAPH_URL}{path}"
            r = client.get(url, params=params)
            if r.status_code == 200:
                return r.json()
            return None
    except Exception:
        return None


# ---------- Instagram ----------

def _get_business_username() -> Optional[str]:
    global _BUSINESS_USERNAME
    if _BUSINESS_USERNAME:
        return _BUSINESS_USERNAME
    data = _meta_get(f"/{_BUSINESS_ID}", {"fields": "username"})
    if data:
        _BUSINESS_USERNAME = data.get("username")
    return _BUSINESS_USERNAME


def _to_app_access_token() -> Optional[str]:
    if _APP_ID and _APP_SECRET:
        return f"{_APP_ID}|{_APP_SECRET}"
    return None


def _get_oembed_author_username(post_url: str) -> Optional[str]:
    app_token = _to_app_access_token()
    if not app_token:
        return None
    try:
        with httpx.Client(timeout=15) as client:
            r = client.get(
                f"{META_GRAPH_URL}/instagram_oembed",
                params={"url": post_url, "access_token": app_token},
            )
            if r.status_code != 200:
                return None
            data = r.json()
    except Exception:
        return None

    author_url = (data.get("author_url") or "").strip()
    if author_url:
        parsed = urlparse(author_url)
        parts = [p for p in parsed.path.split("/") if p]
        if parts:
            return parts[0].lstrip("@")

    author_name = (data.get("author_name") or "").strip()
    if not author_name:
        return None
    candidate = author_name.lstrip("@")
    if " " in candidate:
        return None
    return candidate


def _get_media_with_views_via_business_discovery(username: Optional[str] = None) -> dict[str, dict]:
    username = (username or _get_business_username() or "").strip()
    if not username:
        return {}
    cache_key = username.lower()
    now = time()
    cached = _DISCOVERY_CACHE.get(cache_key)
    if cached and (now - cached[0] < 300):
        return cached[1]

    fields = (
        "business_discovery.username("
        + username
        + "){media.limit(100){id,media_type,permalink,like_count,comments_count,view_count,timestamp,caption}}"
    )
    data = _meta_get(f"/{_BUSINESS_ID}", {"fields": fields})
    if not data:
        return {}
    bd = data.get("business_discovery", {})
    media_list = bd.get("media", {}).get("data", [])
    result: dict[str, dict] = {}
    for item in media_list:
        permalink = item.get("permalink", "")
        sc = extract_instagram_shortcode(permalink)
        if sc:
            result[sc] = item

    _DISCOVERY_CACHE[cache_key] = (now, result)
    return result


def get_instagram_post_details(url: str) -> Optional[dict]:
    if not is_configured():
        return None
    shortcode = extract_instagram_shortcode(url)
    if not shortcode:
        return None
    cache = _get_media_with_views_via_business_discovery()
    item = cache.get(shortcode)
    if not item:
        author_username = _get_oembed_author_username(url)
        if author_username:
            author_cache = _get_media_with_views_via_business_discovery(author_username)
            item = author_cache.get(shortcode)
    if not item:
        return None
    views = int(item.get("view_count", 0) or 0)
    if views == 0 and item.get("media_type") == "VIDEO":
        views = int(item.get("like_count", 0) or 0)
    if views == 0:
        views = int(item.get("like_count", 0) or 0)
    caption = item.get("caption", "") or ""
    title = caption[:90] if caption else "Instagram post"
    canonical_path = "reel" if item.get("media_type") == "VIDEO" else "p"
    canonical_url = f"https://www.instagram.com/{canonical_path}/{shortcode}/"
    thumbnail = ""
    if item.get("media_type") == "VIDEO":
        thumbnail = item.get("media_url", "")
    return {
        "shortcode": shortcode,
        "url": canonical_url,
        "title": title,
        "thumbnail": thumbnail,
        "views": int(views or 0),
        "likes": int(item.get("like_count", 0)),
        "comments": int(item.get("comments_count", 0)),
        "published_at": item.get("timestamp", ""),
        "is_video": item.get("media_type") == "VIDEO",
    }


def get_instagram_account_video_urls(account_url: str, max_videos: int = 30) -> list[str]:
    if not is_configured():
        return []
    max_videos = max(1, min(max_videos, 100))
    results = []
    params = {"fields": "id,media_type,permalink", "limit": min(max_videos, 50)}
    data = _meta_get(f"/{_BUSINESS_ID}/media", params)
    if not data:
        return []
    for item in data.get("data", []):
        if item.get("media_type") == "VIDEO":
            permalink = item.get("permalink", "")
            results.append(permalink)
            if len(results) >= max_videos:
                break
    return results


def get_instagram_account_info() -> Optional[dict]:
    return _meta_get(f"/{_BUSINESS_ID}", {"fields": "id,username,profile_picture_url,name,followers_count,media_count"})


# ---------- Facebook ----------

def _extract_facebook_video_id(url: str) -> Optional[str]:
    parsed = urlparse(url.strip())
    path = parsed.path.strip("/")
    qs = parse_qs(parsed.query)
    if qs.get("v"):
        return qs.get("v", [None])[0]
    parts = [p for p in path.split("/") if p]
    if not parts:
        return None
    if parts[0].lower() in {"reel", "videos"} and len(parts) > 1 and parts[1].isdigit():
        return parts[1]
    if "videos" in [p.lower() for p in parts]:
        for i, p in enumerate(parts):
            if p.lower() == "videos" and i + 1 < len(parts) and parts[i + 1].isdigit():
                return parts[i + 1]
    return None


def get_facebook_post_details(url: str) -> Optional[dict]:
    if not _PAGE_TOKEN:
        return None
    vid = _extract_facebook_video_id(url)
    if not vid:
        return None
    data = _meta_get(f"/{vid}", {
        "fields": "id,title,description,permalink_url,views,thumbnails{uri}",
    }, use_page_token=True)
    if not data:
        return None
    views = int(data.get("views") or 0)
    thumb = ""
    thumbs = data.get("thumbnails", {}).get("data") or []
    if thumbs and isinstance(thumbs[0], dict):
        thumb = thumbs[0].get("uri") or ""
    title = (data.get("title") or data.get("description") or "Facebook Video").strip()
    permalink = data.get("permalink_url") or f"https://www.facebook.com/watch/?v={vid}"
    return {
        "url": permalink,
        "title": title[:120] if title else "Facebook Video",
        "thumbnail": thumb,
        "views": max(views, 0),
    }


def get_facebook_page_video_urls(page_url: str, max_videos: int = 30) -> list[str]:
    if not _PAGE_TOKEN or not _PAGE_ID:
        return []
    max_videos = max(1, min(max_videos, 100))
    results = []
    params = {
        "fields": "id,permalink_url",
        "limit": min(max_videos, 50),
    }
    data = _meta_get(f"/{_PAGE_ID}/videos", params, use_page_token=True)
    if not data:
        return []
    for item in data.get("data", []):
        url = item.get("permalink_url", "")
        if url:
            results.append(url)
            if len(results) >= max_videos:
                break
    return results
