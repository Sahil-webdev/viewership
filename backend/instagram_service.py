import re
import os
import time
from html import unescape
from urllib.parse import urlparse

import meta_service
import httpx

try:
    import instaloader
except Exception:
    instaloader = None

try:
    import yt_dlp
except Exception:
    yt_dlp = None

_CACHED_LOADER = None
_LOGIN_ATTEMPTED = False


def instagram_feature_available() -> bool:
    return meta_service.is_configured() or instaloader is not None


def meta_available() -> bool:
    return meta_service.is_configured()


def is_instagram_url(url: str) -> bool:
    return meta_service.is_instagram_url(url)


def is_instagram_post_url(url: str) -> bool:
    return meta_service.is_instagram_post_url(url)


def is_instagram_account_url(url: str) -> bool:
    return meta_service.is_instagram_account_url(url)


def extract_instagram_shortcode(url: str) -> str | None:
    return meta_service.extract_instagram_shortcode(url)


def extract_instagram_username(url: str) -> str | None:
    return meta_service.extract_instagram_username(url)


def _loader():
    global _CACHED_LOADER, _LOGIN_ATTEMPTED
    if instaloader is None:
        return None
    if _CACHED_LOADER is not None:
        return _CACHED_LOADER

    loader = instaloader.Instaloader(
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        download_comments=False,
        save_metadata=False,
        quiet=True,
    )
    username = os.getenv("INSTAGRAM_USERNAME", "").strip()
    password = os.getenv("INSTAGRAM_PASSWORD", "").strip()
    session_file = os.getenv("INSTAGRAM_SESSION_FILE", "").strip()
    if username and session_file:
        try:
            loader.load_session_from_file(username, filename=session_file)
            _CACHED_LOADER = loader
            return loader
        except Exception:
            pass
    if username and password and not _LOGIN_ATTEMPTED:
        _LOGIN_ATTEMPTED = True
        try:
            loader.login(username, password)
        except Exception:
            pass
    _CACHED_LOADER = loader
    return loader


def _instaloader_post_details(url: str) -> dict | None:
    if instaloader is None:
        return None
    shortcode = extract_instagram_shortcode(url)
    if not shortcode:
        return None

    delay = float(os.getenv("INSTAGRAM_FETCH_DELAY_SECONDS", "2.0") or "2.0")
    retries = max(1, int(os.getenv("INSTAGRAM_FETCH_RETRIES", "3") or "3"))

    for attempt in range(1, retries + 1):
        try:
            if delay > 0:
                time.sleep(delay)
            loader = _loader()
            post = instaloader.Post.from_shortcode(loader.context, shortcode)
            break
        except Exception as exc:
            if attempt >= retries:
                return None
            time.sleep(delay * attempt if delay > 0 else attempt)
    else:
        return None

    caption = (post.caption or "").strip()
    title = caption[:90] if caption else f"Instagram post by @{post.owner_username}"
    metric_views = 0
    if post.is_video:
        play_count = getattr(post, "video_play_count", None)
        view_count = post.video_view_count
        candidates = [v for v in [play_count, view_count] if isinstance(v, int)]
        metric_views = max(candidates) if candidates else 0
    else:
        metric_views = int(post.likes or 0)

    canonical_path = "reel" if post.is_video else "p"
    canonical_url = f"https://www.instagram.com/{canonical_path}/{post.shortcode}/"

    return {
        "shortcode": post.shortcode,
        "url": canonical_url,
        "title": title,
        "thumbnail": post.url or "",
        "views": int(metric_views or 0),
        "likes": int(post.likes or 0),
        "comments": int(post.comments or 0),
        "published_at": post.date_utc.isoformat() if post.date_utc else "",
        "is_video": bool(post.is_video),
    }


def _ytdlp_instagram_post_details(url: str) -> dict | None:
    if yt_dlp is None:
        return None
    shortcode = extract_instagram_shortcode(url)
    if not shortcode:
        return None
    opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extract_flat": False,
        "retries": 3,
        "fragment_retries": 3,
        "socket_timeout": 20,
    }
    cookie_file = os.getenv("INSTAGRAM_COOKIE_FILE", "").strip()
    if cookie_file:
        opts["cookiefile"] = cookie_file

    candidates = [url]
    base = url.split("?")[0].strip()
    if base and not base.endswith("/"):
        base = f"{base}/"
    if base and base not in candidates:
        candidates.append(base)
    if "www.instagram.com" in base:
        mobile = base.replace("www.instagram.com", "m.instagram.com")
        if mobile not in candidates:
            candidates.append(mobile)

    info = None
    for candidate in candidates:
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(candidate, download=False)
            if info:
                break
        except Exception:
            continue

    if not info or not isinstance(info, dict):
        return None

    canonical = info.get("webpage_url") or info.get("original_url") or url
    title = (info.get("title") or "Instagram Reel").strip()[:90]
    thumbnail = info.get("thumbnail") or ""
    views = int(info.get("view_count") or 0)

    return {
        "shortcode": shortcode,
        "url": canonical,
        "title": title,
        "thumbnail": thumbnail,
        "views": views,
        "likes": int(info.get("like_count") or 0),
        "comments": int(info.get("comment_count") or 0),
        "published_at": info.get("timestamp") or "",
        "is_video": True,
    }


def _parse_metric_number(raw: str) -> int:
    txt = (raw or "").strip().lower().replace(",", "")
    m = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*([kmb])?", txt)
    if not m:
        digits = re.sub(r"[^0-9]", "", txt)
        return int(digits) if digits else 0
    num = float(m.group(1))
    suffix = m.group(2) or ""
    mul = 1
    if suffix == "k":
        mul = 1_000
    elif suffix == "m":
        mul = 1_000_000
    elif suffix == "b":
        mul = 1_000_000_000
    return int(num * mul)


def _extract_html_views(html: str) -> int:
    patterns = [
        r'"video_view_count"\s*:\s*"?(?P<n>[0-9,\.kmb]+)"?',
        r'"video_play_count"\s*:\s*"?(?P<n>[0-9,\.kmb]+)"?',
        r'"play_count"\s*:\s*"?(?P<n>[0-9,\.kmb]+)"?',
        r'"view_count"\s*:\s*"?(?P<n>[0-9,\.kmb]+)"?',
        r'(?P<n>[0-9]+(?:\.[0-9]+)?[kmb]?)\s+views',
        r'(?P<n>[0-9]+(?:\.[0-9]+)?[kmb]?)\s+plays',
    ]
    candidates: list[int] = []
    for p in patterns:
        for m in re.finditer(p, html, flags=re.IGNORECASE):
            n = _parse_metric_number(m.group("n"))
            if n > 0:
                candidates.append(n)
    return max(candidates) if candidates else 0


def _extract_og(html: str, prop: str) -> str:
    pattern = rf'<meta[^>]+property=["\']{re.escape(prop)}["\'][^>]+content=["\']([^"\']+)["\']'
    m = re.search(pattern, html, flags=re.IGNORECASE)
    return unescape(m.group(1)).strip() if m else ""


def _http_instagram_post_details(url: str) -> dict | None:
    shortcode = extract_instagram_shortcode(url)
    if not shortcode:
        return None

    delay = float(os.getenv("INSTAGRAM_FETCH_DELAY_SECONDS", "2.0") or "2.0")
    retries = max(1, int(os.getenv("INSTAGRAM_FETCH_RETRIES", "3") or "3"))
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9",
    }

    base = url.split("?")[0].strip()
    if not base.endswith("/"):
        base = f"{base}/"
    candidates = [base]
    if "www.instagram.com" in base:
        candidates.append(base.replace("www.instagram.com", "m.instagram.com"))

    for candidate in candidates:
        for attempt in range(1, retries + 1):
            try:
                if delay > 0:
                    time.sleep(delay)
                with httpx.Client(timeout=20, follow_redirects=True, headers=headers) as client:
                    res = client.get(candidate)
                html = res.text
                views = _extract_html_views(html)
                if views <= 0:
                    continue

                title = _extract_og(html, "og:title") or "Instagram Reel"
                thumbnail = _extract_og(html, "og:image")
                canonical = _extract_og(html, "og:url") or candidate
                return {
                    "shortcode": shortcode,
                    "url": canonical,
                    "title": title[:90],
                    "thumbnail": thumbnail,
                    "views": int(views),
                    "likes": 0,
                    "comments": 0,
                    "published_at": "",
                    "is_video": True,
                }
            except Exception:
                if attempt >= retries:
                    break
                time.sleep(delay * attempt if delay > 0 else attempt)
    return None


def get_instagram_post_details(url: str) -> dict | None:
    if meta_service.is_configured():
        result = meta_service.get_instagram_post_details(url)
        if result and int(result.get("views", 0)) > 0:
            return result

    ytdlp_result = _ytdlp_instagram_post_details(url)
    if ytdlp_result and int(ytdlp_result.get("views", 0)) > 0:
        return ytdlp_result

    http_result = _http_instagram_post_details(url)
    if http_result and int(http_result.get("views", 0)) > 0:
        return http_result

    if instaloader is not None:
        instaloader_result = _instaloader_post_details(url)
        if instaloader_result and int(instaloader_result.get("views", 0)) > 0:
            return instaloader_result

    return None


def instagram_data_accuracy_note() -> str:
    if meta_service.is_configured():
        return meta_service.meta_data_accuracy_note()
    return (
        "Instagram counts can vary by source. For best accuracy configure Meta API, "
        "or set INSTAGRAM_USERNAME/INSTAGRAM_PASSWORD and optionally INSTAGRAM_SESSION_FILE or "
        "INSTAGRAM_COOKIE_FILE on server for restricted reels."
    )


def get_instagram_account_video_urls(account_url: str, max_videos: int = 30) -> list[str]:
    if meta_service.is_configured():
        result = meta_service.get_instagram_account_video_urls(account_url, max_videos)
        if result:
            return result

    if instaloader is None:
        return []
    username = extract_instagram_username(account_url)
    if not username:
        return []

    max_videos = max(1, min(max_videos, 100))
    try:
        loader = _loader()
        profile = instaloader.Profile.from_username(loader.context, username)
    except Exception:
        return []

    results: list[str] = []
    seen: set[str] = set()

    try:
        for post in profile.get_posts():
            if not post.is_video:
                continue
            if post.shortcode in seen:
                continue
            seen.add(post.shortcode)
            results.append(f"https://www.instagram.com/reel/{post.shortcode}/")
            if len(results) >= max_videos:
                break
    except Exception:
        pass

    return results
