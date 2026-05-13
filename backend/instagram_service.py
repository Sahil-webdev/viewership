import re
import os
import time
from urllib.parse import urlparse

import meta_service

try:
    import instaloader
except Exception:
    instaloader = None

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


def get_instagram_post_details(url: str) -> dict | None:
    if meta_service.is_configured():
        result = meta_service.get_instagram_post_details(url)
        if result:
            return result

    if instaloader is not None:
        return _instaloader_post_details(url)

    return None


def instagram_data_accuracy_note() -> str:
    if meta_service.is_configured():
        return meta_service.meta_data_accuracy_note()
    return (
        "Instagram counts can vary by source. We use max(play_count, view_count) when available; "
        "for best accuracy set INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD on server."
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
