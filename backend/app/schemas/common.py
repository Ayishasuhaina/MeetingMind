"""Common/shared Pydantic schemas."""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel


class HealthOut(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    environment: str


class ErrorOut(BaseModel):
    detail: str


class SearchResultItem(BaseModel):
    type: str          # "meeting" | "action" | "decision"
    id: int
    title: str
    snippet: Optional[str] = None
    date: Optional[str] = None
    status: Optional[str] = None
    extra: Optional[Any] = None


class SearchOut(BaseModel):
    query: str
    total: int
    results: list[SearchResultItem]


class DashboardStats(BaseModel):
    total_meetings: int
    upcoming_meetings: int
    completed_meetings: int
    total_actions: int
    pending_actions: int
    in_progress_actions: int
    completed_actions: int
    overdue_actions: int
    total_decisions: int
    approved_decisions: int
    pending_decisions: int


class ReportSummary(BaseModel):
    meetings_by_category: dict[str, int]
    actions_by_status: dict[str, int]
    actions_by_priority: dict[str, int]
    decisions_by_impact: dict[str, int]
    decisions_by_status: dict[str, int]
    recent_activity_count: int   # items created in last 30 days
