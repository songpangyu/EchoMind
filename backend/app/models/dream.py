import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Dream(Base):
    __tablename__ = "dreams"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    source_type: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="completed")
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    transcript: Mapped[str] = mapped_column(Text)
    mood: Mapped[str | None] = mapped_column(String(32), nullable=True)
    tags_json: Mapped[list[str]] = mapped_column(JSON, default=list)
    audio_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ai_image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    ai_image_style: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ai_autofill_status: Mapped[str] = mapped_column(String(20), default="idle")
    ai_image_status: Mapped[str] = mapped_column(String(20), default="idle")
    is_favorited: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

