"""Prediction and comparison routes."""

from flask import Blueprint, request
from backend.services.prediction_service import PredictionService
from backend.services.validation_service import ValidationService
from backend.utils.response import error_response, success_response

prediction_bp = Blueprint("prediction", __name__, url_prefix="/api")


@prediction_bp.route("/predict", methods=["POST"])
def predict():
    """Predict PM2.5 concentration using a selected ML/DL model.

    Expected JSON body:
    {
        "model": "xgboost",
        "features": {
            "RH": 55.0,
            "WD": 180.0,
            "SR": 350.0,
            "BP": 745.0,
            "AT": 28.0
        }
    }
    """
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return error_response(
            message="Request body must be a valid JSON object.",
            code="INVALID_JSON",
            status_code=400,
        )

    # Validate model selection
    model_name = payload.get("model")
    is_valid_model, err_msg, err_code, err_details, status_code = ValidationService.validate_model_selection(model_name)
    if not is_valid_model:
        return error_response(message=err_msg, code=err_code, details=err_details, status_code=status_code)

    # Validate meteorological features
    is_valid_feat, clean_feats, err_msg, err_code, err_details, status_code = ValidationService.extract_and_validate_features(payload)
    if not is_valid_feat:
        return error_response(message=err_msg, code=err_code, details=err_details, status_code=status_code)

    try:
        result = PredictionService.predict_single(model_name.strip().lower(), clean_feats)
        return success_response(data=result, message="PM2.5 prediction calculated successfully.")
    except Exception as exc:
        return error_response(
            message=f"Inference failure: {str(exc)}",
            code="INFERENCE_ERROR",
            status_code=500,
        )


@prediction_bp.route("/compare", methods=["POST"])
def compare():
    """Run all available models (Random Forest, XGBoost, MLP) on identical meteorological features.

    Expected JSON body:
    {
        "features": {
            "RH": 55.0,
            "WD": 180.0,
            "SR": 350.0,
            "BP": 745.0,
            "AT": 28.0
        }
    }
    """
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return error_response(
            message="Request body must be a valid JSON object.",
            code="INVALID_JSON",
            status_code=400,
        )

    is_valid_feat, clean_feats, err_msg, err_code, err_details, status_code = ValidationService.extract_and_validate_features(payload)
    if not is_valid_feat:
        return error_response(message=err_msg, code=err_code, details=err_details, status_code=status_code)

    try:
        result = PredictionService.compare_all(clean_feats)
        return success_response(data=result, message="Multi-model comparison completed successfully.")
    except Exception as exc:
        return error_response(
            message=f"Comparison failure: {str(exc)}",
            code="COMPARISON_ERROR",
            status_code=500,
        )
