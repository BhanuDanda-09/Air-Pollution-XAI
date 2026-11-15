"""Model metadata and catalogue inspection routes."""

from flask import Blueprint
from backend.config import Config
from backend.models.model_loader import get_model_loader
from backend.utils.response import success_response

model_bp = Blueprint("models", __name__, url_prefix="/api")


@model_bp.route("/models", methods=["GET"])
def get_models():
    """Retrieve detailed metadata, held-out test benchmarks, and availability for all models."""
    loader = get_model_loader()
    live_status = loader.get_status()

    models_list = []
    for model_key, details in Config.MODEL_BENCHMARKS.items():
        is_live = live_status.get(model_key, False)
        item = {
            "key": model_key,
            "display_name": details["display_name"],
            "paradigm": details["paradigm"],
            "available": is_live,
            "status": details["status"],
            "is_best_model": details["is_best"],
            "description": details["description"],
            "test_metrics": (
                {
                    "r2": details["test_r2"],
                    "rmse": details["test_rmse"],
                    "mae": details["test_mae"],
                    "mse": details["test_mse"],
                }
                if details["test_r2"] is not None
                else None
            ),
        }

        # Add explicit scientific reason if blocked
        if not details["is_available"]:
            item["blocking_reason"] = (
                "Dataset lacks genuine sequential timestamps. Training or validating sequential "
                "deep learning architectures (LSTM, Transformer) on cross-sectional or non-timestamped "
                "data induces artificial ordering artifacts."
            )

        models_list.append(item)

    data = {
        "best_model": "xgboost",
        "benchmark_summary": "XGBoost demonstrated top generalization with test R²=0.7455, followed by Random Forest (R²=0.7269) and MLP (R²=0.5408).",
        "models": models_list,
        "input_features": Config.FEATURE_SPECS,
    }

    return success_response(data=data, message="Retrieved model catalogue successfully.")
