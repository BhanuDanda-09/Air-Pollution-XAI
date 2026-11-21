"""Health check and service status routes."""

from flask import Blueprint, jsonify
from backend.models.model_loader import get_model_loader

health_bp = Blueprint("health", __name__, url_prefix="/api")


@health_bp.route("/health", methods=["GET"])
def health_check():
    """System health check, status, and model availability flags."""
    loader = get_model_loader()
    model_status = loader.get_status()

    # Determine overall status
    is_healthy = model_status.get("xgboost", False) or model_status.get("random_forest", False)

    response_data = {
        "status": "healthy" if is_healthy else "degraded",
        "app_name": "AirIQ India Backend",
        "version": "1.0.0",
        "models_available": {
            "random_forest": model_status.get("random_forest", False),
            "xgboost": model_status.get("xgboost", False),
            "mlp": model_status.get("mlp", False),
            "lstm": False,
            "transformer": False,
        },
    }

    status_code = 200 if is_healthy else 503
    return jsonify(response_data), status_code
