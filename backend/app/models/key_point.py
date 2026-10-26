"""KeyPoint ORM model — notable highlights extracted from a meeting."""
from __future__ import annotations

import datetime
from typing import Optional

from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class KeyPoint(Base):
    __tablename__ = "key_points"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    meeting_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), nullable=True, index=True
    )
    # category: summary | highlight | risk | question | other
    category: Mapped[str] = mapped_column(String(50), default="highlight", nullable=False)
    # source excerpt from transcript
    evidence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    meeting: Mapped[Optional["Meeting"]] = relationship(  # noqa: F821
        "Meeting", back_populates="key_points"
    )

    def __repr__(self) -> str:
        return f"<KeyPoint id={self.id} category={self.category!r}>"
