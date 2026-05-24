from fastapi import APIRouter
from app.database.db import SessionLocal
from app.models.expense import Expense
from datetime import datetime

router = APIRouter()


@router.get("/forecast")
def forecast_expenses():

    db = SessionLocal()

    expenses = db.query(Expense).all()

    total_spending = sum(
        float(exp.amount or 0)
        for exp in expenses
    )

    total_days = datetime.now().day

    predicted_monthly_spending = 0

    if total_days > 0:

        daily_average = (
            total_spending / total_days
        )

        predicted_monthly_spending = (
            daily_average * 30
        )

    warning = "Budget looks safe."

    if predicted_monthly_spending > 10000:

        warning = (
            "Warning: You may exceed your budget."
        )

    db.close()

    return {

        "current_spending":
        total_spending,

        "forecast_spending":
        round(
            predicted_monthly_spending,
            2
        ),

        "warning":
        warning
    }