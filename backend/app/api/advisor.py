from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.plans import get_plan_or_404
from app.database import get_db
from app.schemas.advisor import AdviceRequest, AdviceResponse, Understood
from app.schemas.comparison import ComparisonItem
from app.services.advisor import advise, parse_request
from app.services.my_version import break_even_trips

router = APIRouter(prefix="/api/plans/{plan_id}/advice", tags=["Advisor"])


@router.post("", response_model=AdviceResponse)
def advise_plan(plan_id: int, data: AdviceRequest, db: Session = Depends(get_db)):
    plan = get_plan_or_404(plan_id, db)
    prefs = parse_request(data.text)
    advice = advise(plan, plan.options, prefs)

    recommendation = None
    if advice.result is not None:
        o, r = advice.option, advice.result
        recommendation = ComparisonItem(
            rank=1,
            option_id=o.id,
            mode=r.mode,
            monthly_cost=r.monthly_cost,
            monthly_minutes=r.monthly_minutes,
            monthly_co2_kg=r.monthly_co2_kg,
            uses_pass=r.uses_pass,
            break_even_trips=break_even_trips(
                o.mode, o.price_per_trip, o.monthly_pass_price, o.riders
            ),
        )

    return AdviceResponse(
        understood=Understood(priority=prefs.priority, max_budget=prefs.max_budget),
        recommendation=recommendation,
        explanation=advice.explanation,
        source="rules",
    )