"""Health-Personalised Relocation Advisor REST API Routes."""

import logging
from flask import Blueprint, request

from backend.services.city_service import CityService
from backend.services.risk_service import RiskService
from backend.utils.rate_limiter import InMemoryRateLimiter
from backend.utils.response import error_response, success_response

logger = logging.getLogger(__name__)

relocation_bp = Blueprint("relocation", __name__, url_prefix="/api/relocation")
rate_limiter = InMemoryRateLimiter(max_requests=40, window_seconds=60)


def _check_rate_limit():
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1").split(",")[0].strip()
    allowed, remaining, retry_after = rate_limiter.is_allowed(client_ip)
    if not allowed:
        return error_response(
            message=f"Rate limit exceeded. Please retry in {retry_after} seconds.",
            code="RATE_LIMIT_EXCEEDED",
            status_code=429,
        )
    return None


@relocation_bp.route("/compare", methods=["POST"])
def compare_relocation():
    """Compare origin living location with 1-4 destination candidate places.

    Expected JSON body:
      {
        "origin": { "name": "Delhi", "lat": 28.6139, "lon": 77.2090 },
        "destinations": [
          { "name": "Bengaluru", "lat": 12.9716, "lon": 77.5946 },
          { "name": "Kochi", "lat": 9.9312, "lon": 76.2673 }
        ],
        "profile": {
          "conditions": ["asthma"],
          "household": "children",
          "is_pregnant": false,
          "outdoor_exercise_hours": 5.0,
          "commute_mode": "two_wheeler"
        }
      }
    """
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return error_response(
            message="Request body must be a valid JSON object.",
            code="INVALID_JSON",
            status_code=400,
        )

    origin = payload.get("origin")
    destinations = payload.get("destinations")
    profile = payload.get("profile", {})

    if not isinstance(origin, dict) or "lat" not in origin or "lon" not in origin:
        return error_response(
            message="Valid 'origin' object with 'lat' and 'lon' is required.",
            code="MISSING_ORIGIN",
            status_code=400,
        )

    if not isinstance(destinations, list) or len(destinations) == 0:
        return error_response(
            message="At least one candidate destination is required.",
            code="MISSING_DESTINATIONS",
            status_code=400,
        )

    # Validate coordinate boundaries for origin
    try:
        o_lat = float(origin["lat"])
        o_lon = float(origin["lon"])
    except ValueError:
        return error_response(message="Origin coordinates must be numeric.", code="INVALID_COORDINATES", status_code=400)

    if not CityService.is_within_india(o_lat, o_lon):
        return error_response(
            message="Origin location is outside India geographical bounds.",
            code="OUTSIDE_COVERAGE",
            status_code=422,
        )

    # Validate destinations
    clean_destinations = []
    for d in destinations[:4]:
        if isinstance(d, dict) and "lat" in d and "lon" in d:
            try:
                d_lat = float(d["lat"])
                d_lon = float(d["lon"])
                if CityService.is_within_india(d_lat, d_lon):
                    clean_destinations.append({
                        "name": d.get("name", "Destination"),
                        "lat": d_lat,
                        "lon": d_lon,
                    })
            except ValueError:
                continue

    if not clean_destinations:
        return error_response(
            message="No valid destinations within India were provided.",
            code="NO_VALID_DESTINATIONS",
            status_code=422,
        )

    try:
        report = RiskService.compare_relocation(
            origin={"name": origin.get("name", "Current Location"), "lat": o_lat, "lon": o_lon},
            destinations=clean_destinations,
            profile=profile if isinstance(profile, dict) else {},
        )
        return success_response(data=report, message="Relocation comparison generated successfully.")
    except Exception as exc:
        logger.error("Error executing relocation comparison: %s", exc)
        return error_response(
            message=f"Failed to generate relocation comparison: {str(exc)}",
            code="RELOCATION_ERROR",
            status_code=500,
        )
