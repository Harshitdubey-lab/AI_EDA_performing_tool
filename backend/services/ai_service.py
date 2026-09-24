import re
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from .chart_service import ChartService

class AIService:
    @staticmethod
    def get_suggested_questions(df: pd.DataFrame) -> List[str]:
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

        suggestions = [
            "Provide a comprehensive data health and quality summary.",
        ]

        if numeric_cols and categorical_cols:
            cat = categorical_cols[0]
            num = numeric_cols[0]
            suggestions.append(f"Which {cat} generates the highest average {num}?")
            suggestions.append(f"Show a bar chart comparing {num} across different {cat}.")

        if len(numeric_cols) >= 2:
            suggestions.append(f"What is the correlation between {numeric_cols[0]} and {numeric_cols[1]}?")
            suggestions.append(f"Are there any statistical outliers in {numeric_cols[0]}?")

        if categorical_cols:
            suggestions.append(f"What is the percentage distribution of {categorical_cols[0]}?")

        return suggestions[:5]

    @classmethod
    def answer_query(cls, df: pd.DataFrame, question: str) -> Dict[str, Any]:
        q_lower = question.lower().strip()
        cols = list(df.columns)
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

        # Helper to find referenced column names in question
        matched_cols = []
        for c in cols:
            # Check exact, snake_case, or camelCase spaced match
            c_spaced = re.sub(r'([a-z])([A-Z])', r'\1 \2', c).lower()
            c_snake = c.lower().replace("_", " ")
            if c_spaced in q_lower or c_snake in q_lower or c.lower() in q_lower:
                matched_cols.append(c)

        # 1. DATA HEALTH / OVERVIEW
        if any(w in q_lower for w in ["health", "quality", "missing", "null", "clean", "overview", "summary", "shape", "rows"]):
            total_rows, total_cols = df.shape
            total_missing = int(df.isna().sum().sum())
            dups = int(df.duplicated().sum())
            missing_cols = [c for c in cols if df[c].isna().sum() > 0]
            
            answer = (
                f"### 📋 Dataset Overview & Quality Assessment\n\n"
                f"- **Total Observations**: `{total_rows:,}` rows\n"
                f"- **Total Dimensions**: `{total_cols}` columns ({len(num_cols)} numerical, {len(cat_cols)} categorical)\n"
                f"- **Duplicate Records**: `{dups}` rows\n"
                f"- **Total Missing Cells**: `{total_missing}`\n\n"
            )

            if missing_cols:
                answer += "**Columns with Missing Values:**\n"
                for mc in missing_cols:
                    cnt = int(df[mc].isna().sum())
                    pct = round((cnt / total_rows) * 100, 1)
                    answer += f"- `{mc}`: {cnt} missing ({pct}%)\n"
                answer += "\n💡 **Recommendation**: For machine learning, use median imputation for numeric features and mode/most-frequent imputation for categorical columns."
            else:
                answer += "✅ **Data Completeness**: No missing values detected across all columns. The dataset is well-structured for modeling."

            return {
                "answer": answer,
                "chart": None,
                "referenced_columns": missing_cols[:3]
            }

        # 2. OUTLIER DETECTION
        if any(w in q_lower for w in ["outlier", "outliers", "anomaly", "extreme"]):
            target_num = matched_cols[0] if (matched_cols and matched_cols[0] in num_cols) else (num_cols[0] if num_cols else None)
            if not target_num:
                return {
                    "answer": "⚠️ Outlier analysis requires at least one numerical column in the dataset, but none were identified or matched.",
                    "chart": None
                }

            s = pd.to_numeric(df[target_num], errors='coerce').dropna()
            q1 = float(s.quantile(0.25))
            med = float(s.median())
            q3 = float(s.quantile(0.75))
            iqr = q3 - q1
            low = q1 - 1.5 * iqr
            high = q3 + 1.5 * iqr
            outliers = s[(s < low) | (s > high)]
            pct = round((len(outliers) / len(s)) * 100, 2)

            answer = (
                f"### 🔍 Outlier Analysis for `{target_num}`\n\n"
                f"- **Valid Samples**: `{len(s):,}`\n"
                f"- **Median Value**: `{med:,.2f}` (IQR: `{iqr:,.2f}`)\n"
                f"- **Normal Boundary [Tukey's IQR Rule]**: `{low:,.2f}` to `{high:,.2f}`\n"
                f"- **Detected Outliers**: `{len(outliers):,}` records (`{pct}%` of data)\n\n"
            )

            if len(outliers) > 0:
                answer += (
                    f"Highest outlier value observed: `{float(outliers.max()):,.2f}`.\n\n"
                    f"💡 **Recommendation**: If building linear models or regression, consider log-transforming `{target_num}` or capping values at the 99th percentile to prevent high-leverage distortion."
                )
            else:
                answer += "✅ No extreme statistical anomalies detected in this feature."

            chart = ChartService.generate_chart(df, "boxplot", target_num)

            return {
                "answer": answer,
                "chart": chart,
                "referenced_columns": [target_num]
            }

        # 3. CORRELATION QUERY
        if any(w in q_lower for w in ["correlat", "relation", "associated", "relationship"]):
            num_matched = [c for c in matched_cols if c in num_cols]
            if len(num_matched) < 2 and len(num_cols) >= 2:
                # Pick top correlated pair from numeric columns
                corr_sub = df[num_cols].dropna().corr()
                np.fill_diagonal(corr_sub.values, 0)
                max_pair = corr_sub.abs().stack().idxmax()
                num_matched = list(max_pair)

            if len(num_matched) >= 2:
                col1, col2 = num_matched[0], num_matched[1]
                s1 = pd.to_numeric(df[col1], errors='coerce')
                s2 = pd.to_numeric(df[col2], errors='coerce')
                valid = pd.DataFrame({col1: s1, col2: s2}).dropna()
                val = float(valid[col1].corr(valid[col2]))

                strength = "strong positive" if val > 0.6 else ("moderate positive" if val > 0.3 else ("moderate negative" if val < -0.3 else ("strong negative" if val < -0.6 else "weak/negligible")))
                
                answer = (
                    f"### 📈 Correlation Analysis: `{col1}` vs `{col2}`\n\n"
                    f"- **Pearson Correlation Coefficient**: `r = {val:.3f}`\n"
                    f"- **Relationship Strength**: **{strength.capitalize()}**\n\n"
                    f"**Statistical Interpretation**:\n"
                )
                if val > 0.3:
                    answer += f"As `{col1}` increases, `{col2}` tends to systematically increase as well.\n\n"
                elif val < -0.3:
                    answer += f"As `{col1}` increases, `{col2}` tends to decrease (inverse relationship).\n\n"
                else:
                    answer += f"There is virtually no linear association between `{col1}` and `{col2}`.\n\n"

                answer += f"💡 **Data Science Note**: Correlation does not imply causation. In predictive modeling, high correlation between input features (r > 0.85) indicates multicollinearity."

                chart = ChartService.generate_chart(df, "scatter", col1, col2)
                return {
                    "answer": answer,
                    "chart": chart,
                    "referenced_columns": [col1, col2]
                }

        # 4. DISTRIBUTION / HISTOGRAM
        if any(w in q_lower for w in ["distribution", "histogram", "spread", "density", "range"]):
            target = matched_cols[0] if matched_cols else (num_cols[0] if num_cols else None)
            if target and target in num_cols:
                s = pd.to_numeric(df[target], errors='coerce').dropna()
                answer = (
                    f"### 📊 Distribution of `{target}`\n\n"
                    f"- **Count**: `{len(s):,}`\n"
                    f"- **Mean**: `{float(s.mean()):,.2f}` | **Std Dev**: `{float(s.std()):,.2f}`\n"
                    f"- **Min**: `{float(s.min()):,.2f}` | **Max**: `{float(s.max()):,.2f}`\n"
                    f"- **Skewness**: `{float(s.skew()):.2f}` " + ("(Right-skewed)" if s.skew() > 0.5 else ("(Left-skewed)" if s.skew() < -0.5 else "(Fairly symmetric)")) + "\n\n"
                    f"Below is the binned histogram distribution."
                )
                chart = ChartService.generate_chart(df, "histogram", target)
                return {
                    "answer": answer,
                    "chart": chart,
                    "referenced_columns": [target]
                }

        # 5. RANKING & AGGREGATION (e.g., "highest", "top", "average", "breakdown", "by")
        target_cat = next((c for c in matched_cols if c in cat_cols), None)
        target_num = next((c for c in matched_cols if c in num_cols), None)

        if not target_cat and cat_cols:
            target_cat = cat_cols[0]
        if not target_num and num_cols:
            target_num = num_cols[0]

        if target_cat and target_num:
            agg_type = "mean" if any(w in q_lower for w in ["average", "avg", "mean"]) else "sum"
            grouped = df.groupby(target_cat)[target_num].agg(agg_type).dropna().sort_values(ascending=False).head(5)
            
            top_name = grouped.index[0]
            top_val = grouped.iloc[0]

            answer = (
                f"### 🏆 Breakdown: `{agg_type.capitalize()} of {target_num}` by `{target_cat}`\n\n"
                f"- **Top Performer**: **`{top_name}`** with `{top_val:,.2f}`\n\n"
                f"**Top Categories Ranked:**\n"
            )
            for idx, (cat_name, v) in enumerate(grouped.items(), 1):
                answer += f"{idx}. **{cat_name}**: `{v:,.2f}`\n"

            answer += f"\n💡 **Business Insight**: `{top_name}` represents the highest volume of `{target_num}`. Targeted strategies or optimizations should prioritize this segment."

            chart = ChartService.generate_chart(df, "bar", target_cat, target_num, aggregation=agg_type, limit=8)
            return {
                "answer": answer,
                "chart": chart,
                "referenced_columns": [target_cat, target_num]
            }

        # 6. FALLBACK / GENERAL COLUMN INQUIRY
        if matched_cols:
            col = matched_cols[0]
            s = df[col]
            if col in num_cols:
                answer = (
                    f"### ℹ️ Statistical Summary for `{col}`\n\n"
                    f"- **Mean**: `{float(s.mean()):,.2f}`\n"
                    f"- **Median**: `{float(s.median()):,.2f}`\n"
                    f"- **Min / Max**: `{float(s.min()):,.2f}` / `{float(s.max()):,.2f}`\n"
                    f"- **Missing**: `{int(s.isna().sum())}` records\n"
                )
                chart = ChartService.generate_chart(df, "histogram", col)
            else:
                top_v = s.value_counts().head(5)
                answer = f"### ℹ️ Categorical Overview for `{col}`\n\n"
                for k, v in top_v.items():
                    answer += f"- **{k}**: {v:,} occurrences ({round(v/len(df)*100, 1)}%)\n"
                chart = ChartService.generate_chart(df, "pie", col)

            return {
                "answer": answer,
                "chart": chart,
                "referenced_columns": [col]
            }

        # Insufficient data / no matching column
        available_str = ", ".join([f"`{c}`" for c in cols[:8]])
        return {
            "answer": (
                f"I analyzed your request against the uploaded dataset, but could not identify specific columns corresponding to your query.\n\n"
                f"**Available Columns in Dataset:**\n{available_str}{'...' if len(cols) > 8 else ''}\n\n"
                f"💡 Try asking: *'What is the distribution of {num_cols[0] if num_cols else cols[0]}?'* or *'Show average {num_cols[0] if num_cols else 'values'} by {cat_cols[0] if cat_cols else cols[0]}'*"
            ),
            "chart": None,
            "referenced_columns": []
        }
