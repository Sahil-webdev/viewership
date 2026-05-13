from fastapi import APIRouter, Depends, HTTPException, status
from fastapi import Query
from sqlalchemy.orm import Session
from database import get_db
from models import User, Video, ViewRecord
from schemas import VideoCreate, VideoResponse, ChannelCreate
from auth import get_current_user
from youtube_service import (
    extract_video_id,
    get_video_details,
    search_video_by_query,
    get_channel_video_urls,
)
from instagram_service import (
    instagram_feature_available,
    meta_available,
    instagram_data_accuracy_note,
    is_instagram_url,
    is_instagram_post_url,
    is_instagram_account_url,
    get_instagram_post_details,
    get_instagram_account_video_urls,
)
from facebook_service import (
    facebook_feature_available,
    facebook_data_accuracy_note,
    is_facebook_url,
    is_facebook_post_url,
    is_facebook_page_url,
    get_facebook_post_details,
    get_facebook_page_video_urls,
)
import uuid
import re
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/api/videos", tags=["Videos"])


def is_valid_youtube(url: str) -> bool:
    return bool(re.search(r"youtube\.com|youtu\.be", url))


def detect_platform(url: str) -> str:
    url_l = url.lower()
    if "youtube.com" in url_l or "youtu.be" in url_l:
        return "youtube"
    if "instagram.com" in url_l:
        return "instagram"
    if "facebook.com" in url_l or "fb.watch" in url_l:
        return "facebook"
    return "unknown"


def resolve_target_user(
    db: Session,
    current_user: User,
    company_id: Optional[str],
) -> User:
    if current_user.is_super_admin:
        if not company_id:
            raise HTTPException(
                status_code=400,
                detail="company_id is required for super admin operations",
            )
        target = db.query(User).filter(
            User.id == company_id,
            User.is_super_admin == False,
        ).first()
        if not target:
            raise HTTPException(status_code=404, detail="Company not found")
        return target

    if company_id and company_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot access another company")

    return current_user


def add_video_urls_for_user(db: Session, current_user: User, urls: list[str]) -> list[VideoResponse]:
    existing_urls = {v.url for v in db.query(Video).filter(Video.user_id == current_user.id).all()}
    new_videos: list[Video] = []

    for raw_url in urls:
        url = raw_url.strip()
        platform = detect_platform(url)
        if platform == "youtube" and not is_valid_youtube(url):
            continue
        if platform == "instagram" and not (is_instagram_url(url) and is_instagram_post_url(url)):
            continue
        if platform == "instagram" and not instagram_feature_available():
            raise HTTPException(
                status_code=503,
                detail="Instagram tracking is not configured. Please set Meta API credentials (META_APP_ID, META_APP_SECRET, META_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ID) in .env or install instaloader.",
            )
        if platform == "facebook" and not (is_facebook_url(url) and is_facebook_post_url(url)):
            continue
        if platform == "facebook" and not facebook_feature_available():
            raise HTTPException(
                status_code=503,
                detail="Facebook tracking dependency is not installed on server. Please install requirements and restart backend.",
            )
        if platform not in {"youtube", "instagram", "facebook"}:
            continue
        if url in existing_urls:
            continue

        title = "Unknown Video"
        thumbnail = ""
        canonical_url = url

        if platform == "youtube":
            video_id = extract_video_id(url)
            if video_id:
                canonical_url = f"https://www.youtube.com/watch?v={video_id}"
                thumbnail = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
                title = "YouTube Video"
        elif platform == "instagram":
            match = re.search(r"/(p|reel|tv)/([A-Za-z0-9_-]+)", url.strip(), flags=re.IGNORECASE)
            if match:
                post_type = match.group(1).lower()
                shortcode = match.group(2)
                canonical_url = f"https://www.instagram.com/{post_type}/{shortcode}/"
            else:
                canonical_url = url.split("?")[0]
            title = "Instagram Post/Reel"
        else:
            canonical_url = url.split("?")[0]
            title = "Facebook Video/Reel"

        if canonical_url in existing_urls and canonical_url != url:
            continue
        existing_urls.add(url)
        existing_urls.add(canonical_url)

        video = Video(
            id=f"v{uuid.uuid4().hex[:10]}",
            user_id=current_user.id,
            url=canonical_url,
            title=title,
            thumbnail=thumbnail,
        )
        db.add(video)
        new_videos.append(video)

    if not new_videos:
        raise HTTPException(status_code=400, detail="No valid new social video URLs to add")

    db.commit()
    for v in new_videos:
        db.refresh(v)

    return [
        VideoResponse(
            id=v.id, user_id=v.user_id, url=v.url, title=v.title,
            thumbnail=v.thumbnail, added_at=v.added_at, view_history=[]
        )
        for v in new_videos
    ]


def upsert_today_view_record(db: Session, video_id: str, current_views: int) -> tuple[bool, float]:
    today_str = datetime.utcnow().date().isoformat()
    today_record = db.query(ViewRecord).filter(
        ViewRecord.video_id == video_id,
        ViewRecord.date == today_str
    ).first()

    previous_record = db.query(ViewRecord).filter(
        ViewRecord.video_id == video_id,
        ViewRecord.date < today_str
    ).order_by(ViewRecord.date.desc()).first()

    previous_views = previous_record.views if previous_record else 0
    growth = round(((current_views - previous_views) / previous_views) * 100, 2) if previous_views > 0 else 0

    if today_record:
        today_record.views = current_views
        today_record.growth = growth
        return False, growth

    db.add(ViewRecord(
        id=f"vr_{uuid.uuid4().hex[:8]}",
        video_id=video_id,
        date=today_str,
        views=current_views,
        growth=growth,
    ))
    return True, growth


@router.post("/add", response_model=list[VideoResponse])
def add_videos(
    urls: list[VideoCreate],
    company_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Only super admin can add links")
    target_user = resolve_target_user(db, current_user, company_id)
    plain_urls = [item.url for item in urls]
    return add_video_urls_for_user(db, target_user, plain_urls)


@router.post("/add-channel", response_model=list[VideoResponse])
def add_channel_videos(
    payload: ChannelCreate,
    company_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Only super admin can add links")
    target_user = resolve_target_user(db, current_user, company_id)

    max_videos = max(1, min(payload.max_videos, 100))
    urls = get_channel_video_urls(payload.channel_url, max_videos=max_videos)
    if not urls:
        raise HTTPException(
            status_code=400,
            detail="Could not fetch videos from this channel URL. Please check the link and API key.",
        )

    return add_video_urls_for_user(db, target_user, urls)


@router.post("/add-instagram-account", response_model=list[VideoResponse])
def add_instagram_account_videos(
    payload: ChannelCreate,
    company_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Only super admin can add links")
    target_user = resolve_target_user(db, current_user, company_id)
    if not instagram_feature_available():
        raise HTTPException(
            status_code=503,
            detail="Instagram tracking is not configured. Please set Meta API credentials in .env or install instaloader.",
        )
    if not is_instagram_account_url(payload.channel_url):
        raise HTTPException(status_code=400, detail="Invalid Instagram account URL")

    max_videos = max(1, min(payload.max_videos, 100))
    urls = get_instagram_account_video_urls(payload.channel_url, max_videos=max_videos)
    if not urls:
        raise HTTPException(status_code=400, detail="Could not fetch videos from this Instagram account")
    return add_video_urls_for_user(db, target_user, urls)


@router.post("/add-facebook-page", response_model=list[VideoResponse])
def add_facebook_page_videos(
    payload: ChannelCreate,
    company_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Only super admin can add links")
    target_user = resolve_target_user(db, current_user, company_id)
    if not facebook_feature_available():
        raise HTTPException(
            status_code=503,
            detail="Facebook tracking dependency is not installed on server. Please install requirements and restart backend.",
        )
    if not is_facebook_page_url(payload.channel_url):
        raise HTTPException(status_code=400, detail="Invalid Facebook page URL")

    max_videos = max(1, min(payload.max_videos, 100))
    urls = get_facebook_page_video_urls(payload.channel_url, max_videos=max_videos)
    if not urls:
        raise HTTPException(status_code=400, detail="Could not fetch videos from this Facebook page")
    return add_video_urls_for_user(db, target_user, urls)


@router.post("/track-views")
def track_views(
    company_id: Optional[str] = Query(default=None),
    video_ids: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Only super admin can run sync")
    target_user = resolve_target_user(db, current_user, company_id)

    video_query = db.query(Video).filter(Video.user_id == target_user.id)
    if video_ids:
        selected_ids = [v.strip() for v in video_ids.split(",") if v.strip()]
        if selected_ids:
            video_query = video_query.filter(Video.id.in_(selected_ids))
    videos = video_query.all()
    total_count = len(videos)
    tracked_count = 0
    skipped_count = 0
    errors = []
    warnings = []

    for video in videos:
        platform = detect_platform(video.url)
        details = None

        if platform == "youtube":
            video_id = extract_video_id(video.url)
            if not video_id:
                errors.append(f"Could not extract YouTube video ID from: {video.url}")
                skipped_count += 1
                continue
            details = get_video_details(video_id) or search_video_by_query(video_id)
        elif platform == "instagram":
            if not instagram_feature_available():
                errors.append("Instagram tracking not configured (missing Meta API credentials or instaloader).")
                skipped_count += 1
                continue
            details = get_instagram_post_details(video.url)
        elif platform == "facebook":
            if not facebook_feature_available():
                errors.append("Facebook dependency not installed. Skipping Facebook links.")
                skipped_count += 1
                continue
            if is_facebook_page_url(video.url):
                page_videos = get_facebook_page_video_urls(video.url, max_videos=1)
                if page_videos:
                    details = get_facebook_post_details(page_videos[0])
                    if details:
                        video.url = details.get("url", page_videos[0])
                else:
                    details = None
            else:
                details = get_facebook_post_details(video.url)
        else:
            errors.append(f"Unsupported platform URL: {video.url}")
            skipped_count += 1
            continue

        if not details:
            errors.append(f"Failed to fetch data for video: {video.url}")
            skipped_count += 1
            continue

        if video.title == "Unknown Video" or not video.thumbnail:
            video.title = details.get("title", video.title)
            video.thumbnail = details.get("thumbnail", video.thumbnail)
            db.commit()

        current_views = int(details.get("views", 0))
        if platform in {"instagram", "facebook"} and current_views <= 0:
            last_record = db.query(ViewRecord).filter(
                ViewRecord.video_id == video.id
            ).order_by(ViewRecord.date.desc()).first()
            if last_record:
                warnings.append(
                    f"Verified {platform.title()} views not available for: {video.url}. "
                    f"Kept last verified value ({int(last_record.views)})."
                )
            else:
                warnings.append(
                    f"Verified {platform.title()} views not available for: {video.url}. "
                    "No baseline exists, so update skipped."
                )
            skipped_count += 1
            continue
        upsert_today_view_record(db, video.id, current_views)
        tracked_count += 1

    db.commit()

    result = {
        "message": f"View data synced for {tracked_count} of {total_count} videos",
        "tracked": tracked_count,
        "skipped": skipped_count,
        "total": total_count,
    }
    if any("instagram.com" in v.url.lower() for v in videos):
        if meta_available():
            result["instagram_note"] = "View counts from Meta Graph API (Business Discovery - real view counts)."
        else:
            result["instagram_note"] = instagram_data_accuracy_note()
    if any(("facebook.com" in v.url.lower() or "fb.watch" in v.url.lower()) for v in videos):
        if meta_available():
            result["facebook_note"] = "Facebook view counts from Meta Graph API + fallback methods."
        else:
            result["facebook_note"] = facebook_data_accuracy_note()
    if warnings:
        result["warnings"] = warnings
    if errors:
        result["errors"] = errors

    return result


@router.get("/refresh/{video_id}")
def refresh_video_views(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = db.query(Video).filter(Video.id == video_id, Video.user_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    platform = detect_platform(video.url)
    details = None
    views = 0
    title = video.title

    if platform == "youtube":
        yt_id = extract_video_id(video.url)
        if not yt_id:
            raise HTTPException(status_code=400, detail="Invalid YouTube URL")
        details = get_video_details(yt_id)
        if not details:
            raise HTTPException(status_code=500, detail="Failed to fetch video data from YouTube")
        views = details["views"]
        title = details.get("title", video.title)
    elif platform == "instagram":
        if not instagram_feature_available():
            raise HTTPException(status_code=503, detail="Instagram tracking not configured")
        details = get_instagram_post_details(video.url)
        if not details:
            raise HTTPException(status_code=500, detail="Failed to fetch Instagram data")
        views = details["views"]
        title = details.get("title", video.title)
    else:
        raise HTTPException(status_code=400, detail="Refresh not supported for this platform")

    upsert_today_view_record(db, video.id, views)
    video.title = title
    video.thumbnail = details.get("thumbnail", video.thumbnail)
    db.commit()

    return {"views": views, "title": title, "message": "Views refreshed"}


@router.get("/my-videos", response_model=list[VideoResponse])
def get_my_videos(
    company_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_user = resolve_target_user(db, current_user, company_id)
    videos = db.query(Video).filter(Video.user_id == target_user.id).all()
    result = []
    for video in videos:
        records = db.query(ViewRecord).filter(ViewRecord.video_id == video.id).order_by(ViewRecord.date).all()
        result.append(VideoResponse(
            id=video.id, user_id=video.user_id, url=video.url, title=video.title,
            thumbnail=video.thumbnail, added_at=video.added_at,
            view_history=[
                {"date": r.date, "views": r.views, "growth": r.growth} for r in records
            ]
        ))
    return result


@router.delete("/clear-all")
def clear_all_videos(
    company_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Only super admin can clear tracked links")
    target_user = resolve_target_user(db, current_user, company_id)
    videos = db.query(Video).filter(Video.user_id == target_user.id).all()
    deleted_count = len(videos)

    for video in videos:
        db.delete(video)

    db.commit()
    return {"message": f"Deleted {deleted_count} tracked videos", "deleted": deleted_count}


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = db.query(Video).filter(Video.id == video_id, Video.user_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    db.delete(video)
    db.commit()
    return None
