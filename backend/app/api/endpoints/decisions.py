"""
Decisions endpoints:
  GET    /api/decisions
  POST   /api/decisions
  PUT    /api/decisions/{decision_id}
  DELETE /api/decisions/{decision_id}
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...schemas.decision import (
    DecisionCreate,
    DecisionOut,
    DecisionListOut,
    DecisionUpdate,
)
from ...services import decision_service

router = APIRouter()


@router.get("", response_model=DecisionListOut, summary="List decisions")
def list_decisions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search title, description, tags"),
    impact: Optional[str] = Query(None, description="low | medium | high"),
    status: Optional[str] = Query(None, description="pending | approved | rejected"),
    meeting_id: Optional[int] = Query(None),
    sort_by: str = Query("decision_date"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    total, items = decision_service.get_decisions(
        db,
        page=page,
        page_size=page_size,
        search=search,
        impact=impact,
        status=status,
        meeting_id=meeting_id,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return DecisionListOut(total=total, page=page, page_size=page_size, items=items)


@router.post("", response_model=DecisionOut, status_code=status.HTTP_201_CREATED, summary="Create decision")
def create_decision(payload: DecisionCreate, db: Session = Depends(get_db)):
    return decision_service.create_decision(db, payload)


@router.put("/{decision_id}", response_model=DecisionOut, summary="Update decision")
def update_decision(decision_id: int, payload: DecisionUpdate, db: Session = Depends(get_db)):
    decision = decision_service.get_decision_by_id(db, decision_id)
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision with id={decision_id} not found.",
        )
    return decision_service.update_decision(db, decision, payload)


@router.delete("/{decision_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete decision")
def delete_decision(decision_id: int, db: Session = Depends(get_db)):
    decision = decision_service.get_decision_by_id(db, decision_id)
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision with id={decision_id} not found.",
        )
    decision_service.delete_decision(db, decision)
