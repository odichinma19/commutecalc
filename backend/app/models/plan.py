from datetime import datetime, timezone

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    origin: Mapped[str] = mapped_column(String(100))
    destination: Mapped[str] = mapped_column(String(100))
    distance_km: Mapped[float]
    trips_per_week: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )
    options: Mapped[list["Option"]] = relationship(
        back_populates="plan", cascade="all, delete-orphan"
    )


class Option(Base):
    __tablename__ = "options"

    id: Mapped[int] = mapped_column(primary_key=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("plans.id"))
    mode: Mapped[str] = mapped_column(String(20))
    price_per_trip: Mapped[float]
    duration_min: Mapped[int]
    monthly_pass_price: Mapped[float | None] = mapped_column(default=None)
    riders: Mapped[int] = mapped_column(default=1)

    plan: Mapped["Plan"] = relationship(back_populates="options")