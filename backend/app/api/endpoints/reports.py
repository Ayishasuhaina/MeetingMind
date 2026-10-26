"""
Reports endpoint:
  GET /api/reports/summary
"""
import datetime
from collections import Counter
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.meeting import Meeting
from app.models.action_item import ActionItem
from app.models.decision import Decision
from app.schemas.common import ReportSummary

router = APIRouter()


@router.get("/summary", response_model=ReportSummary, summary="Aggregated report summary")
def get_report_summary(
    date_from: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    """
    Returns aggregate statistics useful for charts and reports:
    - Meetings broken down by category
    - Actions broken down by status and priority
    - Decisions broken down by impact and status
    - Count of items created in the last 30 days

    Optionally filter by date_from and date_to (YYYY-MM-DD).
    When provided, only items whose created_at falls within the range are included.
    """
    # Build base queries with optional date range filtering
    meetings_q = db.query(Meeting)
    actions_q = db.query(ActionItem)
    decisions_q = db.query(Decision)

    if date_from:
        from_dt = datetime.datetime.strptime(date_from, "%Y-%m-%d")
        meetings_q = meetings_q.filter(Meeting.created_at >= from_dt)
        actions_q = actions_q.filter(ActionItem.created_at >= from_dt)
        decisions_q = decisions_q.filter(Decision.created_at >= from_dt)

    if date_to:
        # Include the full end-of-day by adding one day
        to_dt = datetime.datetime.strptime(date_to, "%Y-%m-%d") + datetime.timedelta(days=1)
        meetings_q = meetings_q.filter(Meeting.created_at < to_dt)
        actions_q = actions_q.filter(ActionItem.created_at < to_dt)
        decisions_q = decisions_q.filter(Decision.created_at < to_dt)

    # Meetings by category
    meetings = meetings_q.all()
    meetings_by_category = dict(
        Counter(m.category or "Uncategorized" for m in meetings)
    )

    # Actions
    actions = actions_q.all()
    actions_by_status = dict(Counter(a.status for a in actions))
    actions_by_priority = dict(Counter(a.priority for a in actions))

    # Decisions
    decisions = decisions_q.all()
    decisions_by_impact = dict(Counter(d.impact or "unspecified" for d in decisions))
    decisions_by_status = dict(Counter(d.status for d in decisions))

    # Recent activity (last 30 days)
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    recent_meetings = db.query(Meeting).filter(Meeting.created_at >= cutoff).count()
    recent_actions = db.query(ActionItem).filter(ActionItem.created_at >= cutoff).count()
    recent_decisions = db.query(Decision).filter(Decision.created_at >= cutoff).count()
    recent_activity_count = recent_meetings + recent_actions + recent_decisions

    return ReportSummary(
        meetings_by_category=meetings_by_category,
        actions_by_status=actions_by_status,
        actions_by_priority=actions_by_priority,
        decisions_by_impact=decisions_by_impact,
        decisions_by_status=decisions_by_status,
        recent_activity_count=recent_activity_count,
    )
