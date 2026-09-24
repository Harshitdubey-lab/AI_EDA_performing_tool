import os
import sys
import unittest
import asyncio

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import pandas as pd
from services.data_service import DataService
from services.ml_service import MLService
from services.ai_service import AIService
from services.chart_service import ChartService
from services.report_service import ReportService
from core.dataset_registry import DatasetRegistry
from services.eda_agent_service import EDAAgentService, DatasetStatsPayload

class TestInsightPilotBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Ensure database and sample datasets exist
        from main import seed_sample_datasets
        seed_sample_datasets()

    def test_01_data_service_profile(self):
        sample_path = os.path.join(BASE_DIR, "samples", "sample_sales_data.csv")
        self.assertTrue(os.path.exists(sample_path), "sample_sales_data.csv missing")
        df = DataService.load_dataset(sample_path)
        profile = DataService.profile_dataset(df)
        self.assertGreaterEqual(profile["shape"]["rows"], 500)
        self.assertEqual(profile["shape"]["columns"], 16)
        self.assertIn("quality_score", profile)
        self.assertIn("outlier_summary", profile)
        self.assertIn("correlation_matrix", profile)

    def test_02_dataset_registry_catalog(self):
        catalog = DatasetRegistry.get_catalog()
        self.assertGreaterEqual(len(catalog), 3, "Catalog must contain at least the 3 sample datasets")
        sample_ids = [d["id"] for d in catalog]
        self.assertIn("sample-sales", sample_ids)
        self.assertIn("sample-churn", sample_ids)
        self.assertIn("sample-housing", sample_ids)

        # Verify get_profile
        prof = DatasetRegistry.get_profile("sample-sales")
        self.assertEqual(prof["dataset_id"], "sample-sales")
        self.assertTrue(len(prof["content_hash"]) > 10, "Content hash must be valid SHA-256")

    def test_03_ml_service_pipelines(self):
        # Classification test
        df_sales = pd.read_csv(os.path.join(BASE_DIR, "samples", "sample_sales_data.csv"))
        res_clf = MLService.train_models("test-sales-clf", df_sales, target_col="returned", task_type="classification")
        self.assertEqual(res_clf["task_type"], "classification")
        self.assertGreaterEqual(len(res_clf["models"]), 3)
        self.assertIn(res_clf["best_model"], [m["name"] for m in res_clf["models"]])
        self.assertIn("accuracy", res_clf["models"][0]["metrics"])

        # Regression test
        df_house = pd.read_csv(os.path.join(BASE_DIR, "samples", "housing_prices.csv"))
        res_reg = MLService.train_models("test-house-reg", df_house, target_col="SalePrice", task_type="regression")
        self.assertEqual(res_reg["task_type"], "regression")
        self.assertGreater(res_reg["models"][0]["metrics"]["r2_score"], 0.70)

    def test_04_eda_agent_single_and_cache(self):
        # Generate single EDA report
        report1 = asyncio.run(EDAAgentService.generate_single_eda("sample-sales", force_refresh=True))
        self.assertEqual(report1.dataset_id, "sample-sales")
        self.assertIn("# 1. Executive Summary & Data Health Diagnostics", report1.narrative)
        self.assertIn("# 2. Feature Distributions, Variances & Outlier Analysis", report1.narrative)
        self.assertIn("# 3. Multivariable Relationships & Correlation Structure", report1.narrative)
        self.assertIn("# 4. Machine Learning Feasibility & Target Candidate Recommendations", report1.narrative)
        self.assertIn("# 5. Prescriptive Next Steps & Production Pipeline Directives", report1.narrative)
        self.assertFalse(report1.from_cache)

        # Test cache hit on repeat call
        report2 = asyncio.run(EDAAgentService.generate_single_eda("sample-sales", force_refresh=False))
        self.assertTrue(report2.from_cache, "Unchanged dataset must be served from cache")
        self.assertEqual(report1.content_hash, report2.content_hash)

    def test_05_hallucination_guardrail_rejects_fabricated_number(self):
        """
        NON-NEGOTIABLE VERIFICATION:
        Deliberately feeds a narrative with a completely fabricated statistical number (e.g., 987654.321 and 42.987654)
        and asserts that the pass-2 deterministic checker catches the violation and strips it!
        """
        profile = DatasetRegistry.get_profile("sample-sales")
        stats_payload = EDAAgentService.build_stats_payload(profile)

        # Fabricated test narrative with ungrounded statistics
        fake_narrative = (
            "The dataset has 650 records, but an ungrounded revenue peak of 987654.321 was observed "
            "with a fabricated accuracy rate of 42.987654%."
        )

        sanitized_text, checks = EDAAgentService.verify_and_guard_narrative(fake_narrative, stats_payload)
        
        # Assertions
        self.assertFalse(checks["verified"], "Checker must flag unverified statistics")
        self.assertGreaterEqual(checks["fabricated_numbers_stripped"], 1, "Fabricated numbers must be stripped")
        self.assertIn("[unverified statistic: 987654.321 removed]", sanitized_text)
        self.assertIn("987654.321", checks["violations_detected"])
        print(f"\n[PASS-2 GUARDRAIL VERIFIED] Stripped violations: {checks['violations_detected']}")

    def test_06_compare_and_portfolio_ask(self):
        # Multi-dataset comparison
        compare_res = EDAAgentService.compare_datasets(["sample-sales", "sample-churn", "sample-housing"])
        self.assertEqual(len(compare_res["compared_datasets"]), 3)
        self.assertIn("narrative", compare_res)
        self.assertIn("highest_quality_dataset", compare_res)

        # Portfolio ask query
        ask_res = EDAAgentService.ask_portfolio("What is the total data volume across all registered datasets?")
        self.assertIn("Portfolio-Wide Data Intelligence", ask_res["answer"])
        self.assertGreaterEqual(len(ask_res["referenced_datasets"]), 1)

if __name__ == "__main__":
    unittest.main(verbosity=2)
