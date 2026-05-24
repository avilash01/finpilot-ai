from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File
from fastapi import HTTPException

from PIL import Image

from app.services.llm_service import (
    smart_analysis
)

from app.database.db import (
    SessionLocal
)

from app.models.expense import (
    Expense
)

import pytesseract
import platform
import shutil
import os


router = APIRouter()


# ----------------------------
# TESSERACT PATH
# ----------------------------

if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = (
        r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    )
else:
    pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"


UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


ALLOWED_EXTENSIONS = [
    ".png",
    ".jpg",
    ".jpeg"
]


@router.post("/upload")
async def upload_invoice(

    file: UploadFile = File(...)

):

    # ----------------------------
    # VALIDATION
    # ----------------------------

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



    # ----------------------------
    # SAVE FILE
    # ----------------------------

    file_path = os.path.join(

        UPLOAD_DIR,

        file.filename
    )



    try:

        with open(

            file_path,

            "wb"

        ) as buffer:

            shutil.copyfileobj(

                file.file,

                buffer
            )



        # ----------------------------
        # OCR EXTRACTION
        # ----------------------------

        image = Image.open(
            file_path
        )

        image = image.convert(
            "RGB"
        )



        extracted_text = (
            pytesseract.image_to_string(
                image
            )
        )



        # ----------------------------
        # AI ANALYSIS
        # ----------------------------

        parsed_data = smart_analysis(
            extracted_text
        )



        # ----------------------------
        # DATABASE SAVE
        # ----------------------------

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



        # ----------------------------
        # RETURN RESPONSE
        # ----------------------------

        return {

            "status":
            "success",

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