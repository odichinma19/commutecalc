from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.comparison import ComparisonItem


class AdviceRequest(BaseModel):
    text: str = Field(min_length=3, max_length=500)


class Understood(BaseModel):
    priority: Literal["cost", "time", "co2"]
    max_budget: float | None


class AdviceResponse(BaseModel):
    understood: Understood
    recommendation: ComparisonItem | None
    explanation: str
    source: str