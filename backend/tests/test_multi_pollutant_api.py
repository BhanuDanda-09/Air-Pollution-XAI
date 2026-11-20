"""Unit and Integration tests for All-India Multi-Pollutant & Relocation API."""

import pytest
from backend.app import create_app
from backend.config import Config
from backend.services.multi_pollutant_service import current_aq_cache


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False


@pytest.fixture(autouse=True)
def clear_caches():
    current_aq_cache.clear()
    yield
    current_aq_cache.clear()


@pytest.fixture
def client():
    app = create_app(TestConfig)
    with app.test_client() as test_client:
        yield test_client


def test_get_all_cities(client):
    """Test retrieving 45-city nationwide catalog."""
    resp = client.get("/api/cities")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["total"] == 45
    assert len(data["cities"]) == 45
    city_ids = [c["id"] for c in data["cities"]]
    assert "delhi" in city_ids
    assert "bengaluru" in city_ids
    assert "shillong" in city_ids


def test_search_cities(client):
    """Test filtering cities by substring."""
    resp = client.get("/api/cities?q=Kochi")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["total"] >= 1
    assert data["cities"][0]["id"] == "kochi"


def test_geocode_location(client):
    """Test India geocoding with local catalog and bounds verification."""
    resp = client.get("/api/geocode?q=Bengaluru")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["count"] >= 1
    match = data["results"][0]
    assert "Bengaluru" in match["name"] or "Karnataka" in match["state"]
    assert 12.0 <= match["lat"] <= 14.0
    assert 77.0 <= match["lon"] <= 78.0


def test_geocode_missing_query(client):
    """Test missing query parameter in geocoding."""
    resp = client.get("/api/geocode")
    assert resp.status_code == 400
    assert resp.get_json()["error"]["code"] == "MISSING_QUERY"


def test_current_air_by_city(client):
    """Test current multi-pollutant air quality retrieval by city ID."""
    resp = client.get("/api/air/current?city=delhi")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert "overall_aqi" in data
    assert "category" in data
    assert "governing_pollutant" in data
    assert "pollutants" in data

    # Verify all 6 criteria pollutants are reported
    for pol in ["PM2.5", "PM10", "NO2", "SO2", "CO", "O3"]:
        assert pol in data["pollutants"]
        pol_card = data["pollutants"][pol]
        assert "cpcb_subindex" in pol_card
        assert "concentration" in pol_card


def test_current_air_outside_coverage(client):
    """Test honest refusal when coordinates are outside India."""
    # Paris, France coordinates
    resp = client.get("/api/air/current?lat=48.8566&lon=2.3522")
    assert resp.status_code == 422
    err = resp.get_json()["error"]
    assert err["code"] == "OUTSIDE_COVERAGE"
    assert "outside" in err["message"].lower()


def test_air_forecast(client):
    """Test multi-pollutant forecast endpoint with uncertainty bands."""
    payload = {
        "lat": 28.6139,
        "lon": 77.2090,
        "horizon_hours": 24,
    }
    resp = client.post("/api/air/forecast", json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert data["horizon_hours"] == 24
    assert "forecast_aqi" in data
    assert "forecasts" in data
    for pol in ["PM2.5", "PM10", "NO2", "SO2", "CO", "O3"]:
        assert pol in data["forecasts"]
        item = data["forecasts"][pol]
        assert "predicted_concentration" in item
        assert "lower_bound" in item
        assert "upper_bound" in item
        assert item["lower_bound"] <= item["upper_bound"]


def test_air_climatology(client):
    """Test city monthly climatology and seasonal inversion factors."""
    resp = client.get("/api/air/climatology?city=delhi")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["city_id"] == "delhi"
    assert "best_month" in data
    assert "worst_month" in data
    assert "winter_inversion_factor" in data
    assert len(data["monthly_pm25"]) >= 5


def test_hotspots_rankings(client):
    """Test nationwide hotspot rankings and regional filtering."""
    resp = client.get("/api/hotspots")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["total_cities"] == 45
    assert len(data["rankings"]) == 45

    # Test filtering by region
    resp_north = client.get("/api/hotspots?region=North")
    assert resp_north.status_code == 200
    data_north = resp_north.get_json()
    for r in data_north["rankings"]:
        assert r["region"] == "North"


def test_relocation_comparison(client):
    """Test health-personalised relocation comparison engine."""
    payload = {
        "origin": {"name": "Delhi", "lat": 28.6139, "lon": 77.2090},
        "destinations": [
            {"name": "Bengaluru", "lat": 12.9716, "lon": 77.5946},
            {"name": "Shillong", "lat": 25.5788, "lon": 91.8933},
        ],
        "profile": {
            "conditions": ["asthma"],
            "household": "children",
            "is_pregnant": False,
            "outdoor_exercise_hours": 6.0,
            "commute_mode": "two_wheeler",
        },
    }
    resp = client.post("/api/relocation/compare", json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert "origin" in data
    assert "personal_risk" in data["origin"]
    assert len(data["candidates"]) == 2

    # Check candidate comparison structure
    bengaluru = data["candidates"][0]
    assert "personal_risk" in bengaluru
    assert "verdict" in bengaluru
    assert "explanation_narrative" in bengaluru
    assert len(bengaluru["actionable_advice"]) > 0


def test_relocation_outside_origin(client):
    """Test rejection when origin is outside India."""
    payload = {
        "origin": {"name": "London", "lat": 51.5074, "lon": -0.1278},
        "destinations": [{"name": "Bengaluru", "lat": 12.9716, "lon": 77.5946}],
    }
    resp = client.post("/api/relocation/compare", json=payload)
    assert resp.status_code == 422
    assert resp.get_json()["error"]["code"] == "OUTSIDE_COVERAGE"


def test_explain_multi_pollutant_get(client):
    """Test GET /api/explain returning multi-pollutant SHAP attributions."""
    resp = client.get("/api/explain?pollutant=PM2.5")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["pollutant"] == "PM2.5"
    assert "global_importance" in data
    assert "scientific_disclaimer" in data["metadata"]
    assert "source apportionment" in data["metadata"]["scientific_disclaimer"].lower()


def test_explain_legacy_post(client):
    """Test legacy POST /api/explain maintains 100% backward compatibility."""
    payload = {
        "model": "xgboost",
        "features": {
            "RH": 55.0,
            "WD": 180.0,
            "SR": 350.0,
            "BP": 745.0,
            "AT": 28.0,
        },
    }
    resp = client.post("/api/explain", json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert "attributions" in data
    assert len(data["attributions"]) == 5
