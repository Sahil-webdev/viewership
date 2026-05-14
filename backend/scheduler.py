import threading
import time
import logging
from datetime import datetime, timedelta

from database import SessionLocal
from models import User, Video, ViewRecord
from routes.videos import detect_platform, upsert_today_view_record
from youtube_service import extract_video_id, get_video_details, search_video_by_query
from instagram_service import get_instagram_post_details
from facebook_service import get_facebook_post_details

logger = logging.getLogger("scheduler")
logging.basicConfig(level=logging.INFO)

_SCHEDULER_RUNNING = False
_SYNC_INTERVAL_HOURS = 6


def _sync_all_companies():
    db = SessionLocal()
    try:
        companies = db.query(User).filter(User.is_super_admin == False).all()
        for company in companies:
            videos = db.query(Video).filter(Video.user_id == company.id).all()
            if not videos:
                continue

            tracked = 0
            skipped = 0
            for video in videos:
                platform = detect_platform(video.url)
                details = None

                try:
                    if platform == "youtube":
                        video_id = extract_video_id(video.url)
                        if video_id:
                            details = get_video_details(video_id) or search_video_by_query(video_id)
                    elif platform == "instagram":
                        details = get_instagram_post_details(video.url)
                    elif platform == "facebook":
                        details = get_facebook_post_details(video.url)
                except Exception:
                    skipped += 1
                    continue

                if not details:
                    skipped += 1
                    continue

                current_views = int(details.get("views", 0))
                if platform in {"instagram", "facebook"} and current_views <= 0:
                    skipped += 1
                    continue

                try:
                    upsert_today_view_record(db, video.id, current_views)
                    tracked += 1
                except Exception:
                    skipped += 1

            if tracked > 0:
                db.commit()
                logger.info(f"Auto-synced {company.company_name or company.email}: {tracked} tracked, {skipped} skipped")

    except Exception as e:
        logger.error(f"Auto-sync error: {e}")
    finally:
        db.close()


def _scheduler_loop():
    global _SCHEDULER_RUNNING
    logger.info(f"Auto-sync scheduler started (interval: {_SYNC_INTERVAL_HOURS}h)")
    while _SCHEDULER_RUNNING:
        try:
            _sync_all_companies()
            logger.info(f"Auto-sync cycle completed at {datetime.utcnow().isoformat()}")
        except Exception as e:
            logger.error(f"Auto-sync cycle error: {e}")
        for _ in range(_SYNC_INTERVAL_HOURS * 60):
            if not _SCHEDULER_RUNNING:
                break
            time.sleep(60)


def start_scheduler():
    global _SCHEDULER_RUNNING
    if _SCHEDULER_RUNNING:
        return
    _SCHEDULER_RUNNING = True
    thread = threading.Thread(target=_scheduler_loop, daemon=True)
    thread.start()


def stop_scheduler():
    global _SCHEDULER_RUNNING
    _SCHEDULER_RUNNING = False
