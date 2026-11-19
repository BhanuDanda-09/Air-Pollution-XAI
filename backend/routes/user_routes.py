"""User persistence routes for health profiles, saved places, and history tracking."""

from flask import Blueprint, request
from backend.database import db
from backend.models.db_models import AssessmentHistory, HealthProfile, SavedLocation, User
from backend.utils.auth import token_required
from backend.utils.response import error_response, success_response

user_bp = Blueprint("user", __name__, url_prefix="/api/user")


def _resolve_user_id():
    """Extract numeric user_id or return None for demo/unregistered session."""
    raw = request.user_id
    if isinstance(raw, int):
        return raw
    if isinstance(raw, str) and raw.isdigit():
        return int(raw)
    return None


# ---------------------------------------------------------------------------
# 1. Health Profile Persistence
# ---------------------------------------------------------------------------

@user_bp.route("/profile", methods=["GET"])
@token_required
def get_user_profile():
    """Get the authenticated user's persistent health profile."""
    uid = _resolve_user_id()
    if uid is None:
        return success_response(data={"health_profile": None}, message="No registered profile found.")

    profile = HealthProfile.query.filter_by(user_id=uid).first()
    if not profile:
        return success_response(data={"health_profile": None}, message="No profile found.")

    return success_response(
        data={"health_profile": profile.to_dict()},
        message="User health profile retrieved.",
    )


@user_bp.route("/profile", methods=["PUT"])
@token_required
def update_user_profile():
    """Update or create the authenticated user's persistent health profile."""
    uid = _resolve_user_id()
    if uid is None:
        return error_response(
            message="Persistent health profile requires an authenticated user account.",
            code="ACCOUNT_REQUIRED",
            status_code=400,
        )

    payload = request.get_json(silent=True) or {}

    profile = HealthProfile.query.filter_by(user_id=uid).first()
    if not profile:
        profile = HealthProfile(user_id=uid)
        db.session.add(profile)

    if "age_group" in payload:
        age = str(payload["age_group"]).lower()
        if age in ("child", "adult", "senior"):
            profile.age_group = age

    if "asthma" in payload:
        profile.asthma = bool(payload["asthma"])
    elif "has_respiratory_condition" in payload:
        profile.asthma = bool(payload["has_respiratory_condition"])

    if "has_heart_condition" in payload:
        profile.has_heart_condition = bool(payload["has_heart_condition"])

    if "is_pregnant" in payload:
        profile.is_pregnant = bool(payload["is_pregnant"])

    if "is_outdoor_worker" in payload:
        profile.is_outdoor_worker = bool(payload["is_outdoor_worker"])

    try:
        db.session.commit()
        return success_response(
            data={"health_profile": profile.to_dict()},
            message="Health profile updated successfully.",
        )
    except Exception as exc:
        db.session.rollback()
        return error_response(
            message=f"Failed to save profile: {str(exc)}",
            code="DATABASE_ERROR",
            status_code=500,
        )


# ---------------------------------------------------------------------------
# 2. Saved Places ("My Locations") CRUD
# ---------------------------------------------------------------------------

@user_bp.route("/locations", methods=["GET"])
@token_required
def get_saved_locations():
    """List all saved bookmarked places for the current user."""
    uid = _resolve_user_id()
    if uid is None:
        return success_response(data={"locations": []}, message="No saved locations.")

    locations = (
        SavedLocation.query.filter_by(user_id=uid)
        .order_by(SavedLocation.created_at.desc())
        .all()
    )
    return success_response(
        data={"locations": [loc.to_dict() for loc in locations]},
        message="Saved locations retrieved.",
    )


@user_bp.route("/locations", methods=["POST"])
@token_required
def add_saved_location():
    """Add a new favorite/saved location."""
    uid = _resolve_user_id()
    if uid is None:
        return error_response(
            message="Saving locations requires an authenticated user account.",
            code="ACCOUNT_REQUIRED",
            status_code=400,
        )

    payload = request.get_json(silent=True) or {}
    label = str(payload.get("label", "Saved Place")).strip()
    name = str(payload.get("name", "")).strip()
    lat = payload.get("latitude") or payload.get("lat")
    lon = payload.get("longitude") or payload.get("lon")

    if not name or lat is None or lon is None:
        return error_response(
            message="Fields 'name', 'latitude', and 'longitude' are required.",
            code="MISSING_FIELDS",
            status_code=400,
        )

    try:
        lat_float = float(lat)
        lon_float = float(lon)
    except (ValueError, TypeError):
        return error_response(
            message="Coordinates must be numeric values.",
            code="INVALID_COORDINATES",
            status_code=400,
        )

    try:
        loc = SavedLocation(
            user_id=uid,
            label=label or "Saved Place",
            name=name,
            latitude=lat_float,
            longitude=lon_float,
        )
        db.session.add(loc)
        db.session.commit()

        return success_response(
            data={"location": loc.to_dict()},
            message="Location saved successfully.",
            status_code=201,
        )
    except Exception as exc:
        db.session.rollback()
        return error_response(
            message=f"Failed to save location: {str(exc)}",
            code="DATABASE_ERROR",
            status_code=500,
        )


@user_bp.route("/locations/<int:location_id>", methods=["DELETE"])
@token_required
def delete_saved_location(location_id: int):
    """Delete a saved location."""
    uid = _resolve_user_id()
    if uid is None:
        return error_response(message="Saved location not found.", code="NOT_FOUND", status_code=404)

    loc = SavedLocation.query.filter_by(id=location_id, user_id=uid).first()
    if not loc:
        return error_response(
            message="Saved location not found.",
            code="NOT_FOUND",
            status_code=404,
        )

    try:
        db.session.delete(loc)
        db.session.commit()
        return success_response(data={"deleted_id": location_id}, message="Location removed.")
    except Exception as exc:
        db.session.rollback()
        return error_response(
            message=f"Failed to delete location: {str(exc)}",
            code="DATABASE_ERROR",
            status_code=500,
        )


# ---------------------------------------------------------------------------
# 3. Assessment History Log
# ---------------------------------------------------------------------------

@user_bp.route("/history", methods=["GET"])
@token_required
def get_assessment_history():
    """Retrieve recent assessment history for the user."""
    uid = _resolve_user_id()
    if uid is None:
        return success_response(data={"history": []}, message="No assessment history.")

    limit = min(50, int(request.args.get("limit", 20)))
    records = (
        AssessmentHistory.query.filter_by(user_id=uid)
        .order_by(AssessmentHistory.timestamp.desc())
        .limit(limit)
        .all()
    )

    return success_response(
        data={"history": [r.to_dict() for r in records]},
        message="Assessment history retrieved.",
    )


@user_bp.route("/history", methods=["POST"])
@token_required
def record_assessment():
    """Record an assessment event to user history."""
    uid = _resolve_user_id()
    if uid is None:
        # Non-DB / demo user: acknowledge without persisting
        return success_response(
            data={"history_entry": None, "persisted": False},
            message="Assessment acknowledged for guest session.",
        )

    payload = request.get_json(silent=True) or {}
    lat = payload.get("latitude") or payload.get("lat")
    lon = payload.get("longitude") or payload.get("lon")
    verdict = payload.get("verdict", "Good to go")

    if lat is None or lon is None:
        return error_response(
            message="Coordinates are required to record history.",
            code="MISSING_COORDINATES",
            status_code=400,
        )

    try:
        hist = AssessmentHistory(
            user_id=uid,
            latitude=float(lat),
            longitude=float(lon),
            place_name=payload.get("place_name") or payload.get("name"),
            score=payload.get("score"),
            verdict=verdict,
            pm25_reference=payload.get("pm25_reference"),
            pm25_model=payload.get("pm25_model"),
        )
        db.session.add(hist)
        db.session.commit()

        return success_response(
            data={"history_entry": hist.to_dict(), "persisted": True},
            message="Assessment logged to history.",
            status_code=201,
        )
    except Exception as exc:
        db.session.rollback()
        return error_response(
            message=f"Failed to record history: {str(exc)}",
            code="DATABASE_ERROR",
            status_code=500,
        )
