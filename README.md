# InsightPilot AI — Enterprise AI Data Analytics & Autonomous Data Science Platform

[![Python](https://img.shields.io/badge/Python-3.14%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16%20(Turbopack)-black.svg)](https://nextjs.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.8%2B-F7931E.svg)](https://scikit-learn.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg)](https://tailwindcss.com/)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Ready-black.svg)](https://vercel.com/)

**InsightPilot AI** is an enterprise-grade, full-stack AI data analytics and data science SaaS platform. It combines automated exploratory data analysis (EDA), a deterministic **zero-hallucination** statistical intelligence engine, interactive multi-chart visualization studios, production-grade scikit-learn machine learning training pipelines, and executive ReportLab PDF dossier generation.

---

## Architecture & Deployment Workflow

```text
Antigravity IDE / VS Code
       ↓ (Make changes & Save)
Save → Commit → Push (1-Click IDE Task or `npm run git:sync`)
       ↓
GitHub Repository (`main` branch)
       ↓ (Automatic Webhook Trigger)
Vercel CI/CD Pipeline
       ↓ (Builds Next.js Frontend)
Production Live Deployment 🚀
```

---

## Key Features

1. **Autonomous AI Data Scientist Agent (`/data-scientist`)**:
   - **Two-Pass Zero-Hallucination Verification**: Generates exhaustive 5-section EDA dossiers where every single cited number is mathematically verified against the input statistics payload in code. Any fabricated number is strictly stripped.
   - **Multi-Dataset Portfolio Intelligence**: Explore and query across all registered datasets simultaneously (`GET /api/eda/catalog` & `POST /api/eda/ask`).
   - **Cross-Dataset Comparative Benchmarks**: Side-by-side comparative matrices analyzing health scores, cardinality, and data quality across multiple tables (`POST /api/eda/compare`).
   - **SHA-256 Content-Hash Caching**: In-memory + SQLite cached profiles for sub-millisecond report delivery.

2. **Grounded AI Analyst Chat (`/chat`)**:
   - Conversational assistant powered by Python/Pandas operations.
   - Answers questions using **real calculations** without hallucinations.
   - Automatically generates inline dynamic charts (Bar, Line, Scatter, Pie, Histogram) matching query intent.

3. **Data Overview & Exploratory Studio (`/explorer`)**:
   - Automated 5-number summary statistics (Min, Q1, Median, Q3, Max, Mean, Std, Skewness).
   - Tukey's IQR Outlier Detection (1.5 × IQR boundary fences).
   - Interactive Pearson Correlation Heatmap with dynamic color scaling.

4. **Interactive Visualization Studio (`/visualizer`)**:
   - Multi-chart canvas supporting Bar, Line, Scatter, Pie/Donut, Histogram, and Boxplots.
   - Dynamic mathematical aggregations (Sum, Mean, Median, Min, Max, Count) with JSON data export.

5. **Machine Learning Studio (`/ml-studio`)**:
   - Automated task type detection (Classification vs Regression).
   - Preprocessing pipeline: Median/Mode imputation, One-Hot Encoding, StandardScaler.
   - Multi-model benchmark suite: Logistic Regression, Random Forest, Decision Tree, Gradient Boosting, Linear Regression, Ridge.
   - Real test-set evaluation: Accuracy, Precision, Recall, F1-Score, Confusion Matrix, R², MAE, RMSE.
   - Feature Importance extraction and **Live Prediction Sandbox** for real-time inference.

6. **Automated Data Cleaning Suite (`/cleaner`)**:
   - Imputation strategies (Median, Mean, Mode, Constant, Drop).
   - Row deduplication and Tukey IQR outlier winsorizing / clipping.
   - 1-click cleaned CSV export (`GET /api/exports/{id}/cleaned-csv`).

7. **Executive Reports & PDF Dossier (`/reports`)**:
   - Compiles executive briefing with data quality index, automated findings, and model metrics.
   - Generates and downloads branded, print-ready PDF reports via ReportLab.

8. **External Public Repositories Integration**:
   - 1-Click OpenML benchmark importer (`credit-g`, `diabetes`, `iris`, `boston`).
   - World Bank economic GDP indicator API importer.

---

## Local Development & Setup

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+ (Python 3.14 recommended)
- Git

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Harshitdubey-lab/AI_EDA_performing_tool.git
cd AI_EDA_performing_tool

# Install frontend dependencies
npm --prefix frontend install

# Install Python backend dependencies
pip install -r requirements.txt
```

### 2. Environment Setup

Copy `.env.example` to create local configuration:

```bash
# Root / Backend environment
cp .env.example .env

# Frontend environment
cp frontend/.env.example frontend/.env.local
```

### 3. Run Locally

You can launch both servers with convenient npm commands:

```bash
# Start Next.js Frontend (http://localhost:3000)
npm run dev

# Start FastAPI Backend (http://127.0.0.1:8001)
npm run dev:backend
```

- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://127.0.0.1:8001](http://127.0.0.1:8001)
- **Interactive Swagger Docs**: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

---

## One-Click GitHub Push Workflow

Inside **Antigravity IDE / VS Code**, use the built-in tasks (`Ctrl+Shift+P` → `Tasks: Run Task`):

| IDE Task / Command | Action |
| :--- | :--- |
| **`Git: Quick Sync`** (`npm run git:sync`) | 1-Click: Stages all changed files, creates commit, and pushes to `origin main` |
| **`Git: Status`** (`npm run git:status`) | Displays modified, untracked, and staged files |
| **`Git: Stage All Changes`** (`npm run git:add`) | Stages all working directory changes |
| **`Git: Commit Changes`** (`npm run git:commit`) | Prompts for custom commit message and commits |
| **`Git: Push to GitHub`** (`npm run git:push`) | Pushes commits to remote `origin main` |
| **`Git: Pull Latest Changes`** (`npm run git:pull`) | Pulls upstream changes from `origin main` |

---

## Vercel Deployment Guide

### Method A: Automated GitHub Integration (Recommended)

1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New..." → "Project"**.
3. Select the repository **`Harshitdubey-lab/AI_EDA_performing_tool`**.
4. Configure the project settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Select `frontend` (or keep root with included `vercel.json`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. **Environment Variables**:
   Add the following under **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-api-url.com` (Your deployed FastAPI backend endpoint)
6. Click **"Deploy"**.

Every future `git push origin main` will automatically trigger a production deployment on Vercel!

### Method B: Vercel CLI (Optional)

```bash
# Log in to Vercel CLI
npx vercel login

# Link and deploy from terminal
npx vercel --prod
```

---

## Backend Deployment Options (FastAPI)

Since Vercel specializes in frontend and serverless edge functions, host the Python FastAPI backend on any of these free/affordable cloud providers:

1. **Render (render.com)**:
   - Create a Web Service connected to your GitHub repo.
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
2. **Railway (railway.app)**:
   - Import GitHub repository and deploy with standard Python buildpack.
3. **Fly.io / AWS / DigitalOcean**:
   - Deploy as a Docker container or standalone service.

After deploying the backend, update `NEXT_PUBLIC_API_URL` in your Vercel project environment variables to link frontend and backend.

---

## Security & Secrets Policy

- **No Secrets in Git**: `.env`, `.env.local`, `.env*.local`, private keys (`*.pem`, `*.key`), and SQLite databases (`*.db`, `*.sqlite`) are strictly blocked by `.gitignore`.
- **Environment Templates**: Always document new variables in `.env.example` and `frontend/.env.example` with blank/placeholder values.
- **Production Secrets**: Inject all API keys and credentials exclusively via the hosting provider's dashboard (e.g. Vercel Environment Variables, Render Secrets).

---

## Verification & Automated Test Suite

Run the full automated test suite to verify data processing, machine learning models, and zero-hallucination guardrails:

```bash
npm run test:backend
# or: python backend/test_suite.py
```

### Verified Test Summary:
- `test_01_data_service_profile`: Statistical profile, quantiles, outliers, correlations.
- `test_02_dataset_registry_catalog`: Catalog integrity and SHA-256 caching.
- `test_03_ml_service_pipelines`: Classification and regression training pipelines.
- `test_04_eda_agent_single_and_cache`: Multi-section EDA reports and cache hits.
- `test_05_hallucination_guardrail_rejects_fabricated_number`: **Pass-2 deterministic zero-hallucination verification**.
- `test_06_compare_and_portfolio_ask`: Multi-dataset comparison and portfolio intelligence Q&A.

---

## License & Author

Developed by **Harshit Dubey** ([@Harshitdubey-lab](https://github.com/Harshitdubey-lab)).
Licensed under the [MIT License](LICENSE).
