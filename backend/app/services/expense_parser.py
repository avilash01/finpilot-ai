import json


def parse_expense_data(text):

    try:

        text = text.strip()

        data = json.loads(text)

        return data

    except Exception as e:

        return {
            "category": "",
            "total_spending": "",
            "insights": f"Parsing failed: {str(e)}"
        }