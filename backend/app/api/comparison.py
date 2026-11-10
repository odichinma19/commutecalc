from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.plans import get_plan_or_404
from app.database import get_db
from app.schemas.comparison import ComparisonItem, ComparisonResponse
from app.services.my_version import WEEKS_PER_MONTH, break_even_trips, compare_option

router = APIRouter(prefix="/api/plans/{plan_id}/comparison", tags=["Comparison"])

SORT_KEYS = {
    "cost": lambda pair: pair[1].monthly_cost,
    "time": lambda pair: pair[1].monthly_minutes,
    "co2": lambda pair: pair[1].monthly_co2_kg,
}


@router.get("", response_model=ComparisonResponse)
def compare(
    plan_id: int,
    priority: Literal["cost", "time", "co2"] = "cost",
    db: Session = Depends(get_db),
):
    plan = get_plan_or_404(plan_id, db)

    pairs = []
    for option in plan.options:
        result = compare_option(
            option.mode, option.price_per_trip, option.duration_min,
            plan.distance_km, plan.trips_per_week,
            option.monthly_pass_price, option.riders,
        )
        pairs.append((option, result))

    pairs.sort(key=SORT_KEYS[priority])

    items = [
        ComparisonItem(
            rank=rank,
            option_id=option.id,
            mode=result.mode,
            monthly_cost=result.monthly_cost,
            monthly_minutes=result.monthly_minutes,
            monthly_co2_kg=result.monthly_co2_kg,
            uses_pass=result.uses_pass,
            break_even_trips=break_even_trips(
                option.mode, option.price_per_trip,
                option.monthly_pass_price, option.riders,
            ),
        )
        for rank, (option, result) in enumerate(pairs, start=1)
    ]

    return ComparisonResponse(
        plan_id=plan.id,
        trips_per_month=round(plan.trips_per_week * WEEKS_PER_MONTH, 1),
        priority=priority,
        results=items,
        best=items[0] if items else None,
    )