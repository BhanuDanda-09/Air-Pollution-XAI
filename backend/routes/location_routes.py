"""Location assessment routes combining live weather, XGBoost PM2.5, SHAP, and Reference PM2.5."""

from flask import Blueprint, request
from backend.config import Config
from backend.services.air_quality_service import AirQualityService
from backend.services.explanation_service import ExplanationService
from backend.services.prediction_service import PredictionService
from backend.services.weather_service import WeatherService
from backend.utils.rate_limiter import InMemoryRateLimiter
from backend.utils.response import error_response, success_response

location_bp = Blueprint("location", __name__, url_prefix="/api/location")

# Global singleton rate limiter: 30 requests/minute per IP
location_limiter = InMemoryRateLimiter(
    max_requests=Config.LOCATION_RATE_LIMIT_MAX,
    window_seconds=60,
)


def get_client_ip() -> str:
    """Extract client IP address, trusting the last entry added by the upstream reverse proxy.

    Security Note:
        The first entry in X-Forwarded-For can be spoofed by a malicious client.
        Trusted reverse proxies (Render edge / Cloudflare) append the genuine remote IP
        to the end of the X-Forwarded-For chain. Therefore, we parse the last entry.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        parts = [p.strip() for p in forwarded.split(",") if p.strip()]
        if parts:
            return parts[-1]
    return request.remote_addr or "127.0.0.1"


@location_bp.route("/assess", methods=["POST"])
def assess_location():
    """Perform real-world air quality assessment for geographic coordinates.

    Expected JSON body:
    {
        "lat": 28.6139,
        "lon": 77.2090
    }

    Returns:
        Structured evaluation containing:
        - Model Estimated PM2.5 & CPCB Health Band
        - Reference PM2.5 (CAMS model data)
        - Discrepancy comparison (Model vs. Reference)
        - Live Meteorological Features (with hPa->mmHg conversion)
        - Geographic validity warning (Delhi-NCR boundary check)
        - Out-of-training-range input warnings (No silent clamping)
        - Local SHAP Meteorological Feature Attributions
    """
    client_ip = get_client_ip()
    allowed, remaining, retry_after = location_limiter.is_allowed(client_ip)
    if not allowed:
        return error_response(
            message=f"Too many requests from your IP. Limit is 30 assessments per minute. Try again in {retry_after} seconds.",
            code="RATE_LIMIT_EXCEEDED",
            details={"retry_after": retry_after, "client_ip": client_ip},
            status_code=429,
        )

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return error_response(
            message="Request body must be a valid JSON object with 'lat' and 'lon'.",
            code="INVALID_JSON",
            status_code=400,
        )

    lat_raw = payload.get("lat")
    lon_raw = payload.get("lon")

    if lat_raw is None or lon_raw is None:
        return error_response(
            message="Both 'lat' (latitude) and 'lon' (longitude) are required.",
            code="MISSING_COORDINATES",
            status_code=400,
        )

    try:
        lat = float(lat_raw)
        lon = float(lon_raw)
    except (ValueError, TypeError):
        return error_response(
            message="Coordinates 'lat' and 'lon' must be valid numerical values.",
            code="INVALID_COORDINATES",
            status_code=400,
        )

    if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
        return error_response(
            message=f"Coordinates out of physical bounds: lat must be [-90, 90], lon [-180, 180]. Received: ({lat}, {lon})",
            code="COORDINATES_OUT_OF_BOUNDS",
            status_code=400,
        )

    # 1. Fetch live meteorological features via Open-Meteo
    try:
        weather_info = WeatherService.get_live_weather(lat, lon)
    except Exception as exc:
        return error_response(
            message=f"Failed retrieving live weather for coordinates ({lat}, {lon}): {str(exc)}",
            code="WEATHER_SERVICE_ERROR",
            status_code=502,
        )

    features = weather_info["features"]

    # 2. Run model prediction using top-performing tuned XGBoost model
    try:
        prediction_result = PredictionService.predict_single("xgboost", features)
    except Exception as exc:
        return error_response(
            message=f"Model inference failed on live features: {str(exc)}",
            code="INFERENCE_ERROR",
            status_code=500,
        )

    model_pm25 = prediction_result["prediction"]["pm25"]

    # 3. Compute local SHAP meteorological feature attributions
    shap_data = None
    try:
        shap_res = ExplanationService.explain_instance("xgboost", features)
        shap_data = {
            "base_value": shap_res["base_value"],
            "attributions": shap_res["attributions"],
            "ranked_importance": shap_res["ranked_importance"],
            "explainer_type": shap_res["explainer_type"],
            "attribution_focus": "Meteorological Feature Attribution (Weather impact on model, NOT chemical source emissions)",
        }
    except Exception as exc:
        # Non-fatal: if SHAP fails, still return predictions
        shap_data = {
            "error": f"SHAP explanation calculation failed: {str(exc)}",
            "attributions": [],
        }

    # 4. Fetch Reference PM2.5 (CAMS model data) with resilience fallback
    reference_info = AirQualityService.get_reference_air_quality(lat, lon)
    ref_pm25 = reference_info.get("reference_pm25")

    # 5. Calculate discrepancy honestly without model tuning
    comparison = None
    if ref_pm25 is not None:
        delta = round(model_pm25 - ref_pm25, 2)
        comparison = {
            "model_estimate_pm25": model_pm25,
            "reference_pm25": ref_pm25,
            "reference_label": reference_info.get("reference_label", "Reference PM2.5 (CAMS model data)"),
            "reference_source": reference_info.get("reference_source"),
            "delta": delta,
            "delta_direction": "higher" if delta > 0 else ("lower" if delta < 0 else "identical"),
            "discrepancy_explanation": (
                f"The XGBoost model estimate is {abs(delta)} µg/m³ "
                f"{'higher than' if delta > 0 else 'lower than'} the {reference_info.get('reference_label')}. "
                "Discrepancies arise because the local ML model predicts particulate concentrations strictly "
                "from surface weather patterns, whereas CAMS regional reanalysis incorporates satellite AOD "
                "and chemical transport equations."
            ),
        }

    response_data = {
        "location": {
            "latitude": lat,
            "longitude": lon,
            "timestamp": weather_info.get("timestamp"),
            "is_delhi_ncr": weather_info["is_delhi_ncr"],
            "validity": weather_info["validity"],
            "validity_warning": weather_info["validity_warning"],
        },
        "model_prediction": {
            "model_key": "xgboost",
            "model_name": prediction_result["model_name"],
            "pm25": model_pm25,
            "unit": "µg/m³",
            "cpcb_category": prediction_result["cpcb_category"],
        },
        "reference_air_quality": reference_info,
        "model_vs_reference_comparison": comparison,
        "meteorological_inputs": {
            "features": features,
            "raw_units": {
                "RH": "%",
                "WD": "° (from North)",
                "SR": "W/m²",
                "BP": "mmHg (converted from hPa: hPa * 0.750062)",
                "AT": "°C",
            },
            "has_out_of_training_range_inputs": weather_info["has_out_of_training_range_inputs"],
            "input_out_of_training_range_warnings": weather_info["input_out_of_training_range_warnings"],
        },
        "shap_attributions": shap_data,
        "scientific_disclaimers": {
            "regional_limitation": (
                "This model was trained exclusively on historical Delhi meteorological monitoring data. "
                "When queried for locations outside Delhi-NCR, predictions represent an unvalidated geographic extrapolation."
            ),
            "attribution_distinction": (
                "Feature attributions (SHAP) explain which surface weather indicators drove the model's numerical output. "
                "This does NOT constitute chemical or physical emission source apportionment (e.g. vehicles vs. crop burning)."
            ),
        },
    }

    return success_response(
        data=response_data,
        message="Location air quality assessment completed successfully.",
    )
