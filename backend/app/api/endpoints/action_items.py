"""
Action Items endpoints:
  GET    /api/actions
  POST   /api/actions
  PUT    /api/actions/{action_id}
  DELETE /api/actions/{action_id}
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...schemas.action_item import (
    ActionItemCreate,
    ActionItemOut,
    ActionItemListOut,
    ActionItemUpdate,
)
from ...services import action_item_service

router = APIRouter()


@router.get("", response_model=ActionItemListOut, summary="List action items")
def list_action_items(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search title, description, owner"),
    status: Optional[str] = Query(None, description="pending | in_progress | completed | overdue"),
    priority: Optional[str] = Query(None, description="low | medium | high"),
    meeting_id: Optional[int] = Query(None, description="Filter by meeting ID"),
    owner: Optional[str] = Query(None, description="Filter by owner name (partial match)"),
    sort_by: str = Query("due_date", description="Sort field"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    total, items = action_item_service.get_action_items(
        db,
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        priority=priority,
        meeting_id=meeting_id,
        owner=owner,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return ActionItemListOut(total=total, page=page, page_size=page_size, items=items)


@router.post("", response_model=ActionItemOut, status_code=status.HTTP_201_CREATED, summary="Create action item")
def create_action_item(payload: ActionItemCreate, db: Session = Depends(get_db)):
    return action_item_service.create_action_item(db, payload)


@router.put("/{action_id}", response_model=ActionItemOut, summary="Update action item")
def update_action_item(action_id: int, payload: ActionItemUpdate, db: Session = Depends(get_db)):
    item = action_item_service.get_action_item_by_id(db, action_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action item with id={action_id} not found.",
        )
    return action_item_service.update_action_item(db, item, payload)


@router.delete("/{action_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete action item")
def delete_action_item(action_id: int, db: Session = Depends(get_db)):
    item = action_item_service.get_action_item_by_id(db, action_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action item with id={action_id} not found.",
        )
    action_item_service.delete_action_item(db, item)
