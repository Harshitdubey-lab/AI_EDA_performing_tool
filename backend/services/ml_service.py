import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder

# Models
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor

# Metrics
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix,
    mean_absolute_error, mean_squared_error, r2_score
)

class MLService:
    # In-memory storage for active trained pipelines per dataset
    _trained_pipelines: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def detect_task_type(cls, df: pd.DataFrame, target_col: str) -> str:
        series = df[target_col].dropna()
        n_unique = series.nunique()
        is_numeric = pd.api.types.is_numeric_dtype(series)

        if not is_numeric or n_unique <= 15 or series.dtype == bool:
            return "classification"
        return "regression"

    @classmethod
    def train_models(cls, dataset_id: str, df: pd.DataFrame, target_col: str, task_type: Optional[str] = None) -> Dict[str, Any]:
        if target_col not in df.columns:
            raise ValueError(f"Target column '{target_col}' not found in dataset.")

        clean_df = df.dropna(subset=[target_col]).copy()
        if len(clean_df) < 20:
            raise ValueError("Dataset has fewer than 20 rows after removing empty target rows. Insufficient data for ML training.")

        if not task_type:
            task_type = cls.detect_task_type(clean_df, target_col)

        # Separate features and target
        X = clean_df.drop(columns=[target_col])
        y = clean_df[target_col]

        # Filter out ID-like columns with 95%+ unique strings
        cols_to_drop = []
        for col in X.columns:
            if not pd.api.types.is_numeric_dtype(X[col]) and X[col].nunique() > 0.95 * len(X):
                cols_to_drop.append(col)
        if cols_to_drop:
            X = X.drop(columns=cols_to_drop)

        numeric_features = X.select_dtypes(include=[np.number]).columns.tolist()
        categorical_features = X.select_dtypes(exclude=[np.number]).columns.tolist()

        # Build Preprocessing Pipeline
        transformers = []
        if numeric_features:
            num_pipeline = Pipeline([
                ('imputer', SimpleImputer(strategy='median')),
                ('scaler', StandardScaler())
            ])
            transformers.append(('num', num_pipeline, numeric_features))

        if categorical_features:
            cat_pipeline = Pipeline([
                ('imputer', SimpleImputer(strategy='most_frequent')),
                ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ])
            transformers.append(('cat', cat_pipeline, categorical_features))

        preprocessor = ColumnTransformer(transformers=transformers, remainder='drop')

        # Encode target for classification
        label_encoder = None
        target_classes = None
        if task_type == "classification":
            label_encoder = LabelEncoder()
            y_encoded = label_encoder.fit_transform(y.astype(str))
            target_classes = [str(c) for c in label_encoder.classes_]
        else:
            y_encoded = pd.to_numeric(y, errors='coerce').fillna(y.mean()).values

        # Split 80% train, 20% test
        stratify = y_encoded if task_type == "classification" and len(np.unique(y_encoded)) > 1 else None
        # Check if min class count is at least 2 for stratified split
        if stratify is not None:
            _, counts = np.unique(y_encoded, return_counts=True)
            if min(counts) < 2:
                stratify = None

        X_train, X_test, y_train, y_test = train_test_split(
            X, y_encoded, test_size=0.20, random_state=42, stratify=stratify
        )

        results = []
        best_score = -1e9
        best_model_name = ""
        best_pipeline = None

        if task_type == "classification":
            candidate_models = {
                "Random Forest Classifier": RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42),
                "Gradient Boosting": GradientBoostingClassifier(n_estimators=80, learning_rate=0.1, max_depth=5, random_state=42),
                "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
                "Decision Tree": DecisionTreeClassifier(max_depth=8, random_state=42)
            }

            for name, clf in candidate_models.items():
                try:
                    pipeline = Pipeline([
                        ('preprocessor', preprocessor),
                        ('model', clf)
                    ])
                    pipeline.fit(X_train, y_train)
                    y_pred = pipeline.predict(X_test)

                    acc = float(accuracy_score(y_test, y_pred))
                    prec = float(precision_score(y_test, y_pred, average='weighted', zero_division=0))
                    rec = float(recall_score(y_test, y_pred, average='weighted', zero_division=0))
                    f1 = float(f1_score(y_test, y_pred, average='weighted', zero_division=0))

                    # Confusion Matrix
                    cm = confusion_matrix(y_test, y_pred).tolist()

                    model_res = {
                        "name": name,
                        "task_type": "classification",
                        "metrics": {
                            "accuracy": round(acc, 4),
                            "precision": round(prec, 4),
                            "recall": round(rec, 4),
                            "f1_score": round(f1, 4)
                        },
                        "confusion_matrix": {
                            "labels": target_classes,
                            "matrix": cm
                        }
                    }
                    results.append(model_res)

                    if f1 > best_score:
                        best_score = f1
                        best_model_name = name
                        best_pipeline = pipeline
                except Exception as e:
                    print(f"Error training {name}: {e}")

        else: # Regression
            candidate_models = {
                "Random Forest Regressor": RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42),
                "Gradient Boosting": GradientBoostingRegressor(n_estimators=80, learning_rate=0.1, max_depth=5, random_state=42),
                "Linear Regression": LinearRegression(),
                "Ridge Regression": Ridge(alpha=1.0),
                "Decision Tree": DecisionTreeRegressor(max_depth=8, random_state=42)
            }

            for name, reg in candidate_models.items():
                try:
                    pipeline = Pipeline([
                        ('preprocessor', preprocessor),
                        ('model', reg)
                    ])
                    pipeline.fit(X_train, y_train)
                    y_pred = pipeline.predict(X_test)

                    mae = float(mean_absolute_error(y_test, y_pred))
                    mse = float(mean_squared_error(y_test, y_pred))
                    rmse = float(np.sqrt(mse))
                    r2 = float(r2_score(y_test, y_pred))

                    model_res = {
                        "name": name,
                        "task_type": "regression",
                        "metrics": {
                            "r2_score": round(r2, 4),
                            "mae": round(mae, 4),
                            "rmse": round(rmse, 4),
                            "mse": round(mse, 4)
                        }
                    }
                    results.append(model_res)

                    if r2 > best_score:
                        best_score = r2
                        best_model_name = name
                        best_pipeline = pipeline
                except Exception as e:
                    print(f"Error training {name}: {e}")

        # Feature Importance from Best Model
        feature_importance: List[Dict[str, Any]] = []
        if best_pipeline:
            try:
                # Extract transformed feature names
                transformed_feature_names = []
                fitted_preprocessor = best_pipeline.named_steps['preprocessor']
                for name, trans, cols in fitted_preprocessor.transformers_:
                    if name == 'num':
                        transformed_feature_names.extend(cols)
                    elif name == 'cat':
                        encoder = trans.named_steps['encoder']
                        cat_names = encoder.get_feature_names_out(cols).tolist()
                        transformed_feature_names.extend(cat_names)

                model_obj = best_pipeline.named_steps['model']
                importances = None
                if hasattr(model_obj, 'feature_importances_'):
                    importances = model_obj.feature_importances_
                elif hasattr(model_obj, 'coef_'):
                    importances = np.abs(model_obj.coef_)
                    if len(importances.shape) > 1:
                        importances = np.mean(importances, axis=0)

                if importances is not None and len(importances) == len(transformed_feature_names):
                    feat_tuples = sorted(zip(transformed_feature_names, importances), key=lambda x: x[1], reverse=True)[:15]
                    feature_importance = [
                        {"feature": f, "importance": round(float(imp), 4)} for f, imp in feat_tuples
                    ]
            except Exception as e:
                print(f"Feature importance extraction warning: {e}")

        # Save active pipeline for live predictions
        cls._trained_pipelines[dataset_id] = {
            "pipeline": best_pipeline,
            "target_col": target_col,
            "task_type": task_type,
            "label_encoder": label_encoder,
            "feature_columns": list(X.columns),
            "best_model_name": best_model_name,
            "feature_importance": feature_importance,
            "results": results
        }

        return {
            "target_column": target_col,
            "task_type": task_type,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "best_model": best_model_name,
            "models": results,
            "feature_importance": feature_importance,
            "feature_columns": list(X.columns)
        }

    @classmethod
    def predict_sample(cls, dataset_id: str, input_features: Dict[str, Any]) -> Dict[str, Any]:
        info = cls._trained_pipelines.get(dataset_id)
        if not info or not info["pipeline"]:
            raise ValueError("No trained model found for this dataset. Please train models in ML Studio first.")

        pipeline = info["pipeline"]
        df_input = pd.DataFrame([input_features])

        # Fill any missing expected feature columns with None/NaN
        for col in info["feature_columns"]:
            if col not in df_input.columns:
                df_input[col] = np.nan

        pred_val = pipeline.predict(df_input)[0]

        if info["task_type"] == "classification":
            probabilities = {}
            if hasattr(pipeline.named_steps['model'], "predict_proba"):
                probs = pipeline.predict_proba(df_input)[0]
                if info["label_encoder"]:
                    for cls_name, p in zip(info["label_encoder"].classes_, probs):
                        probabilities[str(cls_name)] = round(float(p) * 100, 2)
            
            label = str(info["label_encoder"].inverse_transform([int(pred_val)])[0]) if info["label_encoder"] else str(pred_val)
            return {
                "prediction": label,
                "task_type": "classification",
                "probabilities": probabilities,
                "model_used": info["best_model_name"]
            }
        else:
            return {
                "prediction": round(float(pred_val), 2),
                "task_type": "regression",
                "model_used": info["best_model_name"]
            }
