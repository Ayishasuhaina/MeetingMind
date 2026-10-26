"""Service layer for Decision CRUD operations."""
from __future__ import annotations

from typing import List, Optional, Tuple

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.decision import Decision
from app.schemas.decision import DecisionCreate, DecisionUpdate


def _tags_to_str(tags: Optional[List[str]]) -> Optional[str]:
    if not tags:
        return None
    return ",".join(tags)


def get_decisions(
    db: Session,
    *,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    impact: Optional[str] = None,
    status: Optional[str] = None,
    meeting_id: Optional[int] = None,
    sort_by: str = "decision_date",
    sort_order: str = "desc",
) -> Tuple[int, List[Decision]]:
    q = db.query(Decision)

    if search:
        term = f"%{search}%"
        q = q.filter(
            or_(
                Decision.title.ilike(term),
                Decision.description.ilike(term),
                Decision.tags.ilike(term),
            )
        )
    if impact:
        q = q.filter(Decision.impact == impact)
    if status:
        q = q.filter(Decision.status == status)
    if meeting_id is not None:
        q = q.filter(Decision.meeting_id == meeting_id)

    total = q.count()

    sort_col = getattr(Decision, sort_by, Decision.created_at)
    if sort_order == "asc":
        q = q.order_by(sort_col.asc().nullslast())
    else:
        q = q.order_by(sort_col.desc().nullslast())

    offset = (page - 1) * page_size
    items = q.offset(offset).limit(page_size).all()
    return total, items


def get_decision_by_id(db: Session, decision_id: int) -> Optional[Decision]:
    return db.get(Decision, decision_id)


def create_decision(db: Session, payload: DecisionCreate) -> Decision:
    data = payload.model_dump()
    data["tags"] = _tags_to_str(data.get("tags"))
    decision = Decision(**data)
    db.add(decision)
    db.commit()
    db.refresh(decision)
    return decision


def update_decision(
    db: Session, decision: Decision, payload: DecisionUpdate
) -> Decision:
    data = payload.model_dump(exclude_unset=True)
    if "tags" in data:
        data["tags"] = _tags_to_str(data["tags"])
    for key, value in data.items():
        setattr(decision, key, value)
    db.commit()
    db.refresh(decision)
    return decision


def delete_decision(db: Session, decision: Decision) -> None:
    db.delete(decision)
    db.commit()
