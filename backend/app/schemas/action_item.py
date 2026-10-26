"""Pydantic schemas for ActionItem endpoints."""
from __future__ import annotations

import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ActionItemCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    meeting_id: Optional[int] = None
    owner: Optional[str] = Field(None, max_length=150)
    due_date: Optional[str] = Field(None, examples=["2026-10-30"])
    priority: str = Field("medium", pattern="^(low|medium|high|critical)$")
    status: str = Field("pending", pattern="^(todo|pending|in_progress|blocked|completed|overdue)$")
    evidence: Optional[str] = None


class ActionItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    meeting_id: Optional[int] = None
    owner: Optional[str] = Field(None, max_length=150)
    due_date: Optional[str] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|critical)$")
    status: Optional[str] = Field(None, pattern="^(todo|pending|in_progress|blocked|completed|overdue)$")
    evidence: Optional[str] = None


class ActionItemOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    meeting_id: Optional[int]
    owner: Optional[str]
    due_date: Optional[str]
    priority: str
    status: str
    evidence: Optional[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class ActionItemListOut(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ActionItemOut]
