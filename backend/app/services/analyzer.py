def analyze_receipt(text):

    insights = []

    if "Milk" in text:
        insights.append("Dairy item detected")

    if "Rice" in text:
        insights.append("Groceries purchase detected")

    if "Total" in text:
        insights.append("Receipt contains total amount")

    return insights