"""Authentication and token generation routes."""

from flask import Blueprint, request
from backend.config import Config
from backend.utils.auth import generate_jwt
from backend.utils.response import error_response, success_response

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

VALID_ROLES = {"citizen", "worker", "admin"}


@auth_bp.route("/demo-token", methods=["POST"])
def get_demo_token():
    """Generate role-based JWT token for evaluation/demo personas."""
    payload = request.get_json(silent=True) or {}
    role = str(payload.get("role", "citizen")).lower().strip()
    username = payload.get("username", f"demo_{role}")

    if role not in VALID_ROLES:
        return error_response(
            message=f"Invalid role '{role}'. Valid options are: {', '.join(sorted(VALID_ROLES))}.",
            code="INVALID_ROLE",
            status_code=400,
        )

    token = generate_jwt({"user_id": username, "sub": username, "role": role})

    return success_response(
        data={
            "token": token,
            "role": role,
            "user_id": username,
            "token_type": "Bearer",
            "expires_in": Config.JWT_EXPIRY_SECONDS,
        },
        message=f"Token generated for role '{role}'.",
    )
