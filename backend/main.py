from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
import os
from database import engine, Base
from routes.auth import router as auth_router
from routes.videos import router as videos_router
from routes.analytics import router as analytics_router
from meta_service import configure as meta_configure
from meta_service import configure_facebook as meta_configure_facebook

Base.metadata.create_all(bind=engine)


def ensure_runtime_schema():
    inspector = inspect(engine)
    columns = {col["name"] for col in inspector.get_columns("users")}
    if "encrypted_company_password" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN encrypted_company_password TEXT"))


ensure_runtime_schema()

meta_app_id = os.getenv("META_APP_ID", "").strip()
meta_app_secret = os.getenv("META_APP_SECRET", "").strip()
meta_access_token = os.getenv("META_ACCESS_TOKEN", "").strip()
meta_business_id = os.getenv("INSTAGRAM_BUSINESS_ID", "").strip()
if meta_app_id and meta_app_secret and meta_access_token and meta_business_id:
    meta_configure(meta_app_id, meta_app_secret, meta_access_token, meta_business_id)
    print("[Meta] Instagram Graph API configured successfully")
else:
    print("[Meta] Instagram Graph API not configured (missing env vars)")

fb_page_id = os.getenv("FACEBOOK_PAGE_ID", "").strip()
fb_page_token = os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN", "").strip()
if fb_page_id and fb_page_token:
    meta_configure_facebook(fb_page_id, fb_page_token)
    print("[Meta] Facebook Graph API configured successfully")
else:
    print("[Meta] Facebook Graph API not configured (missing env vars)")

app = FastAPI(
    title="ViewPulse API",
    description="YouTube View Tracker - Real Backend",
    version="1.0.0",
)

cors_origins_raw = os.getenv("CORS_ORIGINS", "*")
if cors_origins_raw.strip() == "*":
    allow_origins = ["*"]
else:
    allow_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(videos_router)
app.include_router(analytics_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "ViewPulse API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
