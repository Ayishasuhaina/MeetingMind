"""Meeting ORM model."""
from __future__ import annotations

import datetime
from typing import List, Optional

from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)   # ISO date string YYYY-MM-DD
    time: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)   # HH:MM
    duration: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # e.g. "60 min"
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)   # meeting type/category
    # Participants stored as comma-separated string; service layer converts list <-> str
    participants: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # processing_status: pending | processing | completed | failed
    processing_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
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
    action_items: Mapped[List["ActionItem"]] = relationship(  # noqa: F821
        "ActionItem", back_populates="meeting", cascade="all, delete-orphan"
    )
    decisions: Mapped[List["Decision"]] = relationship(  # noqa: F821
        "Decision", back_populates="meeting", cascade="all, delete-orphan"
    )
    key_points: Mapped[List["KeyPoint"]] = relationship(  # noqa: F821
        "KeyPoint", back_populates="meeting", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Meeting id={self.id} title={self.title!r}>"
