import re
import os
from html import unescape
from urllib.parse import urlparse, parse_qs, urljoin, urlunparse

import httpx

try:
    import yt_dlp
except Exception:
    yt_dlp = None

import meta_service


def facebook_feature_available() -> bool:
    return True


def facebook_data_accuracy_note() -> str:
    if meta_service.is_configured():
        return "View counts from Meta Graph API."
    return (
        "For exact Facebook views, configure FACEBOOK_PAGE_ACCESS_TOKEN (Graph API). "
        "Without it, fallback scraping can be approximate and vary by region/login state."
    )


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


def is_facebook_page_url(url: str) -> bool:
    parsed = urlparse(url.strip())
    host = parsed.netloc.lower()
    if "facebook.com" not in host:
        return False
    path = parsed.path.strip("/")
    if not path:
        return False
    parts = path.split("/")
    if parts[0].lower() == "share" and len(parts) >= 2:
        second = parts[1].lower()
        if second not in {"v", "r", "p"}:
            return True
    blocked = {
        "watch", "reel", "reels", "videos", "photo", "photos", "groups", "events",
        "marketplace", "gaming", "stories", "share", "login", "profile.php",
    }
    if parts[0].lower() in blocked:
        return False
    return True


def _fetch_html(url: str) -> tuple[str, str]:
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9",
    }
    with httpx.Client(timeout=12, follow_redirects=True, headers=headers) as client:
        res = client.get(url)
        return res.text, str(res.url)


def _extract_meta(html: str, prop: str) -> str:
    pattern = rf'<meta[^>]+property=["\']{re.escape(prop)}["\'][^>]+content=["\']([^"\']+)["\']'
    m = re.search(pattern, html, flags=re.IGNORECASE)
    return unescape(m.group(1)).strip() if m else ""


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


def _extract_view_count(html: str) -> int:
    patterns = [
        r'"video_view_count"\s*:\s*"?(?P<n>[0-9,\.kmb]+)"?',
        r'"play_count"\s*:\s*"?(?P<n>[0-9,\.kmb]+)"?',
        r'"viewCount"\s*:\s*"?(?P<n>[0-9,\.kmb]+)"?',
        r'"video_watch_count"\s*:\s*"?(?P<n>[0-9,\.kmb]+)"?',
        r'content=["\'](?P<n>[0-9,\.kmb]+)\s+views["\']',
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


def _to_mbasic_url(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    if "facebook.com" in host and "mbasic.facebook.com" not in host:
        parsed = parsed._replace(netloc="mbasic.facebook.com")
    return urlunparse(parsed)


def _extract_video_id_from_url(url: str) -> str | None:
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

    # Handles paths like /page-name/videos/123456789/
    if "videos" in [p.lower() for p in parts]:
        for i, p in enumerate(parts):
            if p.lower() == "videos" and i + 1 < len(parts) and parts[i + 1].isdigit():
                return parts[i + 1]

    return None


def _graph_video_details(video_id: str) -> dict | None:
    token = os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN", "").strip()
    if not token or not video_id:
        return None

    api_version = os.getenv("FACEBOOK_GRAPH_VERSION", "v22.0").strip() or "v22.0"
    fields = "title,description,permalink_url,thumbnails,views"
    endpoint = f"https://graph.facebook.com/{api_version}/{video_id}"

    try:
        with httpx.Client(timeout=12) as client:
            res = client.get(endpoint, params={
                "fields": fields,
                "access_token": token,
            })
            if res.status_code >= 400:
                return None
            data = res.json()
    except Exception:
        return None

    views = int(data.get("views") or 0)
    thumb = ""
    thumbs = data.get("thumbnails", {}).get("data") or []
    if thumbs and isinstance(thumbs[0], dict):
        thumb = thumbs[0].get("uri") or ""

    title = (data.get("title") or data.get("description") or "Facebook Video").strip()
    url = data.get("permalink_url") or f"https://www.facebook.com/watch/?v={video_id}"

    return {
        "url": url,
        "title": title[:120] if title else "Facebook Video",
        "thumbnail": thumb,
        "views": max(views, 0),
    }


def _clean_facebook_url(url: str) -> str:
    parsed = urlparse(url.strip())
    host = parsed.netloc.lower()
    scheme = parsed.scheme or "https"
    if "facebook.com" in host:
        host = "www.facebook.com"

    vid = _extract_video_id_from_url(url)
    if vid:
        # Canonical watch URL works for many video/reel cases.
        return f"{scheme}://{host}/watch/?v={vid}"

    path = parsed.path
    if path and path != "/":
        if not path.endswith("/"):
            path = f"{path}/"
        return urlunparse((scheme, host, path, "", "", ""))

    return urlunparse((scheme, host, "/", "", "", ""))


def _resolve_redirect_target(url: str, hops: int = 4) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9",
    }
    try:
        with httpx.Client(timeout=12, follow_redirects=True, headers=headers) as client:
            r = client.get(url.strip())
            return _clean_facebook_url(str(r.url))
    except Exception:
        return _clean_facebook_url(url)


def _extract_from_text_metric(text: str) -> int:
    if not text:
        return 0
    m = re.search(r"([0-9]+(?:\.[0-9]+)?\s*[kmb]?)\s+(?:views|plays)", text, flags=re.IGNORECASE)
    if not m:
        return 0
    return _parse_metric_number(m.group(1))


def _ytdlp_post_details(url: str) -> dict | None:
    if yt_dlp is None:
        return None
    opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extract_flat": False,
    }
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception:
        return None

    if not info:
        return None

    # Some wrapper URLs may return playlist/url-like objects; use the first valid entry.
    if isinstance(info, dict) and info.get("_type") in {"playlist", "multi_video"}:
        entries = info.get("entries") or []
        for e in entries:
            if isinstance(e, dict):
                info = e
                break

    if not isinstance(info, dict):
        return None

    canonical = (
        info.get("webpage_url")
        or info.get("original_url")
        or info.get("url")
        or url
    )
    title = (info.get("title") or "Facebook Video").strip()
    thumbnail = info.get("thumbnail") or ""
    views = int(info.get("view_count") or 0)

    # fb extractors sometimes store view text in description/title even when view_count is absent.
    if views <= 0:
        views = max(
            _extract_from_text_metric(str(info.get("description") or "")),
            _extract_from_text_metric(title),
        )

    return {
        "url": canonical,
        "title": title[:120] if title else "Facebook Video",
        "thumbnail": thumbnail,
        "views": int(max(views, 0)),
    }


def get_facebook_post_details(url: str) -> dict | None:
    if not is_facebook_post_url(url):
        return None

    # Try Meta Graph API first
    if meta_service.is_configured():
        meta_details = meta_service.get_facebook_post_details(url)
        if meta_details and int(meta_details.get("views", 0)) > 0:
            return meta_details

    resolved = _resolve_redirect_target(url)
    candidates = [url]
    if resolved not in candidates:
        candidates.append(resolved)
    vid = _extract_video_id_from_url(resolved)
    if vid:
        graph_details = _graph_video_details(vid)
        if graph_details and int(graph_details.get("views", 0)) > 0:
            return graph_details

        watch_url = f"https://www.facebook.com/watch/?v={vid}"
        reel_url = f"https://www.facebook.com/reel/{vid}/"
        for c in [watch_url, reel_url]:
            if c not in candidates:
                candidates.append(c)

    best_details: dict | None = None

    for candidate in candidates:
        ytdlp_details = _ytdlp_post_details(candidate)
        if ytdlp_details and int(ytdlp_details.get("views", 0)) > 0:
            if not best_details or int(ytdlp_details.get("views", 0)) > int(best_details.get("views", 0)):
                best_details = ytdlp_details
        candidate_vid = _extract_video_id_from_url(candidate)
        if candidate_vid:
            graph_details = _graph_video_details(candidate_vid)
            if graph_details and int(graph_details.get("views", 0)) > 0:
                if not best_details or int(graph_details.get("views", 0)) > int(best_details.get("views", 0)):
                    best_details = graph_details

        try:
            html, final_url = _fetch_html(candidate)
        except Exception:
            continue

        best_html = html
        canonical = _extract_meta(html, "og:url") or final_url or candidate
        views = _extract_view_count(html)

        mbasic_url = _to_mbasic_url(canonical)
        if mbasic_url:
            try:
                mbasic_html, mbasic_final = _fetch_html(mbasic_url)
                mbasic_views = _extract_view_count(mbasic_html)
                if mbasic_views > views:
                    views = mbasic_views
                    best_html = mbasic_html
                    canonical = _extract_meta(mbasic_html, "og:url") or mbasic_final or canonical
            except Exception:
                pass

        title = _extract_meta(best_html, "og:title")
        if not title:
            m = re.search(r"<title>(.*?)</title>", best_html, flags=re.IGNORECASE | re.DOTALL)
            title = unescape(m.group(1)).strip() if m else "Facebook Video"
        thumbnail = _extract_meta(best_html, "og:image")

        details = {
            "url": canonical,
            "title": title[:120] if title else "Facebook Video",
            "thumbnail": thumbnail or "",
            "views": int(views),
        }

        if ytdlp_details:
            details["title"] = ytdlp_details.get("title") or details["title"]
            details["thumbnail"] = ytdlp_details.get("thumbnail") or details["thumbnail"]
            details["url"] = ytdlp_details.get("url") or details["url"]
            details["views"] = max(int(details.get("views", 0)), int(ytdlp_details.get("views", 0)))

        if not best_details or int(details.get("views", 0)) > int(best_details.get("views", 0)):
            best_details = details

    return best_details


def get_facebook_page_video_urls(page_url: str, max_videos: int = 30) -> list[str]:
    if not is_facebook_page_url(page_url):
        return []

    # Try Meta Graph API first
    if meta_service.is_configured():
        meta_urls = meta_service.get_facebook_page_video_urls(page_url, max_videos)
        if meta_urls:
            return meta_urls

    page_url = _resolve_redirect_target(page_url)
    max_videos = max(1, min(max_videos, 100))
    try:
        html, final_url = _fetch_html(page_url)
    except Exception:
        return []

    hrefs = re.findall(r'href=["\']([^"\']+)["\']', html, flags=re.IGNORECASE)
    if "mbasic.facebook.com" not in final_url:
        try:
            mbasic_html, _ = _fetch_html(_to_mbasic_url(final_url))
            hrefs.extend(re.findall(r'href=["\']([^"\']+)["\']', mbasic_html, flags=re.IGNORECASE))
        except Exception:
            pass
    found: list[str] = []
    seen: set[str] = set()

    for href in hrefs:
        u = unescape(href)
        abs_url = urljoin("https://www.facebook.com", u)
        abs_lower = abs_url.lower()
        if not (
            "/reel/" in abs_lower
            or "/videos/" in abs_lower
            or "/share/v/" in abs_lower
            or "/share/r/" in abs_lower
            or ("facebook.com/watch" in abs_lower and "v=" in abs_lower)
            or "fb.watch/" in abs_lower
        ):
            continue
        if abs_url in seen:
            continue
        seen.add(abs_url)
        found.append(abs_url)
        if len(found) >= max_videos:
            break

    return found
