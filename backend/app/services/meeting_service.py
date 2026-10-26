"""Service layer for Meeting CRUD operations."""
from __future__ import annotations

from typing import List, Optional, Tuple

from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.models.meeting import Meeting
from app.schemas.meeting import MeetingCreate, MeetingUpdate


def _participants_to_str(participants: Optional[List[str]]) -> Optional[str]:
    if not participants:
        return None
    return ",".join(participants)


def get_meetings(
    db: Session,
    *,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    category: Optional[str] = None,
    processing_status: Optional[str] = None,
    sort_by: str = "date",
    sort_order: str = "desc",
) -> Tuple[int, List[Meeting]]:
    q = db.query(Meeting)

    if search:
        term = f"%{search}%"
        q = q.filter(
            or_(
                Meeting.title.ilike(term),
                Meeting.summary.ilike(term),
                Meeting.description.ilike(term),
            )
        )
    if category:
        q = q.filter(Meeting.category.ilike(category))
    if processing_status:
        q = q.filter(Meeting.processing_status == processing_status)

    total = q.count()

    # Sorting
    sort_col = getattr(Meeting, sort_by, Meeting.date)
    if sort_order == "asc":
        q = q.order_by(sort_col.asc().nullslast())
    else:
        q = q.order_by(sort_col.desc().nullslast())

    offset = (page - 1) * page_size
    items = q.offset(offset).limit(page_size).all()
    return total, items


def get_meeting_by_id(db: Session, meeting_id: int) -> Optional[Meeting]:
    return db.get(Meeting, meeting_id)


def create_meeting(db: Session, payload: MeetingCreate) -> Meeting:
    data = payload.model_dump()
    data["participants"] = _participants_to_str(data.get("participants"))
    meeting = Meeting(**data)
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


def update_meeting(db: Session, meeting: Meeting, payload: MeetingUpdate) -> Meeting:
    data = payload.model_dump(exclude_unset=True)
    if "participants" in data:
        data["participants"] = _participants_to_str(data["participants"])
    for key, value in data.items():
        setattr(meeting, key, value)
    db.commit()
    db.refresh(meeting)
    return meeting


def delete_meeting(db: Session, meeting: Meeting) -> None:
    db.delete(meeting)
    db.commit()
