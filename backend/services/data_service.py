import os
import math
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

class DataService:
    @staticmethod
    def load_dataset(file_path: str) -> pd.DataFrame:
        ext = os.path.splitext(file_path)[1].lower()
        if ext in ['.xlsx', '.xls']:
            return pd.read_excel(file_path)
        elif ext == '.tsv':
            return pd.read_csv(file_path, sep='\t')
        else:
            try:
                return pd.read_csv(file_path)
            except Exception:
                return pd.read_csv(file_path, encoding='latin1')

    @staticmethod
    def get_preview(df: pd.DataFrame, page: int = 1, page_size: int = 20, search: Optional[str] = None) -> Dict[str, Any]:
        temp_df = df.copy()
        if search:
            search_str = str(search).lower()
            mask = temp_df.astype(str).apply(lambda row: row.str.lower().str.contains(search_str, regex=False).any(), axis=1)
            temp_df = temp_df[mask]

        total_rows = len(temp_df)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        sliced = temp_df.iloc[start_idx:end_idx]

        # Convert NaNs to None for clean JSON serialization
        clean_records = sliced.replace({np.nan: None}).to_dict(orient='records')
        
        return {
            "total_rows": total_rows,
            "page": page,
            "page_size": page_size,
            "total_pages": math.ceil(total_rows / page_size) if page_size > 0 else 1,
            "columns": list(df.columns),
            "data": clean_records
        }

    @staticmethod
    def profile_dataset(df: pd.DataFrame) -> Dict[str, Any]:
        total_rows, total_cols = df.shape
        duplicate_count = int(df.duplicated().sum())

        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

        column_profiles: List[Dict[str, Any]] = []
        outlier_summary: Dict[str, Any] = {}
        stats_summary: Dict[str, Any] = {}

        total_missing_cells = 0
        total_cells = total_rows * total_cols if total_cols > 0 else 1

        for col in df.columns:
            series = df[col]
            missing_count = int(series.isna().sum())
            total_missing_cells += missing_count
            missing_pct = round((missing_count / total_rows) * 100, 2) if total_rows > 0 else 0
            unique_count = int(series.nunique(dropna=True))

            is_numeric = col in numeric_cols
            col_type = str(series.dtype)

            sample_vals = series.dropna().unique()[:5].tolist()
            # Ensure serializable sample values
            sample_vals = [str(x) if isinstance(x, (pd.Timestamp, np.datetime64)) else (float(x) if isinstance(x, (np.floating, float)) else (int(x) if isinstance(x, (np.integer, int)) else str(x))) for x in sample_vals]

            col_meta = {
                "name": col,
                "type": "numeric" if is_numeric else "categorical",
                "dtype": col_type,
                "missing_count": missing_count,
                "missing_percentage": missing_pct,
                "unique_count": unique_count,
                "sample_values": sample_vals
            }

            if is_numeric:
                clean_num = series.dropna()
                if len(clean_num) > 0:
                    q1 = float(clean_num.quantile(0.25))
                    median = float(clean_num.median())
                    q3 = float(clean_num.quantile(0.75))
                    iqr = q3 - q1
                    lower_bound = q1 - 1.5 * iqr
                    upper_bound = q3 + 1.5 * iqr

                    outliers = clean_num[(clean_num < lower_bound) | (clean_num > upper_bound)]
                    outlier_count = int(len(outliers))
                    outlier_pct = round((outlier_count / len(clean_num)) * 100, 2)

                    col_meta["stats"] = {
                        "min": round(float(clean_num.min()), 4),
                        "q1": round(q1, 4),
                        "median": round(median, 4),
                        "q3": round(q3, 4),
                        "max": round(float(clean_num.max()), 4),
                        "mean": round(float(clean_num.mean()), 4),
                        "std": round(float(clean_num.std()), 4) if len(clean_num) > 1 else 0.0,
                        "skewness": round(float(clean_num.skew()), 4) if len(clean_num) > 2 else 0.0
                    }

                    col_meta["outliers"] = {
                        "count": outlier_count,
                        "percentage": outlier_pct,
                        "lower_bound": round(lower_bound, 4),
                        "upper_bound": round(upper_bound, 4)
                    }

                    outlier_summary[col] = col_meta["outliers"]
                    stats_summary[col] = col_meta["stats"]
                else:
                    col_meta["stats"] = None
                    col_meta["outliers"] = None
            else:
                # Value counts for top categories
                top_counts = series.value_counts(dropna=True).head(5)
                col_meta["top_categories"] = [
                    {"value": str(k), "count": int(v), "percentage": round((int(v) / total_rows) * 100, 1)}
                    for k, v in top_counts.items()
                ]

            column_profiles.append(col_meta)

        # Pearson Correlation Matrix for numeric features
        correlation_matrix: Dict[str, Any] = {"columns": [], "matrix": []}
        if len(numeric_cols) >= 2:
            num_df = df[numeric_cols].dropna()
            if len(num_df) > 1:
                corr = num_df.corr(method='pearson').round(3)
                correlation_matrix["columns"] = list(corr.columns)
                matrix_data = []
                for row_col in corr.index:
                    row_data = {"feature": row_col}
                    for target_col in corr.columns:
                        val = corr.loc[row_col, target_col]
                        row_data[target_col] = 0.0 if np.isnan(val) else float(val)
                    matrix_data.append(row_data)
                correlation_matrix["matrix"] = matrix_data

        # Overall Data Quality Score (0 - 100)
        completeness = max(0.0, 100.0 - (total_missing_cells / total_cells * 100))
        duplicate_penalty = min(20.0, (duplicate_count / total_rows * 100)) if total_rows > 0 else 0
        quality_score = round(max(10.0, completeness * 0.85 - duplicate_penalty + 15), 1)

        return {
            "shape": {
                "rows": total_rows,
                "columns": total_cols,
                "numeric_columns_count": len(numeric_cols),
                "categorical_columns_count": len(categorical_cols)
            },
            "quality_score": min(100.0, quality_score),
            "duplicate_rows": duplicate_count,
            "missing_cells": total_missing_cells,
            "missing_cells_percentage": round((total_missing_cells / total_cells) * 100, 2),
            "numeric_columns": numeric_cols,
            "categorical_columns": categorical_cols,
            "columns": column_profiles,
            "stats_summary": stats_summary,
            "outlier_summary": outlier_summary,
            "correlation_matrix": correlation_matrix
        }
