from fastapi import APIRouter
from app.database.db import SessionLocal
from app.models.expense import Expense

router = APIRouter()


@router.get("/alerts")
def get_alerts():

    db = SessionLocal()

    expenses = db.query(Expense).all()

    alerts = []

    total_spending = sum(
        float(exp.amount or 0)
        for exp in expenses
    )

    if total_spending > 5000:

        alerts.append(
            "⚠️ Your spending is getting high."
        )

    category_totals = {}

    for exp in expenses:

        category = exp.category or "Other"

        category_totals[category] = (

            category_totals.get(
                category,
                0
            )

            + float(exp.amount or 0)
        )

    for category, amount in category_totals.items():

        if amount > 3000:

            alerts.append(

                f"⚠️ High spending on {category}"
            )

    if len(alerts) == 0:

        alerts.append(
            "✅ Your spending looks healthy."
        )

    db.close()

    return {

        "alerts":
        alerts
    }