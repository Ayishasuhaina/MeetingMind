"""Application settings — loaded from .env file."""
from __future__ import annotations

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "sqlite:///./meetingmind.db"
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_reload: bool = True

    # Raw comma-separated string from .env
    cors_origins: str = "http://localhost:5173,http://localhost:4173,http://localhost:5174"

    # ── Optional LLM settings (Phase 3) ──────────────────────────────────
    # Leave blank to use the local rule-based extractor only.
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_base_url: str = ""   # override for local/compatible providers

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
