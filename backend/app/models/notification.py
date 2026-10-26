"""Notification ORM model."""
from __future__ import annotations

import datetime
from typing import Optional

from sqlalchemy import String, Text, DateTime, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # type: info | warning | error | success
    notification_type: Mapped[str] = mapped_column(String(30), default="info", nullable=False)
    # entity references (optional)
    entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)   # meeting | action | decision
    entity_id: Mapped[Optional[int]] = mapped_column(nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Notification id={self.id} type={self.notification_type!r} read={self.is_read}>"
