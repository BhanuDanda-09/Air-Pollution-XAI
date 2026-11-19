"""Livability and exposure assessment routes answering 'Should I live/go here?'"""

from flask import Blueprint, request
from backend.config import Config
from backend.routes.location_routes import get_client_ip, location_limiter
from backend.services.air_quality_service import AirQualityService
from backend.services.livability_service import LivabilityService
from backend.services.prediction_service import PredictionService
from backend.services.weather_service import WeatherService
from backend.utils.response import error_response, success_response

livability_bp = Blueprint("livability", __name__, url_prefix="/api/location")


def _assess_single_coordinates(lat: float, lon: float, health_profile: dict = None) -> dict:
    """Core evaluation engine synthesizing meteorology, ML context, and CAMS reference."""
    weather_info = WeatherService.get_live_weather(lat, lon)
    features = weather_info["features"]

    # Secondary meteorological context using tuned XGBoost
    try:
        prediction_result = PredictionService.predict_single("xgboost", features)
        ml_prediction = {
            "model_key": "xgboost",
            "model_name": prediction_result["model_name"],
            "pm25": prediction_result["prediction"]["pm25"],
            "unit": "µg/m³",
            "cpcb_category": prediction_result["cpcb_category"],
        }
    except Exception as exc:
        ml_prediction = {
            "model_key": "xgboost",
            "pm25": None,
            "error": str(exc),
        }

    reference_info = AirQualityService.get_reference_air_quality(lat, lon)
    livability_eval = LivabilityService.evaluate_livability(
        reference_info=reference_info,
        weather_info=weather_info,
        ml_prediction=ml_prediction,
        health_profile=health_profile,
    )

    return {
        "location": {
            "latitude": lat,
            "longitude": lon,
            "timestamp": weather_info.get("timestamp"),
            "is_delhi_ncr": weather_info["is_delhi_ncr"],
            "validity": weather_info["validity"],
            "validity_warning": weather_info["validity_warning"],
        },
        "livability": livability_eval,
        "meteorological_inputs": {
            "features": features,
            "has_out_of_training_range_inputs": weather_info["has_out_of_training_range_inputs"],
            "input_out_of_training_range_warnings": weather_info["input_out_of_training_range_warnings"],
        },
        "reference_air_quality": reference_info,
    }


@livability_bp.route("/livability", methods=["POST"])
def assess_livability():
    """Evaluate real-world livability and exposure for geographic coordinates."""
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

    try:
        response_data = _assess_single_coordinates(lat, lon, payload.get("health_profile"))
        response_data["scientific_disclaimers"] = {
            "primary_driver_note": (
                "Exposure scores and livability verdicts are anchored primarily on Copernicus Atmosphere "
                "Monitoring Service (CAMS) regional reanalysis and forecasts."
            ),
            "secondary_model_note": (
                "The XGBoost ML estimate is secondary context reflecting surface weather patterns only."
            ),
        }
        return success_response(
            data=response_data,
            message="Livability assessment computed successfully.",
        )
    except Exception as exc:
        return error_response(
            message=f"Failed evaluating livability: {str(exc)}",
            code="LIVABILITY_ERROR",
            status_code=502,
        )


@livability_bp.route("/compare-livability", methods=["POST"])
def compare_livability():
    """Compare real-world livability between two geographic locations side-by-side."""
    client_ip = get_client_ip()
    allowed, remaining, retry_after = location_limiter.is_allowed(client_ip)
    if not allowed:
        return error_response(
            message=f"Rate limit exceeded. Try again in {retry_after} seconds.",
            code="RATE_LIMIT_EXCEEDED",
            status_code=429,
        )

    payload = request.get_json(silent=True) or {}
    loc_a = payload.get("location_a") or {}
    loc_b = payload.get("location_b") or {}
    health_profile = payload.get("health_profile")

    for loc, label in [(loc_a, "location_a"), (loc_b, "location_b")]:
        if not isinstance(loc, dict) or "lat" not in loc or "lon" not in loc:
            return error_response(
                message=f"'{label}' must be an object with 'lat' and 'lon'.",
                code="INVALID_LOCATION_PAYLOAD",
                status_code=400,
            )

    try:
        lat_a, lon_a = float(loc_a["lat"]), float(loc_a["lon"])
        lat_b, lon_b = float(loc_b["lat"]), float(loc_b["lon"])
    except (ValueError, TypeError):
        return error_response(
            message="Coordinates must be valid numbers.",
            code="INVALID_COORDINATES",
            status_code=400,
        )

    name_a = str(loc_a.get("name") or "Location A").strip()
    name_b = str(loc_b.get("name") or "Location B").strip()

    try:
        eval_a = _assess_single_coordinates(lat_a, lon_a, health_profile)
        eval_b = _assess_single_coordinates(lat_b, lon_b, health_profile)
    except Exception as exc:
        return error_response(
            message=f"Comparison evaluation failed: {str(exc)}",
            code="EVALUATION_FAILED",
            status_code=502,
        )

    score_a = eval_a["livability"].get("score", 0)
    score_b = eval_b["livability"].get("score", 0)
    pm25_a = eval_a.get("reference_air_quality", {}).get("reference_pm25")
    pm25_b = eval_b.get("reference_air_quality", {}).get("reference_pm25")

    # Winner determination
    if score_a > score_b:
        winner = "location_a"
        winner_name = name_a
        score_diff = score_a - score_b
        summary = (
            f"🏆 {name_a} offers significantly more favorable air quality right now with a livability score "
            f"of {score_a}/100 ({eval_a['livability']['verdict']['label']}) vs. {name_b}'s {score_b}/100 "
            f"({eval_b['livability']['verdict']['label']})."
        )
    elif score_b > score_a:
        winner = "location_b"
        winner_name = name_b
        score_diff = score_b - score_a
        summary = (
            f"🏆 {name_b} offers significantly more favorable air quality right now with a livability score "
            f"of {score_b}/100 ({eval_b['livability']['verdict']['label']}) vs. {name_a}'s {score_a}/100 "
            f"({eval_a['livability']['verdict']['label']})."
        )
    else:
        winner = "tie"
        winner_name = "Tie"
        score_diff = 0
        summary = (
            f"⚖️ Both {name_a} and {name_b} currently share equivalent livability scores of {score_a}/100 "
            f"with identical exposure categories."
        )

    comparison_result = {
        "winner": winner,
        "winner_name": winner_name,
        "score_difference": score_diff,
        "summary": summary,
        "location_a": {
            "name": name_a,
            "latitude": lat_a,
            "longitude": lon_a,
            "score": score_a,
            "verdict": eval_a["livability"]["verdict"],
            "pm25_reference": pm25_a,
            "best_time_today": eval_a["livability"].get("forecast_best_time"),
            "full_assessment": eval_a,
        },
        "location_b": {
            "name": name_b,
            "latitude": lat_b,
            "longitude": lon_b,
            "score": score_b,
            "verdict": eval_b["livability"]["verdict"],
            "pm25_reference": pm25_b,
            "best_time_today": eval_b["livability"].get("forecast_best_time"),
            "full_assessment": eval_b,
        },
    }

    return success_response(
        data=comparison_result,
        message="Location comparison computed successfully.",
    )
