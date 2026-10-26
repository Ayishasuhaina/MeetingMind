"""Pydantic schemas for Meeting endpoints."""
from __future__ import annotations

import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


# ── Shared helpers ──────────────────────────────────────────────────────────


def _split_participants(v: object) -> object:
    """Accept both a list and a comma-separated string for participants."""
    if isinstance(v, list):
        return v
    if isinstance(v, str):
        return [p.strip() for p in v.split(",") if p.strip()]
    return v


# ── Request schemas ─────────────────────────────────────────────────────────


class MeetingCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, examples=["Q4 Product Roadmap Review"])
    date: Optional[str] = Field(None, examples=["2026-10-20"])
    time: Optional[str] = Field(None, examples=["10:00"])
    duration: Optional[str] = Field(None, examples=["60 min"])
    category: Optional[str] = Field(None, examples=["Planning"])
    participants: Optional[List[str]] = Field(default_factory=list)
    description: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    processing_status: str = Field("pending", examples=["pending"])

    @field_validator("participants", mode="before")
    @classmethod
    def parse_participants(cls, v: object) -> object:
        return _split_participants(v)


class MeetingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    date: Optional[str] = None
    time: Optional[str] = None
    duration: Optional[str] = None
    category: Optional[str] = None
    participants: Optional[List[str]] = None
    description: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    processing_status: Optional[str] = None

    @field_validator("participants", mode="before")
    @classmethod
    def parse_participants(cls, v: object) -> object:
        if v is None:
            return v
        return _split_participants(v)


# ── Response schema ─────────────────────────────────────────────────────────


class MeetingOut(BaseModel):
    id: int
    title: str
    date: Optional[str]
    time: Optional[str]
    duration: Optional[str]
    category: Optional[str]
    participants: List[str] = []
    description: Optional[str]
    transcript: Optional[str]
    summary: Optional[str]
    processing_status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}

    @field_validator("participants", mode="before")
    @classmethod
    def coerce_participants(cls, v: object) -> List[str]:
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            return [p.strip() for p in v.split(",") if p.strip()]
        return []


class MeetingListOut(BaseModel):
    """Paginated meeting list response."""
    total: int
    page: int
    page_size: int
    items: List[MeetingOut]
