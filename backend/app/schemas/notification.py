"""Pydantic schemas for Notification endpoints."""
from __future__ import annotations

import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class NotificationOut(BaseModel):
    id: int
    title: str
    message: Optional[str]
    notification_type: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    is_read: bool
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class NotificationListOut(BaseModel):
    total: int
    unread_count: int
    items: List[NotificationOut]


class MarkReadRequest(BaseModel):
    notification_ids: Optional[List[int]] = None  # None = mark all as read
