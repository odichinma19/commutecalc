from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.plan import Plan
from app.schemas.plan import PlanCreate, PlanResponse, PlanUpdate

router = APIRouter(prefix="/api/plans", tags=["Plans"])


def get_plan_or_404(plan_id: int, db: Session) -> Plan:
    plan = db.get(Plan, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


def check_different(origin: str, destination: str) -> None:
    if origin.strip().lower() == destination.strip().lower():
        raise HTTPException(
            status_code=400, detail="Origin and destination must be different."
        )


@router.post("", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(data: PlanCreate, db: Session = Depends(get_db)):
    check_different(data.origin, data.destination)
    plan = Plan(**data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("", response_model=list[PlanResponse])
def list_plans(db: Session = Depends(get_db)):
    return db.query(Plan).order_by(Plan.created_at.desc()).all()


@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    return get_plan_or_404(plan_id, db)


@router.put("/{plan_id}", response_model=PlanResponse)
def update_plan(plan_id: int, data: PlanUpdate, db: Session = Depends(get_db)):
    plan = get_plan_or_404(plan_id, db)
    changes = data.model_dump(exclude_unset=True, exclude_none=True)
    check_different(
        changes.get("origin", plan.origin),
        changes.get("destination", plan.destination),
    )
    for field, value in changes.items():
        setattr(plan, field, value)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = get_plan_or_404(plan_id, db)
    db.delete(plan)
    db.commit()