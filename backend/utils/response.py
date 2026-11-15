"""Standardized JSON response formatters for Flask API."""

from datetime import datetime, timezone
from flask import jsonify


def success_response(data=None, message=None, status_code=200, **extra):
    """Format and return a standardized successful JSON API response.

    Args:
        data (dict | list | None): Primary payload data. If dict, merged at root.
        message (str | None): Human-readable success message.
        status_code (int): HTTP response code (default: 200).
        **extra: Additional top-level response attributes.
    """
    body = {
        "success": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if message:
        body["message"] = message

    if data is not None:
        if isinstance(data, dict):
            body.update(data)
        else:
            body["data"] = data

    if extra:
        body.update(extra)

    return jsonify(body), status_code


def error_response(message, code="BAD_REQUEST", details=None, status_code=400):
    """Format and return a standardized error JSON API response.

    Args:
        message (str): Human-readable error description.
        code (str): Machine-readable uppercase error token (e.g. 'VALIDATION_ERROR').
        details (dict | list | None): Structured error context or parameter details.
        status_code (int): HTTP status code (default: 400).
    """
    body = {
        "success": False,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "error": {
            "code": code,
            "message": message,
        },
    }
    if details is not None:
        body["error"]["details"] = details

    return jsonify(body), status_code
