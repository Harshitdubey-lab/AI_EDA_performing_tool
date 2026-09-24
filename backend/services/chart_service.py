import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

class ChartService:
    @staticmethod
    def generate_chart(
        df: pd.DataFrame,
        chart_type: str,
        x_col: str,
        y_col: Optional[str] = None,
        aggregation: str = "sum",
        group_by: Optional[str] = None,
        limit: int = 25
    ) -> Dict[str, Any]:
        chart_type = chart_type.lower()
        if x_col not in df.columns:
            raise ValueError(f"Column '{x_col}' does not exist in dataset.")
        if y_col and y_col not in df.columns:
            raise ValueError(f"Column '{y_col}' does not exist in dataset.")

        clean_df = df.copy()

        # 1. Histogram
        if chart_type == "histogram":
            series = pd.to_numeric(clean_df[x_col], errors='coerce').dropna()
            if len(series) == 0:
                return {"type": "histogram", "data": [], "x": x_col, "y": "count"}
            
            # Use Freedman-Diaconis or Sturges rule for bins
            counts, bin_edges = np.histogram(series, bins=15)
            chart_data = []
            for i in range(len(counts)):
                label = f"{round(bin_edges[i], 1)} - {round(bin_edges[i+1], 1)}"
                chart_data.append({
                    "bin": label,
                    "count": int(counts[i]),
                    "range_start": round(bin_edges[i], 2),
                    "range_end": round(bin_edges[i+1], 2)
                })
            return {
                "type": "histogram",
                "data": chart_data,
                "x_key": "bin",
                "y_key": "count",
                "title": f"Distribution of {x_col}"
            }

        # 2. Boxplot
        elif chart_type == "boxplot":
            series = pd.to_numeric(clean_df[x_col], errors='coerce').dropna()
            if len(series) == 0:
                return {"type": "boxplot", "data": {}}
            
            q1 = float(series.quantile(0.25))
            med = float(series.median())
            q3 = float(series.quantile(0.75))
            iqr = q3 - q1
            low_whisker = float(series[series >= q1 - 1.5 * iqr].min()) if len(series[series >= q1 - 1.5 * iqr]) > 0 else q1
            high_whisker = float(series[series <= q3 + 1.5 * iqr].max()) if len(series[series <= q3 + 1.5 * iqr]) > 0 else q3
            outliers = series[(series < low_whisker) | (series > high_whisker)].tolist()

            return {
                "type": "boxplot",
                "x_key": x_col,
                "data": [{
                    "feature": x_col,
                    "min": round(float(series.min()), 2),
                    "lower_whisker": round(low_whisker, 2),
                    "q1": round(q1, 2),
                    "median": round(med, 2),
                    "q3": round(q3, 2),
                    "upper_whisker": round(high_whisker, 2),
                    "max": round(float(series.max()), 2),
                    "outliers_count": len(outliers)
                }],
                "title": f"Boxplot Summary for {x_col}"
            }

        # 3. Scatter Plot
        elif chart_type == "scatter":
            if not y_col:
                raise ValueError("Scatter plot requires both X and Y columns.")
            scatter_df = clean_df[[x_col, y_col]].dropna()
            if group_by and group_by in clean_df.columns:
                scatter_df[group_by] = clean_df[group_by]
            
            # Limit points to avoid browser lag on massive datasets
            if len(scatter_df) > 300:
                scatter_df = scatter_df.sample(300, random_state=42)
            
            data = []
            for _, row in scatter_df.iterrows():
                pt = {
                    "x": float(row[x_col]) if pd.api.types.is_numeric_dtype(scatter_df[x_col]) else str(row[x_col]),
                    "y": float(row[y_col]) if pd.api.types.is_numeric_dtype(scatter_df[y_col]) else str(row[y_col]),
                }
                if group_by and group_by in row:
                    pt["group"] = str(row[group_by])
                data.append(pt)

            return {
                "type": "scatter",
                "data": data,
                "x_key": "x",
                "y_key": "y",
                "x_label": x_col,
                "y_label": y_col,
                "title": f"{y_col} vs {x_col}"
            }

        # 4. Bar, Line, Pie Charts with Aggregations
        else:
            if not y_col:
                # Value counts of x_col
                counts = clean_df[x_col].value_counts().head(limit)
                data = [{"name": str(k), "value": int(v)} for k, v in counts.items()]
                return {
                    "type": chart_type,
                    "data": data,
                    "x_key": "name",
                    "y_key": "value",
                    "title": f"Frequency Count of {x_col}"
                }
            else:
                agg_map = {
                    "sum": "sum",
                    "mean": "mean",
                    "average": "mean",
                    "count": "count",
                    "min": "min",
                    "max": "max",
                    "median": "median"
                }
                agg_func = agg_map.get(aggregation.lower(), "sum")

                # Ensure y_col is numeric for mathematical aggregations
                if agg_func != "count":
                    clean_df[y_col] = pd.to_numeric(clean_df[y_col], errors='coerce')
                
                grouped = clean_df.groupby(x_col)[y_col].agg(agg_func).reset_index()
                grouped = grouped.sort_values(by=y_col, ascending=False).head(limit)
                
                data = []
                for _, row in grouped.iterrows():
                    val = row[y_col]
                    clean_val = round(float(val), 2) if isinstance(val, (int, float, np.number)) and not np.isnan(val) else 0.0
                    data.append({
                        "name": str(row[x_col]),
                        "value": clean_val
                    })

                return {
                    "type": chart_type,
                    "data": data,
                    "x_key": "name",
                    "y_key": "value",
                    "aggregation": agg_func,
                    "title": f"{agg_func.capitalize()} of {y_col} by {x_col}"
                }
