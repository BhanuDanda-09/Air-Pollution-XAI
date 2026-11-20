"""All-India Location Hierarchy and Coverage Tier REST API Routes."""

import logging
from typing import Optional
from flask import Blueprint, jsonify, request

from backend.services.location_resolver import LocationResolver
from backend.utils.rate_limiter import InMemoryRateLimiter
from backend.utils.response import error_response, success_response

logger = logging.getLogger(__name__)

geo_bp = Blueprint("geo", __name__, url_prefix="/api")

# Rate limiter: 120 requests per minute per IP for autocomplete and geocoding
rate_limiter = InMemoryRateLimiter(max_requests=120, window_seconds=60)


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


@geo_bp.route("/geo/states", methods=["GET"])
def get_states():
    """Retrieve all 36 States and Union Territories of India with administrative metadata."""
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    states = LocationResolver.get_states()
    return success_response(
        data={"total": len(states), "states": states},
        message="All 36 States and Union Territories retrieved successfully.",
    )


@geo_bp.route("/geo/districts", methods=["GET"])
def get_districts():
    """Retrieve districts for a specified State or Union Territory.

    Query parameter:
      - state: State name (e.g. 'Telangana', 'Maharashtra', 'Delhi')
    """
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    state = request.args.get("state", "").strip()
    if not state:
        return error_response(
            message="Query parameter 'state' is required.",
            code="MISSING_STATE_PARAMETER",
            status_code=400,
        )

    districts = LocationResolver.get_districts(state)
    return success_response(
        data={"state": state, "total": len(districts), "districts": districts},
        message=f"Retrieved {len(districts)} districts for {state}.",
    )


@geo_bp.route("/geo/places", methods=["GET"])
def search_places():
    """Search villages, towns, cities, or localities with optional State/District filtering.

    Query parameters:
      - q: search query (e.g. 'Hanamkonda', 'Koramangala', 'Andheri')
      - state: optional state filter
      - district: optional district filter
      - limit: max results (default: 10, max: 25)
    """
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    q = request.args.get("q", "").strip()
    if not q:
        return error_response(
            message="Query parameter 'q' is required for place search.",
            code="MISSING_QUERY",
            status_code=400,
        )

    state = request.args.get("state")
    district = request.args.get("district")
    try:
        limit = min(25, max(1, int(request.args.get("limit", 10))))
    except ValueError:
        limit = 10

    results = LocationResolver.search_places(query=q, state=state, district=district, limit=limit)
    return success_response(
        data={"query": q, "state": state, "district": district, "count": len(results), "places": results},
        message=f"Found {len(results)} places matching '{q}'.",
    )


@geo_bp.route("/geo/pincode/<pin>", methods=["GET"])
def resolve_pincode(pin: str):
    """Resolve an Indian 6-digit postal PIN code to administrative hierarchy, coordinates, and tier.

    URL parameter:
      - pin: 6-digit PIN code (e.g. 506001, 110001, 560034)
    """
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    result = LocationResolver.resolve_pincode(pin)
    if not result.get("success"):
        return error_response(
            message=result.get("message", "PIN code lookup failed."),
            code=result.get("error", "PIN_NOT_FOUND"),
            status_code=400,
        )

    return success_response(data=result, message="PIN code resolved successfully.")


@geo_bp.route("/geo/reverse", methods=["GET"])
def reverse_geocode():
    """Reverse geocode geographic coordinates to administrative hierarchy with Coverage Tier.

    Query parameters:
      - lat: Latitude
      - lon: Longitude
    """
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    lat_arg = request.args.get("lat")
    lon_arg = request.args.get("lon")
    if lat_arg is None or lon_arg is None:
        return error_response(
            message="Both 'lat' and 'lon' query parameters are required.",
            code="MISSING_COORDINATES",
            status_code=400,
        )

    try:
        lat = float(lat_arg)
        lon = float(lon_arg)
    except ValueError:
        return error_response(
            message="Coordinates 'lat' and 'lon' must be valid numbers.",
            code="INVALID_COORDINATES",
            status_code=400,
        )

    result = LocationResolver.reverse_geocode(lat, lon)
    if not result.get("success"):
        return error_response(
            message=result.get("message", "Reverse geocoding failed."),
            code=result.get("error", "REVERSE_GEO_ERROR"),
            status_code=422 if result.get("error") == "OUTSIDE_INDIA" else 500,
            details=result.get("coverage"),
        )

    return success_response(data=result, message="Reverse geocoding resolved successfully.")


@geo_bp.route("/districts/ranking", methods=["GET"])
def get_district_rankings():
    """Retrieve comprehensive air quality rankings across all Indian districts."""
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    rankings = LocationResolver.get_district_rankings()
    return success_response(
        data=rankings,
        message=f"National rankings across {rankings.get('total_districts')} districts retrieved successfully.",
    )


@geo_bp.route("/states/summary", methods=["GET"])
def get_states_summary():
    """Retrieve state-level air quality summaries, average AQI, and station counts."""
    rl_err = _check_rate_limit()
    if rl_err:
        return rl_err

    summary = LocationResolver.get_states_summary()
    return success_response(
        data=summary,
        message=f"Summary for {summary.get('total_states_uts')} States and UTs retrieved successfully.",
    )
