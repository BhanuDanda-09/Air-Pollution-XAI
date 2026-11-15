"""Prediction service handling model inference and CPCB health classifications."""

from typing import Any, Dict
import pandas as pd
from backend.config import Config
from backend.models.model_loader import get_model_loader


class PredictionService:
    """Executes model inference, applies CPCB categorization, and handles multi-model comparison."""

    @staticmethod
    def get_cpcb_category(pm25: float) -> Dict[str, Any]:
        """Classify PM2.5 concentration into an indicative CPCB health category.

        Important: This is an indicative concentration category, NOT an official
        24-hour multi-pollutant CPCB AQI.
        """
        for band in Config.CPCB_BANDS:
            if pm25 <= band["max"]:
                return {
                    "category": band["category"],
                    "color": band["color"],
                    "health_statement": band["health_statement"],
                    "is_official_aqi": False,
                    "disclaimer": Config.CPCB_DISCLAIMER,
                }
        # Fallback to Severe
        severe = Config.CPCB_BANDS[-1]
        return {
            "category": severe["category"],
            "color": severe["color"],
            "health_statement": severe["health_statement"],
            "is_official_aqi": False,
            "disclaimer": Config.CPCB_DISCLAIMER,
        }

    @classmethod
    def predict_single(cls, model_key: str, features: Dict[str, float]) -> Dict[str, Any]:
        """Generate PM2.5 prediction for a single model.

        Args:
            model_key: 'random_forest', 'xgboost', or 'mlp'.
            features: Dictionary containing validated meteorological values.

        Returns:
            Structured prediction dictionary.
        """
        loader = get_model_loader()
        df = pd.DataFrame([features], columns=Config.FEATURE_ORDER)

        if model_key == "random_forest":
            if loader.rf_model is None:
                raise RuntimeError("Random Forest model artifact is not loaded on server.")
            model = loader.rf_model
            raw_pred = float(model.predict(df)[0])
        elif model_key == "xgboost":
            if loader.xgb_model is None:
                raise RuntimeError("XGBoost model artifact is not loaded on server.")
            model = loader.xgb_model
            raw_pred = float(model.predict(df)[0])
        elif model_key == "mlp":
            if loader.mlp_model is None or loader.mlp_scaler is None:
                raise RuntimeError("MLP model or preprocessing scaler artifact is not loaded on server.")
            scaler = loader.mlp_scaler
            scaled = scaler.transform(df)
            try:
                # Direct tensor callable forward pass (training=False preserves inference semantics)
                # avoids Keras batching threadpool allocation and memory spikes on constrained containers
                pred_tensor = loader.mlp_model(scaled, training=False)
                if hasattr(pred_tensor, "numpy"):
                    raw_pred = float(pred_tensor.numpy().flatten()[0])
                else:
                    raw_pred = float(pred_tensor[0][0])
            except Exception:
                # Robust fallback to standard predict if tensor execution raises
                raw_pred = float(loader.mlp_model.predict(scaled, verbose=0).flatten()[0])
        else:
            raise ValueError(f"Unsupported model key: {model_key}")

        pm25 = max(0.0, round(raw_pred, 2))
        cpcb = cls.get_cpcb_category(pm25)
        benchmark = Config.MODEL_BENCHMARKS.get(model_key, {})

        return {
            "model_key": model_key,
            "model_name": benchmark.get("display_name", model_key),
            "paradigm": benchmark.get("paradigm", "Machine Learning"),
            "prediction": {
                "pm25": pm25,
                "unit": "µg/m³",
            },
            "cpcb_category": cpcb,
            "features": features,
            "scientific_disclaimer": Config.GENERAL_DISCLAIMER,
        }

    @classmethod
    def compare_all(cls, features: Dict[str, float]) -> Dict[str, Any]:
        """Execute all available models on identical meteorological inputs.

        Handles model-specific exceptions independently: if one model fails or is
        unavailable, the successful predictions from remaining models are returned,
        while unavailable models are clearly tagged without fabricating estimates.

        Returns:
            Dictionary comparing all model predictions alongside held-out test benchmarks.
        """
        loader = get_model_loader()
        status = loader.get_status()
        predictions = {}
        successful_count = 0
        model_errors = {}

        for key in ["random_forest", "xgboost", "mlp"]:
            bench = Config.MODEL_BENCHMARKS.get(key, {})
            test_bench = {
                "r2": bench.get("test_r2"),
                "rmse": bench.get("test_rmse"),
                "mae": bench.get("test_mae"),
            }

            # 1. Pre-check if model is available/loaded
            is_available = status.get(key, False)
            if not is_available:
                err_msg = loader.load_errors.get(key, "Model artifact is not loaded on server.")
                model_errors[key] = err_msg
                predictions[key] = {
                    "display_name": bench.get("display_name", key),
                    "paradigm": bench.get("paradigm", "Machine Learning"),
                    "available": False,
                    "status": "unavailable",
                    "error": err_msg,
                    "pm25": None,
                    "unit": "µg/m³",
                    "cpcb_category": None,
                    "color": "#94A3B8",
                    "test_benchmark": test_bench,
                    "is_best_model": bench.get("is_best", False),
                }
                continue

            # 2. Execute inference with isolated error handling
            try:
                single = cls.predict_single(key, features)
                successful_count += 1
                predictions[key] = {
                    "display_name": bench.get("display_name", key),
                    "paradigm": bench.get("paradigm", "Machine Learning"),
                    "available": True,
                    "status": "success",
                    "pm25": single["prediction"]["pm25"],
                    "unit": "µg/m³",
                    "cpcb_category": single["cpcb_category"]["category"],
                    "color": single["cpcb_category"]["color"],
                    "test_benchmark": test_bench,
                    "is_best_model": bench.get("is_best", False),
                }
            except Exception as exc:
                model_errors[key] = str(exc)
                predictions[key] = {
                    "display_name": bench.get("display_name", key),
                    "paradigm": bench.get("paradigm", "Machine Learning"),
                    "available": False,
                    "status": "failed",
                    "error": str(exc),
                    "pm25": None,
                    "unit": "µg/m³",
                    "cpcb_category": None,
                    "color": "#94A3B8",
                    "test_benchmark": test_bench,
                    "is_best_model": bench.get("is_best", False),
                }

        # If every single model failed, raise an error so the route returns an error response
        if successful_count == 0:
            raise RuntimeError(f"All comparison models failed inference: {model_errors}")

        summary = (
            "XGBoost is the top-performing model with R²=0.7455 and RMSE=36.74 µg/m³ on the 406 "
            "held-out test samples. Random Forest achieved R²=0.7269, while MLP achieved R²=0.5408. "
            "Time-series models (LSTM, Transformer) remain scientifically blocked pending sequential timestamps."
        )
        if model_errors:
            failed_names = [Config.MODEL_BENCHMARKS.get(k, {}).get("display_name", k) for k in model_errors.keys()]
            summary += f" Note: Live inference for {', '.join(failed_names)} is currently offline; precomputed benchmarks are displayed."

        return {
            "features": features,
            "predictions": predictions,
            "best_model": "xgboost",
            "successful_models": successful_count,
            "total_models": 3,
            "has_partial_failures": len(model_errors) > 0,
            "comparison_summary": summary,
            "scientific_disclaimer": Config.GENERAL_DISCLAIMER,
        }
