from fastapi import APIRouter

from app.database.db import SessionLocal

from app.models.expense import Expense


router = APIRouter()


@router.get("/analytics")
def get_analytics():

    db = SessionLocal()

    expenses = db.query(
        Expense
    ).all()


    # -----------------------------
    # BASIC ANALYTICS
    # -----------------------------

    total_records = len(
        expenses
    )

    total_spending = sum([

        float(item.amount or 0)

        for item in expenses
    ])


    average_spending = 0

    if total_records > 0:

        average_spending = (

            total_spending /

            total_records
        )


    highest_expense = 0

    if expenses:

        highest_expense = max([

            float(item.amount or 0)

            for item in expenses
        ])


    # -----------------------------
    # CATEGORY BREAKDOWN
    # -----------------------------

    categories = {}

    for item in expenses:

        category = (

            item.category

            if item.category

            else "Others"
        )

        categories[category] = (

            categories.get(
                category,
                0
            )

            + float(item.amount or 0)
        )


    top_category = "None"

    if categories:

        top_category = max(

            categories,

            key=categories.get
        )


    # -----------------------------
    # MERCHANT BREAKDOWN
    # -----------------------------

    merchants = {}

    for item in expenses:

        merchant = (

            item.merchant

            if item.merchant

            else "Unknown"
        )

        merchants[merchant] = (

            merchants.get(
                merchant,
                0
            )

            + float(item.amount or 0)
        )


    top_merchant = "None"

    if merchants:

        top_merchant = max(

            merchants,

            key=merchants.get
        )


    # -----------------------------
    # AI INSIGHTS
    # -----------------------------

    potential_savings = round(

        total_spending * 0.15,

        2
    )


    ai_insights = [

        f"You spend most on {top_category}.",

        f"Top merchant is {top_merchant}.",

        f"Potential monthly savings: ₹{potential_savings}.",

        "Try reducing unnecessary repeat purchases.",

        "Track weekly budgets for better savings."
    ]


    db.close()


    return {

        "total_records":
        total_records,

        "total_spending":
        total_spending,

        "average_spending":
        average_spending,

        "highest_expense":
        highest_expense,

        "top_category":
        top_category,

        "top_merchant":
        top_merchant,

        "category_breakdown":
        categories,

        "merchant_breakdown":
        merchants,

        "ai_insights":
        ai_insights
    }