import uuid
from datetime import date
from typing import Any, List, Optional, TYPE_CHECKING
from sqlalchemy import (
    BigInteger,
    Date,
    Float,
    Integer,
    Text,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class DailyLog(Base, TimestampMixin):
    __tablename__ = "daily_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    log_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # Physical wellness & toxicosis
    nausea_level: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="0 (great) to 5 (vomiting)")
    energy_level: Mapped[int] = mapped_column(Integer, default=3, nullable=False, comment="1 (exhausted) to 5 (full of energy)")
    symptoms: Mapped[List[str]] = mapped_column(
        JSONB,
        default=list,
        nullable=False,
        comment="Active symptoms array, e.g. ['heartburn', 'edema', 'backache']",
    )

    # Nutrition & Hydration
    water_cups: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="Number of 250ml cups")
    food_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    food_tags: Mapped[List[str]] = mapped_column(
        JSONB,
        default=list,
        nullable=False,
        comment="Tags like ['craving_sweet', 'low_appetite', 'healthy_food']",
    )

    # Vitals & Kicks
    weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="Weight in kg")
    blood_pressure_sys: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, comment="Systolic BP")
    blood_pressure_dia: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, comment="Diastolic BP")
    kick_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="Kicks / movements counter")

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="Personal reflections or questions for doctor")

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="daily_logs")

    __table_args__ = (
        UniqueConstraint("user_id", "log_date", name="uq_user_daily_log_date"),
        Index("idx_user_log_date", "user_id", "log_date"),
    )

    def __repr__(self) -> str:
        return f"<DailyLog id={self.id} user_id={self.user_id} date={self.log_date}>"
