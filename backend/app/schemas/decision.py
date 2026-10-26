"""Pydantic schemas for Decision endpoints."""
from __future__ import annotations

import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class DecisionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    meeting_id: Optional[int] = None
    decision_date: Optional[str] = Field(None, examples=["2026-10-20"])
    evidence: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    decided_by: Optional[str] = Field(None, max_length=150)
    impact: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    status: str = Field("pending", pattern="^(pending|approved|rejected)$")

    @field_validator("tags", mode="before")
    @classmethod
    def parse_tags(cls, v: object) -> object:
        if isinstance(v, str):
            return [t.strip() for t in v.split(",") if t.strip()]
        return v


class DecisionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    meeting_id: Optional[int] = None
    decision_date: Optional[str] = None
    evidence: Optional[str] = None
    tags: Optional[List[str]] = None
    decided_by: Optional[str] = Field(None, max_length=150)
    impact: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    status: Optional[str] = Field(None, pattern="^(pending|approved|rejected)$")

    @field_validator("tags", mode="before")
    @classmethod
    def parse_tags(cls, v: object) -> object:
        if v is None:
            return v
        if isinstance(v, str):
            return [t.strip() for t in v.split(",") if t.strip()]
        return v


class DecisionOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    meeting_id: Optional[int]
    decision_date: Optional[str]
    evidence: Optional[str]
    tags: List[str] = []
    decided_by: Optional[str]
    impact: Optional[str]
    status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}

    @field_validator("tags", mode="before")
    @classmethod
    def coerce_tags(cls, v: object) -> List[str]:
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            return [t.strip() for t in v.split(",") if t.strip()]
        return []


class DecisionListOut(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[DecisionOut]
