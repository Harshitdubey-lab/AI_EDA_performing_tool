import os
import re
import math
import json
import uuid
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional, Set, Tuple
from pydantic import BaseModel, Field

try:
    from backend.core.dataset_registry import DatasetRegistry
except ImportError:
    from core.dataset_registry import DatasetRegistry

# Pydantic Schemas for Structured Data Payloads
class ColumnStatsPayload(BaseModel):
    name: str
    type: str
    dtype: str
    missing_count: int
    missing_percentage: float
    unique_count: int
    sample_values: List[Any] = []
    min: Optional[float] = None
    q1: Optional[float] = None
    median: Optional[float] = None
    q3: Optional[float] = None
    max: Optional[float] = None
    mean: Optional[float] = None
    std: Optional[float] = None
    skewness: Optional[float] = None
    outlier_count: Optional[int] = None
    outlier_percentage: Optional[float] = None
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None
    top_categories: Optional[List[Dict[str, Any]]] = None

class DatasetStatsPayload(BaseModel):
    dataset_id: str
    dataset_name: str
    filename: str
    content_hash: str
    total_rows: int
    total_columns: int
    numeric_columns_count: int
    categorical_columns_count: int
    quality_score: float
    duplicate_rows: int
    missing_cells: int
    missing_cells_percentage: float
    numeric_columns: List[str]
    categorical_columns: List[str]
    columns: List[ColumnStatsPayload]
    top_correlations: List[Dict[str, Any]] = []

class AutoEDAReport(BaseModel):
    dataset_id: str
    dataset_name: str
    content_hash: str
    generated_at: str
    status: str
    narrative: str
    quality_score: float
    readiness_tier: str
    key_findings: List[str]
    recommendations: List[str]
    hallucination_checks: Dict[str, Any]
    from_cache: bool = False

class EDAAgentService:
    """
    Proactive AI Data Scientist & Autonomous EDA Agent.
    Implements a strict two-pass zero-hallucination verification engine.
    """
    _report_cache: Dict[Tuple[str, str], AutoEDAReport] = {}
    _job_status: Dict[str, Dict[str, Any]] = {}

    SYSTEM_PROMPT = """You are InsightPilot AI's Senior Principal Data Scientist and Autonomous EDA Agent.
Your objective is to produce a rigorous, exhaustive, zero-hallucination Exploratory Data Analysis & Strategic Modeling Dossier based STRICTLY on the computed dataset statistics payload provided below.

RULES:
1. Every numerical statistic, metric, percentage, sample count, mean, median, IQR boundary, or correlation value cited in your narrative MUST come directly and exactly from the input payload.
2. DO NOT fabricate or extrapolate unprovided numerical data. If a specific metric or pattern is absent, explicitly state that it is not available in the calculated profile.
3. Structure your response into exactly the following 5 analytical sections using clear markdown headings:
   # 1. Executive Summary & Data Health Diagnostics
   # 2. Feature Distributions, Variances & Outlier Analysis
   # 3. Multivariable Relationships & Correlation Structure
   # 4. Machine Learning Feasibility & Target Candidate Recommendations
   # 5. Prescriptive Next Steps & Production Pipeline Directives
4. Write with executive precision, statistical rigor, and actionable business framing."""

    @classmethod
    def build_stats_payload(cls, profile: Dict[str, Any]) -> DatasetStatsPayload:
        columns_payload = []
        for c in profile.get("columns", []):
            stats = c.get("stats") or {}
            outliers = c.get("outliers") or {}
            col_obj = ColumnStatsPayload(
                name=c["name"],
                type=c["type"],
                dtype=c["dtype"],
                missing_count=c["missing_count"],
                missing_percentage=c["missing_percentage"],
                unique_count=c["unique_count"],
                sample_values=c.get("sample_values", [])[:5],
                min=stats.get("min"),
                q1=stats.get("q1"),
                median=stats.get("median"),
                q3=stats.get("q3"),
                max=stats.get("max"),
                mean=stats.get("mean"),
                std=stats.get("std"),
                skewness=stats.get("skewness"),
                outlier_count=outliers.get("count"),
                outlier_percentage=outliers.get("percentage"),
                lower_bound=outliers.get("lower_bound"),
                upper_bound=outliers.get("upper_bound"),
                top_categories=c.get("top_categories")
            )
            columns_payload.append(col_obj)

        # Extract top 10 strong correlations
        top_corrs = []
        corr_matrix = profile.get("correlation_matrix", {})
        if corr_matrix.get("matrix"):
            num_cols = corr_matrix.get("columns", [])
            seen_pairs = set()
            for row in corr_matrix["matrix"]:
                feat = row["feature"]
                for target_c in num_cols:
                    if feat != target_c and (target_c, feat) not in seen_pairs:
                        seen_pairs.add((feat, target_c))
                        val = float(row.get(target_c, 0.0))
                        if abs(val) > 0.05:
                            top_corrs.append({"feature_1": feat, "feature_2": target_c, "pearson_r": val, "abs_r": abs(val)})
            top_corrs = sorted(top_corrs, key=lambda x: x["abs_r"], reverse=True)[:10]

        return DatasetStatsPayload(
            dataset_id=profile["dataset_id"],
            dataset_name=profile["dataset_name"],
            filename=profile["filename"],
            content_hash=profile.get("content_hash", "none"),
            total_rows=profile["shape"]["rows"],
            total_columns=profile["shape"]["columns"],
            numeric_columns_count=profile["shape"]["numeric_columns_count"],
            categorical_columns_count=profile["shape"]["categorical_columns_count"],
            quality_score=profile.get("quality_score", 95.0),
            duplicate_rows=profile.get("duplicate_rows", 0),
            missing_cells=profile.get("missing_cells", 0),
            missing_cells_percentage=profile.get("missing_cells_percentage", 0.0),
            numeric_columns=profile.get("numeric_columns", []),
            categorical_columns=profile.get("categorical_columns", []),
            columns=columns_payload,
            top_correlations=top_corrs
        )

    @classmethod
    def collect_canonical_numbers(cls, payload: DatasetStatsPayload) -> Set[float]:
        """
        Collects every legitimate floating point / integer number present in the stats payload.
        Includes common derived variants (percentages / 100, rounded decimals).
        """
        numbers: Set[float] = set()

        def add_num(val):
            if val is not None and isinstance(val, (int, float)) and not math.isnan(val):
                f_val = float(val)
                numbers.add(round(f_val, 4))
                numbers.add(round(f_val, 2))
                numbers.add(round(f_val, 1))
                numbers.add(round(f_val, 0))
                # Add percentage variations
                numbers.add(round(f_val / 100.0, 4))
                numbers.add(round(f_val * 100.0, 2))

        add_num(payload.total_rows)
        add_num(payload.total_columns)
        add_num(payload.numeric_columns_count)
        add_num(payload.categorical_columns_count)
        add_num(payload.quality_score)
        add_num(payload.duplicate_rows)
        add_num(payload.missing_cells)
        add_num(payload.missing_cells_percentage)

        for col in payload.columns:
            add_num(col.missing_count)
            add_num(col.missing_percentage)
            add_num(col.unique_count)
            add_num(col.min)
            add_num(col.q1)
            add_num(col.median)
            add_num(col.q3)
            add_num(col.max)
            add_num(col.mean)
            add_num(col.std)
            add_num(col.skewness)
            add_num(col.outlier_count)
            add_num(col.outlier_percentage)
            add_num(col.lower_bound)
            add_num(col.upper_bound)
            if col.sample_values:
                for sv in col.sample_values:
                    if isinstance(sv, (int, float)):
                        add_num(sv)
            if col.top_categories:
                for tc in col.top_categories:
                    add_num(tc.get("count"))
                    add_num(tc.get("percentage"))

        for tc in payload.top_correlations:
            add_num(tc.get("pearson_r"))
            add_num(tc.get("abs_r"))

        return numbers

    @classmethod
    def verify_and_guard_narrative(cls, narrative: str, payload: DatasetStatsPayload) -> Tuple[str, Dict[str, Any]]:
        """
        Pass 2: Deterministic verification checker.
        Scans all numbers in the narrative, checks against canonical payload numbers.
        Strips or flags any fabricated statistics.
        """
        canonical_numbers = cls.collect_canonical_numbers(payload)
        # Structural whitelist: Section numbers 1-5, common safe integers (0, 1, 2, 3, 4, 5, 10, 20, 80, 100)
        whitelist = {0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 10.0, 20.0, 25.0, 50.0, 75.0, 80.0, 95.0, 99.0, 100.0, 1.5, 3.0, 2023.0, 2024.0, 2025.0, 2026.0}

        # Regex matching standalone integers, formatted comma numbers, decimals, and percentages
        number_regex = re.compile(r'(?<![A-Za-z0-9_#])([+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)(%?)')
        
        stripped_count = 0
        violations = []
        
        def replace_match(match):
            nonlocal stripped_count
            full_match = match.group(0)
            num_str = match.group(1).replace(",", "")
            is_pct = bool(match.group(2))
            
            try:
                val = float(num_str)
            except ValueError:
                return full_match

            # Check if number matches canonical payload numbers or whitelist
            matched = False
            tolerances = [0.0, 0.001, 0.01, 0.05, 0.1]
            candidates = [val, round(val, 2), round(val, 1), round(val, 4)]
            if is_pct:
                candidates.extend([val / 100.0, val])

            for cand in candidates:
                if cand in whitelist:
                    matched = True
                    break
                for target in canonical_numbers:
                    for tol in tolerances:
                        if abs(cand - target) <= tol:
                            matched = True
                            break
                    if matched:
                        break
                if matched:
                    break

            if not matched:
                stripped_count += 1
                violations.append(full_match)
                return f"[unverified statistic: {full_match} removed]"
            
            return full_match

        sanitized_narrative = number_regex.sub(replace_match, narrative)

        checks_meta = {
            "verified": stripped_count == 0,
            "total_numbers_checked": len(number_regex.findall(narrative)),
            "fabricated_numbers_stripped": stripped_count,
            "violations_detected": violations,
            "canonical_ground_truth_items": len(canonical_numbers)
        }

        return sanitized_narrative, checks_meta

    @classmethod
    def generate_rule_based_dossier(cls, payload: DatasetStatsPayload) -> str:
        """
        High-caliber, zero-hallucination deterministic 5-section EDA report.
        Executes with zero external API calls.
        """
        # Section 1: Health & Dimensions
        dups_text = f"Zero duplicate records detected ({payload.duplicate_rows} rows)." if payload.duplicate_rows == 0 else f"Found {payload.duplicate_rows} duplicate observations requiring deduplication."
        nulls_text = f"Dataset completeness is exceptional with {payload.missing_cells} missing cells ({payload.missing_cells_percentage}%)." if payload.missing_cells == 0 else f"Identified {payload.missing_cells} missing values ({payload.missing_cells_percentage}% total volume) across features."

        sec1 = f"""# 1. Executive Summary & Data Health Diagnostics
- **Target Dataset**: `{payload.dataset_name}` (`{payload.filename}`)
- **Total Observations**: `{payload.total_rows:,}` records across `{payload.total_columns}` dimensions (`{payload.numeric_columns_count}` numerical, `{payload.categorical_columns_count}` categorical).
- **Quality Benchmark Score**: `{payload.quality_score}/100` (High Statistical Integrity).
- **Data Completeness**: {nulls_text}
- **Row Uniqueness**: {dups_text}"""

        # Section 2: Distributions & Outliers
        sec2_lines = ["\n# 2. Feature Distributions, Variances & Outlier Analysis"]
        outlier_cols = [c for c in payload.columns if c.outlier_count and c.outlier_count > 0]
        if outlier_cols:
            sec2_lines.append(f"Tukey's IQR outlier analysis flagged anomalous tail observations in {len(outlier_cols)} numerical features:")
            for oc in outlier_cols[:4]:
                sec2_lines.append(f"- `{oc.name}`: `{oc.outlier_count}` outliers ({oc.outlier_percentage}% of column) detected outside boundary `[{oc.lower_bound}, {oc.upper_bound}]`. Median = `{oc.median}`, Skewness = `{oc.skewness}`.")
        else:
            sec2_lines.append("Numerical features demonstrate bounded, stable variance with minimal extreme IQR tail anomalies.")

        # Add top skewed features
        skewed_cols = [c for c in payload.columns if c.skewness is not None and abs(c.skewness) > 0.8]
        if skewed_cols:
            sec2_lines.append("\n**Skewness & Asymmetry Diagnostics:**")
            for sc in skewed_cols[:3]:
                skew_type = "Right-skewed (heavy positive tail)" if sc.skewness > 0 else "Left-skewed (negative tail)"
                sec2_lines.append(f"- `{sc.name}` has skewness `{sc.skewness}`: {skew_type}. Mean is `{sc.mean}` vs Median `{sc.median}`.")

        sec2 = "\n".join(sec2_lines)

        # Section 3: Correlations & Structure
        sec3_lines = ["\n# 3. Multivariable Relationships & Correlation Structure"]
        if payload.top_correlations:
            sec3_lines.append("Primary linear interactions identified by Pearson Correlation Matrix:")
            for tc in payload.top_correlations[:5]:
                direction = "Positive Association" if tc["pearson_r"] > 0 else "Inverse / Negative Association"
                strength = "Strong" if tc["abs_r"] > 0.6 else ("Moderate" if tc["abs_r"] > 0.3 else "Weak")
                sec3_lines.append(f"- `{tc['feature_1']}` vs `{tc['feature_2']}`: `r = {tc['pearson_r']:.3f}` ({strength} {direction}).")
        else:
            sec3_lines.append("Numerical feature space is largely orthogonal with weak linear collinearity.")

        sec3 = "\n".join(sec3_lines)

        # Section 4: Modeling Feasibility & Targets
        sec4_lines = ["\n# 4. Machine Learning Feasibility & Target Candidate Recommendations"]
        # Determine candidate targets
        candidates = []
        for c in payload.columns:
            if c.type == "categorical" and c.unique_count in [2, 3]:
                candidates.append((c.name, "Binary Classification", f"Predict discrete outcome `{c.name}`"))
            elif c.type == "numeric" and c.unique_count > 20:
                candidates.append((c.name, "Continuous Regression", f"Forecast numerical continuous metric `{c.name}`"))

        if candidates:
            sec4_lines.append("Recommended modeling formulations derived from feature cardinality:")
            for cand in candidates[:3]:
                sec4_lines.append(f"- **Candidate Target `{cand[0]}`** [{cand[1]}]: {cand[2]}.")
        else:
            sec4_lines.append(f"- Recommended Target `{payload.columns[-1].name}` based on terminal schema position.")

        sec4_lines.append(f"- **Recommended Validation Strategy**: 80% Train ({int(payload.total_rows*0.8)} rows) / 20% Test ({int(payload.total_rows*0.2)} rows) Stratified Partition.")
        sec4 = "\n".join(sec4_lines)

        # Section 5: Prescriptive Next Steps
        sec5 = f"""\n# 5. Prescriptive Next Steps & Production Pipeline Directives
1. **Preprocessing Directives**: Apply standard median imputation for numeric features and mode/frequent imputation for categorical columns prior to feature encoding.
2. **Feature Transformation**: One-hot encode categorical features while clipping extreme outliers on `{outlier_cols[0].name if outlier_cols else payload.numeric_columns[0] if payload.numeric_columns else 'numeric features'}`.
3. **Model Selection**: Benchmark Random Forest and Gradient Boosting against baseline Logistic/Linear Regressors in ML Studio.
4. **Monitoring**: Track concept drift and maintain schema validation checks against content hash `{payload.content_hash[:10]}`."""

        return f"{sec1}\n{sec2}\n{sec3}\n{sec4}\n{sec5}"

    @classmethod
    async def generate_single_eda(cls, dataset_id: str, force_refresh: bool = False) -> AutoEDAReport:
        """
        Executes automated exploratory analysis for a single dataset.
        Checks cache, builds stats payload, performs two-pass verification, and caches result.
        """
        profile = DatasetRegistry.get_profile(dataset_id, force_refresh=force_refresh)
        content_hash = profile.get("content_hash", "")
        cache_key = (dataset_id, content_hash)

        if not force_refresh and cache_key in cls._report_cache:
            cached_report = cls._report_cache[cache_key]
            cached_report.from_cache = True
            return cached_report

        stats_payload = cls.build_stats_payload(profile)

        # Pass 1: Narrative generation (Rule-based fallback or OpenAI if key provided)
        openai_key = os.getenv("OPENAI_API_KEY", "")
        raw_narrative = ""

        if openai_key:
            try:
                import requests
                headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
                prompt_content = f"{cls.SYSTEM_PROMPT}\n\nDATASET COMPUTED STATS PAYLOAD:\n{json.dumps(stats_payload.model_dump(), indent=2)}"
                payload_req = {
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt_content}],
                    "temperature": 0.2
                }
                resp = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload_req, timeout=15)
                if resp.status_code == 200:
                    raw_narrative = resp.json()["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"LLM API call fallback to rule-based: {e}")

        if not raw_narrative:
            raw_narrative = cls.generate_rule_based_dossier(stats_payload)

        # Pass 2: Deterministic Number Verification & Guardrail
        sanitized_narrative, checks_meta = cls.verify_and_guard_narrative(raw_narrative, stats_payload)

        # Key Findings
        key_findings = [
            f"{stats_payload.total_rows:,} rows across {stats_payload.total_columns} attributes with {stats_payload.quality_score}/100 health score.",
            f"{stats_payload.missing_cells} missing values ({stats_payload.missing_cells_percentage}%) and {stats_payload.duplicate_rows} duplicate records."
        ]
        if stats_payload.top_correlations:
            top_c = stats_payload.top_correlations[0]
            key_findings.append(f"Strongest linear link: `{top_c['feature_1']}` vs `{top_c['feature_2']}` (r = {top_c['pearson_r']:.2f}).")

        recommendations = [
            "Use median/mode imputation in preprocessing pipelines.",
            "Deploy tree-based gradient ensembles for robust non-linear modeling.",
            "Validate test performance on unseen 20% holdout split."
        ]

        report = AutoEDAReport(
            dataset_id=dataset_id,
            dataset_name=stats_payload.dataset_name,
            content_hash=content_hash,
            generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
            status="completed",
            narrative=sanitized_narrative,
            quality_score=stats_payload.quality_score,
            readiness_tier="Production Ready" if stats_payload.quality_score >= 90 else "Preprocessing Needed",
            key_findings=key_findings,
            recommendations=recommendations,
            hallucination_checks=checks_meta,
            from_cache=False
        )

        cls._report_cache[cache_key] = report
        return report

    @classmethod
    def compare_datasets(cls, dataset_ids: List[str]) -> Dict[str, Any]:
        """
        Cross-dataset portfolio comparison engine.
        Evaluates shape, schemas, health differentials, and suitability across datasets.
        """
        if not dataset_ids:
            raise ValueError("Must provide at least one dataset ID for comparison.")

        profiles = []
        for d_id in dataset_ids:
            try:
                prof = DatasetRegistry.get_profile(d_id)
                profiles.append(prof)
            except Exception as e:
                print(f"Error loading profile for {d_id}: {e}")

        if not profiles:
            raise ValueError("No valid dataset profiles found for comparison.")

        comparison_matrix = []
        for p in profiles:
            comparison_matrix.append({
                "id": p["dataset_id"],
                "name": p["dataset_name"],
                "filename": p["filename"],
                "rows": p["shape"]["rows"],
                "columns": p["shape"]["columns"],
                "numeric_features": p["shape"]["numeric_columns_count"],
                "categorical_features": p["shape"]["categorical_columns_count"],
                "missing_percentage": p["missing_cells_percentage"],
                "duplicate_rows": p["duplicate_rows"],
                "quality_score": p["quality_score"],
                "is_sample": p.get("is_sample", False)
            })

        # Summary narrative
        highest_quality = max(comparison_matrix, key=lambda x: x["quality_score"])
        largest_volume = max(comparison_matrix, key=lambda x: x["rows"])

        narrative = (
            f"### 📊 Multi-Dataset Comparative Analysis\n\n"
            f"- **Portfolio Size**: `{len(comparison_matrix)}` datasets analyzed.\n"
            f"- **Highest Quality Dataset**: **`{highest_quality['name']}`** with a score of `{highest_quality['quality_score']}/100`.\n"
            f"- **Largest Volume Dataset**: **`{largest_volume['name']}`** with `{largest_volume['rows']:,}` rows across `{largest_volume['columns']}` features.\n\n"
            f"**Strategic Assessment**:\n"
            f"All compared datasets are active and structured for automated ML modeling. Datasets with lower missing values should be prioritized for zero-imputation workflows."
        )

        return {
            "compared_datasets": comparison_matrix,
            "narrative": narrative,
            "highest_quality_dataset": highest_quality["name"],
            "largest_dataset": largest_volume["name"],
            "total_observations_analyzed": sum(x["rows"] for x in comparison_matrix)
        }

    @classmethod
    def ask_portfolio(cls, question: str) -> Dict[str, Any]:
        """
        Cross-dataset semantic analytical agent.
        Answers user queries referencing any dataset in the entire library.
        """
        catalog = DatasetRegistry.get_catalog()
        if not catalog:
            return {
                "answer": "No datasets are currently registered in the catalog.",
                "referenced_datasets": []
            }

        q_lower = question.lower().strip()
        matched_datasets = []
        for d in catalog:
            if d["name"].lower() in q_lower or d["filename"].lower() in q_lower or d["id"].lower() in q_lower:
                matched_datasets.append(d)

        # If no specific dataset is mentioned, examine whole portfolio
        if not matched_datasets:
            matched_datasets = catalog

        total_obs = sum(d["row_count"] for d in catalog)
        avg_quality = round(sum(d["quality_score"] for d in catalog) / len(catalog), 1)

        answer = (
            f"### 🌐 Portfolio-Wide Data Intelligence\n\n"
            f"- **Registered Datasets**: `{len(catalog)}` total tables\n"
            f"- **Aggregated Volume**: `{total_obs:,}` total records\n"
            f"- **Mean Quality Index**: `{avg_quality}/100`\n\n"
            f"**Dataset Catalog Breakdown:**\n"
        )
        for d in catalog:
            answer += f"- **`{d['name']}`**: {d['row_count']:,} rows, {d['col_count']} cols (Health: `{d['quality_score']}/100` &bull; {d['readiness']})\n"

        answer += "\n💡 **Recommendation**: To inspect deep feature distributions or train predictive models, select the specific dataset from the workspace."

        return {
            "answer": answer,
            "referenced_datasets": [d["name"] for d in matched_datasets]
        }
