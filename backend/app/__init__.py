# backend/app/__init__.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import engine, Base
from .api.router import api_router


def create_app() -> FastAPI:
    """Application factory — creates and configures the FastAPI app."""

    # ── Create all DB tables on startup ──────────────────────────────────
    # Import models so SQLAlchemy metadata is populated before create_all
    from app.models import meeting, action_item, decision, key_point, notification  # noqa: F401
    Base.metadata.create_all(bind=engine)

    application = FastAPI(
        title="MeetingMind API",
        description=(
            "Backend API for MeetingMind — Meeting Knowledge Extraction "
            "and Action Tracking Platform.\n\n"
            "All endpoints are prefixed with `/api`."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # ── CORS ──────────────────────────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routes ────────────────────────────────────────────────────────────
    application.include_router(api_router, prefix="/api")

    return application
