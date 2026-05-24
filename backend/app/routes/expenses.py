from fastapi import APIRouter
from app.database.db import SessionLocal
from app.models.expense import Expense

router = APIRouter()


# Get all expenses
@router.get("/expenses")
def get_expenses():

    db = SessionLocal()

    expenses = db.query(
        Expense
    ).all()

    db.close()

    return expenses


# Filter expenses by category
@router.get("/expenses/{category}")
def get_by_category(
    category: str
):

    db = SessionLocal()

    expenses = db.query(
        Expense
    ).filter(
        Expense.category == category
    ).all()

    db.close()

    return expenses


# Filter expenses above a minimum amount
@router.get("/expenses/min/{amount}")
def minimum_amount(
    amount: float
):

    db = SessionLocal()

    expenses = []

    all_expenses = db.query(
        Expense
    ).all()

    for item in all_expenses:

        try:

            if float(
                item.total_spending
            ) >= amount:

                expenses.append(
                    item
                )

        except:

            pass

    db.close()

    return expenses


# Search by keyword inside insights
@router.get("/expenses/search/{word}")
def search_expense(
    word: str
):

    db = SessionLocal()

    expenses = db.query(
        Expense
    ).filter(
        Expense.insights.contains(
            word
        )
    ).all()

    db.close()

    return expenses


# Count expenses category-wise
@router.get("/expenses/stats/categories")
def category_stats():

    db = SessionLocal()

    expenses = db.query(
        Expense
    ).all()

    counts = {}

    for item in expenses:

        category = item.category

        counts[category] = (
            counts.get(
                category,
                0
            ) + 1
        )

    db.close()

    return counts