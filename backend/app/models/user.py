import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    
    ai_insight: Mapped[dict | None] = mapped_column(JSON, nullable=True)

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

    dreams: Mapped[list["Dream"]] = relationship("Dream", back_populates="user", cascade="all, delete-orphan")
