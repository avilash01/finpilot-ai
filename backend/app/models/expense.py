from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Float

from app.database.base import Base


class Expense(Base):

    __tablename__ = "expenses"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    merchant = Column(
        String
    )

    category = Column(
        String
    )

    amount = Column(
        Float
    )

    payment_mode = Column(
        String
    )

    expense_date = Column(
        String
    )

    insights = Column(
        String
    )

    pattern = Column(
        String
    )

    saving_tip = Column(
        String
    )

    confidence_score = Column(
        Float
    )