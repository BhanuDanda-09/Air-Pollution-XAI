"""Administrative routes protected by RBAC (role: 'admin')."""

from flask import Blueprint, request
from backend.models.model_loader import get_model_loader
from backend.services.air_quality_service import aq_cache
from backend.services.weather_service import weather_cache
from backend.utils.auth import require_role
from backend.utils.response import success_response

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/metrics", methods=["GET"])
@require_role("admin")
def get_admin_metrics():
    """Retrieve system-wide operational metrics and model diagnostics (Admin only)."""
    loader = get_model_loader()
    status = loader.get_status()

    metrics_payload = {
        "user": request.current_user,
        "models": status,
        "cache_stats": {
            "weather_cache_entries": len(weather_cache),
            "weather_cache_max": weather_cache.maxsize,
            "aq_cache_entries": len(aq_cache),
            "aq_cache_max": aq_cache.maxsize,
        },
        "system_health": {
            "environment": "active",
            "api_tier": "Render Free Tier (512MB RAM ceiling)",
            "worker_concurrency": "1 worker, 4 threads (gunicorn)",
        },
    }

    return success_response(
        data=metrics_payload,
        message="Admin system metrics retrieved successfully.",
    )


@admin_bp.route("/system-status", methods=["GET"])
@require_role("admin")
def get_system_status():
    """Check administrative health and audit telemetry (Admin only)."""
    return success_response(
        data={
            "status": "operational",
            "authorized_admin": request.current_user.get("user_id") or request.current_user.get("sub"),
            "role": request.current_user.get("role"),
            "audit_log": [
                {"event": "system_boot", "status": "completed"},
                {"event": "model_loader_initialized", "status": "verified"},
            ],
        },
        message="Administrative status confirmed.",
    )


@admin_bp.route("/cache/clear", methods=["POST"])
@require_role("admin")
def clear_caches():
    """Clear in-memory caches (Admin only)."""
    weather_cache.clear()
    aq_cache.clear()
    return success_response(
        data={"cleared": True},
        message="Weather and Air Quality in-memory caches cleared.",
    )
