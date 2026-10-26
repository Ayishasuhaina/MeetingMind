"""Decision ORM model."""
from __future__ import annotations

import datetime
from typing import Optional

from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Decision(Base):
    __tablename__ = "decisions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    meeting_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("meetings.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # ISO date string for when the decision was formally made
    decision_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    # evidence: transcript excerpt supporting this decision
    evidence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # tags: comma-separated keyword tags
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # decided_by: person who made/owns the decision
    decided_by: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    # impact: low | medium | high
    impact: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    # status: pending | approved | rejected
    status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)
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
        "Meeting", back_populates="decisions"
    )

    def __repr__(self) -> str:
        return f"<Decision id={self.id} title={self.title!r}>"
