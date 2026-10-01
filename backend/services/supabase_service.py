import os
import json
import logging
from typing import Dict, Any, List, Optional
import requests

logger = logging.getLogger(__name__)

class SupabaseService:
    """
    Cloud Database integration service for Supabase (https://tjbgwejzoepyuavleziw.supabase.co).
    Communicates via Supabase PostgREST endpoints for high performance and zero external driver dependencies.
    """
    _url: str = os.getenv("SUPABASE_URL", "https://tjbgwejzoepyuavleziw.supabase.co").rstrip("/")
    _key: str = os.getenv("SUPABASE_ANON_KEY", os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")))

    @classmethod
    def configure(cls, url: Optional[str] = None, key: Optional[str] = None):
        if url:
            cls._url = url.rstrip("/")
        if key:
            cls._key = key

    @classmethod
    def is_configured(cls) -> bool:
        return bool(cls._url and cls._key)

    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        configured = cls.is_configured()
        status_info = {
            "supabase_url": cls._url,
            "key_configured": bool(cls._key),
            "is_connected": False,
            "mode": "supabase_cloud" if configured else "sqlite_local"
        }
        if configured:
            try:
                res = requests.get(
                    f"{cls._url}/rest/v1/datasets?select=count",
                    headers=cls._get_headers(),
                    timeout=5
                )
                status_info["is_connected"] = res.status_code in [200, 206]
                status_info["response_code"] = res.status_code
            except Exception as e:
                status_info["error"] = str(e)
        return status_info

    @classmethod
    def _get_headers(cls) -> Dict[str, str]:
        return {
            "apikey": cls._key,
            "Authorization": f"Bearer {cls._key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    @classmethod
    def get_datasets(cls) -> Optional[List[Dict[str, Any]]]:
        if not cls.is_configured():
            return None
        try:
            res = requests.get(
                f"{cls._url}/rest/v1/datasets?select=*&order=created_at.desc",
                headers=cls._get_headers(),
                timeout=8
            )
            if res.status_code == 200:
                return res.json()
            logger.warning(f"Supabase get_datasets returned status {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Failed to query Supabase datasets: {e}")
        return None

    @classmethod
    def insert_dataset(cls, dataset: Dict[str, Any]) -> bool:
        if not cls.is_configured():
            return False
        try:
            payload = {
                "id": str(dataset["id"]),
                "name": str(dataset["name"]),
                "filename": str(dataset["filename"]),
                "file_path": str(dataset["file_path"]),
                "row_count": int(dataset.get("row_count", 0)),
                "col_count": int(dataset.get("col_count", 0)),
                "file_size_kb": float(dataset.get("file_size_kb", 0.0)),
                "created_at": dataset.get("created_at"),
                "is_sample": bool(dataset.get("is_sample", False)),
                "cleaned_path": dataset.get("cleaned_path")
            }
            res = requests.post(
                f"{cls._url}/rest/v1/datasets",
                headers=cls._get_headers(),
                json=payload,
                timeout=8
            )
            return res.status_code in [200, 201]
        except Exception as e:
            logger.error(f"Failed to insert dataset into Supabase: {e}")
            return False

    @classmethod
    def insert_report(cls, report: Dict[str, Any]) -> bool:
        if not cls.is_configured():
            return False
        try:
            payload = {
                "id": str(report["id"]),
                "dataset_id": str(report["dataset_id"]),
                "title": str(report["title"]),
                "file_path": str(report["file_path"]),
                "quality_score": float(report.get("quality_score", 0.0)),
                "created_at": report.get("created_at"),
                "summary_json": report.get("summary_json")
            }
            res = requests.post(
                f"{cls._url}/rest/v1/reports",
                headers=cls._get_headers(),
                json=payload,
                timeout=8
            )
            return res.status_code in [200, 201]
        except Exception as e:
            logger.error(f"Failed to insert report into Supabase: {e}")
            return False
