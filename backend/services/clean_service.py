import os
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional

class CleanService:
    @staticmethod
    def clean_dataset(
        df: pd.DataFrame,
        dataset_id: str,
        output_dir: str,
        remove_duplicates: bool = True,
        missing_strategy: str = "impute_median",  # "drop", "impute_median", "impute_mean", "impute_constant", "none"
        outlier_strategy: str = "clip_iqr",      # "none", "clip_iqr", "drop"
    ) -> Dict[str, Any]:
        initial_rows = len(df)
        initial_cols = len(df.columns)
        initial_missing = int(df.isna().sum().sum())
        initial_dups = int(df.duplicated().sum())

        cleaned_df = df.copy()

        # 1. Duplicate handling
        dups_removed = 0
        if remove_duplicates and initial_dups > 0:
            cleaned_df = cleaned_df.drop_duplicates()
            dups_removed = initial_rows - len(cleaned_df)

        numeric_cols = cleaned_df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = cleaned_df.select_dtypes(exclude=[np.number]).columns.tolist()

        # 2. Missing value handling
        if missing_strategy == "drop":
            cleaned_df = cleaned_df.dropna()
        elif missing_strategy == "impute_median":
            for c in numeric_cols:
                if cleaned_df[c].isna().sum() > 0:
                    cleaned_df[c] = cleaned_df[c].fillna(cleaned_df[c].median())
            for c in categorical_cols:
                if cleaned_df[c].isna().sum() > 0:
                    mode_val = cleaned_df[c].mode()
                    fill_val = mode_val[0] if len(mode_val) > 0 else "Unknown"
                    cleaned_df[c] = cleaned_df[c].fillna(fill_val)
        elif missing_strategy == "impute_mean":
            for c in numeric_cols:
                if cleaned_df[c].isna().sum() > 0:
                    cleaned_df[c] = cleaned_df[c].fillna(cleaned_df[c].mean())
            for c in categorical_cols:
                if cleaned_df[c].isna().sum() > 0:
                    mode_val = cleaned_df[c].mode()
                    fill_val = mode_val[0] if len(mode_val) > 0 else "Unknown"
                    cleaned_df[c] = cleaned_df[c].fillna(fill_val)
        elif missing_strategy == "impute_constant":
            for c in numeric_cols:
                cleaned_df[c] = cleaned_df[c].fillna(0)
            for c in categorical_cols:
                cleaned_df[c] = cleaned_df[c].fillna("Missing")

        # 3. Outlier handling
        outliers_modified = 0
        if outlier_strategy == "clip_iqr" and numeric_cols:
            for c in numeric_cols:
                s = cleaned_df[c].dropna()
                if len(s) > 10:
                    q1 = s.quantile(0.25)
                    q3 = s.quantile(0.75)
                    iqr = q3 - q1
                    low = q1 - 1.5 * iqr
                    high = q3 + 1.5 * iqr
                    outliers_mask = (cleaned_df[c] < low) | (cleaned_df[c] > high)
                    outliers_modified += int(outliers_mask.sum())
                    cleaned_df[c] = cleaned_df[c].clip(lower=low, upper=high)

        elif outlier_strategy == "drop" and numeric_cols:
            for c in numeric_cols:
                s = cleaned_df[c].dropna()
                if len(s) > 10:
                    mean = s.mean()
                    std = s.std()
                    if std > 0:
                        z_scores = ((cleaned_df[c] - mean) / std).abs()
                        cleaned_df = cleaned_df[z_scores <= 3.0]

        final_rows = len(cleaned_df)
        final_missing = int(cleaned_df.isna().sum().sum())

        os.makedirs(output_dir, exist_ok=True)
        cleaned_filename = f"cleaned_{dataset_id}.csv"
        cleaned_path = os.path.join(output_dir, cleaned_filename)
        cleaned_df.to_csv(cleaned_path, index=False)

        return {
            "dataset_id": dataset_id,
            "cleaned_file_path": cleaned_path,
            "cleaned_filename": cleaned_filename,
            "metrics": {
                "initial_rows": initial_rows,
                "final_rows": final_rows,
                "rows_removed": initial_rows - final_rows,
                "duplicates_removed": dups_removed,
                "missing_values_handled": initial_missing - final_missing,
                "remaining_missing": final_missing,
                "outliers_adjusted": outliers_modified
            }
        }
