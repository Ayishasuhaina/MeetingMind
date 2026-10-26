"""ActionItem ORM model."""
from __future__ import annotations

import datetime
from typing import Optional

from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ActionItem(Base):
    __tablename__ = "action_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    meeting_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("meetings.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # owner / assignee name (free text — no auth in Phase 2)
    owner: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    due_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # YYYY-MM-DD
    # priority: low | medium | high
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    # status: pending | in_progress | completed | overdue
    status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)
    # evidence: excerpt / quote from transcript that generated this action
    evidence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    meeting: Mapped[Optional["Meeting"]] = relationship(  # noqa: F821
        "Meeting", back_populates="action_items"
    )

    def __repr__(self) -> str:
        return f"<ActionItem id={self.id} title={self.title!r} status={self.status!r}>"
