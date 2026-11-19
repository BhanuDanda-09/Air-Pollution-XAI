"""Tests for user persistence: health profiles, saved places, and history tracking."""

import uuid
import pytest


@pytest.fixture
def registered_auth(client):
    """Fixture providing an authenticated test user session with access token."""
    email = f"persistence_{uuid.uuid4().hex[:8]}@example.com"
    resp = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "Password12345!",
            "name": "Persistence Citizen",
        },
    )
    body = resp.get_json()
    return {
        "user_id": body["user"]["id"],
        "token": body["access_token"],
        "headers": {"Authorization": f"Bearer {body['access_token']}"},
    }


def test_health_profile_lifecycle(client, registered_auth):
    """Test retrieving and updating persistent health profile."""
    headers = registered_auth["headers"]

    # Initial profile check
    get_resp = client.get("/api/user/profile", headers=headers)
    assert get_resp.status_code == 200
    body = get_resp.get_json()
    assert body["health_profile"]["age_group"] == "adult"
    assert body["health_profile"]["asthma"] is False

    # Update profile
    put_resp = client.put(
        "/api/user/profile",
        headers=headers,
        json={
            "age_group": "senior",
            "asthma": True,
            "has_heart_condition": True,
            "is_outdoor_worker": False,
        },
    )
    assert put_resp.status_code == 200
    updated = put_resp.get_json()["health_profile"]
    assert updated["age_group"] == "senior"
    assert updated["asthma"] is True
    assert updated["has_heart_condition"] is True

    # Confirm persistence
    get_resp2 = client.get("/api/user/profile", headers=headers)
    assert get_resp2.get_json()["health_profile"]["age_group"] == "senior"


def test_saved_locations_crud(client, registered_auth):
    """Test creating, listing, and deleting bookmarked locations."""
    headers = registered_auth["headers"]

    # Add Home location
    add_resp = client.post(
        "/api/user/locations",
        headers=headers,
        json={
            "label": "Home",
            "name": "Connaught Place, New Delhi",
            "latitude": 28.6328,
            "longitude": 77.2197,
        },
    )
    assert add_resp.status_code == 201
    loc_id = add_resp.get_json()["location"]["id"]
    assert add_resp.get_json()["location"]["label"] == "Home"

    # List locations
    list_resp = client.get("/api/user/locations", headers=headers)
    assert list_resp.status_code == 200
    locations = list_resp.get_json()["locations"]
    assert any(loc["id"] == loc_id for loc in locations)

    # Delete location
    del_resp = client.delete(f"/api/user/locations/{loc_id}", headers=headers)
    assert del_resp.status_code == 200

    # Verify deleted
    list_resp2 = client.get("/api/user/locations", headers=headers)
    assert not any(loc["id"] == loc_id for loc in list_resp2.get_json()["locations"])


def test_saved_location_validation(client, registered_auth):
    """Test validation errors when saving invalid places."""
    headers = registered_auth["headers"]

    # Missing fields
    resp = client.post("/api/user/locations", headers=headers, json={"label": "Work"})
    assert resp.status_code == 400
    assert resp.get_json()["error"]["code"] == "MISSING_FIELDS"

    # Invalid coordinates
    resp2 = client.post(
        "/api/user/locations",
        headers=headers,
        json={"name": "Bad Coords", "latitude": "invalid", "longitude": 77.2},
    )
    assert resp2.status_code == 400
    assert resp2.get_json()["error"]["code"] == "INVALID_COORDINATES"


def test_assessment_history_lifecycle(client, registered_auth):
    """Test logging an assessment event and retrieving history."""
    headers = registered_auth["headers"]

    # Record assessment
    rec_resp = client.post(
        "/api/user/history",
        headers=headers,
        json={
            "latitude": 28.6139,
            "longitude": 77.2090,
            "place_name": "India Gate, New Delhi",
            "score": 68,
            "verdict": "Take precautions",
            "pm25_reference": 142.5,
            "pm25_model": 138.2,
        },
    )
    assert rec_resp.status_code == 201
    entry = rec_resp.get_json()["history_entry"]
    assert entry["score"] == 68
    assert entry["verdict"] == "Take precautions"

    # Retrieve history
    hist_resp = client.get("/api/user/history", headers=headers)
    assert hist_resp.status_code == 200
    history = hist_resp.get_json()["history"]
    assert len(history) >= 1
    assert history[0]["place_name"] == "India Gate, New Delhi"


def test_unauthenticated_endpoints_rejected(client):
    """Ensure user persistence endpoints reject requests without a token."""
    assert client.get("/api/user/profile").status_code == 401
    assert client.put("/api/user/profile", json={"age_group": "child"}).status_code == 401
    assert client.get("/api/user/locations").status_code == 401
    assert client.post("/api/user/locations", json={"name": "Test"}).status_code == 401
    assert client.get("/api/user/history").status_code == 401
    assert client.post("/api/user/history", json={"latitude": 28.5, "longitude": 77.1}).status_code == 401
    assert client.get("/api/user/alerts").status_code == 401
    assert client.put("/api/user/alerts", json={"pm25_threshold": 90.0}).status_code == 401


def test_alert_preferences_lifecycle(client, registered_auth):
    """Test retrieving and updating user alert thresholds."""
    headers = registered_auth["headers"]

    # Default alert threshold
    get_resp = client.get("/api/user/alerts", headers=headers)
    assert get_resp.status_code == 200
    body = get_resp.get_json()
    assert body["preference"]["pm25_threshold"] == 100.0
    assert "active_alerts" in body

    # Update alert threshold
    put_resp = client.put(
        "/api/user/alerts",
        headers=headers,
        json={"pm25_threshold": 75.0, "is_email_enabled": True},
    )
    assert put_resp.status_code == 200
    updated = put_resp.get_json()["preference"]
    assert updated["pm25_threshold"] == 75.0
    assert updated["is_email_enabled"] is True


def test_alert_threshold_validation(client, registered_auth):
    """Test boundary validation for alert threshold."""
    headers = registered_auth["headers"]

    # Threshold too low (< 10)
    resp_low = client.put("/api/user/alerts", headers=headers, json={"pm25_threshold": 5.0})
    assert resp_low.status_code == 400
    assert resp_low.get_json()["error"]["code"] == "INVALID_THRESHOLD"

    # Threshold too high (> 500)
    resp_high = client.put("/api/user/alerts", headers=headers, json={"pm25_threshold": 999.0})
    assert resp_high.status_code == 400
    assert resp_high.get_json()["error"]["code"] == "INVALID_THRESHOLD"

    # Non-numeric
    resp_str = client.put("/api/user/alerts", headers=headers, json={"pm25_threshold": "low"})
    assert resp_str.status_code == 400
    assert resp_str.get_json()["error"]["code"] == "INVALID_THRESHOLD"
