from fastapi import APIRouter

from app.database.db import SessionLocal

from app.models.expense import Expense


router = APIRouter()


@router.get("/insights")
def generate_insights():

    db = SessionLocal()

    expenses = db.query(
        Expense
    ).all()

    db.close()


    if not expenses:

        return {
            "insights": [
                "No expenses found yet."
            ]
        }


    total_spending = 0

    category_totals = {}

    merchant_totals = {}


    for item in expenses:

        try:

            amount = float(
                item.amount
            )

        except:

            amount = 0


        total_spending += amount


        # CATEGORY TOTALS

        category = (
            item.category
            if item.category
            else "Others"
        )

        category_totals[category] = (

            category_totals.get(
                category,
                0
            ) + amount
        )


        # MERCHANT TOTALS

        merchant = (
            item.merchant
            if item.merchant
            else "Unknown"
        )

        merchant_totals[merchant] = (

            merchant_totals.get(
                merchant,
                0
            ) + amount
        )


    # TOP CATEGORY

    top_category = max(

        category_totals,

        key=category_totals.get
    )


    # TOP MERCHANT

    top_merchant = max(

        merchant_totals,

        key=merchant_totals.get
    )


    # SAVINGS ESTIMATE

    potential_savings = round(
        total_spending * 0.15,
        2
    )


    insights = [

        f"You spent most on {top_category}.",

        f"Top merchant is {top_merchant}.",

        f"Potential monthly savings: ₹{potential_savings}.",

        f"Total spending analyzed: ₹{total_spending}.",

        "AI suggests reducing unnecessary repeat purchases."
    ]


    return {

        "insights": insights
    }