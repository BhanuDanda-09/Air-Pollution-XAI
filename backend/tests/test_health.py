"""Tests for /api/health endpoint."""


def test_health_check(client):
    """Test health endpoint returns 200 and expected model availability flags."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()

    assert data["status"] == "healthy"
    assert data["app_name"] == "Air Pollution XAI Backend"
    assert "version" in data

    models = data["models_available"]
    assert models["random_forest"] is True
    assert models["xgboost"] is True
    assert models["mlp"] is True
    assert models["lstm"] is False
    assert models["transformer"] is False


def test_root_index(client):
    """Test root endpoint provides API directory."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert "endpoints" in data
