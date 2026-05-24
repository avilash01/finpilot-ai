from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.budget import Budget


router = APIRouter()


# -----------------------------------
# SET / UPDATE BUDGET
# -----------------------------------

@router.post("/budget")
def set_budget(
    category: str,
    monthly_limit: float,
    db: Session = Depends(get_db)
):

    # Check if budget already exists
    existing = db.query(Budget).filter(
        Budget.category == category
    ).first()

    if existing:
        # Update existing
        existing.monthly_limit = monthly_limit
        db.commit()
        db.refresh(existing)
        return existing

    # Create new
    budget = Budget(
        category=category,
        monthly_limit=monthly_limit
    )

    db.add(budget)
    db.commit()
    db.refresh(budget)

    return budget


# -----------------------------------
# GET ALL BUDGETS
# -----------------------------------

@router.get("/budgets")
def get_budgets(
    db: Session = Depends(get_db)
):

    budgets = db.query(Budget).all()

    return budgets


# -----------------------------------
# DELETE BUDGET
# -----------------------------------

@router.delete("/budget/{category}")
def delete_budget(
    category: str,
    db: Session = Depends(get_db)
):

    budget = db.query(Budget).filter(
        Budget.category == category
    ).first()

    if not budget:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    db.delete(budget)
    db.commit()

    return {
        "message": f"Budget for {category} deleted"
    }