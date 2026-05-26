# FinPilot AI

FinPilot AI is an expense intelligence platform inspired by Ramp-style finance workflows. It combines receipt extraction, policy compliance checks, anomaly detection, spend reporting, forecasting, and an AI finance agent in one deployed dashboard.

Live app: [https://finpilot-ai-nine.vercel.app](https://finpilot-ai-nine.vercel.app)

## Features

- Structured receipt extraction from uploaded receipts or batch inputs
- JSON output for vendor, amount, category, date, currency, and confidence
- Policy document ingestion with FAISS-style RAG compliance checks
- Reimbursable/non-reimbursable scoring per transaction
- AI agent with finance tools for categorization, anomaly detection, reports, policy checks, and forecasting
- Spend breakdown charts by category
- Month-over-month trend chart
- Anomaly alerts panel
- CFO-style spend summary report
- Chat interface powered by Groq
- Synthetic categorization dataset for future fine-tuning work

## Tech Stack

- Frontend: React, Vite, Recharts, Lucide React
- Backend: Vercel Serverless Node API
- AI: Groq Llama model through `GROQ_API_KEY`
- Data: In-memory Vercel serverless state for deployed demo flow
- Fine-tuning assets: JSONL synthetic spend categorization dataset
- Deployment: Vercel

## Project Structure

```text
finpilot-ai/
├── frontend/
│   ├── api/index.js              # Vercel backend API
│   ├── src/App.jsx               # React dashboard
│   ├── vercel.json               # Vercel routing
│   └── package.json
├── backend/                      # Original FastAPI backend reference
├── data/
│   └── synthetic_spend_categorization.jsonl
├── docs/
│   └── fine_tuning_plan.md
├── scripts/
│   └── generate_synthetic_categorization_dataset.js
└── README.md
```

## API Routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health check and feature list |
| `POST` | `/api/extract` | Structured receipt extraction and batch processing |
| `POST` | `/api/upload` | Receipt upload-compatible extraction route |
| `POST` | `/api/ingest-policy` | Ingest policy text and index it for compliance checks |
| `POST` | `/api/agent` | AI agent endpoint with finance tools |
| `POST` | `/api/chat` | Chat endpoint for the dashboard assistant |
| `GET` | `/api/expenses` | List transactions |
| `GET` | `/api/analytics` | Spend totals, category breakdown, compliance, trend |
| `GET` | `/api/anomalies` | List flagged transactions |
| `GET` | `/api/report` | CFO-style spend summary |
| `GET` | `/api/forecast` | Spend forecast |
| `GET` | `/api/policies` | Current policy clauses |

## AI Agent Tools

The deployed `/api/agent` route exposes tool-style behavior for:

- `categorize_spend(transaction)`
- `flag_anomaly(transaction)`
- `summarize_by_category(date_range)`
- `check_policy_compliance(transaction)`
- `forecast_spend(months)`

## Local Setup

```bash
cd frontend
npm install
npm run dev
```

The app runs locally at:

```text
http://localhost:5173
```

## Environment Variables

For AI chat and agent responses, add this variable in Vercel:

```text
GROQ_API_KEY=your_groq_key
```

The deployed project already uses this through Vercel production environment variables.

## Build

```bash
cd frontend
npm run build
```

## Deployment

The project is deployed on Vercel from the `frontend` app with serverless API routes under `frontend/api`.

Production URL:

[https://finpilot-ai-nine.vercel.app](https://finpilot-ai-nine.vercel.app)

## Fine-Tuning Dataset

Generate the synthetic spend categorization dataset:

```bash
node scripts/generate_synthetic_categorization_dataset.js
```

Output:

```text
data/synthetic_spend_categorization.jsonl
```

The dataset contains 600 labeled examples for category fine-tuning. See [docs/fine_tuning_plan.md](docs/fine_tuning_plan.md) for the planned Mistral 7B fine-tuning workflow and accuracy comparison.

## Notes

This deployment uses Vercel serverless state for a portfolio/demo flow. For production use, connect a persistent database such as Postgres, MongoDB, or SQLite on a persistent host.
