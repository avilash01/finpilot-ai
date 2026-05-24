from app.database.db import SessionLocal
from app.models.expense import Expense

db = SessionLocal()

# delete all rows
db.query(Expense).delete()

# save changes
db.commit()

db.close()

print("Database cleared successfully")