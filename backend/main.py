import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import uuid
import json
import sqlite3
import shutil
import requests
from datetime import datetime
from typing import Optional, Dict, Any, List

import numpy as np
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from services.data_service import DataService
from services.chart_service import ChartService
from services.ml_service import MLService
from services.ai_service import AIService
from services.report_service import ReportService
from services.pdf_service import PDFService
from services.clean_service import CleanService
from services.eda_agent_service import EDAAgentService, DatasetStatsPayload, AutoEDAReport
from core.dataset_registry import DatasetRegistry

# Environment Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./insightpilot.db")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./storage/uploads")
REPORT_DIR = os.getenv("REPORT_DIR", "./storage/reports")
MODEL_DIR = os.getenv("MODEL_DIR", "./storage/models")
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "100"))
ALLOWED_FILE_TYPES = os.getenv("ALLOWED_FILE_TYPES", "csv,xlsx,xls,tsv").split(",")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAMPLES_DIR = os.path.join(BASE_DIR, "samples")
DB_PATH = os.path.join(BASE_DIR, "insightpilot.db")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(REPORT_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(SAMPLES_DIR, exist_ok=True)

app = FastAPI(
    title="InsightPilot AI - Enterprise Data Science Engine",
    description="Full-stack AI-powered Data Analytics and Machine Learning Assistant API",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database initializations
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS datasets (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                row_count INTEGER,
                col_count INTEGER,
                file_size_kb REAL,
                created_at TEXT NOT NULL,
                is_sample BOOLEAN DEFAULT 0,
                cleaned_path TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                dataset_id TEXT NOT NULL,
                title TEXT NOT NULL,
                file_path TEXT NOT NULL,
                quality_score REAL,
                created_at TEXT NOT NULL,
                summary_json TEXT
            )
        """)
        conn.commit()

init_db()

# Seed default datasets (including sample_sales_data.csv)
def seed_sample_datasets():
    samples = [
        {"name": "Global Retail Sales & Returns", "filename": "sample_sales_data.csv", "id": "sample-sales"},
        {"name": "Customer Churn & Retention", "filename": "customer_churn.csv", "id": "sample-churn"},
        {"name": "Residential Housing Valuations", "filename": "housing_prices.csv", "id": "sample-housing"},
    ]
    with get_db() as conn:
        for s in samples:
            src = os.path.join(SAMPLES_DIR, s["filename"])
            if os.path.exists(src):
                row = conn.execute("SELECT id FROM datasets WHERE id = ?", (s["id"],)).fetchone()
                if not row:
                    try:
                        df = pd.read_csv(src)
                        size_kb = round(os.path.getsize(src) / 1024, 1)
                        conn.execute("""
                            INSERT INTO datasets (id, name, filename, file_path, row_count, col_count, file_size_kb, created_at, is_sample)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
                        """, (s["id"], s["name"], s["filename"], src, len(df), len(df.columns), size_kb, datetime.now().isoformat()))
                    except Exception as e:
                        print(f"Error seeding sample {s['name']}: {e}")
        conn.commit()

seed_sample_datasets()

# Helper accessors
def get_dataset_record(dataset_id: str):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return dict(row)

def get_df_by_id(dataset_id: str) -> pd.DataFrame:
    record = get_dataset_record(dataset_id)
    target_path = record["cleaned_path"] if (record.get("cleaned_path") and os.path.exists(record["cleaned_path"])) else record["file_path"]
    if not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail=f"Dataset file missing on disk: {target_path}")
    return DataService.load_dataset(target_path)

# --- Request Schemas ---
class AskQueryRequest(BaseModel):
    question: str

class ChartRequest(BaseModel):
    chart_type: str
    x_col: str
    y_col: Optional[str] = None
    aggregation: Optional[str] = "sum"
    group_by: Optional[str] = None
    limit: Optional[int] = 25

class CleanRequest(BaseModel):
    remove_duplicates: Optional[bool] = True
    missing_strategy: Optional[str] = "impute_median"  # drop, impute_median, impute_mean, impute_constant, none
    outlier_strategy: Optional[str] = "clip_iqr"       # none, clip_iqr, drop

class TrainModelRequest(BaseModel):
    target_column: str
    feature_columns: Optional[List[str]] = None
    task_type: Optional[str] = None

class PredictRequest(BaseModel):
    features: Dict[str, Any]

# --- 1. Dataset Management Endpoints ---

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "InsightPilot AI Backend API",
        "version": "2.0.0",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "InsightPilot AI",
        "version": "2.0.0",
        "openai_configured": bool(OPENAI_API_KEY)
    }

@app.get("/api/datasets")
def list_datasets():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM datasets ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]

@app.post("/api/datasets/upload")
async def upload_dataset(file: UploadFile = File(...), name: Optional[str] = Form(None)):
    ext = os.path.splitext(file.filename)[1].lower().replace(".", "")
    if ext not in ALLOWED_FILE_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(ALLOWED_FILE_TYPES)}")

    dataset_id = str(uuid.uuid4())
    safe_filename = f"{dataset_id}_{file.filename}"
    dest_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Size check
    file_size_mb = os.path.getsize(dest_path) / (1024 * 1024)
    if file_size_mb > MAX_UPLOAD_SIZE_MB:
        os.remove(dest_path)
        raise HTTPException(status_code=400, detail=f"File exceeds maximum allowed size of {MAX_UPLOAD_SIZE_MB}MB.")

    try:
        df = DataService.load_dataset(dest_path)
    except Exception as e:
        if os.path.exists(dest_path):
            os.remove(dest_path)
        raise HTTPException(status_code=400, detail=f"Could not parse file into tabular dataset: {str(e)}")

    display_name = name or os.path.splitext(file.filename)[0].replace("_", " ").title()
    size_kb = round(os.path.getsize(dest_path) / 1024, 1)

    with get_db() as conn:
        conn.execute("""
            INSERT INTO datasets (id, name, filename, file_path, row_count, col_count, file_size_kb, created_at, is_sample)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        """, (dataset_id, display_name, file.filename, dest_path, len(df), len(df.columns), size_kb, datetime.now().isoformat()))
        conn.commit()

    return {
        "id": dataset_id,
        "name": display_name,
        "filename": file.filename,
        "rows": len(df),
        "columns": len(df.columns),
        "file_size_kb": size_kb,
        "created_at": datetime.now().isoformat()
    }

@app.get("/api/datasets/{dataset_id}")
def get_dataset(dataset_id: str):
    return get_dataset_record(dataset_id)

@app.get("/api/datasets/{dataset_id}/preview")
def dataset_preview(
    dataset_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None)
):
    df = get_df_by_id(dataset_id)
    return DataService.get_preview(df, page=page, page_size=page_size, search=search)

@app.get("/api/datasets/{dataset_id}/profile")
def dataset_profile(dataset_id: str):
    df = get_df_by_id(dataset_id)
    profile = DataService.profile_dataset(df)
    profile["suggested_questions"] = AIService.get_suggested_questions(df)
    return profile

@app.get("/api/datasets/{dataset_id}/columns")
def dataset_columns(dataset_id: str):
    df = get_df_by_id(dataset_id)
    cols = []
    for c in df.columns:
        is_num = pd.api.types.is_numeric_dtype(df[c])
        cols.append({
            "name": c,
            "type": "numeric" if is_num else "categorical",
            "dtype": str(df[c].dtype),
            "unique_count": int(df[c].nunique())
        })
    return {"columns": cols}

@app.get("/api/datasets/{dataset_id}/missing-values")
def dataset_missing_values(dataset_id: str):
    df = get_df_by_id(dataset_id)
    total_rows = len(df)
    missing_list = []
    for c in df.columns:
        cnt = int(df[c].isna().sum())
        missing_list.append({
            "column": c,
            "missing_count": cnt,
            "missing_percentage": round((cnt / total_rows) * 100, 2) if total_rows > 0 else 0
        })
    return {"total_rows": total_rows, "columns": missing_list}

@app.get("/api/datasets/{dataset_id}/correlations")
def dataset_correlations(dataset_id: str):
    df = get_df_by_id(dataset_id)
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if len(num_cols) < 2:
        return {"columns": [], "matrix": []}
    corr = df[num_cols].dropna().corr(method="pearson").round(3)
    matrix = []
    for r in corr.index:
        row_dict = {"feature": r}
        for c in corr.columns:
            val = corr.loc[r, c]
            row_dict[c] = 0.0 if np.isnan(val) else float(val)
        matrix.append(row_dict)
    return {"columns": list(corr.columns), "matrix": matrix}

@app.get("/api/datasets/{dataset_id}/outliers")
def dataset_outliers(dataset_id: str):
    df = get_df_by_id(dataset_id)
    profile = DataService.profile_dataset(df)
    return profile["outlier_summary"]

# --- 2. Data Cleaning Endpoint ---

@app.post("/api/datasets/{dataset_id}/clean")
def clean_dataset(dataset_id: str, req: CleanRequest):
    df = get_df_by_id(dataset_id)
    res = CleanService.clean_dataset(
        df=df,
        dataset_id=dataset_id,
        output_dir=UPLOAD_DIR,
        remove_duplicates=req.remove_duplicates if req.remove_duplicates is not None else True,
        missing_strategy=req.missing_strategy or "impute_median",
        outlier_strategy=req.outlier_strategy or "clip_iqr"
    )
    with get_db() as conn:
        conn.execute("UPDATE datasets SET cleaned_path = ? WHERE id = ?", (res["cleaned_file_path"], dataset_id))
        conn.commit()
    return res

@app.get("/api/exports/{dataset_id}/cleaned-csv")
def download_cleaned_csv(dataset_id: str):
    record = get_dataset_record(dataset_id)
    cleaned_path = record.get("cleaned_path")
    if not cleaned_path or not os.path.exists(cleaned_path):
        # Fall back to original file if no clean copy yet
        cleaned_path = record["file_path"]
    filename = f"cleaned_{record['filename']}"
    return FileResponse(cleaned_path, media_type="text/csv", filename=filename)

# --- 3. AI Analyst Chat Endpoint ---

@app.post("/api/datasets/{dataset_id}/ask")
def ask_question(dataset_id: str, req: AskQueryRequest):
    df = get_df_by_id(dataset_id)
    # Grounded answer calculation
    res = AIService.answer_query(df, req.question)
    
    # Optional OpenAI refinement if API key provided
    if OPENAI_API_KEY:
        try:
            import json
            headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
            prompt = (
                f"You are InsightPilot AI, a senior business data analyst. "
                f"Here is the user question: '{req.question}'.\n"
                f"Here is the exact grounded calculation and statistics from the dataset:\n{res['answer']}\n\n"
                f"Rewrite this explanation in clean, concise, executive language. Do not invent any numbers outside this data."
            )
            payload = {
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2
            }
            resp = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=8)
            if resp.status_code == 200:
                openai_text = resp.json()["choices"][0]["message"]["content"]
                res["answer"] = openai_text
        except Exception as e:
            print(f"OpenAI optional enrichment skipped: {e}")

    return res

# --- 4. Visualization Studio Endpoint ---

@app.post("/api/datasets/{dataset_id}/chart")
def create_chart(dataset_id: str, req: ChartRequest):
    df = get_df_by_id(dataset_id)
    try:
        chart_res = ChartService.generate_chart(
            df,
            chart_type=req.chart_type,
            x_col=req.x_col,
            y_col=req.y_col,
            aggregation=req.aggregation or "sum",
            group_by=req.group_by,
            limit=req.limit or 25
        )
        return chart_res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- 5. Machine Learning Studio Endpoints ---

@app.post("/api/datasets/{dataset_id}/train-model")
def train_model(dataset_id: str, req: TrainModelRequest):
    df = get_df_by_id(dataset_id)
    if req.feature_columns and len(req.feature_columns) > 0:
        cols_to_keep = [c for c in req.feature_columns if c in df.columns]
        if req.target_column not in cols_to_keep:
            cols_to_keep.append(req.target_column)
        df = df[cols_to_keep]

    try:
        results = MLService.train_models(
            dataset_id=dataset_id,
            df=df,
            target_col=req.target_column,
            task_type=req.task_type
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/datasets/{dataset_id}/model-results")
def get_model_results(dataset_id: str):
    info = MLService._trained_pipelines.get(dataset_id)
    if not info:
        return {"has_models": False, "models": []}
    return {
        "has_models": True,
        "target_column": info["target_col"],
        "task_type": info["task_type"],
        "best_model": info["best_model_name"],
        "models": info.get("results", []),
        "feature_importance": info.get("feature_importance", []),
        "feature_columns": info.get("feature_columns", [])
    }

@app.post("/api/datasets/{dataset_id}/predict")
def predict_model(dataset_id: str, req: PredictRequest):
    try:
        res = MLService.predict_sample(dataset_id, req.features)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- 6. Executive Report & PDF Generation ---

@app.post("/api/datasets/{dataset_id}/generate-report")
def generate_report(dataset_id: str):
    import json
    record = get_dataset_record(dataset_id)
    df = get_df_by_id(dataset_id)
    report_data = ReportService.generate_report(dataset_id, record["name"], df)

    report_id = str(uuid.uuid4())
    pdf_filename = f"report_{dataset_id}_{report_id[:8]}.pdf"
    pdf_path = os.path.join(REPORT_DIR, pdf_filename)

    try:
        PDFService.generate_pdf(report_data, pdf_path)
    except Exception as e:
        print(f"PDF generation error: {e}")

    with get_db() as conn:
        conn.execute("""
            INSERT INTO reports (id, dataset_id, title, file_path, quality_score, created_at, summary_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            report_id,
            dataset_id,
            report_data["title"],
            pdf_path,
            report_data["quality_score"],
            datetime.now().isoformat(),
            json.dumps(report_data)
        ))
        conn.commit()

    return {
        "report_id": report_id,
        "dataset_id": dataset_id,
        "title": report_data["title"],
        "quality_score": report_data["quality_score"],
        "created_at": datetime.now().isoformat(),
        "pdf_download_url": f"/api/reports/{report_id}/download",
        "data": report_data
    }

@app.get("/api/reports/{report_id}")
def get_report(report_id: str):
    import json
    with get_db() as conn:
        row = conn.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Report not found")
        data = dict(row)
        if data.get("summary_json"):
            data["summary"] = json.loads(data["summary_json"])
        return data

@app.get("/api/reports/{report_id}/download")
def download_report(report_id: str):
    with get_db() as conn:
        row = conn.execute("SELECT file_path, title FROM reports WHERE id = ?", (report_id,)).fetchone()
        if not row or not os.path.exists(row["file_path"]):
            raise HTTPException(status_code=404, detail="PDF report file not found on disk")
        return FileResponse(row["file_path"], media_type="application/pdf", filename=f"{row['title'].replace(' ', '_')}.pdf")

# --- 7. Public OpenML & External Datasets ---

@app.get("/api/public/openml/datasets")
def list_openml_datasets():
    # Pre-curated list of famous OpenML benchmarks for 1-click import
    return [
        {"id": "credit-g", "name": "German Credit Risk", "task": "Classification", "description": "Predict good vs bad credit risks across 1,000 banking customers."},
        {"id": "iris", "name": "Fisher's Iris Flower", "task": "Classification", "description": "Classic benchmark: 150 samples of petal and sepal measurements."},
        {"id": "diabetes", "name": "Pima Indians Diabetes", "task": "Classification", "description": "Medical diagnostic dataset with glucose, insulin, and BMI factors."},
        {"id": "boston", "name": "Housing Market Index", "task": "Regression", "description": "Socio-economic features and median residential property values."}
    ]

@app.post("/api/public/openml/import")
def import_openml_dataset(dataset_name: str = Query("credit-g")):
    try:
        import openml
        ds = openml.datasets.get_dataset(dataset_name)
        X, y, _, _ = ds.get_data(target=ds.default_target_attribute)
        df = X.copy()
        if y is not None:
            target_col = ds.default_target_attribute or "target"
            df[target_col] = y

        dataset_id = str(uuid.uuid4())
        filename = f"openml_{dataset_name}.csv"
        dest_path = os.path.join(UPLOAD_DIR, filename)
        df.to_csv(dest_path, index=False)

        size_kb = round(os.path.getsize(dest_path) / 1024, 1)
        display_name = f"OpenML: {dataset_name.replace('-', ' ').title()}"

        with get_db() as conn:
            conn.execute("""
                INSERT INTO datasets (id, name, filename, file_path, row_count, col_count, file_size_kb, created_at, is_sample)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (dataset_id, display_name, filename, dest_path, len(df), len(df.columns), size_kb, datetime.now().isoformat()))
            conn.commit()

        return {"id": dataset_id, "name": display_name, "rows": len(df), "columns": len(df.columns)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch dataset from OpenML: {str(e)}")

@app.post("/api/public/worldbank/import")
def import_worldbank_data(country_code: str = "IND", indicator: str = "NY.GDP.MKTP.CD"):
    try:
        url = f"https://api.worldbank.org/v2/country/{country_code}/indicator/{indicator}?format=json&per_page=60"
        resp = requests.get(url, timeout=10)
        data = resp.json()
        if len(data) < 2:
            raise ValueError("No historical series returned from World Bank API.")

        records = []
        for item in data[1]:
            val = item.get("value")
            records.append({
                "country": item.get("country", {}).get("value", country_code),
                "year": int(item.get("date", 0)),
                "indicator": item.get("indicator", {}).get("value", indicator),
                "value": float(val) if val is not None else None
            })

        df = pd.DataFrame(records).dropna().sort_values("year")
        dataset_id = str(uuid.uuid4())
        filename = f"worldbank_{country_code}_{indicator}.csv"
        dest_path = os.path.join(UPLOAD_DIR, filename)
        df.to_csv(dest_path, index=False)

        size_kb = round(os.path.getsize(dest_path) / 1024, 1)
        display_name = f"World Bank: {country_code.upper()} GDP Time-Series"

        with get_db() as conn:
            conn.execute("""
                INSERT INTO datasets (id, name, filename, file_path, row_count, col_count, file_size_kb, created_at, is_sample)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (dataset_id, display_name, filename, dest_path, len(df), len(df.columns), size_kb, datetime.now().isoformat()))
            conn.commit()

        return {"id": dataset_id, "name": display_name, "rows": len(df), "columns": len(df.columns)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"World Bank import failed: {str(e)}")

# --- 8. AI Data Scientist Agent & Autonomous Multi-Dataset EDA ---

class CompareRequest(BaseModel):
    dataset_ids: List[str]

class EDAAskRequest(BaseModel):
    question: str

@app.get("/api/eda/catalog")
def get_eda_catalog():
    return DatasetRegistry.get_catalog()

@app.post("/api/dataset/{dataset_id}/auto-eda")
@app.post("/api/datasets/{dataset_id}/auto-eda")
async def trigger_auto_eda(dataset_id: str, force_refresh: bool = Query(False)):
    job_id = str(uuid.uuid4())
    # Execute single EDA generation
    report = await EDAAgentService.generate_single_eda(dataset_id, force_refresh=force_refresh)
    return {
        "job_id": job_id,
        "dataset_id": dataset_id,
        "status": "completed",
        "report": report
    }

@app.get("/api/dataset/{dataset_id}/auto-eda")
@app.get("/api/datasets/{dataset_id}/auto-eda")
async def get_auto_eda(dataset_id: str):
    report = await EDAAgentService.generate_single_eda(dataset_id, force_refresh=False)
    return report

@app.post("/api/eda/compare")
def compare_datasets_endpoint(req: CompareRequest):
    try:
        return EDAAgentService.compare_datasets(req.dataset_ids)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/eda/ask")
def ask_portfolio_endpoint(req: EDAAskRequest):
    try:
        return EDAAgentService.ask_portfolio(req.question)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/dataset/{dataset_id}/export-filtered")
@app.get("/api/datasets/{dataset_id}/export-filtered")
def export_filtered_dataset(
    dataset_id: str,
    search: Optional[str] = Query(None),
    format: str = Query("csv") # csv or json
):
    df = get_df_by_id(dataset_id)
    record = get_dataset_record(dataset_id)
    
    # Apply search filter if provided
    if search:
        search_str = str(search).lower()
        mask = df.astype(str).apply(lambda row: row.str.lower().str.contains(search_str, regex=False).any(), axis=1)
        df = df[mask]

    base_name = os.path.splitext(record["filename"])[0]
    suffix = "_filtered" if search else "_full"
    
    if format.lower() == "json":
        export_filename = f"{base_name}{suffix}.json"
        export_path = os.path.join(UPLOAD_DIR, export_filename)
        df.to_json(export_path, orient="records", indent=2)
        return FileResponse(export_path, media_type="application/json", filename=export_filename)
    else:
        export_filename = f"{base_name}{suffix}.csv"
        export_path = os.path.join(UPLOAD_DIR, export_filename)
        df.to_csv(export_path, index=False)
        return FileResponse(export_path, media_type="text/csv", filename=export_filename)

@app.get("/api/dataset/{dataset_id}/export-eda")
@app.get("/api/datasets/{dataset_id}/export-eda")
async def export_eda_report(
    dataset_id: str,
    format: str = Query("markdown") # markdown or json
):
    report = await EDAAgentService.generate_single_eda(dataset_id, force_refresh=False)
    record = get_dataset_record(dataset_id)
    base_name = os.path.splitext(record["filename"])[0]

    if format.lower() == "json":
        filename = f"{base_name}_eda_dossier.json"
        file_path = os.path.join(REPORT_DIR, filename)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(report.model_dump_json(indent=2))
        return FileResponse(file_path, media_type="application/json", filename=filename)
    else:
        filename = f"{base_name}_eda_dossier.md"
        file_path = os.path.join(REPORT_DIR, filename)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(f"# Automated EDA Dossier — {record['name']}\n")
            f.write(f"> Generated by InsightPilot AI | Content Hash: {report.content_hash[:16]} | Quality Score: {report.quality_score}/100\n\n")
            f.write(report.narrative)
        return FileResponse(file_path, media_type="text/markdown", filename=filename)

# Legacy compatibility endpoints
@app.get("/api/dataset/{dataset_id}/preview")
def legacy_preview(dataset_id: str, page: int = 1, page_size: int = 50, search: Optional[str] = None):
    return dataset_preview(dataset_id, page, page_size, search)

@app.get("/api/dataset/{dataset_id}/profile")
def legacy_profile(dataset_id: str):
    return dataset_profile(dataset_id)

@app.post("/api/dataset/{dataset_id}/ask")
def legacy_ask(dataset_id: str, req: AskQueryRequest):
    return ask_question(dataset_id, req)

@app.post("/api/dataset/{dataset_id}/chart")
def legacy_chart(dataset_id: str, req: ChartRequest):
    return create_chart(dataset_id, req)

@app.post("/api/dataset/{dataset_id}/train-model")
def legacy_train(dataset_id: str, req: TrainModelRequest):
    return train_model(dataset_id, req)

@app.get("/api/dataset/{dataset_id}/model-results")
def legacy_results(dataset_id: str):
    return get_model_results(dataset_id)

@app.post("/api/dataset/{dataset_id}/predict")
def legacy_predict(dataset_id: str, req: PredictRequest):
    return predict_model(dataset_id, req)

@app.post("/api/dataset/{dataset_id}/generate-report")
def legacy_report(dataset_id: str):
    return generate_report(dataset_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

