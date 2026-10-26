"""Top-level API router — aggregates all endpoint modules."""
from fastapi import APIRouter

from .endpoints import health, dashboard, meetings, action_items, decisions, search, reports, extract, notifications, export

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(meetings.router, prefix="/meetings", tags=["Meetings"])
api_router.include_router(action_items.router, prefix="/actions", tags=["Action Items"])
api_router.include_router(decisions.router, prefix="/decisions", tags=["Decisions"])
api_router.include_router(search.router, tags=["Search"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(extract.router, prefix="/extract", tags=["Extraction"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(export.router, prefix="/export", tags=["Export"])
