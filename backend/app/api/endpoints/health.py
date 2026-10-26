"""GET /api/health"""
from fastapi import APIRouter
from ...core.config import settings
from ...schemas.common import HealthOut

router = APIRouter()


@router.get("/health", response_model=HealthOut, summary="Health check")
def health_check():
    """Returns 200 OK with API version and environment info."""
    return HealthOut(status="ok", version="1.0.0", environment=settings.app_env)
