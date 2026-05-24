import re


def clean_ocr_text(text):

    # ---------------------------------
    # FIX 1: Remove ₹ symbol cleanly
    # ---------------------------------
    text = text.replace("₹", " ")

    # ---------------------------------
    # FIX 2: Fix OCR misreading ₹ as 7
    # Example: 7587.00 → 587.00
    # ---------------------------------
    text = re.sub(
        r'\b7(\d{3}\.\d{2})\b',
        r'\1',
        text
    )

    return text


def extract_amount(text):

    amount = 0

    # ---------------------------------
    # PRIORITY 1: GRAND TOTAL line
    # ---------------------------------
    grand_total = re.search(
        r'grand\s*total\s*[^\d]*(\d+\.?\d{0,2})',
        text,
        re.IGNORECASE
    )

    if grand_total:
        amount = float(grand_total.group(1))
        return amount

    # ---------------------------------
    # PRIORITY 2: TOTAL AMOUNT line
    # ---------------------------------
    total_amount = re.search(
        r'total\s*amount\s*[^\d]*(\d+\.?\d{0,2})',
        text,
        re.IGNORECASE
    )

    if total_amount:
        amount = float(total_amount.group(1))
        return amount

    # ---------------------------------
    # PRIORITY 3: TOTAL ITEMS line
    # ---------------------------------
    total_items = re.search(
        r'total\s*items?\s*:?\s*\d+\s+(\d+\.?\d{0,2})',
        text,
        re.IGNORECASE
    )

    if total_items:
        amount = float(total_items.group(1))
        return amount

    # ---------------------------------
    # FALLBACK: Largest valid amount
    # under 50,000
    # ---------------------------------
    amounts = re.findall(r'\d+\.\d{2}', text)

    valid_amounts = []

    for x in amounts:
        value = float(x)
        if value < 50000:
            valid_amounts.append(value)

    if valid_amounts:
        amount = max(valid_amounts)

    return amount


def extract_date(text):

    date_match = re.search(
        r'(\d{2}[/-]\d{2}[/-]\d{2,4})',
        text
    )

    if date_match:
        return date_match.group(1)

    return "Not Found"


def detect_merchant(text):

    text_lower = text.lower()

    merchants = {
        "dmart":             "DMart",
        "d-mart":            "DMart",
        "avenue supermarts": "DMart",
        "swiggy":            "Swiggy",
        "zomato":            "Zomato",
        "amazon":            "Amazon",
        "uber":              "Uber",
        "ola":               "Ola",
        "flipkart":          "Flipkart",
        "bigbasket":         "BigBasket",
        "blinkit":           "Blinkit",
        "zepto":             "Zepto",
        "myntra":            "Myntra",
    }

    for keyword, name in merchants.items():
        if keyword in text_lower:
            return name

    return "Unknown"


def detect_category(text_lower):

    grocery_words = [
        "rice", "milk", "vegetable",
        "grocery", "bread", "sugar",
        "salt", "dal", "oil", "dmart",
        "eggs", "flour", "atta", "ghee",
        "butter", "paneer", "pulses",
        "avenue supermarts", "bigbasket",
        "blinkit", "zepto"
    ]

    food_words = [
        "pizza", "burger", "restaurant",
        "cafe", "swiggy", "zomato",
        "biryani", "noodles", "pasta",
        "coffee", "tea", "hotel", "dhaba"
    ]

    travel_words = [
        "petrol", "diesel", "fuel",
        "uber", "ola", "cab", "auto",
        "metro", "bus", "train", "flight",
        "toll", "parking"
    ]

    shopping_words = [
        "amazon", "flipkart", "myntra",
        "shirt", "jeans", "shoes",
        "mobile", "laptop", "electronics"
    ]

    health_words = [
        "pharmacy", "medicine", "hospital",
        "clinic", "doctor", "medical",
        "apollo", "medplus"
    ]

    if any(w in text_lower for w in grocery_words):
        return (
            "Groceries",
            "Essential household shopping",
            "Buy in bulk to save more on groceries."
        )

    elif any(w in text_lower for w in food_words):
        return (
            "Food",
            "Restaurant and dining expenses",
            "Cook at home more often to save money."
        )

    elif any(w in text_lower for w in travel_words):
        return (
            "Travel",
            "Transportation expenses",
            "Use public transport when possible."
        )

    elif any(w in text_lower for w in shopping_words):
        return (
            "Shopping",
            "Online or retail shopping",
            "Wait for sales and compare prices before buying."
        )

    elif any(w in text_lower for w in health_words):
        return (
            "Health",
            "Medical and pharmacy expenses",
            "Check for generic medicine alternatives."
        )

    return (
        "Others",
        "General spending",
        "Track your spending regularly."
    )


def detect_payment_mode(text_lower):

    if "upi" in text_lower:
        return "UPI"
    elif "credit card" in text_lower:
        return "Credit Card"
    elif "debit card" in text_lower:
        return "Debit Card"
    elif "card" in text_lower:
        return "Card"
    elif "cash" in text_lower:
        return "Cash"
    elif "net banking" in text_lower:
        return "Net Banking"

    return "Unknown"


def smart_analysis(text):

    # ---------------------------------
    # STEP 1: Clean OCR artifacts first
    # ---------------------------------
    text = clean_ocr_text(text)

    text_lower = text.lower()

    # ---------------------------------
    # STEP 2: Extract all fields
    # ---------------------------------
    merchant = detect_merchant(text)

    category, pattern, saving_tip = detect_category(text_lower)

    payment_mode = detect_payment_mode(text_lower)

    expense_date = extract_date(text)

    amount = extract_amount(text)

    # ---------------------------------
    # STEP 3: Build insights
    # ---------------------------------
    insights = (
        f"You spent ₹{amount:.2f} "
        f"on {category.lower()} "
        f"at {merchant}."
    )

    # ---------------------------------
    # STEP 4: Return structured JSON
    # ---------------------------------
    return {
        "merchant":     merchant,
        "category":     category,
        "amount":       amount,
        "payment_mode": payment_mode,
        "expense_date": expense_date,
        "insights":     insights,
        "pattern":      pattern,
        "saving_tip":   saving_tip
    }