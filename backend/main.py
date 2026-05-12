from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from database import engine, Base
from routes.auth import router as auth_router
from routes.videos import router as videos_router
from routes.analytics import router as analytics_router

Base.metadata.create_all(bind=engine)


def ensure_runtime_schema():
    inspector = inspect(engine)
    columns = {col["name"] for col in inspector.get_columns("users")}
    if "encrypted_company_password" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN encrypted_company_password TEXT"))


ensure_runtime_schema()

app = FastAPI(
    title="ViewPulse API",
    description="YouTube View Tracker - Real Backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
