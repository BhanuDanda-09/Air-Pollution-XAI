"""Tests for authentication, registration, JWT refresh, and identity endpoints."""

import uuid
import pytest


def test_register_success(client):
    """Test successful user registration creates user and default health profile."""
    email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    resp = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "SecurePassword123!",
            "name": "Test Citizen",
        },
    )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["success"] is True
    assert body["user"]["email"] == email
    assert body["user"]["name"] == "Test Citizen"
    assert body["health_profile"] is not None
    assert body["health_profile"]["age_group"] == "adult"
    assert "access_token" in body
    assert "refresh_token" in body


def test_register_duplicate_email(client):
    """Test duplicate registration returns 409 Conflict."""
    email = f"dup_{uuid.uuid4().hex[:8]}@example.com"
    client.post(
        "/api/auth/register",
        json={"email": email, "password": "Password123!"},
    )
    resp = client.post(
        "/api/auth/register",
        json={"email": email, "password": "AnotherPassword123!"},
    )
    assert resp.status_code == 409
    body = resp.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == "USER_ALREADY_EXISTS"


def test_register_invalid_email(client):
    """Test invalid email format returns 400."""
    resp = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "password": "ValidPassword123!"},
    )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["error"]["code"] == "INVALID_EMAIL"


def test_register_weak_password(client):
    """Test password shorter than 8 characters returns 400."""
    resp = client.post(
        "/api/auth/register",
        json={"email": f"short_{uuid.uuid4().hex[:8]}@example.com", "password": "short"},
    )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["error"]["code"] == "WEAK_PASSWORD"


def test_login_success(client):
    """Test login with valid credentials returns tokens and user info."""
    email = f"login_{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPassword123"
    client.post("/api/auth/register", json={"email": email, "password": password, "name": "Login User"})

    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["user"]["email"] == email


def test_login_invalid_password(client):
    """Test login with incorrect password returns 401."""
    email = f"wrong_{uuid.uuid4().hex[:8]}@example.com"
    client.post("/api/auth/register", json={"email": email, "password": "CorrectPassword123"})

    resp = client.post("/api/auth/login", json={"email": email, "password": "WrongPassword456"})
    assert resp.status_code == 401
    body = resp.get_json()
    assert body["error"]["code"] == "INVALID_CREDENTIALS"


def test_login_nonexistent_user(client):
    """Test login with unknown email returns 401."""
    resp = client.post("/api/auth/login", json={"email": f"unknown_{uuid.uuid4().hex[:8]}@example.com", "password": "AnyPassword123"})
    assert resp.status_code == 401
    body = resp.get_json()
    assert body["error"]["code"] == "INVALID_CREDENTIALS"


def test_login_missing_fields(client):
    """Test login with missing email or password returns 400."""
    resp = client.post("/api/auth/login", json={"email": "only_email@example.com"})
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["error"]["code"] == "MISSING_CREDENTIALS"


def test_token_refresh_lifecycle(client):
    """Test exchanging a refresh token for a new access token."""
    email = f"refresh_{uuid.uuid4().hex[:8]}@example.com"
    reg_resp = client.post(
        "/api/auth/register",
        json={"email": email, "password": "Password12345"},
    )
    refresh_token = reg_resp.get_json()["refresh_token"]

    resp = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    assert "access_token" in body


def test_token_refresh_invalid_token(client):
    """Test refresh endpoint with invalid token returns 401."""
    resp = client.post("/api/auth/refresh", json={"refresh_token": "not.a.valid.jwt"})
    assert resp.status_code == 401
    body = resp.get_json()
    assert body["error"]["code"] == "TOKEN_REFRESH_FAILED"


def test_get_current_user_me(client):
    """Test /api/auth/me returns authenticated user details."""
    email = f"me_{uuid.uuid4().hex[:8]}@example.com"
    reg_resp = client.post(
        "/api/auth/register",
        json={"email": email, "password": "Password12345", "name": "Me Profile"},
    )
    token = reg_resp.get_json()["access_token"]

    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    assert body["user"]["email"] == email
    assert body["user"]["name"] == "Me Profile"


def test_get_current_user_unauthorized(client):
    """Test /api/auth/me without token returns 401."""
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401
    body = resp.get_json()
    assert body["error"]["code"] == "UNAUTHORIZED"
