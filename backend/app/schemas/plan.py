from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Mode = Literal["train", "bus", "carpool", "car"]


class OptionCreate(BaseModel):
    mode: Mode
    price_per_trip: float = Field(ge=0)
    duration_min: int = Field(gt=0)
    monthly_pass_price: float | None = Field(default=None, ge=0)
    riders: int = Field(default=1, ge=1, le=8)


class OptionResponse(OptionCreate):
    id: int
    plan_id: int
    model_config = ConfigDict(from_attributes=True)


class PlanCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    origin: str = Field(min_length=2, max_length=100)
    destination: str = Field(min_length=2, max_length=100)
    distance_km: float = Field(gt=0)
    trips_per_week: int = Field(ge=1, le=14)


class PlanUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    origin: str | None = Field(default=None, min_length=2, max_length=100)
    destination: str | None = Field(default=None, min_length=2, max_length=100)
    distance_km: float | None = Field(default=None, gt=0)
    trips_per_week: int | None = Field(default=None, ge=1, le=14)


class PlanResponse(PlanCreate):
    id: int
    created_at: datetime
    options: list[OptionResponse] = []
    model_config = ConfigDict(from_attributes=True)