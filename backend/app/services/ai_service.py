import ollama
import json
import re


def smart_analysis(text):

    prompt = f"""
You are FinPilot AI, an intelligent financial assistant.

Analyze this invoice/receipt:

{text}

Rules:

1. Detect category:
   - Groceries
   - Food
   - Transport
   - Medical
   - Electronics
   - Shopping
   - Utilities
   - Entertainment
   - Other

2. Extract total spending amount.

3. Generate short spending insights.

4. Detect spending pattern:
   Example:
   - Daily purchase
   - Monthly expense
   - Frequent shopping
   - One-time purchase

5. Suggest a saving tip.

Return ONLY valid JSON.

Format:

{{
"category":"",
"total_spending":"",
"insights":"",
"pattern":"",
"saving_tip":""
}}

"""

    try:

        response = ollama.chat(

            model="qwen2:1.5b",

            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        result = response["message"]["content"]

        # remove markdown if model wraps JSON
        result = re.sub(
            r"```json|```",
            "",
            result
        ).strip()

        try:

            parsed = json.loads(
                result
            )

            return parsed

        except:

            return {

                "category":
                "Unknown",

                "total_spending":
                "0",

                "insights":
                result,

                "pattern":
                "Unknown",

                "saving_tip":
                "No suggestion available"
            }

    except Exception as e:

        return {

            "category":
            "Error",

            "total_spending":
            "0",

            "insights":
            str(e),

            "pattern":
            "Unknown",

            "saving_tip":
            "None"
        }