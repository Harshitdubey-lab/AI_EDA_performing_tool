import os
from datetime import datetime
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from .data_service import DataService
from .ml_service import MLService

class ReportService:
    @staticmethod
    def generate_report(dataset_id: str, dataset_name: str, df: pd.DataFrame) -> Dict[str, Any]:
        profile = DataService.profile_dataset(df)
        total_rows = profile["shape"]["rows"]
        total_cols = profile["shape"]["columns"]
        quality_score = profile["quality_score"]

        # Generate Key Insights
        insights = []
        # Insight 1: Data Health
        if profile["missing_cells"] == 0:
            insights.append({
                "type": "positive",
                "title": "High Data Integrity",
                "detail": f"Dataset contains {total_rows:,} records across {total_cols} columns with zero missing values, providing a robust statistical sample."
            })
        else:
            insights.append({
                "type": "warning",
                "title": "Missing Values Identified",
                "detail": f"{profile['missing_cells']:,} missing cells detected ({profile['missing_cells_percentage']}%), requiring automated median/mode imputation prior to modeling."
            })

        # Insight 2: Outliers
        high_outliers = [c for c, o in profile["outlier_summary"].items() if o["percentage"] > 2.0]
        if high_outliers:
            insights.append({
                "type": "warning",
                "title": "Heavy-Tail Outliers",
                "detail": f"Noticeable outlier concentrations detected in columns {', '.join([f'`{c}`' for c in high_outliers[:3]])}. Tree-based algorithms or robust scaling are recommended."
            })
        else:
            insights.append({
                "type": "positive",
                "title": "Standard Value Distributions",
                "detail": "Numerical features show bounded variance with minimal extreme tail outliers."
            })

        # Insight 3: Top correlations
        if profile["correlation_matrix"]["columns"]:
            corrs = []
            num_cols = profile["correlation_matrix"]["columns"]
            for row in profile["correlation_matrix"]["matrix"]:
                feat = row["feature"]
                for c in num_cols:
                    if c != feat and row[c] != 0:
                        corrs.append((feat, c, row[c], abs(row[c])))
            corrs = sorted(corrs, key=lambda x: x[3], reverse=True)
            if corrs:
                top_pair = corrs[0]
                insights.append({
                    "type": "info",
                    "title": "Primary Driver Correlation",
                    "detail": f"Strongest observed linear relationship exists between `{top_pair[0]}` and `{top_pair[1]}` with a Pearson coefficient of r = {top_pair[2]:.2f}."
                })

        # Check for trained ML models
        ml_info = MLService._trained_pipelines.get(dataset_id)
        ml_summary = None
        if ml_info:
            ml_summary = {
                "best_model": ml_info["best_model_name"],
                "target_column": ml_info["target_col"],
                "task_type": ml_info["task_type"],
                "top_features": ml_info.get("feature_importance", [])[:5],
                "benchmarks": ml_info.get("results", [])
            }

        # Strategic Recommendations
        recommendations = [
            "Maintain continuous data profiling to detect schema drift and null value spikes in production pipelines.",
            "Deploy tree-based ensemble architectures (e.g. Random Forest / Gradient Boosting) to leverage non-linear feature interactions without distortion from residual outliers."
        ]
        if ml_summary:
            recommendations.append(
                f"The best performing architecture was '{ml_summary['best_model']}' targeting '{ml_summary['target_column']}'. Use this pipeline for operational batch scoring."
            )

        report_payload = {
            "title": f"InsightPilot Analytics Dossier: {dataset_name}",
            "generated_at": datetime.now().strftime("%B %d, %Y - %H:%M UTC"),
            "dataset_name": dataset_name,
            "quality_score": quality_score,
            "metrics": {
                "total_rows": total_rows,
                "total_columns": total_cols,
                "numerical_features": profile["shape"]["numeric_columns_count"],
                "categorical_features": profile["shape"]["categorical_columns_count"],
                "duplicate_rows": profile["duplicate_rows"]
            },
            "insights": insights,
            "ml_summary": ml_summary,
            "recommendations": recommendations
        }

        return report_payload
