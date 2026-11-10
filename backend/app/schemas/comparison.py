from pydantic import BaseModel


class ComparisonItem(BaseModel):
    rank: int
    option_id: int
    mode: str
    monthly_cost: float
    monthly_minutes: float
    monthly_co2_kg: float
    uses_pass: bool
    break_even_trips: float | None


class ComparisonResponse(BaseModel):
    plan_id: int
    trips_per_month: float
    priority: str
    results: list[ComparisonItem]
    best: ComparisonItem | None