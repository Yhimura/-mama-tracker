from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import BigInteger, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.profile import PregnancyProfile
    from app.models.daily_log import DailyLog


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True, autoincrement=False)
    username: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    first_name: Mapped[str] = mapped_column(String(128), nullable=False)
    language_code: Mapped[Optional[str]] = mapped_column(String(10), default="ru", nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    profiles: Mapped[List["PregnancyProfile"]] = relationship(
        "PregnancyProfile",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(PregnancyProfile.created_at)",
    )
    daily_logs: Mapped[List["DailyLog"]] = relationship(
        "DailyLog",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(DailyLog.log_date)",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username} first_name={self.first_name}>"
