# InsightPilot AI — Enterprise AI Data Analytics & Autonomous Data Science Platform

[![Python](https://img.shields.io/badge/Python-3.14%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16%20(Turbopack)-black.svg)](https://nextjs.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.8%2B-F7931E.svg)](https://scikit-learn.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg)](https://tailwindcss.com/)

**InsightPilot AI** is an enterprise-grade, full-stack AI data analytics and data science SaaS platform. It combines automated exploratory data analysis (EDA), a deterministic **zero-hallucination** statistical intelligence engine, interactive multi-chart visualization studios, production-grade scikit-learn machine learning training pipelines, and executive ReportLab PDF dossier generation.

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

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router + Turbopack) with TypeScript
- **Styling**: Tailwind CSS v4 with dark slate / emerald-indigo-violet enterprise theme
- **Visualization**: Recharts & Lucide React icons
- **Architecture**: Modular SPA component structure with direct sub-routes

### Backend
- **Framework**: Python 3.14+ with FastAPI and Uvicorn
- **Data Processing**: Pandas 2.3+ & NumPy 2.4+
- **Machine Learning**: Scikit-Learn 1.8+
- **PDF Generation**: ReportLab 5.0+
- **Persistence**: SQLite (`insightpilot.db`) with SHA-256 profile caching
- **External Integration**: OpenML, Requests

---

## Environment Variables

Create a `.env` file or export environment variables in your terminal:

```env
# Optional: OpenAI API Key for enriched narrative generation (Rule-based fallback works 100% offline without it)
OPENAI_API_KEY=your_openai_api_key

# Storage & Database Configuration
DATABASE_URL=sqlite:///./insightpilot.db
UPLOAD_DIR=./storage/uploads
REPORT_DIR=./storage/reports
MODEL_DIR=./storage/models
MAX_UPLOAD_SIZE_MB=100
ALLOWED_FILE_TYPES=csv,xlsx,xls,tsv
```

---

## Quick Setup & Run Instructions

### 1. Backend Setup
From the project root:

```bash
# Install Python dependencies
pip install fastapi uvicorn pandas numpy scikit-learn reportlab openml requests python-multipart

# Start FastAPI server on port 8000
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be live at: **`http://127.0.0.1:8000`**  
Interactive API Docs: **`http://127.0.0.1:8000/docs`**

### 2. Frontend Setup
From the `frontend/` directory:

```bash
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server on port 3000
npm run dev
```

Frontend application will be live at: **`http://localhost:3000`**

---

## Built-In Sample Datasets

The platform automatically registers 3 realistic production datasets upon first launch:

1. **Global Retail Sales & Returns (`sample_sales_data.csv`)**:
   - 650 records with `order_id, order_date, region, city, product_category, quantity, unit_price, discount, revenue, profit, delivery_days, returned`.
   - **Classification Demo**: Target `returned` (Predict order return status; Accuracy, Precision, Recall, F1, Confusion Matrix).
   - **Regression Demo**: Target `profit` (Predict profit margins; MAE, RMSE, R² Score).
2. **Customer Churn & Retention (`customer_churn.csv`)**:
   - 1,000 telecommunication accounts with contract types, tenure, monthly charges, and churn status.
3. **Residential Housing Valuations (`housing_prices.csv`)**:
   - 800 real estate properties with square footage, bedrooms, bathrooms, quality score, and sale prices.

---

## Verification & Test Suite

Run the full automated test suite covering profiling, ML pipelines, two-pass zero-hallucination verification, fabricated number rejection, and cache hits:

```bash
python backend/test_suite.py
```

### Test Results Summary:
- `test_01_data_service_profile`: Passed (EDA shape, quantiles, outliers, correlation).
- `test_02_dataset_registry_catalog`: Passed (Catalog integrity and SHA-256 caching).
- `test_03_ml_service_pipelines`: Passed (Classification and regression pipelines).
- `test_04_eda_agent_single_and_cache`: Passed (5-section report and cache hits).
- `test_05_hallucination_guardrail_rejects_fabricated_number`: Passed (**Guaranteed Zero-Hallucination Guardrail verified**).
- `test_06_compare_and_portfolio_ask`: Passed (Multi-dataset compare and portfolio Q&A).

---

## API Endpoints Reference

### Dataset Management
- `POST /api/datasets/upload` — Upload CSV/XLSX file with validation and schema parsing.
- `GET /api/datasets` — List all registered datasets.
- `GET /api/datasets/{id}` — Retrieve dataset metadata.
- `GET /api/datasets/{id}/preview` — Paginated data preview with search filter.
- `GET /api/datasets/{id}/profile` — Automated statistical profile and 5-number summary.
- `GET /api/datasets/{id}/columns` — Inferred data types and unique counts.
- `GET /api/datasets/{id}/missing-values` — Missing value percentages per feature.
- `GET /api/datasets/{id}/correlations` — Pearson correlation matrix.
- `GET /api/datasets/{id}/outliers` — Tukey IQR outlier analysis.

### Autonomous AI Data Scientist Agent
- `GET /api/eda/catalog` — Multi-dataset portfolio catalog with readiness tiers and quality scores.
- `POST /api/dataset/{id}/auto-eda` — Trigger single-dataset autonomous EDA with two-pass verification.
- `GET /api/dataset/{id}/auto-eda` — Retrieve cached EDA report.
- `POST /api/eda/compare` — Compare multiple datasets across dimensions and health metrics.
- `POST /api/eda/ask` — Semantic natural language queries across the entire dataset library.

### Machine Learning Studio
- `POST /api/datasets/{id}/train-model` — Train multiple scikit-learn models on 80/20 train/test split.
- `GET /api/datasets/{id}/model-results` — Retrieve benchmark leaderboard, metrics, and feature importances.
- `POST /api/datasets/{id}/predict` — Real-time single-row inference sandbox.

### Reports & Cleaning
- `POST /api/datasets/{id}/clean` — Execute missing value imputation, duplicate removal, and outlier clipping.
- `GET /api/exports/{id}/cleaned-csv` — Download cleaned CSV.
- `POST /api/datasets/{id}/generate-report` — Compile executive dossier.
- `GET /api/reports/{id}/download` — Download branded PDF report.
