from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserCreate(BaseModel):
    company_name: str
    name: str
    email: str
    password: str
    role: str = "Company Admin"
    status: str = "Active"


class UserUpdate(BaseModel):
    company_name: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    company_name: str
    name: str
    email: str
    role: str
    status: str
    is_super_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ViewRecordSchema(BaseModel):
    date: str
    views: int
    growth: float


class VideoCreate(BaseModel):
    url: str


class ChannelCreate(BaseModel):
    channel_url: str
    max_videos: int = 20


class VideoResponse(BaseModel):
    id: str
    user_id: str
    url: str
    title: str
    thumbnail: Optional[str] = None
    added_at: datetime
    view_history: List[ViewRecordSchema] = []

    class Config:
        from_attributes = True


class AnalyticsEntry(BaseModel):
    date: str
    title: str
    url: str
    thumbnail: Optional[str] = None
    views: int
    growth: float
    status: str = "Synced"
