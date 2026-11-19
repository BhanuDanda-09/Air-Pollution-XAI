"""Authentication, registration, JWT issuance, and session management routes."""

import re
from flask import Blueprint, current_app, request
from backend.config import Config
from backend.database import db
from backend.models.db_models import HealthProfile, User
from backend.utils.auth import decode_jwt, generate_jwt, token_required
from backend.utils.rate_limiter import InMemoryRateLimiter
from backend.utils.response import error_response, success_response

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# Brute-force protection: max 10 auth attempts per minute per IP
auth_limiter = InMemoryRateLimiter(max_requests=10, window_seconds=60)
VALID_ROLES = {"citizen", "worker", "admin"}
EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")


def _get_client_ip() -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        parts = [p.strip() for p in forwarded.split(",") if p.strip()]
        if parts:
            return parts[-1]
    return request.remote_addr or "127.0.0.1"


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user account with email, password, and optional name."""
    if not current_app.config.get("TESTING"):
        client_ip = _get_client_ip()
        allowed, _, retry_after = auth_limiter.is_allowed(client_ip)
        if not allowed:
            return error_response(
                message=f"Too many registration attempts. Please wait {retry_after}s.",
                code="RATE_LIMIT_EXCEEDED",
                status_code=429,
            )

    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", "")).strip()
    name = str(payload.get("name", "")).strip() or None

    if not email or not EMAIL_REGEX.match(email):
        return error_response(
            message="Valid email address is required.",
            code="INVALID_EMAIL",
            status_code=400,
        )

    if len(password) < 8:
        return error_response(
            message="Password must be at least 8 characters long.",
            code="WEAK_PASSWORD",
            status_code=400,
        )

    # Check if email is already registered
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return error_response(
            message="An account with this email address already exists.",
            code="USER_ALREADY_EXISTS",
            status_code=409,
        )

    try:
        user = User(email=email, name=name, role="citizen")
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        # Initialize default health profile for the new user
        profile = HealthProfile(
            user_id=user.id,
            age_group="adult",
            asthma=False,
            has_heart_condition=False,
            is_pregnant=False,
            is_outdoor_worker=False,
        )
        db.session.add(profile)
        db.session.commit()

        # Generate tokens
        access_token = generate_jwt(
            {"user_id": user.id, "sub": user.email, "role": user.role, "type": "access"},
            expires_in=Config.JWT_EXPIRY_SECONDS,
        )
        refresh_token = generate_jwt(
            {"user_id": user.id, "sub": user.email, "role": user.role, "type": "refresh"},
            expires_in=7 * 86400,  # 7 days
        )

        return success_response(
            data={
                "user": user.to_dict(),
                "health_profile": profile.to_dict(),
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "Bearer",
                "expires_in": Config.JWT_EXPIRY_SECONDS,
            },
            message="Registration successful. Welcome to Air Pollution XAI!",
            status_code=201,
        )
    except Exception as exc:
        db.session.rollback()
        return error_response(
            message=f"Failed to create user account: {str(exc)}",
            code="REGISTRATION_FAILED",
            status_code=500,
        )


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate with email and password to receive JWT access and refresh tokens."""
    if not current_app.config.get("TESTING"):
        client_ip = _get_client_ip()
        allowed, _, retry_after = auth_limiter.is_allowed(client_ip)
        if not allowed:
            return error_response(
                message=f"Too many login attempts. Please wait {retry_after}s before retrying.",
                code="RATE_LIMIT_EXCEEDED",
                status_code=429,
            )

    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", "")).strip()

    if not email or not password:
        return error_response(
            message="Email and password are both required.",
            code="MISSING_CREDENTIALS",
            status_code=400,
        )

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return error_response(
            message="Invalid email or password.",
            code="INVALID_CREDENTIALS",
            status_code=401,
        )

    access_token = generate_jwt(
        {"user_id": user.id, "sub": user.email, "role": user.role, "type": "access"},
        expires_in=Config.JWT_EXPIRY_SECONDS,
    )
    refresh_token = generate_jwt(
        {"user_id": user.id, "sub": user.email, "role": user.role, "type": "refresh"},
        expires_in=7 * 86400,
    )

    profile_dict = user.health_profile.to_dict() if user.health_profile else None

    return success_response(
        data={
            "user": user.to_dict(),
            "health_profile": profile_dict,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": Config.JWT_EXPIRY_SECONDS,
        },
        message="Login successful.",
    )


@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    """Exchange a valid refresh token for a fresh short-lived access token."""
    payload = request.get_json(silent=True) or {}
    token = payload.get("refresh_token")
    if not token:
        return error_response(
            message="Missing 'refresh_token' parameter.",
            code="MISSING_TOKEN",
            status_code=400,
        )

    try:
        decoded = decode_jwt(token)
        if decoded.get("type") != "refresh":
            return error_response(
                message="Invalid token type: expected a refresh token.",
                code="INVALID_TOKEN_TYPE",
                status_code=401,
            )

        user_id = decoded.get("user_id")
        user = db.session.get(User, user_id)
        if not user:
            return error_response(message="User not found.", code="USER_NOT_FOUND", status_code=404)

        new_access_token = generate_jwt(
            {"user_id": user.id, "sub": user.email, "role": user.role, "type": "access"},
            expires_in=Config.JWT_EXPIRY_SECONDS,
        )

        return success_response(
            data={
                "access_token": new_access_token,
                "token_type": "Bearer",
                "expires_in": Config.JWT_EXPIRY_SECONDS,
            },
            message="Token refreshed successfully.",
        )
    except ValueError as exc:
        return error_response(
            message=f"Refresh token invalid or expired: {str(exc)}",
            code="TOKEN_REFRESH_FAILED",
            status_code=401,
        )


@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user():
    """Retrieve identity and health profile of current authenticated user."""
    raw_uid = request.user_id
    uid = None
    if isinstance(raw_uid, int):
        uid = raw_uid
    elif isinstance(raw_uid, str) and raw_uid.isdigit():
        uid = int(raw_uid)

    user = db.session.get(User, uid) if uid is not None else None
    if not user:
        # Fallback if authenticated via synthetic demo token
        return success_response(
            data={
                "user": {
                    "id": request.user_id,
                    "email": f"{request.user_id}@demo.local",
                    "role": request.current_user.get("role", "citizen"),
                    "is_demo": True,
                },
                "health_profile": None,
            },
            message="Demo user profile retrieved.",
        )

    return success_response(
        data={
            "user": user.to_dict(),
            "health_profile": user.health_profile.to_dict() if user.health_profile else None,
        },
        message="Current user profile retrieved.",
    )


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
