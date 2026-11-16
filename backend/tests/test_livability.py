"""Tests for Phase 2 Livability & Exposure Scoring Engine."""

from unittest.mock import MagicMock, patch
import pytest

from backend.config import Config
from backend.services.air_quality_service import aq_cache
from backend.services.livability_service import LivabilityService
from backend.services.weather_service import weather_cache


# ---------------------------------------------------------------------------
# 1. Unit Tests: Scoring Function
# ---------------------------------------------------------------------------

def test_pm25_to_subscore_ranges():
    """Verify PM2.5 mapping to 0-100 continuous score."""
    # WHO guideline level (10 µg/m³) -> >90
    s_who = LivabilityService.pm25_to_subscore(10.0)
    assert 90.0 <= s_who <= 100.0

    # CPCB Good (25 µg/m³) -> 80 - 90
    s_good = LivabilityService.pm25_to_subscore(25.0)
    assert 80.0 <= s_good <= 90.0

    # CPCB Satisfactory (45 µg/m³) -> 65 - 80
    s_sat = LivabilityService.pm25_to_subscore(45.0)
    assert 65.0 <= s_sat <= 80.0

    # CPCB Moderate (75 µg/m³) -> 50 - 65
    s_mod = LivabilityService.pm25_to_subscore(75.0)
    assert 50.0 <= s_mod <= 65.0

    # CPCB Poor (105 µg/m³) -> 35 - 50
    s_poor = LivabilityService.pm25_to_subscore(105.0)
    assert 35.0 <= s_poor <= 50.0

    # CPCB Very Poor (180 µg/m³) -> 20 - 35
    s_vpoor = LivabilityService.pm25_to_subscore(180.0)
    assert 20.0 <= s_vpoor <= 35.0

    # CPCB Severe (300 µg/m³) -> <20
    s_severe = LivabilityService.pm25_to_subscore(300.0)
    assert 0.0 <= s_severe <= 20.0


# ---------------------------------------------------------------------------
# 2. Integration Tests: POST /api/location/livability
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def clear_caches():
    """Clear caches between tests."""
    weather_cache.clear()
    aq_cache.clear()
    yield
    weather_cache.clear()
    aq_cache.clear()


def mock_cams_good_weather_and_aq(*args, **kwargs):
    """Mock good air quality in Delhi (PM2.5 = 22.0)."""
    url = args[0] if args else kwargs.get("url", "")
    mock_resp = MagicMock()
    mock_resp.status_code = 200

    if "forecast" in url:
        mock_resp.json.return_value = {
            "current": {
                "time": "2026-11-16T12:00",
                "temperature_2m": 21.0,
                "relative_humidity_2m": 50.0,
                "wind_direction_10m": 120.0,
                "surface_pressure": 985.0,
                "shortwave_radiation": 250.0,
            }
        }
        return mock_resp

    if "air-quality" in url:
        mock_resp.json.return_value = {
            "current": {
                "time": "2026-11-16T12:00",
                "pm2_5": 22.0,
                "european_aqi": 25,
                "us_aqi": 72,
            },
            "hourly": {
                "time": ["2026-11-16T12:00" for _ in range(24)],
                "pm2_5": [22.0 for _ in range(24)],
            },
        }
        return mock_resp

    return mock_resp


@patch("requests.get", side_effect=mock_cams_good_weather_and_aq)
def test_livability_primary_driver_delhi(mock_get, client):
    """Verify livability calculation when reference CAMS data is favorable in Delhi."""
    res = client.post("/api/location/livability", json={"lat": 28.6139, "lon": 77.2090})
    assert res.status_code == 200
    data = res.get_json()

    assert data["success"] is True
    livability = data["livability"]

    # Score should be in the Favorable range (>80)
    assert livability["score"] is not None
    assert livability["score"] >= 80
    assert "Favorable" in livability["tier"]
    assert livability["confidence"] == "high"

    # Primary driver must be Reference PM2.5 (CAMS)
    assert "Reference PM2.5 (CAMS model data)" in livability["primary_driver"]["source"]
    assert livability["primary_driver"]["current_pm25"] == 22.0

    # Secondary context must be clearly distinguished
    sec = livability["secondary_ml_context"]
    assert sec["model_key"] == "xgboost"
    assert "estimated_pm25" in sec
    assert "Delhi winter" in sec["scientific_limitation"]

    # Persona advice
    personas = livability["persona_guidance"]
    assert "general" in personas
    assert "sensitive" in personas
    assert "outdoor" in personas
    assert personas["general"]["tag"] == "Safe"


def mock_cams_failure(*args, **kwargs):
    """Mock weather succeeding but CAMS air quality failing."""
    url = args[0] if args else kwargs.get("url", "")
    if "forecast" in url:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "current": {
                "time": "2026-11-16T12:00",
                "temperature_2m": 22.0,
                "relative_humidity_2m": 55.0,
                "wind_direction_10m": 120.0,
                "surface_pressure": 985.0,
                "shortwave_radiation": 200.0,
            }
        }
        return mock_resp

    if "air-quality" in url:
        mock_resp = MagicMock()
        mock_resp.status_code = 503
        mock_resp.raise_for_status.side_effect = Exception("Service unavailable")
        return mock_resp

    return MagicMock(status_code=404)


@patch("requests.get", side_effect=mock_cams_failure)
def test_livability_reference_unavailable_never_silently_falls_back(mock_get, client):
    """STRICT REQUIREMENT: When reference is unavailable, return low confidence verdict.

    Must NEVER silently fall back to the ML model estimate.
    """
    res = client.post("/api/location/livability", json={"lat": 28.6139, "lon": 77.2090})
    assert res.status_code == 200
    data = res.get_json()

    livability = data["livability"]
    # Score must be None (not fabricated from ML estimate)
    assert livability["score"] is None
    assert livability["confidence"] == "low"
    assert "Unverified" in livability["tier"]
    assert "temporarily unavailable" in livability["confidence_reason"]
    assert "cannot be reliably established" in livability["confidence_reason"]

    # Primary driver marked unavailable
    assert livability["primary_driver"]["status"] == "unavailable"

    # Secondary ML context is present but explicitly marked as not used for score
    assert livability["secondary_ml_context"]["estimated_pm25"] is not None
    assert "Not used to fabricate livability score" in livability["secondary_ml_context"]["note"]


def mock_cams_severe(*args, **kwargs):
    """Mock hazardous air quality (PM2.5 = 280.0 µg/m³)."""
    url = args[0] if args else kwargs.get("url", "")
    mock_resp = MagicMock()
    mock_resp.status_code = 200

    if "forecast" in url:
        mock_resp.json.return_value = {
            "current": {
                "time": "2026-11-16T12:00",
                "temperature_2m": 15.0,
                "relative_humidity_2m": 85.0,
                "wind_direction_10m": 310.0,
                "surface_pressure": 995.0,
                "shortwave_radiation": 40.0,
            }
        }
        return mock_resp

    if "air-quality" in url:
        mock_resp.json.return_value = {
            "current": {
                "time": "2026-11-16T12:00",
                "pm2_5": 280.0,
                "european_aqi": 100,
                "us_aqi": 340,
            },
            "hourly": {
                "time": ["2026-11-16T12:00" for _ in range(24)],
                "pm2_5": [290.0 for _ in range(24)],
            },
        }
        return mock_resp

    return mock_resp


@patch("requests.get", side_effect=mock_cams_severe)
def test_livability_severe_verdict(mock_get, client):
    """Verify severe/hazardous exposure score and emergency advisories."""
    res = client.post("/api/location/livability", json={"lat": 28.6139, "lon": 77.2090})
    assert res.status_code == 200
    data = res.get_json()

    livability = data["livability"]
    assert livability["score"] < 25
    assert "Severe" in livability["tier"]
    assert "Emergency" in livability["persona_guidance"]["sensitive"]["tag"]
    assert "Avoid all outdoor exposure" in livability["verdicts"]["should_i_go"]


@patch("requests.get", side_effect=mock_cams_good_weather_and_aq)
def test_livability_outside_delhi_moderate_confidence(mock_get, client):
    """Verify that locations outside Delhi return moderate confidence."""
    # Bengaluru coordinates
    res = client.post("/api/location/livability", json={"lat": 12.9716, "lon": 77.5946})
    assert res.status_code == 200
    data = res.get_json()

    livability = data["livability"]
    assert livability["confidence"] == "moderate"
    assert "outside Delhi-NCR" in livability["confidence_reason"]
    assert data["location"]["is_delhi_ncr"] is False
