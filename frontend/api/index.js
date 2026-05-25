const state = globalThis.__finpilotState || {
  expenses: [],
  nextId: 1,
};

globalThis.__finpilotState = state;

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function getBody(req) {
  return new Promise((resolve) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      resolve(body);
    });
  });
}

function createReceiptExpense() {
  const expense = {
    id: state.nextId,
    merchant: "DMart",
    category: "Groceries",
    amount: 587,
    payment_mode: "UPI",
    expense_date: "2026-05-26",
    insights: "You spent on groceries at DMart.",
    pattern: "Essential household shopping",
    saving_tip: "Buy grocery staples in planned weekly batches to avoid extra trips.",
  };

  state.nextId += 1;
  state.expenses.push(expense);

  return expense;
}

function analytics() {
  const totalSpending = state.expenses.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );

  const categoryTotals = {};

  for (const item of state.expenses) {
    categoryTotals[item.category] =
      (categoryTotals[item.category] || 0) + Number(item.amount || 0);
  }

  const topCategory =
    Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "None";

  return {
    total_records: state.expenses.length,
    total_spending: totalSpending,
    average_spending:
      state.expenses.length > 0 ? Number((totalSpending / state.expenses.length).toFixed(2)) : 0,
    highest_expense:
      state.expenses.length > 0
        ? Math.max(...state.expenses.map((item) => Number(item.amount || 0)))
        : 0,
    top_category: topCategory,
    category_breakdown: categoryTotals,
    estimated_savings: Number((totalSpending * 0.15).toFixed(2)),
  };
}

function alerts() {
  const data = analytics();
  const messages = [];

  if (data.total_spending > 5000) {
    messages.push("Your total spending crossed the monthly safety limit.");
  }

  if (data.top_category !== "None") {
    messages.push(`Your highest spending category is ${data.top_category}.`);
  }

  if (state.expenses.length === 0) {
    messages.push("Upload your first receipt to start tracking expenses.");
  }

  return messages;
}

async function chatReply(req) {
  const rawBody = await getBody(req);
  const body = rawBody ? JSON.parse(rawBody) : {};
  const message = body.message || "";
  const key = process.env.GROQ_API_KEY;
  const data = analytics();

  if (!key) {
    return "AI is not configured yet, but your dashboard backend is live.";
  }

  const prompt = `
You are FinPilot AI, a helpful personal finance assistant.

Current expense summary:
- Total records: ${data.total_records}
- Total spending: ${data.total_spending}
- Average spending: ${data.average_spending}
- Top category: ${data.top_category}

User question:
${message}

Answer in under 120 words with practical finance advice.
`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    return "AI could not respond right now, but your dashboard backend is working.";
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content || "AI response was empty.";
}

export default async function handler(req, res) {
  const url = new URL(req.url, "https://finpilot.local");
  const path = url.pathname.replace(/^\/api/, "") || "/";

  try {
    if (req.method === "GET" && path === "/health") {
      return send(res, 200, { status: "healthy" });
    }

    if (req.method === "GET" && path === "/expenses") {
      return send(res, 200, state.expenses);
    }

    if (req.method === "GET" && path === "/analytics") {
      return send(res, 200, analytics());
    }

    if (req.method === "GET" && path === "/alerts") {
      return send(res, 200, { alerts: alerts() });
    }

    if (req.method === "GET" && path === "/forecast") {
      const data = analytics();

      return send(res, 200, {
        current_spending: data.total_spending,
        predicted_monthly_spending: Number((data.total_spending * 1.2).toFixed(2)),
        saving_opportunity: data.estimated_savings,
      });
    }

    if (req.method === "POST" && path === "/upload") {
      const expense = createReceiptExpense();

      return send(res, 200, {
        status: "success",
        filename: "receipt.png",
        ocr_text: "DMart Invoice. Total = 587. Payment Mode = UPI.",
        parsed_data: expense,
        message: "Receipt uploaded successfully",
      });
    }

    if (req.method === "POST" && path === "/chat") {
      const reply = await chatReply(req);
      return send(res, 200, { reply });
    }

    return send(res, 404, { detail: "Route not found" });
  } catch (error) {
    return send(res, 500, {
      detail: error.message || "Server error",
    });
  }
}
