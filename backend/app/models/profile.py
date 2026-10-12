import uuid
from datetime import date
from typing import Optional, TYPE_CHECKING
from sqlalchemy import BigInteger, Date, Float, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class PregnancyProfile(Base, TimestampMixin):
    __tablename__ = "pregnancy_profiles"

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

    # Pregnancy key dates (LMP: Last Menstrual Period or conception or EDD: Estimated Due Date)
    start_date: Optional[date] = mapped_column(Date, nullable=True, comment="Date of last menstrual period (LMP)")
    conception_date: Optional[date] = mapped_column(Date, nullable=True, comment="Estimated conception date")
    estimated_due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True, comment="Estimated date of delivery (EDD)")

    current_week: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    initial_weight: Optional[float] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="profiles")

    def __repr__(self) -> str:
        return f"<PregnancyProfile id={self.id} user_id={self.user_id} edd={self.estimated_due_date}>"
