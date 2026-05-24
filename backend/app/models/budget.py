from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Float

from app.database.base import Base


class Budget(Base):

    __tablename__ = "budgets"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    category = Column(
        String
    )

    monthly_limit = Column(
        Float
    )