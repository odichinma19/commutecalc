from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.plans import get_plan_or_404
from app.database import get_db
from app.models.plan import Option
from app.schemas.plan import OptionCreate, OptionResponse

router = APIRouter(prefix="/api/plans/{plan_id}/options", tags=["Options"])


def get_option_or_404(plan_id: int, option_id: int, db: Session) -> Option:
    option = db.get(Option, option_id)
    if option is None or option.plan_id != plan_id:
        raise HTTPException(status_code=404, detail="Option not found")
    return option


@router.post("", response_model=OptionResponse, status_code=status.HTTP_201_CREATED)
def add_option(plan_id: int, data: OptionCreate, db: Session = Depends(get_db)):
    get_plan_or_404(plan_id, db)
    option = Option(plan_id=plan_id, **data.model_dump())
    db.add(option)
    db.commit()
    db.refresh(option)
    return option


@router.put("/{option_id}", response_model=OptionResponse)
def update_option(plan_id: int, option_id: int, data: OptionCreate,
                  db: Session = Depends(get_db)):
    option = get_option_or_404(plan_id, option_id, db)
    for field, value in data.model_dump().items():
        setattr(option, field, value)
    db.commit()
    db.refresh(option)
    return option


@router.delete("/{option_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_option(plan_id: int, option_id: int, db: Session = Depends(get_db)):
    option = get_option_or_404(plan_id, option_id, db)
    db.delete(option)
    db.commit()