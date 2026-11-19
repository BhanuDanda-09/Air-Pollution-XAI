"""Authentication and Role-Based Access Control (RBAC) utilities."""

import base64
import functools
import hashlib
import hmac
import json
import logging
import time
from typing import Any, Dict, List, Optional, Union
from flask import request
from backend.config import Config
from backend.utils.response import error_response

logger = logging.getLogger(__name__)


def _b64url_encode(data: bytes) -> str:
    """Encode bytes to URL-safe base64 string without trailing padding."""
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64url_decode(s: str) -> bytes:
    """Decode URL-safe base64 string with restored padding."""
    padding = "=" * (4 - (len(s) % 4)) if len(s) % 4 != 0 else ""
    return base64.urlsafe_b64decode(s + padding)


def generate_jwt(payload: Dict[str, Any], secret: Optional[str] = None, expires_in: Optional[int] = None) -> str:
    """Generate an HS256 signed JSON Web Token using Python standard library.

    Args:
        payload: Custom claims (e.g. {'user_id': 1, 'role': 'citizen'})
        secret: Signing key (defaults to Config.SECRET_KEY)
        expires_in: Token lifespan in seconds (defaults to Config.JWT_EXPIRY_SECONDS)

    Returns:
        Compact encoded JWT string
    """
    secret_key = (secret or Config.SECRET_KEY).encode("utf-8")
    ttl = expires_in if expires_in is not None else Config.JWT_EXPIRY_SECONDS
    now = int(time.time())

    token_payload = {
        **payload,
        "iat": now,
        "exp": now + ttl,
    }

    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(token_payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

    signature = hmac.new(secret_key, signing_input, hashlib.sha256).digest()
    sig_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_jwt(token: str, secret: Optional[str] = None) -> Dict[str, Any]:
    """Validate and decode HS256 JWT, verifying header, signature and expiration.

    Args:
        token: Raw JWT string
        secret: Signing key (defaults to Config.SECRET_KEY)

    Returns:
        Decoded payload dictionary

    Raises:
        ValueError: On malformed token, invalid signature, or expired token
    """
    secret_key = (secret or Config.SECRET_KEY).encode("utf-8")
    parts = token.strip().split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT format: token must have exactly 3 dot-separated parts.")

    header_b64, payload_b64, sig_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

    expected_sig = hmac.new(secret_key, signing_input, hashlib.sha256).digest()
    try:
        provided_sig = _b64url_decode(sig_b64)
    except Exception as e:
        raise ValueError(f"Corrupt signature encoding: {e}")

    if not hmac.compare_digest(expected_sig, provided_sig):
        raise ValueError("Signature verification failed: invalid token signature.")

    try:
        payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
    except Exception as e:
        raise ValueError(f"Corrupt payload JSON: {e}")

    now = int(time.time())
    if "exp" in payload and now > payload["exp"]:
        raise ValueError("Token has expired.")

    return payload


def require_role(allowed_roles: Union[str, List[str]]):
    """Decorator to enforce Bearer JWT authentication and Role-Based Access Control.

    Returns:
        401 UNAUTHORIZED: Missing, invalid, or expired Authorization Bearer token.
        403 FORBIDDEN: Valid token, but role is not authorized for this resource.
    """
    if isinstance(allowed_roles, str):
        roles = [allowed_roles]
    else:
        roles = list(allowed_roles)

    def decorator(f):
        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return error_response(
                    message="Missing or invalid Authorization header. Expected 'Bearer <token>'.",
                    code="UNAUTHORIZED",
                    status_code=401,
                )

            token = auth_header[7:].strip()
            if not token:
                return error_response(
                    message="Bearer token is empty.",
                    code="UNAUTHORIZED",
                    status_code=401,
                )

            try:
                payload = decode_jwt(token)
            except ValueError as e:
                return error_response(
                    message=f"Authentication failed: {str(e)}",
                    code="INVALID_TOKEN",
                    status_code=401,
                )

            user_role = payload.get("role", "citizen")
            if user_role not in roles:
                logger.warning(
                    "RBAC rejection: user '%s' with role '%s' attempted to access endpoint requiring %s",
                    payload.get("user_id") or payload.get("sub"),
                    user_role,
                    roles,
                )
                return error_response(
                    message=f"Access denied. Role '{user_role}' is not authorized to access this resource. Required role: {', '.join(roles)}.",
                    code="FORBIDDEN",
                    status_code=403,
                )

            # Attach authenticated user identity to request context
            request.current_user = payload
            request.user_id = payload.get("user_id") or payload.get("sub")
            return f(*args, **kwargs)

        return wrapper

    return decorator


def token_required(f):
    """Decorator to require valid JWT authentication for any authenticated user."""
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return error_response(
                message="Missing or invalid Authorization header. Expected 'Bearer <token>'.",
                code="UNAUTHORIZED",
                status_code=401,
            )

        token = auth_header[7:].strip()
        if not token:
            return error_response(
                message="Bearer token is empty.",
                code="UNAUTHORIZED",
                status_code=401,
            )

        try:
            payload = decode_jwt(token)
        except ValueError as e:
            return error_response(
                message=f"Authentication failed: {str(e)}",
                code="INVALID_TOKEN",
                status_code=401,
            )

        request.current_user = payload
        request.user_id = payload.get("user_id") or payload.get("sub")
        return f(*args, **kwargs)

    return wrapper
