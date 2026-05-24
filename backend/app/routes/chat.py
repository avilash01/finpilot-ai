from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq

from app.services.rag_service import (
    get_expense_context
)


router = APIRouter()


# -----------------------------------
# GROQ SETUP
# -----------------------------------

GROQ_API_KEY = "key"

client = Groq(
    api_key=GROQ_API_KEY
)


# -----------------------------------
# REQUEST SCHEMA
# -----------------------------------

class ChatRequest(BaseModel):
    message: str


# -----------------------------------
# CHAT ENDPOINT
# -----------------------------------

@router.post("/chat")
def ai_chat(data: ChatRequest):

    user_message = data.message

    expense_context = get_expense_context()

    prompt = f"""
You are FinPilot AI, an intelligent
personal finance assistant.

Here is the user's real expense data:

{expense_context}

User Question:
{user_message}

Instructions:
- Answer based on their actual data
- Give specific numbers when possible
- Suggest practical savings tips
- Keep response under 150 words
- Be friendly and professional
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return {
        "reply": response.choices[0].message.content
    }