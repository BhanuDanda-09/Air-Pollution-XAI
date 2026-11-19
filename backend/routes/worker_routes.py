"""Field worker and municipal personnel routes protected by RBAC (roles: 'worker', 'admin')."""

from flask import Blueprint, request
from backend.utils.auth import require_role
from backend.utils.response import success_response

worker_bp = Blueprint("worker", __name__, url_prefix="/api/worker")


@worker_bp.route("/field-tasks", methods=["GET"])
@require_role(["worker", "admin"])
def get_field_tasks():
    """Retrieve active municipal air quality and sensor maintenance tasks (Worker or Admin)."""
    tasks = [
        {
            "id": "TASK-101",
            "title": "Anand Vihar Mobile Sensor Calibration",
            "priority": "High",
            "location": "Anand Vihar, New Delhi (28.6469, 77.3160)",
            "air_quality_window": "Schedule during peak dispersion (12:00 - 15:00)",
            "mandatory_ppe": "N95 / FFP2 mask mandatory during prolonged outdoor exposure",
            "status": "In Progress",
        },
        {
            "id": "TASK-102",
            "title": "Gurugram Cyber City Road Dust Suppression Verification",
            "priority": "Medium",
            "location": "Cyber City, Gurugram (28.4900, 77.0900)",
            "air_quality_window": "Early morning audit (07:00 - 09:00)",
            "mandatory_ppe": "Safety goggles and N95 respirator",
            "status": "Pending",
        },
    ]

    return success_response(
        data={
            "worker_identity": request.current_user.get("user_id") or request.current_user.get("sub"),
            "role": request.current_user.get("role"),
            "tasks": tasks,
        },
        message="Worker field tasks retrieved successfully.",
    )


@worker_bp.route("/shift-advisories", methods=["GET"])
@require_role(["worker", "admin"])
def get_shift_advisories():
    """Retrieve safety guidelines and shift duration recommendations for outdoor personnel."""
    advisories = {
        "shift_recommendations": {
            "heavy_exertion_max_hours": 4,
            "mandatory_hydration_rest_minutes": 15,
            "respirator_fit_test": "Required prior to field deployment",
        },
        "advisory_notes": (
            "Field workers with respiratory conditions must report to site coordinator "
            "if particulate levels exceed 150 µg/m³."
        ),
    }

    return success_response(
        data=advisories,
        message="Worker shift safety advisories retrieved successfully.",
    )
