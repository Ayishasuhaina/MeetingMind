from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...schemas.meeting import MeetingCreate, MeetingOut, MeetingListOut, MeetingUpdate
from ...services import meeting_service

router = APIRouter()

@router.get("", response_model=MeetingListOut, summary="List meetings")
def list_meetings(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search title, summary, description"),
    category: Optional[str] = Query(None, description="Filter by meeting category"),
    processing_status: Optional[str] = Query(None, description="Filter by processing status"),
    sort_by: str = Query("date", description="Sort field: date | title | created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    total, items = meeting_service.get_meetings(
        db,
        page=page,
        page_size=page_size,
        search=search,
        category=category,
        processing_status=processing_status,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return MeetingListOut(total=total, page=page, page_size=page_size, items=items)

@router.post("", response_model=MeetingOut, status_code=status.HTTP_201_CREATED, summary="Create a meeting")
def create_meeting(payload: MeetingCreate, db: Session = Depends(get_db)):
    return meeting_service.create_meeting(db, payload)

@router.get("/{meeting_id}", response_model=MeetingOut, summary="Get a meeting")
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = meeting_service.get_meeting_by_id(db, meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with id={meeting_id} not found.",
        )
    return meeting

@router.put("/{meeting_id}", response_model=MeetingOut, summary="Update a meeting")
def update_meeting(meeting_id: int, payload: MeetingUpdate, db: Session = Depends(get_db)):
    meeting = meeting_service.get_meeting_by_id(db, meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with id={meeting_id} not found.",
        )
    return meeting_service.update_meeting(db, meeting, payload)

@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a meeting")
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = meeting_service.get_meeting_by_id(db, meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with id={meeting_id} not found.",
        )
    meeting_service.delete_meeting(db, meeting)
