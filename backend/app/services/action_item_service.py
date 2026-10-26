"""Service layer for ActionItem CRUD operations."""
from __future__ import annotations

from typing import List, Optional, Tuple

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.action_item import ActionItem
from app.schemas.action_item import ActionItemCreate, ActionItemUpdate


def get_action_items(
    db: Session,
    *,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    meeting_id: Optional[int] = None,
    owner: Optional[str] = None,
    sort_by: str = "due_date",
    sort_order: str = "asc",
) -> Tuple[int, List[ActionItem]]:
    q = db.query(ActionItem)

    if search:
        term = f"%{search}%"
        q = q.filter(
            or_(
                ActionItem.title.ilike(term),
                ActionItem.description.ilike(term),
                ActionItem.owner.ilike(term),
            )
        )
    if status:
        q = q.filter(ActionItem.status == status)
    if priority:
        q = q.filter(ActionItem.priority == priority)
    if meeting_id is not None:
        q = q.filter(ActionItem.meeting_id == meeting_id)
    if owner:
        q = q.filter(ActionItem.owner.ilike(f"%{owner}%"))

    total = q.count()

    sort_col = getattr(ActionItem, sort_by, ActionItem.due_date)
    if sort_order == "asc":
        q = q.order_by(sort_col.asc().nullslast())
    else:
        q = q.order_by(sort_col.desc().nullslast())

    offset = (page - 1) * page_size
    items = q.offset(offset).limit(page_size).all()
    return total, items


def get_action_item_by_id(db: Session, action_id: int) -> Optional[ActionItem]:
    return db.get(ActionItem, action_id)


def create_action_item(db: Session, payload: ActionItemCreate) -> ActionItem:
    item = ActionItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_action_item(
    db: Session, item: ActionItem, payload: ActionItemUpdate
) -> ActionItem:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


def delete_action_item(db: Session, item: ActionItem) -> None:
    db.delete(item)
    db.commit()
