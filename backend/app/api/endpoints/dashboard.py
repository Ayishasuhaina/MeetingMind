"""GET /api/dashboard/stats"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...models.meeting import Meeting
from ...models.action_item import ActionItem
from ...models.decision import Decision
from ...schemas.common import DashboardStats

router = APIRouter()


@router.get("/stats", response_model=DashboardStats, summary="Dashboard statistics")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Aggregate counts for the dashboard overview cards."""

    # Meetings
    total_meetings = db.query(Meeting).count()
    upcoming_meetings = db.query(Meeting).filter(
        Meeting.processing_status == "pending"
    ).count()
    completed_meetings = db.query(Meeting).filter(
        Meeting.processing_status == "completed"
    ).count()

    # Actions
    total_actions = db.query(ActionItem).count()
    pending_actions = db.query(ActionItem).filter(ActionItem.status == "pending").count()
    in_progress_actions = db.query(ActionItem).filter(ActionItem.status == "in_progress").count()
    completed_actions = db.query(ActionItem).filter(ActionItem.status == "completed").count()
    overdue_actions = db.query(ActionItem).filter(ActionItem.status == "overdue").count()

    # Decisions
    total_decisions = db.query(Decision).count()
    approved_decisions = db.query(Decision).filter(Decision.status == "approved").count()
    pending_decisions = db.query(Decision).filter(Decision.status == "pending").count()

    return DashboardStats(
        total_meetings=total_meetings,
        upcoming_meetings=upcoming_meetings,
        completed_meetings=completed_meetings,
        total_actions=total_actions,
        pending_actions=pending_actions,
        in_progress_actions=in_progress_actions,
        completed_actions=completed_actions,
        overdue_actions=overdue_actions,
        total_decisions=total_decisions,
        approved_decisions=approved_decisions,
        pending_decisions=pending_decisions,
    )
