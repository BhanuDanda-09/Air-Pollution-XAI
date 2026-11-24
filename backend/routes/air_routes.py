"""All-India Multi-Pollutant Air Quality REST API Routes."""

import logging
from typing import Optional
from flask import Blueprint, jsonify, request

from backend.services.air_quality_service import AirQualityService
from backend.services.city_service import CityService
from backend.services.climatology_service import ClimatologyService
from backend.services.hotspot_service import HotspotService
from backend.services.location_resolver import LocationResolver
from backend.services.multi_pollutant_service import MultiPollutantService
from backend.utils.rate_limiter import InMemoryRateLimiter
from backend.utils.response import error_response, success_response

logger = logging.getLogger(__name__)

air_bp = Blueprint("air", __name__, url_prefix="/api")

# Rate limiter: 60 requests per minute per client IP
rate_limiter = InMemoryRateLimiter(max_requests=60, window_seconds=60)


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


@air_bp.route("/cities", methods=["GET"])
def get_cities():
    """Return catalog of all 45 Indian monitoring and forecasting cities.

    Optional query parameters:
      - q: search filter (name, state, region)
      - limit: maximum results (default 45)
    """
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    q = request.args.get("q", "")
    try:
        limit = min(100, int(request.args.get("limit", 45)))
    except ValueError:
        limit = 45

    if q:
        cities = CityService.search_cities(q, limit=limit)
    else:
        cities = CityService.get_all_cities()[:limit]

    return success_response(
        data={"total": len(cities), "cities": cities},
        message="All-India cities retrieved successfully.",
    )


@air_bp.route("/geocode", methods=["GET"])
def geocode_location():
    """Geocode an Indian city or area query restricted to India subcontinent.

    Query parameter:
      - q: place name (e.g., 'Bengaluru', 'Indore', 'Kochi')
    """
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    q = request.args.get("q", "").strip()
    if not q:
        return error_response(
            message="Query parameter 'q' is required for geocoding.",
            code="MISSING_QUERY",
            status_code=400,
        )

    results = CityService.geocode(q)
    return success_response(
        data={"query": q, "results": results, "count": len(results)},
        message=f"Found {len(results)} locations matching '{q}'.",
    )


@air_bp.route("/air/current", methods=["GET"])
def get_current_air():
    """Fetch current observations and CPCB AQI sub-indices across all 6 pollutants.

    Query parameters:
      - lat, lon: geographic coordinates
      - OR city: city ID from catalog (e.g., 'delhi', 'bengaluru')
    """
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    lat_arg = request.args.get("lat")
    lon_arg = request.args.get("lon")
    city_arg = request.args.get("city")

    lat: Optional[float] = None
    lon: Optional[float] = None

    if city_arg:
        city_info = CityService.get_city_by_id(city_arg)
        if city_info:
            lat = city_info["lat"]
            lon = city_info["lon"]
        else:
            return error_response(
                message=f"City '{city_arg}' not found in catalog.",
                code="CITY_NOT_FOUND",
                status_code=404,
            )
    elif lat_arg is not None and lon_arg is not None:
        try:
            lat = float(lat_arg)
            lon = float(lon_arg)
        except ValueError:
            return error_response(
                message="Latitude and longitude must be valid floating point numbers.",
                code="INVALID_COORDINATES",
                status_code=400,
            )
    else:
        # Default to Delhi central coordinates
        lat = 28.6139
        lon = 77.2090

    # Outside coverage check
    if not CityService.is_within_india(lat, lon):
        cov = CityService.get_coverage_status(lat, lon)
        return error_response(
            message=cov["message"],
            code="OUTSIDE_COVERAGE",
            status_code=422,
            details=cov,
        )

    result = MultiPollutantService.get_current_air(lat, lon)
    if not result.get("success"):
        return error_response(
            message=result.get("message", "Failed to retrieve air quality data."),
            code=result.get("error", "AIR_QUALITY_ERROR"),
            status_code=422 if result.get("error") == "outside_coverage" else 500,
        )

    # Attach precision coverage tier and nearest station
    coverage = LocationResolver.classify_coverage_tier(lat, lon)
    result["coverage"] = coverage
    result["coverage_tier"] = coverage.get("tier_label")
    result["confidence_score"] = coverage.get("confidence_score")
    result["confidence_level"] = coverage.get("confidence_level")
    result["nearest_station"] = coverage.get("nearest_station")

    return success_response(data=result, message="Current multi-pollutant air quality retrieved.")


@air_bp.route("/air/forecast", methods=["POST"])
def get_air_forecast():
    """Generate multi-pollutant forecast with 95% uncertainty error bands.

    Expected JSON body:
      {
        "lat": 28.6139,
        "lon": 77.2090,
        "horizon_hours": 24   # Optional, choices: [1, 6, 24, 72], default: 24
      }
    """
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    payload = request.get_json(silent=True) or {}
    lat_val = payload.get("lat")
    lon_val = payload.get("lon")
    horizon = int(payload.get("horizon_hours", 24))

    if lat_val is None or lon_val is None:
        # Allow query parameters as fallback
        lat_val = request.args.get("lat", 28.6139)
        lon_val = request.args.get("lon", 77.2090)

    try:
        lat = float(lat_val)
        lon = float(lon_val)
    except ValueError:
        return error_response(
            message="Invalid lat/lon coordinate parameters.",
            code="INVALID_COORDINATES",
            status_code=400,
        )

    if not CityService.is_within_india(lat, lon):
        cov = CityService.get_coverage_status(lat, lon)
        return error_response(
            message=cov["message"],
            code="OUTSIDE_COVERAGE",
            status_code=422,
            details=cov,
        )

    forecast_data = MultiPollutantService.get_forecast(lat, lon, horizon_hours=horizon)
    return success_response(data=forecast_data, message=f"{horizon}h multi-pollutant forecast generated.")


@air_bp.route("/air/history", methods=["GET"])
def get_air_history():
    """Fetch past hourly multi-pollutant records for trend visualization.

    Query parameters:
      - lat, lon: coordinates (default: Delhi)
      - days: number of days to retrieve (1-7, default: 7)
    """
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    try:
        lat = float(request.args.get("lat", 28.6139))
        lon = float(request.args.get("lon", 77.2090))
        days = min(7, max(1, int(request.args.get("days", 7))))
    except ValueError:
        return error_response(
            message="Invalid query parameters for history.",
            code="INVALID_PARAMS",
            status_code=400,
        )

    if not CityService.is_within_india(lat, lon):
        cov = CityService.get_coverage_status(lat, lon)
        return error_response(
            message=cov["message"],
            code="OUTSIDE_COVERAGE",
            status_code=422,
            details=cov,
        )

    history_data = MultiPollutantService.get_history(lat, lon, days=days)
    if not history_data.get("success"):
        return error_response(
            message=history_data.get("message", "History retrieval failed."),
            code="HISTORY_ERROR",
            status_code=500,
        )

    return success_response(data=history_data, message="Hourly air history retrieved.")


@air_bp.route("/air/early-warning", methods=["GET"])
def get_early_warning():
    """Retrieve 24-72h CAMS hourly forecast and Poor/Very Poor/Severe early warning advisory.

    Query parameters:
      - lat, lon: coordinates (default: Delhi)
      - horizon_hours: forecast span (24 to 72 hours, default: 72)
    """
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    try:
        lat = float(request.args.get("lat", 28.6139))
        lon = float(request.args.get("lon", 77.2090))
        horizon = min(72, max(24, int(request.args.get("horizon_hours", 72))))
    except ValueError:
        return error_response(
            message="Invalid query parameters for early warning forecast.",
            code="INVALID_PARAMS",
            status_code=400,
        )

    if not CityService.is_within_india(lat, lon):
        cov = CityService.get_coverage_status(lat, lon)
        return error_response(
            message=cov["message"],
            code="OUTSIDE_COVERAGE",
            status_code=422,
            details=cov,
        )

    warning_data = AirQualityService.get_early_warning_forecast(lat, lon, horizon_hours=horizon)
    return success_response(data=warning_data, message="Early warning forecast retrieved successfully.")


@air_bp.route("/air/early-warning/check", methods=["POST"])
def check_early_warnings():
    """On-demand batch early warning check across multiple places or saved locations."""
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    payload = request.get_json(silent=True) or {}
    places = payload.get("places") or payload.get("locations") or []
    if not isinstance(places, list):
        return error_response(
            message="The 'places' field must be a list of location objects.",
            code="INVALID_PAYLOAD",
            status_code=400,
        )

    results = []
    active_warnings = []
    for p in places[:20]: # Limit to 20 places per batch
        try:
            lat = float(p.get("latitude") or p.get("lat", 0))
            lon = float(p.get("longitude") or p.get("lon", 0))
            name = str(p.get("name", "Unknown Location"))
            p_id = p.get("id") or p.get("place_id")

            ew = AirQualityService.get_early_warning_forecast(lat, lon, horizon_hours=72)
            banner = ew.get("banner", {})

            entry = {
                "place_id": p_id,
                "name": name,
                "latitude": lat,
                "longitude": lon,
                "has_warning": banner.get("has_warning", False),
                "severity_level": banner.get("severity_level", "Normal"),
                "trigger_pollutant": banner.get("trigger_pollutant"),
                "expected_start_time": banner.get("expected_start_time"),
                "duration_hours": banner.get("duration_hours", 0),
                "peak_concentration": banner.get("peak_concentration"),
                "banner_message": banner.get("message"),
                "reference_label": "Reference forecast (CAMS)",
            }
            results.append(entry)
            if banner.get("has_warning"):
                active_warnings.append(entry)
        except Exception as exc:
            logger.warning("Early warning check failed for place %s: %s", p, exc)

    return success_response(
        data={
            "total_checked": len(results),
            "warnings_count": len(active_warnings),
            "warnings": active_warnings,
            "active_warnings": active_warnings,
            "places": results,
            "on_demand_timestamp": True,
        },
        message=f"Checked {len(results)} locations; found {len(active_warnings)} active early warning alerts.",
    )


@air_bp.route("/air/interactions", methods=["GET"])
def get_pollutant_interactions():
    """Fetch 7-day multi-pollutant history, Pearson correlation matrix, and chemical readings.

    Query parameters:
      - lat, lon: coordinates (default: Delhi)
      - city: optional city identifier
      - days: history span (default: 7)
    """
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    city_id = request.args.get("city")
    lat_arg = request.args.get("lat")
    lon_arg = request.args.get("lon")

    lat = float(lat_arg) if lat_arg else None
    lon = float(lon_arg) if lon_arg else None

    if city_id and (lat is None or lon is None):
        c = CityService.get_city_by_id(city_id)
        if c:
            lat = c["lat"]
            lon = c["lon"]

    if lat is None or lon is None:
        lat, lon = 28.6139, 77.2090 # Default to Delhi

    if not CityService.is_within_india(lat, lon):
        cov = CityService.get_coverage_status(lat, lon)
        return error_response(
            message=cov["message"],
            code="OUTSIDE_COVERAGE",
            status_code=422,
            details=cov,
        )

    try:
        days = min(7, max(1, int(request.args.get("days", 7))))
    except ValueError:
        days = 7

    data = MultiPollutantService.get_pollutant_interactions(lat, lon, days=days)
    return success_response(data=data, message="Pollutant interactions and correlation matrix computed.")


@air_bp.route("/air/climatology", methods=["GET"])
def get_air_climatology():
    """Retrieve monthly and seasonal air quality norms, best/worst months, and inversion metrics.

    Query parameters:
      - city: city ID (e.g. 'delhi', 'mumbai')
      - OR lat, lon: coordinates
    """
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    city_id = request.args.get("city")
    lat_arg = request.args.get("lat")
    lon_arg = request.args.get("lon")

    lat = float(lat_arg) if lat_arg else None
    lon = float(lon_arg) if lon_arg else None

    result = ClimatologyService.get_city_climatology(city_id=city_id, lat=lat, lon=lon)
    if not result.get("success"):
        return error_response(
            message=result.get("message", "Climatology data not found."),
            code="CLIMATOLOGY_NOT_FOUND",
            status_code=404,
        )

    return success_response(data=result.get("data"), message="City climatology retrieved.")


@air_bp.route("/hotspots", methods=["GET"])
def get_hotspots():
    """Retrieve national exposure rankings and regional hotspot clusters.

    Query parameters:
      - region: filter by 'North', 'South', 'West', 'East', 'Central', 'Northeast'
      - tier: filter by cluster tier (e.g. 'Severe', 'Industrial', 'Coastal', 'Clean')
      - limit: maximum results (default: 45)
    """
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    region = request.args.get("region")
    tier = request.args.get("tier")
    try:
        limit = int(request.args.get("limit", 45))
    except ValueError:
        limit = 45

    hotspots = HotspotService.get_national_hotspots(region=region, tier=tier, limit=limit)
    return success_response(data=hotspots, message="National hotspot rankings retrieved.")


@air_bp.route("/air/<place_id>", methods=["GET"])
def get_place_air(place_id: str):
    """Retrieve full air assessment (current, forecast, climatology, tier, confidence) for place ID or PIN."""
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    p_clean = place_id.strip()
    lat, lon, place_name = None, None, p_clean

    # 1. 6-digit PIN code
    if p_clean.isdigit() and len(p_clean) == 6:
        pin_res = LocationResolver.resolve_pincode(p_clean)
        if pin_res.get("success"):
            lat = pin_res["lat"]
            lon = pin_res["lon"]
            place_name = pin_res.get("place_name")

    # 2. City catalog ID
    if lat is None:
        c_info = CityService.get_city_by_id(p_clean)
        if c_info:
            lat = c_info["lat"]
            lon = c_info["lon"]
            place_name = c_info["name"]

    # 3. Comma-separated coordinates "lat,lon"
    if lat is None and "," in p_clean:
        try:
            parts = p_clean.split(",")
            lat = float(parts[0].strip())
            lon = float(parts[1].strip())
            place_name = f"Location ({round(lat, 2)}, {round(lon, 2)})"
        except ValueError:
            pass

    if lat is None or lon is None:
        # Search places
        matches = LocationResolver.search_places(p_clean, limit=1)
        if matches:
            lat = matches[0]["lat"]
            lon = matches[0]["lon"]
            place_name = matches[0]["name"]
        else:
            return error_response(
                message=f"Place identifier '{place_id}' could not be resolved to coordinates.",
                code="PLACE_NOT_RESOLVED",
                status_code=404,
            )

    if not CityService.is_within_india(lat, lon):
        cov = LocationResolver.classify_coverage_tier(lat, lon)
        return error_response(
            message=cov["explanation"],
            code="OUTSIDE_COVERAGE",
            status_code=422,
            details=cov,
        )

    current_air = MultiPollutantService.get_current_air(lat, lon)
    forecast = MultiPollutantService.get_forecast(lat, lon, horizon_hours=24)
    early_warning = AirQualityService.get_early_warning_forecast(lat, lon, horizon_hours=72)
    climatology = ClimatologyService.get_city_climatology(lat=lat, lon=lon)
    coverage = LocationResolver.classify_coverage_tier(lat, lon)
    hierarchy = LocationResolver.reverse_geocode(lat, lon)

    return success_response(
        data={
            "place_id": place_id,
            "place_name": place_name,
            "latitude": lat,
            "longitude": lon,
            "current_air": current_air,
            "forecast_24h": forecast,
            "early_warning": early_warning,
            "climatology": climatology.get("data"),
            "coverage": coverage,
            "hierarchy": hierarchy if hierarchy.get("success") else None,
        },
        message=f"Complete air assessment for '{place_name}' retrieved successfully.",
    )
