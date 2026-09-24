import os
import sqlite3
import hashlib
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
import pandas as pd

try:
    from backend.services.data_service import DataService
except ImportError:
    from services.data_service import DataService

class DatasetRegistry:
    """
    In-memory and SQLite-backed registry for all loaded datasets in InsightPilot AI.
    Caches statistical profiles with SHA-256 content hashes for instant cache invalidation.
    """
    _cache: Dict[str, Dict[str, Any]] = {}
    _db_path: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "insightpilot.db")

    @classmethod
    def set_db_path(cls, db_path: str):
        cls._db_path = db_path

    @classmethod
    def get_db_connection(cls):
        conn = sqlite3.connect(cls._db_path)
        conn.row_factory = sqlite3.Row
        return conn

    @staticmethod
    def compute_file_hash(file_path: str) -> str:
        if not os.path.exists(file_path):
            return "missing_file"
        hasher = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                hasher.update(chunk)
        return hasher.hexdigest()

    @classmethod
    def get_dataset_metadata(cls, dataset_id: str) -> Dict[str, Any]:
        conn = cls.get_db_connection()
        try:
            row = conn.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
            if not row:
                raise ValueError(f"Dataset with ID '{dataset_id}' not found in registry.")
            return dict(row)
        finally:
            conn.close()

    @classmethod
    def get_profile(cls, dataset_id: str, force_refresh: bool = False) -> Dict[str, Any]:
        meta = cls.get_dataset_metadata(dataset_id)
        active_path = meta.get("cleaned_path") if (meta.get("cleaned_path") and os.path.exists(meta["cleaned_path"])) else meta["file_path"]
        
        if not os.path.exists(active_path):
            raise FileNotFoundError(f"Underlying dataset file '{active_path}' is missing on disk.")

        current_hash = cls.compute_file_hash(active_path)

        # Check in-memory cache
        cached = cls._cache.get(dataset_id)
        if not force_refresh and cached and cached.get("hash") == current_hash:
            return cached["profile"]

        # Generate fresh profile using DataService
        df = DataService.load_dataset(active_path)
        profile = DataService.profile_dataset(df)
        
        # Attach registry metadata & content hash
        profile["dataset_id"] = dataset_id
        profile["dataset_name"] = meta["name"]
        profile["filename"] = meta["filename"]
        profile["file_size_kb"] = meta.get("file_size_kb", round(os.path.getsize(active_path) / 1024, 1))
        profile["is_sample"] = bool(meta.get("is_sample", False))
        profile["content_hash"] = current_hash
        profile["profiled_at"] = datetime.now().isoformat()

        # Update cache
        cls._cache[dataset_id] = {
            "hash": current_hash,
            "profile": profile,
            "cached_at": datetime.now().isoformat()
        }

        return profile

    @classmethod
    def get_catalog(cls) -> List[Dict[str, Any]]:
        """
        Returns full catalog across all registered datasets with computed profile summaries,
        readiness tiers, health indicators, and dimension counts.
        """
        conn = cls.get_db_connection()
        try:
            rows = conn.execute("SELECT * FROM datasets ORDER BY created_at DESC").fetchall()
            datasets_list = [dict(r) for r in rows]
        finally:
            conn.close()

        catalog = []
        for meta in datasets_list:
            d_id = meta["id"]
            try:
                prof = cls.get_profile(d_id)
                q_score = prof.get("quality_score", 90.0)
                
                # Assign ML / Analytics readiness tier
                if q_score >= 90 and prof.get("duplicate_rows", 0) == 0 and prof.get("missing_cells", 0) == 0:
                    readiness = "Production Ready"
                    readiness_color = "emerald"
                elif q_score >= 75:
                    readiness = "Minor Preprocessing Needed"
                    readiness_color = "sky"
                else:
                    readiness = "Substantial Cleaning Required"
                    readiness_color = "amber"

                catalog.append({
                    "id": d_id,
                    "name": meta["name"],
                    "filename": meta["filename"],
                    "is_sample": bool(meta.get("is_sample", False)),
                    "row_count": prof["shape"]["rows"],
                    "col_count": prof["shape"]["columns"],
                    "numeric_count": prof["shape"]["numeric_columns_count"],
                    "categorical_count": prof["shape"]["categorical_columns_count"],
                    "missing_cells": prof["missing_cells"],
                    "missing_cells_percentage": prof["missing_cells_percentage"],
                    "duplicate_rows": prof["duplicate_rows"],
                    "quality_score": q_score,
                    "readiness": readiness,
                    "readiness_color": readiness_color,
                    "content_hash": prof["content_hash"],
                    "created_at": meta.get("created_at", "")
                })
            except Exception as e:
                # Handle edge case where file is missing gracefully
                catalog.append({
                    "id": d_id,
                    "name": meta["name"],
                    "filename": meta["filename"],
                    "is_sample": bool(meta.get("is_sample", False)),
                    "row_count": meta.get("row_count", 0),
                    "col_count": meta.get("col_count", 0),
                    "numeric_count": 0,
                    "categorical_count": 0,
                    "missing_cells": 0,
                    "missing_cells_percentage": 0.0,
                    "duplicate_rows": 0,
                    "quality_score": 0.0,
                    "readiness": "Offline / Error",
                    "readiness_color": "rose",
                    "content_hash": "error",
                    "created_at": meta.get("created_at", "")
                })

        return catalog

    @classmethod
    def invalidate(cls, dataset_id: Optional[str] = None):
        if dataset_id:
            cls._cache.pop(dataset_id, None)
        else:
            cls._cache.clear()
