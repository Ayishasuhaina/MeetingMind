"""
Notification endpoints:
  GET    /api/notifications        — list notifications (newest first)
  PUT    /api/notifications/read   — mark notifications as read
  DELETE /api/notifications/{id}   — delete one notification
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.notification import Notification
from app.schemas.notification import (
    MarkReadRequest,
    NotificationListOut,
    NotificationOut,
)

router = APIRouter()


@router.get("", response_model=NotificationListOut, summary="List notifications")
def list_notifications(
    unread_only: bool = Query(False, description="Return only unread notifications"),
    db: Session = Depends(get_db),
):
    """Return all notifications ordered by newest first, with total and unread counts."""
    query = db.query(Notification)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))

    items = query.order_by(Notification.created_at.desc()).all()

    # Always compute unread_count across all notifications (not just filtered)
    unread_count = (
        db.query(Notification).filter(Notification.is_read.is_(False)).count()
    )

    return NotificationListOut(
        total=len(items),
        unread_count=unread_count,
        items=[NotificationOut.model_validate(n) for n in items],
    )


@router.put("/read", response_model=dict, summary="Mark notifications as read")
def mark_read(
    body: MarkReadRequest,
    db: Session = Depends(get_db),
):
    """
    Mark notifications as read.
    If notification_ids is None, mark ALL notifications as read.
    Otherwise mark only the specified IDs.
    """
    query = db.query(Notification).filter(Notification.is_read.is_(False))

    if body.notification_ids is not None:
        query = query.filter(Notification.id.in_(body.notification_ids))

    updated = query.update({"is_read": True}, synchronize_session="fetch")
    db.commit()

    return {"updated": updated}


@router.delete("/{notification_id}", response_model=dict, summary="Delete a notification")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
):
    """Delete a single notification by ID."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notif)
    db.commit()
    return {"deleted": notification_id}
