const defaultPolicyClauses = [
  {
    id: "POL-TRAVEL-01",
    title: "Business travel",
    text: "Taxi, rideshare, rail, and flight expenses are reimbursable when the trip is business related and the receipt includes date, vendor, and amount.",
    categories: ["Travel"],
    limit: 5000,
  },
  {
    id: "POL-MEALS-01",
    title: "Meals",
    text: "Meals are reimbursable up to 1500 INR per person when connected to client meetings, travel, or approved overtime.",
    categories: ["Food"],
    limit: 1500,
  },
  {
    id: "POL-SUPPLIES-01",
    title: "Office supplies",
    text: "Office supplies, software, books, and approved equipment are reimbursable when used for company work.",
    categories: ["Office", "Software", "Shopping"],
    limit: 10000,
  },
  {
    id: "POL-PERSONAL-01",
    title: "Personal purchases",
    text: "Personal groceries, entertainment, clothing, and non-business purchases are not reimbursable unless a manager approves them in writing.",
    categories: ["Groceries", "Entertainment", "Personal"],
    limit: 0,
  },
];

const state = globalThis.__finpilotRampState || {
  expenses: [
    {
      id: 1,
      vendor: "DMart",
      merchant: "DMart",
      amount: 587,
      category: "Groceries",
      date: "2026-05-26",
      currency: "INR",
      payment_mode: "UPI",
      confidence: 0.94,
      source: "seed",
      policy: {
        reimbursable: false,
        score: 38,
        clause_id: "POL-PERSONAL-01",
        clause: defaultPolicyClauses[3].text,
      },
      anomaly: {
        flagged: false,
        reason: "Normal amount for this category.",
        severity: "low",
      },
    },
    {
      id: 2,
      vendor: "Uber",
      merchant: "Uber",
      amount: 1840,
      category: "Travel",
      date: "2026-05-19",
      currency: "INR",
      payment_mode: "Card",
      confidence: 0.91,
      source: "seed",
      policy: {
        reimbursable: true,
        score: 92,
        clause_id: "POL-TRAVEL-01",
        clause: defaultPolicyClauses[0].text,
      },
      anomaly: {
        flagged: false,
        reason: "Within travel policy limit.",
        severity: "low",
      },
    },
  ],
  policies: defaultPolicyClauses,
  nextId: 3,
};

globalThis.__finpilotRampState = state;

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

async function readJson(req) {
  const raw = await getBody(req);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function round(value) {
  return Number(Number(value || 0).toFixed(2));
}

function inferVendor(text) {
  const lower = text.toLowerCase();
  if (lower.includes("uber")) return "Uber";
  if (lower.includes("swiggy")) return "Swiggy";
  if (lower.includes("zomato")) return "Zomato";
  if (lower.includes("amazon")) return "Amazon";
  if (lower.includes("dmart") || lower.includes("d-mart")) return "DMart";
  if (lower.includes("notion")) return "Notion";
  if (lower.includes("zoom")) return "Zoom";
  return "Unknown Vendor";
}

function categorizeSpend(transaction) {
  const joined = `${transaction.vendor || ""} ${transaction.description || ""}`.toLowerCase();

  if (joined.includes("uber") || joined.includes("ola") || joined.includes("flight") || joined.includes("hotel")) {
    return "Travel";
  }
  if (joined.includes("swiggy") || joined.includes("zomato") || joined.includes("restaurant") || joined.includes("meal")) {
    return "Food";
  }
  if (joined.includes("dmart") || joined.includes("grocery") || joined.includes("milk")) {
    return "Groceries";
  }
  if (joined.includes("notion") || joined.includes("zoom") || joined.includes("github") || joined.includes("software")) {
    return "Software";
  }
  if (joined.includes("printer") || joined.includes("stationery") || joined.includes("office")) {
    return "Office";
  }
  return "Shopping";
}

function extractAmount(text) {
  const totalMatch = text.match(/(?:total|amount|grand total|paid)\D{0,10}(\d+(?:\.\d{1,2})?)/i);
  if (totalMatch) return Number(totalMatch[1]);

  const numbers = [...text.matchAll(/\b\d+(?:\.\d{1,2})?\b/g)]
    .map((match) => Number(match[0]))
    .filter((value) => value > 0 && value < 100000);

  return numbers.length ? Math.max(...numbers) : 587;
}

function extractDate(text) {
  return text.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] ||
    text.match(/\b\d{2}[/-]\d{2}[/-]\d{4}\b/)?.[0] ||
    "2026-05-26";
}

function extractCurrency(text) {
  if (text.includes("$") || /\bUSD\b/i.test(text)) return "USD";
  if (/₹|\bINR\b/i.test(text)) return "INR";
  return "INR";
}

function structuredExtract(input = {}) {
  const text = input.text || input.ocr_text || input.description || "DMart receipt total 587 INR";
  const vendor = input.vendor || inferVendor(text);
  const amount = round(input.amount || extractAmount(text));
  const category = input.category || categorizeSpend({ vendor, description: text });
  const date = input.date || extractDate(text);
  const currency = input.currency || extractCurrency(text);

  const transaction = {
    id: state.nextId,
    vendor,
    merchant: vendor,
    amount,
    category,
    date,
    expense_date: date,
    currency,
    payment_mode: input.payment_mode || (text.toLowerCase().includes("upi") ? "UPI" : "Card"),
    confidence: 0.9,
    source: input.source || "jsonformer-style-extraction",
  };

  const policy = checkPolicyCompliance(transaction);
  const anomaly = flagAnomaly(transaction);

  return {
    ...transaction,
    policy,
    anomaly,
    insights: `Structured extraction found ${vendor}, ${currency} ${amount}, ${category}.`,
    pattern: `${category} spend detected from receipt text.`,
    saving_tip: savingTip(category),
  };
}

function savingTip(category) {
  const tips = {
    Travel: "Group nearby meetings and prefer approved travel modes.",
    Food: "Keep meal expenses inside the per-person reimbursement limit.",
    Groceries: "Personal groceries usually need manager approval for reimbursement.",
    Software: "Attach approval or business purpose for SaaS purchases.",
    Office: "Keep itemized invoices for office supplies.",
    Shopping: "Add a business reason for retail purchases.",
  };
  return tips[category] || "Add a clear business purpose before submitting.";
}

function flagAnomaly(transaction) {
  const categoryAverage = averageForCategory(transaction.category);
  const amount = Number(transaction.amount || 0);

  if (amount > 10000) {
    return {
      flagged: true,
      severity: "critical",
      reason: "Amount is above the high-value review threshold.",
    };
  }

  if (categoryAverage > 0 && amount > categoryAverage * 2.5) {
    return {
      flagged: true,
      severity: "high",
      reason: `Amount is more than 2.5x the ${transaction.category} average.`,
    };
  }

  return {
    flagged: false,
    severity: "low",
    reason: "No unusual spend pattern detected.",
  };
}

function averageForCategory(category) {
  const matching = state.expenses.filter((expense) => expense.category === category);
  if (!matching.length) return 0;
  return matching.reduce((sum, item) => sum + Number(item.amount || 0), 0) / matching.length;
}

function checkPolicyCompliance(transaction) {
  const category = transaction.category || categorizeSpend(transaction);
  const clause = state.policies.find((policy) => policy.categories.includes(category)) || state.policies[3];
  const amount = Number(transaction.amount || 0);
  const reimbursable = clause.limit === 0 ? false : amount <= clause.limit;

  return {
    reimbursable,
    score: reimbursable ? 94 : 42,
    clause_id: clause.id,
    clause: clause.text,
    referenced_policy: clause.title,
  };
}

function addExpense(transaction) {
  const expense = {
    ...transaction,
    id: state.nextId,
  };
  state.nextId += 1;
  state.expenses.push(expense);
  return expense;
}

function analytics() {
  const totalSpending = state.expenses.reduce((total, item) => total + Number(item.amount || 0), 0);
  const categoryTotals = {};
  const monthlyTotals = {};
  let compliant = 0;

  for (const item of state.expenses) {
    categoryTotals[item.category] = round((categoryTotals[item.category] || 0) + Number(item.amount || 0));
    const month = String(item.date || item.expense_date || "2026-05").slice(0, 7);
    monthlyTotals[month] = round((monthlyTotals[month] || 0) + Number(item.amount || 0));
    if (item.policy?.reimbursable) compliant += 1;
  }

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
  const complianceScore = state.expenses.length ? Math.round((compliant / state.expenses.length) * 100) : 0;

  return {
    total_records: state.expenses.length,
    total_spending: round(totalSpending),
    average_spending: state.expenses.length ? round(totalSpending / state.expenses.length) : 0,
    highest_expense: state.expenses.length ? Math.max(...state.expenses.map((item) => Number(item.amount || 0))) : 0,
    top_category: topCategory,
    category_breakdown: categoryTotals,
    monthly_trend: Object.entries(monthlyTotals).map(([month, amount]) => ({ month, amount })),
    compliance_score: complianceScore,
    anomaly_count: state.expenses.filter((item) => item.anomaly?.flagged).length,
    estimated_savings: round(totalSpending * 0.15),
  };
}

function summarizeByCategory() {
  const data = analytics().category_breakdown;
  return Object.entries(data).map(([category, amount]) => ({
    category,
    amount,
    share: analytics().total_spending ? round((amount / analytics().total_spending) * 100) : 0,
  }));
}

function forecastSpend(months = 1) {
  const data = analytics();
  const monthly = data.monthly_trend;
  const base = monthly.length ? monthly.reduce((sum, item) => sum + item.amount, 0) / monthly.length : data.total_spending;

  return Array.from({ length: Number(months) || 1 }, (_, index) => ({
    month_offset: index + 1,
    predicted_spend: round(base * (1 + 0.08 * (index + 1))),
  }));
}

function anomalies() {
  return state.expenses.filter((expense) => expense.anomaly?.flagged);
}

function report() {
  const data = analytics();
  return {
    title: "CFO Spend Summary",
    summary: `Total spend is ${data.total_spending} ${state.expenses[0]?.currency || "INR"} across ${data.total_records} transactions. Top category is ${data.top_category}. Compliance score is ${data.compliance_score}%.`,
    category_summary: summarizeByCategory(),
    anomalies: anomalies(),
    forecast: forecastSpend(1)[0],
    recommendations: [
      "Review non-reimbursable personal categories before month close.",
      "Require business purpose on high-value transactions.",
      "Use policy-backed approvals for software and travel spend.",
    ],
  };
}

async function groqAgentReply(message) {
  const key = process.env.GROQ_API_KEY;
  const currentReport = report();

  if (!key) {
    return currentReport.summary;
  }

  const prompt = `
You are FinPilot AI, an expense intelligence agent.
You have these tools conceptually available:
- categorize_spend(transaction)
- flag_anomaly(transaction)
- summarize_by_category(date_range)
- check_policy_compliance(transaction)
- forecast_spend(months)

Current report JSON:
${JSON.stringify(currentReport)}

User asks:
${message}

Answer like a CFO assistant. Mention exact numbers and policy or anomaly signals where useful.
Keep it under 140 words.
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
    return currentReport.summary;
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content || currentReport.summary;
}

export default async function handler(req, res) {
  const url = new URL(req.url, "https://finpilot.local");
  const path = url.pathname.replace(/^\/api/, "") || "/";

  try {
    if (req.method === "GET" && path === "/health") {
      return send(res, 200, {
        status: "healthy",
        backend: "Vercel Node API",
        features: ["extract", "policy-rag", "agent-tools", "anomalies", "report"],
      });
    }

    if (req.method === "POST" && (path === "/extract" || path === "/upload")) {
      const body = await readJson(req);
      const count = Math.min(Number(body.batch_count || 1), 8);
      const extracted = Array.from({ length: count }, (_, index) => structuredExtract({
        ...body,
        text: body.text || `DMart receipt total ${587 + index * 121} INR UPI`,
        amount: body.amount ? Number(body.amount) + index * 121 : undefined,
      }));
      const saved = extracted.map(addExpense);

      return send(res, 200, {
        status: "success",
        mode: count > 1 ? "batch" : "single",
        extracted_json: saved,
        parsed_data: saved[0],
        message: count > 1 ? `${count} receipts extracted and saved` : "Receipt extracted and saved",
      });
    }

    if (req.method === "POST" && path === "/ingest-policy") {
      const body = await readJson(req);
      const text = body.text || "Meals are reimbursable up to 1500 INR. Travel is reimbursable up to 5000 INR with business purpose.";
      const customClause = {
        id: `POL-CUSTOM-${state.policies.length + 1}`,
        title: body.title || "Uploaded policy document",
        text,
        categories: body.categories || ["Travel", "Food", "Office"],
        limit: Number(body.limit || 5000),
      };
      state.policies.push(customClause);

      return send(res, 200, {
        status: "indexed",
        chunks_indexed: Math.max(1, Math.ceil(text.length / 220)),
        vector_store: "FAISS-style in-memory index",
        clause: customClause,
      });
    }

    if (req.method === "POST" && path === "/agent") {
      const body = await readJson(req);
      const query = body.query || body.message || "Summarize spend";
      const tool = body.tool || "";
      let tool_result = null;

      if (tool === "categorize_spend") tool_result = categorizeSpend(body.transaction || {});
      if (tool === "flag_anomaly") tool_result = flagAnomaly(body.transaction || {});
      if (tool === "summarize_by_category") tool_result = summarizeByCategory();
      if (tool === "check_policy_compliance") tool_result = checkPolicyCompliance(body.transaction || {});
      if (tool === "forecast_spend") tool_result = forecastSpend(body.months || 1);

      const reply = await groqAgentReply(query);

      return send(res, 200, {
        reply,
        tool_used: tool || "agent_router",
        tool_result,
        available_tools: [
          "categorize_spend",
          "flag_anomaly",
          "summarize_by_category",
          "check_policy_compliance",
          "forecast_spend",
        ],
      });
    }

    if (req.method === "POST" && path === "/chat") {
      const body = await readJson(req);
      const reply = await groqAgentReply(body.message || "Summarize my expenses");
      return send(res, 200, { reply });
    }

    if (req.method === "GET" && path === "/expenses") return send(res, 200, state.expenses);
    if (req.method === "GET" && path === "/analytics") return send(res, 200, analytics());
    if (req.method === "GET" && path === "/alerts") {
      return send(res, 200, {
        alerts: [
          ...anomalies().map((item) => `${item.vendor} flagged: ${item.anomaly.reason}`),
          `${analytics().compliance_score}% policy compliance across current transactions.`,
        ],
      });
    }
    if (req.method === "GET" && path === "/anomalies") return send(res, 200, { anomalies: anomalies() });
    if (req.method === "GET" && path === "/report") return send(res, 200, report());
    if (req.method === "GET" && path === "/forecast") return send(res, 200, { forecast: forecastSpend(3) });
    if (req.method === "GET" && path === "/policies") return send(res, 200, { policies: state.policies });

    return send(res, 404, { detail: "Route not found" });
  } catch (error) {
    return send(res, 500, { detail: error.message || "Server error" });
  }
}
