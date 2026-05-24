import requests


def ask_finance_ai(question, expenses):

    prompt = f"""

You are FinPilot AI.

You are a smart financial assistant.

User expenses:

{expenses}

User question:

{question}

Give:
- financial insights
- spending analysis
- saving suggestions
- category analysis

Keep response short and useful.
"""



    response = requests.post(

        "http://localhost:11434/api/generate",

        json={

            "model": "gemma3:1b",

            "prompt": prompt,

            "stream": False
        }
    )



    result = response.json()

    return result["response"]