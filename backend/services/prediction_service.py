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
            model = loader.rf_model
            raw_pred = float(model.predict(df)[0])
        elif model_key == "xgboost":
            model = loader.xgb_model
            raw_pred = float(model.predict(df)[0])
        elif model_key == "mlp":
            scaler = loader.mlp_scaler
            scaled = scaler.transform(df)
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

        Returns:
            Dictionary comparing all model predictions alongside held-out test benchmarks.
        """
        predictions = {}
        for key in ["random_forest", "xgboost", "mlp"]:
            single = cls.predict_single(key, features)
            bench = Config.MODEL_BENCHMARKS.get(key, {})
            predictions[key] = {
                "display_name": bench.get("display_name"),
                "paradigm": bench.get("paradigm"),
                "pm25": single["prediction"]["pm25"],
                "unit": "µg/m³",
                "cpcb_category": single["cpcb_category"]["category"],
                "color": single["cpcb_category"]["color"],
                "test_benchmark": {
                    "r2": bench.get("test_r2"),
                    "rmse": bench.get("test_rmse"),
                    "mae": bench.get("test_mae"),
                },
                "is_best_model": bench.get("is_best", False),
            }

        return {
            "features": features,
            "predictions": predictions,
            "best_model": "xgboost",
            "comparison_summary": (
                "XGBoost is the top-performing model with R²=0.7455 and RMSE=36.74 µg/m³ on the 406 "
                "held-out test samples. Random Forest achieved R²=0.7269, while MLP achieved R²=0.5408. "
                "Time-series models (LSTM, Transformer) remain scientifically blocked pending sequential timestamps."
            ),
            "scientific_disclaimer": Config.GENERAL_DISCLAIMER,
        }
