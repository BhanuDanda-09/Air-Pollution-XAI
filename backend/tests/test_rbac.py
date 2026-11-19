"""Tests for Role-Based Access Control (RBAC), JWT validation, and 403 Forbidden enforcement."""

import time
import pytest
from backend.utils.auth import generate_jwt


@pytest.fixture
def citizen_token():
    return generate_jwt({"user_id": "citizen_user_1", "role": "citizen"})


@pytest.fixture
def worker_token():
    return generate_jwt({"user_id": "worker_user_1", "role": "worker"})


@pytest.fixture
def admin_token():
    return generate_jwt({"user_id": "admin_user_1", "role": "admin"})


# ---------------------------------------------------------------------------
# 1. Unauthenticated and Malformed Token Assertions (401 Unauthorized)
# ---------------------------------------------------------------------------

def test_unauthenticated_request_rejected(client):
    """Verify missing Authorization header returns 401 UNAUTHORIZED."""
    res = client.get("/api/admin/metrics")
    assert res.status_code == 401
    assert res.get_json()["error"]["code"] == "UNAUTHORIZED"


def test_malformed_token_rejected(client):
    """Verify corrupt or invalid signature JWT returns 401 INVALID_TOKEN."""
    res = client.get(
        "/api/admin/metrics",
        headers={"Authorization": "Bearer not.a.valid.jwt"},
    )
    assert res.status_code == 401
    assert res.get_json()["error"]["code"] == "INVALID_TOKEN"


def test_expired_token_rejected(client):
    """Verify expired JWT is rejected with 401."""
    expired_token = generate_jwt({"user_id": "test_user", "role": "admin"}, expires_in=-10)
    res = client.get(
        "/api/admin/metrics",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert res.status_code == 401
    data = res.get_json()
    assert "expired" in data["error"]["message"].lower()


# ---------------------------------------------------------------------------
# 2. Strict Citizen Token 403 Forbidden Assertions (Requirement 5)
# ---------------------------------------------------------------------------

def test_citizen_token_rejected_on_admin_metrics(client, citizen_token):
    """VERIFY REQUIREMENT 5: Real citizen token returns 403 on admin metrics endpoint."""
    res = client.get(
        "/api/admin/metrics",
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert res.status_code == 403
    data = res.get_json()
    assert data["error"]["code"] == "FORBIDDEN"
    assert "citizen" in data["error"]["message"]
    assert "admin" in data["error"]["message"]


def test_citizen_token_rejected_on_admin_system_status(client, citizen_token):
    """VERIFY REQUIREMENT 5: Real citizen token returns 403 on admin system status endpoint."""
    res = client.get(
        "/api/admin/system-status",
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert res.status_code == 403
    data = res.get_json()
    assert data["error"]["code"] == "FORBIDDEN"


def test_citizen_token_rejected_on_worker_field_tasks(client, citizen_token):
    """VERIFY REQUIREMENT 5: Real citizen token returns 403 on worker field tasks endpoint."""
    res = client.get(
        "/api/worker/field-tasks",
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert res.status_code == 403
    data = res.get_json()
    assert data["error"]["code"] == "FORBIDDEN"


def test_citizen_token_rejected_on_worker_shift_advisories(client, citizen_token):
    """VERIFY REQUIREMENT 5: Real citizen token returns 403 on worker shift advisories endpoint."""
    res = client.get(
        "/api/worker/shift-advisories",
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert res.status_code == 403
    data = res.get_json()
    assert data["error"]["code"] == "FORBIDDEN"


# ---------------------------------------------------------------------------
# 3. Worker Role Assertions (Access Worker, Denied Admin)
# ---------------------------------------------------------------------------

def test_worker_token_allowed_on_worker_endpoints(client, worker_token):
    """Verify worker token successfully accesses worker field tasks."""
    res = client.get(
        "/api/worker/field-tasks",
        headers={"Authorization": f"Bearer {worker_token}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["tasks"]) > 0


def test_worker_token_rejected_on_admin_endpoints(client, worker_token):
    """Verify worker role cannot escalate privilege to access admin endpoints (returns 403)."""
    res = client.get(
        "/api/admin/metrics",
        headers={"Authorization": f"Bearer {worker_token}"},
    )
    assert res.status_code == 403
    data = res.get_json()
    assert data["error"]["code"] == "FORBIDDEN"


# ---------------------------------------------------------------------------
# 4. Admin Role Assertions (Access Admin and Worker)
# ---------------------------------------------------------------------------

def test_admin_token_allowed_on_admin_metrics(client, admin_token):
    """Verify admin token successfully accesses admin metrics."""
    res = client.get(
        "/api/admin/metrics",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert "models" in data
    assert "cache_stats" in data


def test_admin_token_allowed_on_worker_endpoints(client, admin_token):
    """Verify admin role has supervisor access to worker endpoints."""
    res = client.get(
        "/api/worker/field-tasks",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200


# ---------------------------------------------------------------------------
# 5. Auth Demo Token Generation
# ---------------------------------------------------------------------------

def test_auth_demo_token_generation(client):
    """Verify /api/auth/demo-token issues valid role tokens."""
    res = client.post("/api/auth/demo-token", json={"role": "worker", "username": "field_inspector_1"})
    assert res.status_code == 200
    token = res.get_json()["token"]
    assert token is not None

    # Test token works against worker endpoint
    worker_res = client.get("/api/worker/field-tasks", headers={"Authorization": f"Bearer {token}"})
    assert worker_res.status_code == 200
