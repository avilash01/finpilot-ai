from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq
import os

from app.services.rag_service import (
    get_expense_context
)


router = APIRouter()


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

    groq_api_key = os.getenv("GROQ_API_KEY")

    if not groq_api_key:
        return {
            "reply": "AI is not configured yet. Please add GROQ_API_KEY in deployment environment variables."
        }

    client = Groq(
        api_key=groq_api_key
    )

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
