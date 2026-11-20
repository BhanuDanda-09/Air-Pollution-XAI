"""Explainable AI (SHAP & LIME) feature attribution routes."""

import json
from pathlib import Path
from flask import Blueprint, request
from backend.services.explanation_service import ExplanationService
from backend.services.validation_service import ValidationService
from backend.utils.response import error_response, success_response

explanation_bp = Blueprint("explanation", __name__, url_prefix="/api")

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SHAP_JSON_PATH = PROJECT_ROOT / "results" / "multi_pollutant_shap.json"


def _load_multi_pollutant_shap():
    if SHAP_JSON_PATH.exists():
        try:
            with open(SHAP_JSON_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return None


@explanation_bp.route("/explain", methods=["GET", "POST"])
def explain():
    """Compute local SHAP feature attributions or return multi-pollutant explanations.

    Supports:
    1. GET /api/explain?pollutant=PM2.5: Multi-pollutant global importance & representative atmospheric scenarios.
    2. POST /api/explain with {"model": "xgboost", "features": {...}}: Legacy single-instance SHAP attribution.
    3. POST /api/explain with {"pollutant": "PM2.5"}: Multi-pollutant SHAP attribution.
    """
    if request.method == "GET":
        pol = request.args.get("pollutant", "").strip().upper()
        shap_data = _load_multi_pollutant_shap()
        if not shap_data:
            return error_response(
                message="Multi-pollutant SHAP explanations not yet generated.",
                code="SHAP_NOT_FOUND",
                status_code=404,
            )

        if pol and pol in shap_data.get("global_importance", {}):
            return success_response(
                data={
                    "metadata": shap_data.get("metadata"),
                    "pollutant": pol,
                    "global_importance": shap_data["global_importance"][pol],
                    "representative_scenarios": shap_data.get("representative_scenarios"),
                },
                message=f"SHAP feature attributions for {pol} retrieved.",
            )

        return success_response(data=shap_data, message="All-India multi-pollutant SHAP explanations retrieved.")

    # POST handling
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return error_response(
            message="Request body must be a valid JSON object.",
            code="INVALID_JSON",
            status_code=400,
        )

    # 1. Multi-pollutant payload check
    if "pollutant" in payload and "features" not in payload:
        pol = payload.get("pollutant", "").strip().upper()
        shap_data = _load_multi_pollutant_shap()
        if shap_data and pol in shap_data.get("global_importance", {}):
            return success_response(
                data={
                    "metadata": shap_data.get("metadata"),
                    "pollutant": pol,
                    "global_importance": shap_data["global_importance"][pol],
                    "representative_scenarios": shap_data.get("representative_scenarios"),
                },
                message=f"SHAP feature attributions for {pol} retrieved.",
            )

    # 2. Legacy model + features validation
    model_name = payload.get("model")
    is_valid_model, err_msg, err_code, err_details, status_code = ValidationService.validate_model_selection(model_name)
    if not is_valid_model:
        return error_response(message=err_msg, code=err_code, details=err_details, status_code=status_code)

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
