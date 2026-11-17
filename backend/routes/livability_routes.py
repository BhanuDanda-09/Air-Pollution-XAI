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


@livability_bp.route("/livability", methods=["POST"])
def assess_livability():
    """Evaluate real-world livability and exposure for geographic coordinates.

    Expected JSON body:
    {
        "lat": 28.6139,
        "lon": 77.2090
    }

    Core Scientific Rule:
        The verdict is driven primarily by Reference PM2.5 (CAMS model data) + forecast.
        The ML model estimate is secondary context only (trained on Delhi winter data: AT 11-23°C).
        If reference is unavailable, returns low confidence verdict and refuses silent fallback.
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

    # 2. Run model prediction using top-performing tuned XGBoost model (as secondary meteorological context)
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

    # 3. Fetch Reference PM2.5 (CAMS model data) + forecast
    reference_info = AirQualityService.get_reference_air_quality(lat, lon)

    # 4. Synthesize Livability Assessment using strict primary vs secondary rules
    health_profile = payload.get("health_profile")
    livability_eval = LivabilityService.evaluate_livability(
        reference_info=reference_info,
        weather_info=weather_info,
        ml_prediction=ml_prediction,
        health_profile=health_profile,
    )

    response_data = {
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
        "scientific_disclaimers": {
            "primary_driver_note": (
                "Exposure scores and livability verdicts are anchored primarily on Copernicus Atmosphere "
                "Monitoring Service (CAMS) regional reanalysis and forecasts."
            ),
            "secondary_model_note": (
                "The XGBoost ML estimate is secondary context reflecting surface weather patterns only. "
                "Because the model was trained exclusively on Delhi winter data, it is not used as the primary "
                "basis for livability verdicts."
            ),
        },
    }

    return success_response(
        data=response_data,
        message="Livability assessment computed successfully.",
    )
