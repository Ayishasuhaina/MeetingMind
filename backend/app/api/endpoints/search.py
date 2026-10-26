"""
Global search endpoint:
  GET /api/search?q=...&types=meeting,action,decision
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.meeting import Meeting
from app.models.action_item import ActionItem
from app.models.decision import Decision
from app.schemas.common import SearchOut, SearchResultItem

router = APIRouter()

_DEFAULT_LIMIT = 10


@router.get("/search", response_model=SearchOut, summary="Global search")
def global_search(
    q: str = Query(..., min_length=1, description="Search query string"),
    types: Optional[str] = Query(
        None,
        description="Comma-separated entity types to search: meeting, action, decision. Defaults to all.",
    ),
    limit: int = Query(10, ge=1, le=50, description="Max results per entity type"),
    db: Session = Depends(get_db),
):
    """
    Search across meetings, action items, and decisions simultaneously.
    Returns results grouped by type with a snippet for context.
    """
    search_types = {t.strip().lower() for t in types.split(",")} if types else {"meeting", "action", "decision"}
    term = f"%{q}%"
    results: List[SearchResultItem] = []

    # ── Meetings ──────────────────────────────────────────────────────────
    if "meeting" in search_types:
        meetings = (
            db.query(Meeting)
            .filter(
                or_(
                    Meeting.title.ilike(term),
                    Meeting.summary.ilike(term),
                    Meeting.description.ilike(term),
                    Meeting.participants.ilike(term),
                )
            )
            .limit(limit)
            .all()
        )
        for m in meetings:
            snippet = m.summary or m.description or ""
            results.append(
                SearchResultItem(
                    type="meeting",
                    id=m.id,
                    title=m.title,
                    snippet=snippet[:200] if snippet else None,
                    date=m.date,
                    status=m.processing_status,
                    extra={"category": m.category, "duration": m.duration},
                )
            )

    # ── Action Items ──────────────────────────────────────────────────────
    if "action" in search_types:
        actions = (
            db.query(ActionItem)
            .filter(
                or_(
                    ActionItem.title.ilike(term),
                    ActionItem.description.ilike(term),
                    ActionItem.owner.ilike(term),
                    ActionItem.evidence.ilike(term),
                )
            )
            .limit(limit)
            .all()
        )
        for a in actions:
            results.append(
                SearchResultItem(
                    type="action",
                    id=a.id,
                    title=a.title,
                    snippet=a.description,
                    date=a.due_date,
                    status=a.status,
                    extra={"priority": a.priority, "owner": a.owner},
                )
            )

    # ── Decisions ─────────────────────────────────────────────────────────
    if "decision" in search_types:
        decisions = (
            db.query(Decision)
            .filter(
                or_(
                    Decision.title.ilike(term),
                    Decision.description.ilike(term),
                    Decision.tags.ilike(term),
                    Decision.evidence.ilike(term),
                )
            )
            .limit(limit)
            .all()
        )
        for d in decisions:
            results.append(
                SearchResultItem(
                    type="decision",
                    id=d.id,
                    title=d.title,
                    snippet=d.description,
                    date=d.decision_date,
                    status=d.status,
                    extra={"impact": d.impact, "decided_by": d.decided_by},
                )
            )

    return SearchOut(query=q, total=len(results), results=results)
