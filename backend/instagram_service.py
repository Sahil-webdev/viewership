import re
import os
from urllib.parse import urlparse

try:
    import instaloader
except Exception:
    instaloader = None


def instagram_feature_available() -> bool:
    return instaloader is not None


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


def extract_instagram_shortcode(url: str) -> str | None:
    parsed = urlparse(url.strip())
    parts = [p for p in parsed.path.split("/") if p]
    if len(parts) < 2:
        return None
    if parts[0].lower() in {"p", "reel", "tv"}:
        return parts[1]
    return None


def extract_instagram_username(url: str) -> str | None:
    parsed = urlparse(url.strip())
    parts = [p for p in parsed.path.split("/") if p]
    if len(parts) != 1:
        return None
    username = parts[0].strip()
    if not username:
        return None
    return username


def _loader():
    if instaloader is None:
        return None  # type: ignore[return-value]
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
    if username and password:
        try:
            loader.login(username, password)
        except Exception:
            pass
    return loader


def get_instagram_post_details(url: str) -> dict | None:
    if instaloader is None:
        return None
    shortcode = extract_instagram_shortcode(url)
    if not shortcode:
        return None
    try:
        loader = _loader()
        post = instaloader.Post.from_shortcode(loader.context, shortcode)
    except Exception:
        return None

    caption = (post.caption or "").strip()
    title = caption[:90] if caption else f"Instagram post by @{post.owner_username}"
    metric_views = 0
    if post.is_video:
        # Reels UI usually shows play_count, while view_count can be lower.
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


def instagram_data_accuracy_note() -> str:
    return (
        "Instagram counts can vary by source. We use max(play_count, view_count) when available; "
        "for best accuracy set INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD on server."
    )


def get_instagram_account_video_urls(account_url: str, max_videos: int = 30) -> list[str]:
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
