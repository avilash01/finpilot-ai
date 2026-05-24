from app.database.db import SessionLocal

from app.models.expense import Expense


def get_expense_context():

    db = SessionLocal()

    expenses = db.query(Expense).all()

    db.close()

    if not expenses:
        return "No expenses found."

    context = ""

    for item in expenses:

        context += f"""
Merchant: {item.merchant}
Category: {item.category}
Amount: ₹{item.amount}
Date: {item.expense_date}
Payment Mode: {item.payment_mode}

"""

    return context