"""
CSV export endpoints:
  GET /api/export/meetings  — CSV of all meetings
  GET /api/export/actions   — CSV of all action items
  GET /api/export/decisions — CSV of all decisions
"""
from __future__ import annotations

import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.meeting import Meeting
from app.models.action_item import ActionItem
from app.models.decision import Decision

router = APIRouter()


def _csv_response(rows: list[list[str]], headers: list[str], filename: str) -> StreamingResponse:
    """Build a StreamingResponse containing a CSV file."""
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    writer.writerows(rows)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/meetings", summary="Export meetings as CSV")
def export_meetings(db: Session = Depends(get_db)):
    """Download all meetings as a CSV file."""
    meetings = db.query(Meeting).order_by(Meeting.id).all()
    headers = [
        "id", "title", "date", "time", "duration",
        "category", "participants", "processing_status",
    ]
    rows = [
        [
            m.id,
            m.title,
            m.date or "",
            m.time or "",
            m.duration or "",
            m.category or "",
            m.participants or "",
            m.processing_status,
        ]
        for m in meetings
    ]
    return _csv_response(rows, headers, "meetings.csv")


@router.get("/actions", summary="Export action items as CSV")
def export_actions(db: Session = Depends(get_db)):
    """Download all action items as a CSV file."""
    actions = db.query(ActionItem).order_by(ActionItem.id).all()
    headers = [
        "id", "title", "owner", "due_date",
        "priority", "status", "meeting_id",
    ]
    rows = [
        [
            a.id,
            a.title,
            a.owner or "",
            a.due_date or "",
            a.priority,
            a.status,
            a.meeting_id if a.meeting_id is not None else "",
        ]
        for a in actions
    ]
    return _csv_response(rows, headers, "action_items.csv")


@router.get("/decisions", summary="Export decisions as CSV")
def export_decisions(db: Session = Depends(get_db)):
    """Download all decisions as a CSV file."""
    decisions = db.query(Decision).order_by(Decision.id).all()
    headers = [
        "id", "title", "decided_by", "decision_date",
        "impact", "status", "meeting_id", "tags",
    ]
    rows = [
        [
            d.id,
            d.title,
            d.decided_by or "",
            d.decision_date or "",
            d.impact or "",
            d.status,
            d.meeting_id if d.meeting_id is not None else "",
            d.tags or "",
        ]
        for d in decisions
    ]
    return _csv_response(rows, headers, "decisions.csv")
