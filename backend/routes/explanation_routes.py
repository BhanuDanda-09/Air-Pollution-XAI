"""Explainable AI (SHAP) feature attribution routes."""

from flask import Blueprint, request
from backend.services.explanation_service import ExplanationService
from backend.services.validation_service import ValidationService
from backend.utils.response import error_response, success_response

explanation_bp = Blueprint("explanation", __name__, url_prefix="/api")


@explanation_bp.route("/explain", methods=["POST"])
def explain():
    """Compute local SHAP feature attributions for a given model and input instance.

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
        result = ExplanationService.explain_instance(model_name.strip().lower(), clean_feats)
        return success_response(data=result, message="SHAP local explanation computed successfully.")
    except Exception as exc:
        return error_response(
            message=f"Explanation failure: {str(exc)}",
            code="EXPLANATION_ERROR",
            status_code=500,
        )
