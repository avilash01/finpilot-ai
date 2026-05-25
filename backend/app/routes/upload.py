from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File
from fastapi import HTTPException

from app.database.db import (
    SessionLocal
)

from app.models.expense import (
    Expense
)

import shutil
import os


router = APIRouter()


# -----------------------------------
# UPLOAD DIRECTORY
# -----------------------------------

UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


# -----------------------------------
# ALLOWED FILE TYPES
# -----------------------------------

ALLOWED_EXTENSIONS = [

    ".png",
    ".jpg",
    ".jpeg"
]


# -----------------------------------
# UPLOAD RECEIPT API
# -----------------------------------

@router.post("/upload")
async def upload_invoice(

    file: UploadFile = File(...)

):

    # -----------------------------------
    # VALIDATION
    # -----------------------------------

    if not file.filename:

        raise HTTPException(

            status_code=400,

            detail="No filename found"
        )



    ext = os.path.splitext(

        file.filename

    )[1].lower()



    if ext not in ALLOWED_EXTENSIONS:

        raise HTTPException(

            status_code=400,

            detail="Only PNG/JPG/JPEG allowed"
        )



    # -----------------------------------
    # FILE PATH
    # -----------------------------------

    file_path = os.path.join(

        UPLOAD_DIR,

        file.filename
    )



    try:

        # -----------------------------------
        # SAVE FILE
        # -----------------------------------

        with open(

            file_path,

            "wb"

        ) as buffer:

            shutil.copyfileobj(

                file.file,

                buffer
            )



        # -----------------------------------
        # MOCK OCR TEXT
        # -----------------------------------

        extracted_text = """

        DMart Invoice

        Milk - 56
        Bread - 35
        Eggs - 78
        Rice - 68

        TOTAL = 587
        Payment Mode = UPI

        """



        # -----------------------------------
        # MOCK AI ANALYSIS
        # -----------------------------------

        parsed_data = {

            "merchant": "DMart",

            "category": "Groceries",

            "amount": 587,

            "payment_mode": "UPI",

            "expense_date": "2026-05-26",

            "insights":
            "You spent on groceries at DMart.",

            "pattern":
            "Essential household shopping",

            "saving_tip":
            "Buy in bulk to save more money.",

            "confidence_score": 95
        }



        # -----------------------------------
        # DATABASE SAVE
        # -----------------------------------

        db = SessionLocal()



        expense = Expense(

            merchant=
            parsed_data.get(
                "merchant"
            ),

            category=
            parsed_data.get(
                "category"
            ),

            amount=
            parsed_data.get(
                "amount"
            ),

            payment_mode=
            parsed_data.get(
                "payment_mode"
            ),

            expense_date=
            parsed_data.get(
                "expense_date"
            ),

            insights=
            parsed_data.get(
                "insights"
            ),

            pattern=
            parsed_data.get(
                "pattern"
            ),

            saving_tip=
            parsed_data.get(
                "saving_tip"
            ),

            confidence_score=
            parsed_data.get(
                "confidence_score"
            )
        )



        db.add(
            expense
        )

        db.commit()

        db.refresh(
            expense
        )

        db.close()



        # -----------------------------------
        # RESPONSE
        # -----------------------------------

        return {

            "status": "success",

            "filename":
            file.filename,

            "ocr_text":
            extracted_text,

            "parsed_data":
            parsed_data
        }



    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=str(e)
        )
