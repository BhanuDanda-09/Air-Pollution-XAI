"""User persistence routes for health profiles, saved places, and history tracking."""

import logging
from flask import Blueprint, request
from backend.database import db
from backend.models.db_models import (
    AlertPreference,
    AssessmentHistory,
    HealthProfile,
    SavedLocation,
    User,
)
from backend.services.air_quality_service import AirQualityService
from backend.utils.auth import token_required
from backend.utils.response import error_response, success_response

logger = logging.getLogger(__name__)

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

    user = db.session.get(User, uid)
    if not user:
        return error_response(message="User account does not exist or has been deleted.", code="USER_NOT_FOUND", status_code=401)

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

    import json
    if "conditions" in payload and isinstance(payload["conditions"], list):
        profile.conditions_json = json.dumps(payload["conditions"])
        if "asthma" in payload["conditions"]:
            profile.asthma = True
        if "cardiovascular_disease" in payload["conditions"]:
            profile.has_heart_condition = True

    if "household" in payload:
        profile.household = str(payload["household"])

    if "outdoor_exercise_hours" in payload:
        try:
            profile.outdoor_exercise_hours = float(payload["outdoor_exercise_hours"])
        except (ValueError, TypeError):
            pass

    if "commute_mode" in payload:
        profile.commute_mode = str(payload["commute_mode"])

    if "dpdp_consent" in payload:
        profile.dpdp_consent = bool(payload["dpdp_consent"])

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


@user_bp.route("/locations/<int:location_id>", methods=["PUT"])
@token_required
def update_saved_location(location_id: int):
    """Update a saved location's name or label."""
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

    payload = request.get_json(silent=True) or {}
    if "name" in payload and str(payload["name"]).strip():
        loc.name = str(payload["name"]).strip()
    if "label" in payload and str(payload["label"]).strip():
        loc.label = str(payload["label"]).strip()

    try:
        db.session.commit()
        return success_response(
            data={"location": loc.to_dict()},
            message="Location updated successfully.",
        )
    except Exception as exc:
        db.session.rollback()
        return error_response(
            message=f"Failed to update location: {str(exc)}",
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


@user_bp.route("/history/<int:history_id>", methods=["DELETE"])
@token_required
def delete_assessment_history_entry(history_id: int):
    """Delete a single assessment history record."""
    uid = _resolve_user_id()
    if uid is None:
        return error_response(message="History record not found.", code="NOT_FOUND", status_code=404)

    record = AssessmentHistory.query.filter_by(id=history_id, user_id=uid).first()
    if not record:
        return error_response(
            message="History record not found.",
            code="NOT_FOUND",
            status_code=404,
        )

    try:
        db.session.delete(record)
        db.session.commit()
        return success_response(data={"deleted_id": history_id}, message="Assessment history record removed.")
    except Exception as exc:
        db.session.rollback()
        return error_response(
            message=f"Failed to delete history: {str(exc)}",
            code="DATABASE_ERROR",
            status_code=500,
        )


@user_bp.route("/history", methods=["DELETE"])
@token_required
def clear_assessment_history():
    """Clear all assessment history records for the user."""
    uid = _resolve_user_id()
    if uid is None:
        return success_response(data={"deleted_count": 0}, message="History cleared.")

    try:
        deleted_count = AssessmentHistory.query.filter_by(user_id=uid).delete()
        db.session.commit()
        return success_response(data={"deleted_count": deleted_count}, message="All history records cleared.")
    except Exception as exc:
        db.session.rollback()
        return error_response(
            message=f"Failed to clear history: {str(exc)}",
            code="DATABASE_ERROR",
            status_code=500,
        )


# ---------------------------------------------------------------------------
# 4. Alert Preferences & Live Threshold Checking
# ---------------------------------------------------------------------------

@user_bp.route("/alerts", methods=["GET"])
@token_required
def get_user_alerts():
    """Retrieve user alert threshold and check live PM2.5 for all saved locations."""
    uid = _resolve_user_id()
    if uid is None:
        return success_response(
            data={
                "preference": {"pm25_threshold": 100.0, "is_email_enabled": False},
                "active_alerts": [],
                "total_saved": 0,
                "alerts_count": 0,
            },
            message="Guest alert status.",
        )

    pref = AlertPreference.query.filter_by(user_id=uid).first()
    if not pref:
        pref = AlertPreference(user_id=uid, pm25_threshold=100.0, is_email_enabled=False)
        db.session.add(pref)
        db.session.commit()

    saved_locations = SavedLocation.query.filter_by(user_id=uid).all()
    active_alerts = []

    for loc in saved_locations:
        try:
            ref_data = AirQualityService.get_reference_air_quality(loc.latitude, loc.longitude)
            pm25 = ref_data.get("reference_pm25") if ref_data else None
            if pm25 is not None and pm25 > pref.pm25_threshold:
                active_alerts.append({
                    "location_id": loc.id,
                    "name": loc.name,
                    "label": loc.label,
                    "latitude": loc.latitude,
                    "longitude": loc.longitude,
                    "current_pm25": pm25,
                    "threshold": pref.pm25_threshold,
                    "exceeded_by": round(pm25 - pref.pm25_threshold, 1),
                    "cpcb_band": ref_data.get("cpcb_band", "Unhealthy"),
                })
        except Exception as exc:
            logger.warning("Alert check failed for location %s: %s", loc.id, exc)

    return success_response(
        data={
            "preference": pref.to_dict(),
            "active_alerts": active_alerts,
            "total_saved": len(saved_locations),
            "alerts_count": len(active_alerts),
        },
        message="Alerts retrieved.",
    )


@user_bp.route("/alerts", methods=["PUT"])
@token_required
def update_user_alerts():
    """Update user's alert threshold preferences."""
    uid = _resolve_user_id()
    if uid is None:
        return error_response(
            message="Setting alert preferences requires an authenticated account.",
            code="ACCOUNT_REQUIRED",
            status_code=400,
        )

    payload = request.get_json(silent=True) or {}
    pref = AlertPreference.query.filter_by(user_id=uid).first()
    if not pref:
        pref = AlertPreference(user_id=uid)
        db.session.add(pref)

    if "pm25_threshold" in payload:
        try:
            val = float(payload["pm25_threshold"])
            if val < 10.0 or val > 500.0:
                return error_response(
                    message="Threshold must be between 10 and 500 µg/m³.",
                    code="INVALID_THRESHOLD",
                    status_code=400,
                )
            pref.pm25_threshold = val
        except (ValueError, TypeError):
            return error_response(
                message="Threshold must be numeric.",
                code="INVALID_THRESHOLD",
                status_code=400,
            )

    if "is_email_enabled" in payload:
        pref.is_email_enabled = bool(payload["is_email_enabled"])

    try:
        db.session.commit()
        return success_response(
            data={"preference": pref.to_dict()},
            message="Alert preferences updated.",
        )
    except Exception as exc:
        db.session.rollback()
        return error_response(
            message=f"Failed to update alert preferences: {str(exc)}",
            code="DATABASE_ERROR",
            status_code=500,
        )


# ---------------------------------------------------------------------------
# 5. DPDP Act 2023 Compliance: Data Portability & Right to Erasure
# ---------------------------------------------------------------------------

@user_bp.route("/export-data", methods=["GET"])
@token_required
def export_user_data():
    """DPDP Act 2023 Data Portability: Export full user account data as JSON."""
    uid = _resolve_user_id()
    if uid is None:
        return error_response(message="Authentication required.", code="UNAUTHORIZED", status_code=401)

    user = db.session.get(User, uid)
    if not user:
        return error_response(message="User not found.", code="NOT_FOUND", status_code=404)

    health_profile = HealthProfile.query.filter_by(user_id=uid).first()
    saved_locations = SavedLocation.query.filter_by(user_id=uid).all()
    history = AssessmentHistory.query.filter_by(user_id=uid).order_by(AssessmentHistory.timestamp.desc()).all()
    preferences = AlertPreference.query.filter_by(user_id=uid).first()

    data_bundle = {
        "user": user.to_dict(),
        "health_profile": health_profile.to_dict() if health_profile else None,
        "saved_locations": [loc.to_dict() for loc in saved_locations],
        "assessment_history": [h.to_dict() for h in history],
        "alert_preferences": preferences.to_dict() if preferences else None,
        "dpdp_notice": "Exported in accordance with Section 12 of the Digital Personal Data Protection (DPDP) Act, 2023.",
    }

    return success_response(data=data_bundle, message="User data bundle exported successfully.")


@user_bp.route("/delete-account", methods=["POST", "DELETE"])
@token_required
def delete_user_account():
    """DPDP Act 2023 Right to Erasure: Permanently delete user and all associated health records."""
    uid = _resolve_user_id()
    if uid is None:
        return error_response(message="Authentication required.", code="UNAUTHORIZED", status_code=401)

    user = db.session.get(User, uid)
    if not user:
        return error_response(message="User not found.", code="NOT_FOUND", status_code=404)

    try:
        # Cascade deletion removes health_profiles, saved_locations, history, preferences
        db.session.delete(user)
        db.session.commit()
        return success_response(
            message="User account and all associated personal and health data have been permanently erased (DPDP Act 2023 compliant)."
        )
    except Exception as exc:
        db.session.rollback()
        return error_response(
            message=f"Failed to delete account: {str(exc)}",
            code="DATABASE_ERROR",
            status_code=500,
        )
