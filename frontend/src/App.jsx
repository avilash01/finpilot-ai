import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Bot,
  FileSearch,
  LayoutDashboard,
  Send,
  ShieldCheck,
  Upload,
  Wallet,
} from "lucide-react";

const configuredApiUrl = import.meta.env.VITE_API_URL;
const BASE_URL = configuredApiUrl && !configuredApiUrl.includes("railway.app") ? configuredApiUrl : "";
const COLORS = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#14b8a6"];

function money(value) {
  return `INR ${Number(value || 0).toLocaleString("en-IN")}`;
}

function App() {
  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [report, setReport] = useState(null);
  const [extractMessage, setExtractMessage] = useState("");
  const [policyMessage, setPolicyMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [batchCount, setBatchCount] = useState(1);
  const [policyText, setPolicyText] = useState("Meals are reimbursable up to 1500 INR. Travel is reimbursable up to 5000 INR with business purpose.");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: "I am FinPilot AI. Ask me about spend, anomalies, policy compliance, or forecasts.",
    },
  ]);

  const fetchAll = async () => {
    const [expensesRes, analyticsRes, alertsRes, anomaliesRes, reportRes] = await Promise.all([
      axios.get(`${BASE_URL}/api/expenses`),
      axios.get(`${BASE_URL}/api/analytics`),
      axios.get(`${BASE_URL}/api/alerts`),
      axios.get(`${BASE_URL}/api/anomalies`),
      axios.get(`${BASE_URL}/api/report`),
    ]);

    setExpenses(expensesRes.data);
    setAnalytics(analyticsRes.data);
    setAlerts(alertsRes.data.alerts || []);
    setAnomalies(anomaliesRes.data.anomalies || []);
    setReport(reportRes.data);
  };

  useEffect(() => {
    fetchAll().catch(console.log);
  }, []);

  const categoryData = useMemo(
    () => Object.entries(analytics.category_breakdown || {}).map(([name, value]) => ({ name, value })),
    [analytics]
  );

  const uploadReceipt = async () => {
    setLoading(true);
    setExtractMessage("");

    try {
      const response = await axios.post(`${BASE_URL}/api/extract`, {
        filename: selectedFile?.name || "receipt.png",
        text: selectedFile?.name || "DMart invoice total 587 INR UPI",
        batch_count: batchCount,
      });

      setExtractMessage(response.data.message);
      setSelectedFile(null);
      const input = document.getElementById("receipt-input");
      if (input) input.value = "";
      await fetchAll();
    } catch (error) {
      setExtractMessage(error.response?.data?.detail || "Extraction failed");
    } finally {
      setLoading(false);
    }
  };

  const ingestPolicy = async () => {
    setPolicyMessage("");

    try {
      const response = await axios.post(`${BASE_URL}/api/ingest-policy`, {
        title: "Company Expense Policy",
        text: policyText,
        categories: ["Travel", "Food", "Office", "Software"],
        limit: 5000,
      });

      setPolicyMessage(`Indexed ${response.data.chunks_indexed} policy chunks into ${response.data.vector_store}.`);
      await fetchAll();
    } catch (error) {
      setPolicyMessage(error.response?.data?.detail || "Policy ingest failed");
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    const message = chatInput;
    setChatMessages((current) => [...current, { role: "user", content: message }]);
    setChatInput("");

    try {
      const response = await axios.post(`${BASE_URL}/api/agent`, {
        query: message,
      });

      setChatMessages((current) => [...current, { role: "assistant", content: response.data.reply }]);
    } catch {
      setChatMessages((current) => [...current, { role: "assistant", content: "Agent is not reachable right now." }]);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#020617", color: "white", fontFamily: "Arial, sans-serif" }}>
      <aside style={{ width: 280, background: "#081028", padding: 32, borderRight: "1px solid #1e293b", position: "sticky", top: 0, height: "100vh" }}>
        <h1 style={{ color: "#8b5cf6", fontSize: 42, marginBottom: 50 }}>FinPilot AI</h1>
        {[
          [LayoutDashboard, "Dashboard"],
          [FileSearch, "Extraction"],
          [ShieldCheck, "Policy RAG"],
          [AlertTriangle, "Anomalies"],
          [Bot, "Agent"],
        ].map(([Icon, label]) => (
          <div key={label} style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 34, fontSize: 20 }}>
            <Icon size={25} />
            {label}
          </div>
        ))}
      </aside>

      <main style={{ flex: 1, padding: 36 }}>
        <h1 style={{ fontSize: 58, margin: "0 0 28px" }}>AI Expense Intelligence</h1>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 18 }}>
          {[
            ["Total Spend", money(analytics.total_spending), Wallet],
            ["Transactions", analytics.total_records || 0, Upload],
            ["Compliance", `${analytics.compliance_score || 0}%`, ShieldCheck],
            ["Anomalies", analytics.anomaly_count || 0, AlertTriangle],
          ].map(([label, value, Icon]) => (
            <div key={label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 18, padding: 24 }}>
              <Icon color="#8b5cf6" />
              <p style={{ color: "#94a3b8" }}>{label}</p>
              <h2 style={{ fontSize: 34, margin: 0 }}>{value}</h2>
            </div>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 24 }}>
          <Panel title="Spend Breakdown">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={105}>
                  {categoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Month-over-Month Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.monthly_trend || []}>
                <CartesianGrid stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#06b6d4" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 24 }}>
          <Panel title="Structured Extraction">
            <p style={{ color: "#94a3b8" }}>Upload a receipt image/PDF or run batch extraction. The API returns JSON with vendor, amount, category, date, and currency.</p>
            <input id="receipt-input" type="file" accept="image/*,.pdf" onChange={(event) => setSelectedFile(event.target.files?.[0])} style={{ color: "white", marginTop: 10 }} />
            <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
              <input type="number" min="1" max="8" value={batchCount} onChange={(event) => setBatchCount(Number(event.target.value))} style={inputStyle} />
              <button onClick={uploadReceipt} disabled={loading} style={buttonStyle}>{loading ? "Extracting..." : "Extract Receipt"}</button>
            </div>
            {extractMessage && <p style={{ color: "#22c55e" }}>{extractMessage}</p>}
          </Panel>

          <Panel title="Policy RAG">
            <textarea value={policyText} onChange={(event) => setPolicyText(event.target.value)} rows={5} style={{ ...inputStyle, width: "100%", resize: "vertical" }} />
            <button onClick={ingestPolicy} style={{ ...buttonStyle, marginTop: 14 }}>Ingest Policy PDF Text</button>
            {policyMessage && <p style={{ color: "#22c55e" }}>{policyMessage}</p>}
          </Panel>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 24 }}>
          <Panel title="Anomaly Alerts">
            {anomalies.length === 0 ? <p style={{ color: "#94a3b8" }}>No red flags right now.</p> : anomalies.map((item) => (
              <div key={item.id} style={{ border: "1px solid #ef4444", borderRadius: 12, padding: 14, marginBottom: 12 }}>
                <strong>{item.vendor}</strong> - {money(item.amount)}
                <p style={{ color: "#fca5a5" }}>{item.anomaly.reason}</p>
              </div>
            ))}
            {alerts.map((alert) => <p key={alert} style={{ color: "#f59e0b" }}>{alert}</p>)}
          </Panel>

          <Panel title="CFO Report">
            <p style={{ color: "#cbd5e1" }}>{report?.summary}</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={report?.category_summary || []}>
                <CartesianGrid stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="amount" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </section>

        <Panel title="AI Agent with Tools" style={{ marginTop: 24 }}>
          <div style={{ minHeight: 240, maxHeight: 360, overflowY: "auto", paddingRight: 8 }}>
            {chatMessages.map((message, index) => (
              <div key={`${message.role}-${index}`} style={{ display: "flex", justifyContent: message.role === "user" ? "flex-end" : "flex-start", marginBottom: 14 }}>
                <div style={{ maxWidth: "72%", background: message.role === "user" ? "#7c3aed" : "#1e293b", padding: 16, borderRadius: 14, lineHeight: 1.55 }}>
                  {message.content}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
            <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendMessage()} placeholder="Ask: forecast next month, summarize categories, check compliance..." style={{ ...inputStyle, flex: 1 }} />
            <button onClick={sendMessage} style={buttonStyle}><Send size={22} /></button>
          </div>
        </Panel>

        <Panel title="Transactions" style={{ marginTop: 24 }}>
          <div style={{ display: "grid", gap: 12 }}>
            {expenses.map((expense) => (
              <div key={expense.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 12, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
                <div><strong>{expense.vendor || expense.merchant}</strong><p style={{ color: "#94a3b8" }}>{expense.date || expense.expense_date}</p></div>
                <div>{expense.category}<p style={{ color: "#94a3b8" }}>{expense.currency || "INR"}</p></div>
                <div>{money(expense.amount)}<p style={{ color: expense.policy?.reimbursable ? "#22c55e" : "#f59e0b" }}>{expense.policy?.reimbursable ? "Reimbursable" : "Needs review"}</p></div>
                <div style={{ color: expense.anomaly?.flagged ? "#ef4444" : "#22c55e" }}>{expense.anomaly?.flagged ? "Flagged" : "Normal"}</div>
              </div>
            ))}
          </div>
        </Panel>
      </main>
    </div>
  );
}

const inputStyle = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 12,
  color: "white",
  padding: "14px 16px",
  fontSize: 16,
};

const buttonStyle = {
  background: "#8b5cf6",
  border: "none",
  borderRadius: 12,
  color: "white",
  cursor: "pointer",
  fontSize: 16,
  padding: "14px 20px",
};

function Panel({ title, children, style }) {
  return (
    <section style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 18, padding: 24, ...style }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </section>
  );
}

export default App;
