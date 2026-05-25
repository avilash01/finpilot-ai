import React, { useEffect, useState } from "react";

import axios from "axios";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import { LayoutDashboard, Wallet, Upload, Bot, Send } from "lucide-react";

// -----------------------------------
// API BASE URL
// -----------------------------------

const configuredApiUrl = import.meta.env.VITE_API_URL;

const BASE_URL = (
  configuredApiUrl && !configuredApiUrl.includes("railway.app")
    ? configuredApiUrl
    : ""
);

function App() {

  // -----------------------------------
  // STATES
  // -----------------------------------

  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: "Hello 👋 I am FinPilot AI. Ask me anything about your expenses.",
    },
  ]);
  const [budget, setBudget] = useState(5000);

  // -----------------------------------
  // COLORS
  // -----------------------------------

  const COLORS = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

  // -----------------------------------
  // FETCH ANALYTICS
  // -----------------------------------

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // -----------------------------------
  // FETCH EXPENSES
  // -----------------------------------

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/expenses`);
      setExpenses(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // -----------------------------------
  // FETCH ALERTS
  // -----------------------------------

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/alerts`);
      setAlerts(response.data.alerts);
    } catch (error) {
      console.log(error);
    }
  };

  // -----------------------------------
  // UPLOAD RECEIPT - FIXED
  // -----------------------------------

  const uploadReceipt = async () => {

    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    try {

      setLoading(true);
      setUploadMessage("");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await axios.post(
        `${BASE_URL}/api/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadMessage(
        response.data.message || "Receipt uploaded successfully!"
      );

      setSelectedFile(null);

      fetchAnalytics();
      fetchExpenses();
      fetchAlerts();

      const fileInput = document.getElementById("receipt-input");
      if (fileInput) fileInput.value = "";

    } catch (error) {

      console.log(error);

      setUploadMessage(
        error.response?.data?.detail || "Upload failed"
      );

    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------
  // AI CHAT
  // -----------------------------------

  const sendMessage = async () => {

    if (!chatInput.trim()) return;

    const userMessage = {
      role: "user",
      content: chatInput,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");

    try {

      const response = await axios.post(`${BASE_URL}/api/chat`, {
        message: chatInput,
      });

      const aiMessage = {
        role: "assistant",
        content: response.data.reply,
      };

      setChatMessages((prev) => [...prev, aiMessage]);

    } catch (error) {

      console.log(error);

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Could not connect to AI.",
        },
      ]);
    }
  };

  // -----------------------------------
  // SAVE BUDGET
  // -----------------------------------

  const saveBudget = () => {
    localStorage.setItem("finpilot_budget", budget);
    alert("Budget Saved!");
  };

  // -----------------------------------
  // HANDLE ENTER KEY
  // -----------------------------------

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // -----------------------------------
  // LOAD DATA
  // -----------------------------------

  useEffect(() => {
    fetchAnalytics();
    fetchExpenses();
    fetchAlerts();

    const savedBudget = localStorage.getItem("finpilot_budget");
    if (savedBudget) {
      setBudget(Number(savedBudget));
    }
  }, []);

  // -----------------------------------
  // PIE DATA
  // -----------------------------------

  const pieData = expenses.map((expense) => ({
    name: expense.category,
    value: expense.amount,
  }));

  // -----------------------------------
  // UI
  // -----------------------------------

  return (
    <div
      style={{
        background: "#020617",
        minHeight: "100vh",
        display: "flex",
        fontFamily: "Arial, sans-serif",
      }}
    >

      {/* SIDEBAR */}

      <div
        style={{
          width: "280px",
          background: "#081028",
          color: "white",
          padding: "40px 30px",
          borderRight: "1px solid #1e293b",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <h1
          style={{
            color: "#8b5cf6",
            fontSize: "40px",
            marginBottom: "80px",
          }}
        >
          FinPilot AI
        </h1>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "45px",
            fontSize: "20px",
          }}
        >
          {[
            { icon: <LayoutDashboard />, label: "Dashboard" },
            { icon: <Wallet />,          label: "Expenses"  },
            { icon: <Upload />,          label: "Uploads"   },
            { icon: <Bot />,             label: "AI Assistant" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                gap: "18px",
                alignItems: "center",
                padding: "10px",
                borderRadius: "12px",
              }}
            >
              {icon}
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}

      <div style={{ flex: 1, padding: "40px" }}>

        <h1
          style={{
            color: "white",
            fontSize: "70px",
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          AI Expense Dashboard
        </h1>

        {/* ANALYTICS CARDS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "30px",
          }}
        >
          <div style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", padding: "40px", borderRadius: "30px", color: "white", textAlign: "center" }}>
            <h2>Total Spending</h2>
            <h1 style={{ fontSize: "70px" }}>₹{analytics.total_spending || 0}</h1>
          </div>

          <div style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)", padding: "40px", borderRadius: "30px", color: "white", textAlign: "center" }}>
            <h2>Total Records</h2>
            <h1 style={{ fontSize: "70px" }}>{analytics.total_records || 0}</h1>
          </div>

          <div style={{ background: "linear-gradient(135deg,#10b981,#059669)", padding: "40px", borderRadius: "30px", color: "white", textAlign: "center" }}>
            <h2>Top Category</h2>
            <h1 style={{ fontSize: "55px" }}>{analytics.top_category || "None"}</h1>
          </div>

          <div style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", padding: "40px", borderRadius: "30px", color: "white", textAlign: "center" }}>
            <h2>Average Spending</h2>
            <h1 style={{ fontSize: "70px" }}>₹{analytics.average_spending || 0}</h1>
          </div>
        </div>

        {/* CHART + UPLOAD */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
            marginTop: "50px",
          }}
        >

          {/* PIE CHART */}

          <div
            style={{
              background: "#0f172a",
              borderRadius: "30px",
              padding: "30px",
              height: "450px",
            }}
          >
            <h2 style={{ color: "white", textAlign: "center" }}>
              Expense Distribution
            </h2>

            {pieData.length === 0 ? (
              <div style={{ color: "#475569", textAlign: "center", marginTop: "120px" }}>
                No expense data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={120}>
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* UPLOAD */}

          <div
            style={{
              background: "#0f172a",
              borderRadius: "30px",
              padding: "40px",
              border: "2px dashed #8b5cf6",
              textAlign: "center",
            }}
          >
            <Upload size={80} color="#8b5cf6" />

            <h2 style={{ color: "white" }}>Upload Receipt</h2>

            <p style={{ color: "#94a3b8" }}>Select your receipt image</p>

            <input
              id="receipt-input"
              type="file"
              accept="image/*"
              onChange={(e) => {
                setSelectedFile(e.target.files[0]);
                setUploadMessage("");
              }}
              style={{ marginTop: "20px", color: "white" }}
            />

            {selectedFile && (
              <p style={{ color: "#94a3b8", marginTop: "10px", fontSize: "14px" }}>
                Selected: {selectedFile.name}
              </p>
            )}

            <button
              onClick={uploadReceipt}
              disabled={loading || !selectedFile}
              style={{
                marginTop: "30px",
                padding: "16px 30px",
                borderRadius: "15px",
                border: "none",
                background: loading || !selectedFile ? "#4b5563" : "#8b5cf6",
                color: "white",
                fontSize: "18px",
                cursor: loading || !selectedFile ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Uploading..." : "Upload Receipt"}
            </button>

            {uploadMessage && (
              <p
                style={{
                  marginTop: "20px",
                  color: uploadMessage.includes("failed") || uploadMessage.includes("Error")
                    ? "#ef4444"
                    : "#22c55e",
                }}
              >
                {uploadMessage}
              </p>
            )}
          </div>
        </div>

        {/* BUDGET PLANNER */}

        <div
          style={{
            background: "#111c3d",
            borderRadius: "30px",
            padding: "40px",
            marginTop: "50px",
          }}
        >
          <h1 style={{ color: "white", textAlign: "center", fontSize: "50px" }}>
            Budget Planner
          </h1>

          <div
            style={{
              display: "flex",
              gap: "20px",
              justifyContent: "center",
              marginTop: "30px",
            }}
          >
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              style={{
                padding: "18px",
                width: "300px",
                borderRadius: "15px",
                border: "none",
                background: "#1e293b",
                color: "white",
                fontSize: "18px",
              }}
            />

            <button
              onClick={saveBudget}
              style={{
                padding: "18px 30px",
                borderRadius: "15px",
                border: "none",
                background: "#8b5cf6",
                color: "white",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              Save Budget
            </button>
          </div>

          <div style={{ marginTop: "40px", textAlign: "center", color: "white" }}>
            <h2>Monthly Budget: ₹{budget}</h2>
            <h2>Total Spending: ₹{analytics.total_spending || 0}</h2>
            <h2
              style={{
                color: (analytics.total_spending || 0) > budget ? "#ef4444" : "#22c55e",
              }}
            >
              Remaining: ₹{budget - (analytics.total_spending || 0)}
            </h2>
          </div>
        </div>

        {/* AI SMART ALERTS */}

        <div
          style={{
            background: "#111c3d",
            borderRadius: "30px",
            padding: "40px",
            marginTop: "50px",
          }}
        >
          <h1
            style={{
              color: "white",
              textAlign: "center",
              fontSize: "50px",
              marginBottom: "30px",
            }}
          >
            AI Smart Alerts
          </h1>

          {alerts.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "20px" }}>
              No alerts right now
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  style={{
                    background: "#1e293b",
                    padding: "25px",
                    borderRadius: "20px",
                    color: "#f59e0b",
                    fontSize: "20px",
                    border: "1px solid #f59e0b",
                  }}
                >
                  ⚠️ {alert}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI CHAT */}

        <div
          style={{
            background: "#111c3d",
            borderRadius: "30px",
            padding: "40px",
            marginTop: "50px",
          }}
        >
          <h1 style={{ color: "white", textAlign: "center", fontSize: "50px" }}>
            AI Financial Assistant
          </h1>

          <div
            style={{
              height: "400px",
              overflowY: "auto",
              marginTop: "30px",
              padding: "20px",
            }}
          >
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    background: msg.role === "user" ? "#8b5cf6" : "#1e293b",
                    color: "white",
                    padding: "20px",
                    borderRadius: "20px",
                    maxWidth: "70%",
                    fontSize: "16px",
                    lineHeight: "1.6",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI about your expenses..."
              style={{
                flex: 1,
                padding: "22px",
                borderRadius: "20px",
                border: "none",
                background: "#1e293b",
                color: "white",
                fontSize: "18px",
              }}
            />

            <button
              onClick={sendMessage}
              style={{
                padding: "20px 30px",
                borderRadius: "20px",
                border: "none",
                background: "#8b5cf6",
                color: "white",
                cursor: "pointer",
              }}
            >
              <Send size={30} />
            </button>
          </div>
        </div>

        {/* RECENT EXPENSES */}

        <div style={{ marginTop: "50px" }}>
          <h1
            style={{
              color: "white",
              textAlign: "center",
              fontSize: "60px",
              marginBottom: "30px",
            }}
          >
            Recent Expenses
          </h1>

          {expenses.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#475569",
                padding: "60px",
                background: "#111c3d",
                borderRadius: "25px",
              }}
            >
              No expenses yet. Upload a receipt to get started.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              {expenses.map((expense, index) => (
                <div
                  key={index}
                  style={{
                    background: "#111c3d",
                    padding: "30px",
                    borderRadius: "25px",
                    color: "white",
                    border: "1px solid #1e293b",
                  }}
                >
                  <h1 style={{ color: "#8b5cf6" }}>{expense.category}</h1>
                  <h1 style={{ fontSize: "55px" }}>₹{expense.amount}</h1>
                  <p>{expense.insights}</p>
                  <p><b>Pattern:</b> {expense.pattern}</p>
                  <p><b>Saving Tip:</b> {expense.saving_tip}</p>
                  <p style={{ color: "#64748b" }}>
                    {expense.merchant} · {expense.expense_date} · {expense.payment_mode}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
