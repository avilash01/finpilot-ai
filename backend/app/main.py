from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# -----------------------------------
# DATABASE
# -----------------------------------

from app.database.db import engine
from app.database.base import Base

# -----------------------------------
# MODELS
# -----------------------------------

from app.models.expense import Expense
from app.models.budget import Budget

# -----------------------------------
# ROUTES
# -----------------------------------

from app.routes.upload import (
    router as upload_router
)

from app.routes.expenses import (
    router as expenses_router
)

from app.routes.analytics import (
    router as analytics_router
)

from app.routes.chat import (
    router as chat_router
)

from app.routes.budget import (
    router as budget_router
)

from app.routes.forecast import (
    router as forecast_router
)

from app.routes.alerts import (
    router as alerts_router
)

# -----------------------------------
# CREATE DATABASE TABLES
# -----------------------------------

Base.metadata.create_all(
    bind=engine
)

# -----------------------------------
# FASTAPI APP
# -----------------------------------

app = FastAPI(

    title="FinPilot AI",

    description=
    "AI Powered Expense Intelligence Platform",

    version="4.0.0"
)

# -----------------------------------
# CORS
# -----------------------------------

app.add_middleware(

    CORSMiddleware,

    allow_origins=[

        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://*.vercel.app",
        "https://finpilot-ai-nine.vercel.app"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)

# -----------------------------------
# ROOT ROUTE
# -----------------------------------

@app.get("/")
def home():

    return {

        "message":
        "FinPilot AI Running Successfully",

        "status":
        "success"
    }

# -----------------------------------
# HEALTH CHECK
# -----------------------------------

@app.get("/health")
def health_check():

    return {

        "status":
        "healthy"
    }

# -----------------------------------
# VERSION CHECK
# -----------------------------------

@app.get("/version")
def version():

    return {

        "app":
        "FinPilot AI",

        "version":
        "4.0.0"
    }

# -----------------------------------
# UPLOAD ROUTES
# -----------------------------------

app.include_router(

    upload_router,

    prefix="/api",

    tags=[
        "Invoice Upload"
    ]
)

# -----------------------------------
# EXPENSE ROUTES
# -----------------------------------

app.include_router(

    expenses_router,

    tags=[
        "Expenses"
    ]
)

# -----------------------------------
# ANALYTICS ROUTES
# -----------------------------------

app.include_router(

    analytics_router,

    tags=[
        "Analytics"
    ]
)

# -----------------------------------
# AI CHAT ROUTES
# -----------------------------------

app.include_router(

    chat_router,

    tags=[
        "AI Chat"
    ]
)

# -----------------------------------
# BUDGET ROUTES
# -----------------------------------

app.include_router(

    budget_router,

    tags=[
        "Budget Planner"
    ]
)

# -----------------------------------
# FORECAST ROUTES
# -----------------------------------

app.include_router(

    forecast_router,

    tags=[
        "Forecast"
    ]
)

# -----------------------------------
# AI ALERT ROUTES
# -----------------------------------

app.include_router(

    alerts_router,

    tags=[
        "AI Alerts"
    ]
)