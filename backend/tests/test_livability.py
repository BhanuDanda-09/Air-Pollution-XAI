"""Tests for Phase 2 Livability & Exposure Scoring Engine."""

from unittest.mock import MagicMock, patch
import pytest

from backend.config import Config
from backend.services.air_quality_service import aq_cache
from backend.services.livability_service import LivabilityService
from backend.services.weather_service import weather_cache


# ---------------------------------------------------------------------------
# 1. Unit Tests: Scoring Function & Profile Sensitivity
# ---------------------------------------------------------------------------

def test_pm25_to_subscore_ranges():
    """Verify PM2.5 mapping to 0-100 continuous score."""
    s_who = LivabilityService.pm25_to_subscore(10.0)
    assert 90.0 <= s_who <= 100.0

    s_good = LivabilityService.pm25_to_subscore(25.0)
    assert 75.0 <= s_good <= 90.0

    s_sat = LivabilityService.pm25_to_subscore(45.0)
    assert 50.0 <= s_sat <= 75.0

    s_mod = LivabilityService.pm25_to_subscore(75.0)
    assert 35.0 <= s_mod <= 50.0

    s_poor = LivabilityService.pm25_to_subscore(105.0)
    assert 20.0 <= s_poor <= 35.0

    s_vpoor = LivabilityService.pm25_to_subscore(180.0)
    assert 10.0 <= s_vpoor <= 20.0

    s_severe = LivabilityService.pm25_to_subscore(300.0)
    assert 0.0 <= s_severe <= 10.0


def test_health_profile_shift_tightening():
    """Verify health profile shifts tighten thresholds for vulnerable individuals."""
    # Healthy adult: 0 shift
    res_adult = LivabilityService.calculate_health_profile_shift({"age_group": "adult"})
    assert res_adult["total_shift"] == 0
    assert res_adult["vulnerability"] == "standard"

    # Asthmatic child: child (+8) + asthma (+10) = 18 shift
    res_asthma_child = LivabilityService.calculate_health_profile_shift({
        "age_group": "child",
        "has_respiratory_condition": True,
    })
    assert res_asthma_child["total_shift"] == 18
    assert res_asthma_child["vulnerability"] == "elevated"

    # Multiple high-risk factors: capped at max_total_shift (25)
    res_multi = LivabilityService.calculate_health_profile_shift({
        "age_group": "senior",
        "has_respiratory_condition": True,
        "has_heart_condition": True,
        "is_pregnant": True,
    })
    assert res_multi["total_shift"] == 25
    assert res_multi["vulnerability"] == "high"


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


def make_mock_air_quality(pm25_val=22.0, with_hourly=True):
    """Factory for mocked air quality responses."""
    def _mock(*args, **kwargs):
        url = args[0] if args else kwargs.get("url", "")
        mock_resp = MagicMock()
        mock_resp.status_code = 200

        if "forecast" in url:
            mock_resp.json.return_value = {
                "current": {
                    "time": "2026-11-17T12:00",
                    "temperature_2m": 21.0,
                    "relative_humidity_2m": 50.0,
                    "wind_direction_10m": 120.0,
                    "surface_pressure": 985.0,
                    "shortwave_radiation": 250.0,
                }
            }
            return mock_resp

        if "air-quality" in url:
            hourly_times = [f"2026-11-17T{h:02d}:00" for h in range(24)]
            # Vary hourly PM2.5 so there is an explicit minimum at 14:00
            hourly_pm = [pm25_val + 5.0 for _ in range(24)]
            hourly_pm[14] = max(5.0, pm25_val - 8.0)

            payload = {
                "current": {
                    "time": "2026-11-17T12:00",
                    "pm2_5": pm25_val,
                    "european_aqi": 25,
                    "us_aqi": 72,
                }
            }
            if with_hourly:
                payload["hourly"] = {
                    "time": hourly_times * 7,
                    "pm2_5": hourly_pm * 7,
                }
            mock_resp.json.return_value = payload
            return mock_resp

        return mock_resp
    return _mock


@patch("requests.get", side_effect=make_mock_air_quality(22.0))
def test_livability_verdict_good_to_go(mock_get, client):
    """Verify 'Good to go' verdict when CAMS reference is clean."""
    res = client.post("/api/location/livability", json={"lat": 28.6139, "lon": 77.2090})
    assert res.status_code == 200
    data = res.get_json()

    livability = data["livability"]
    assert livability["verdict"] == "Good to go"
    assert livability["confidence"] == "high"
    assert "Reference PM2.5 (CAMS model data)" in livability["primary_driver"]["source"]

    # Check tailored advice
    advice = livability["tailored_advice"]
    assert "n95_mask" in advice
    assert "indoor_exercise" in advice
    assert "windows" in advice
    assert "purifier" in advice

    # Check best time today
    best_time = livability.get("best_time_today")
    assert best_time is not None
    assert "Optimal outdoor activity window" in best_time["guidance"]

    # Medical disclaimer
    assert "Medical Disclaimer" in livability["medical_disclaimer"]


@patch("requests.get", side_effect=make_mock_air_quality(55.0))
def test_livability_verdict_take_precautions(mock_get, client):
    """Verify 'Take precautions' verdict for moderate particulate levels."""
    res = client.post("/api/location/livability", json={"lat": 28.6139, "lon": 77.2090})
    assert res.status_code == 200
    data = res.get_json()

    livability = data["livability"]
    assert livability["verdict"] == "Take precautions"


@patch("requests.get", side_effect=make_mock_air_quality(105.0))
def test_livability_verdict_avoid_outdoor(mock_get, client):
    """Verify 'Avoid outdoor activity' verdict for poor air quality."""
    res = client.post("/api/location/livability", json={"lat": 28.6139, "lon": 77.2090})
    assert res.status_code == 200
    data = res.get_json()

    livability = data["livability"]
    assert livability["verdict"] == "Avoid outdoor activity"
    assert "N95" in livability["tailored_advice"]["n95_mask"]


@patch("requests.get", side_effect=make_mock_air_quality(220.0))
def test_livability_verdict_not_recommended(mock_get, client):
    """Verify 'Not recommended' verdict for severe air quality."""
    res = client.post("/api/location/livability", json={"lat": 28.6139, "lon": 77.2090})
    assert res.status_code == 200
    data = res.get_json()

    livability = data["livability"]
    assert livability["verdict"] == "Not recommended"


@patch("requests.get", side_effect=make_mock_air_quality(38.0))
def test_health_profile_shifts_marginal_verdict(mock_get, client):
    """Verify that reporting asthma/heart conditions flips a marginal score into a stricter verdict."""
    # 1. Without profile: baseline is 'Good to go' or 'Take precautions'
    res_healthy = client.post("/api/location/livability", json={
        "lat": 28.6139,
        "lon": 77.2090,
        "health_profile": {"age_group": "adult"},
    })
    score_healthy = res_healthy.get_json()["livability"]["score"]

    # 2. With asthma and senior age: shifts thresholds downward
    res_sensitive = client.post("/api/location/livability", json={
        "lat": 28.6139,
        "lon": 77.2090,
        "health_profile": {
            "age_group": "senior",
            "has_respiratory_condition": True,
        },
    })
    score_sensitive = res_sensitive.get_json()["livability"]["score"]
    assert score_sensitive < score_healthy
    applied = res_sensitive.get_json()["livability"]["health_profile_applied"]
    assert applied["total_shift"] == 18


def mock_cams_failure(*args, **kwargs):
    """Mock weather succeeding but CAMS air quality failing."""
    url = args[0] if args else kwargs.get("url", "")
    if "forecast" in url:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "current": {
                "time": "2026-11-17T12:00",
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
    assert livability["score"] is None
    assert livability["confidence"] == "low"
    assert "Unverified" in livability["verdict"]
    assert "cannot be reliably established" in livability["confidence_reason"]

    # Secondary ML context is present but marked as not used to fabricate score
    assert livability["secondary_ml_context"]["estimated_pm25"] is not None
    assert "Not used to fabricate livability score" in livability["secondary_ml_context"]["note"]


@patch("requests.get", side_effect=make_mock_air_quality(25.0, with_hourly=False))
def test_livability_forecast_failure_fallback(mock_get, client):
    """Verify engine still returns livability using current reference when forecast is missing."""
    res = client.post("/api/location/livability", json={"lat": 28.6139, "lon": 77.2090})
    assert res.status_code == 200
    data = res.get_json()

    livability = data["livability"]
    assert livability["score"] is not None
    assert livability["verdict"] == "Good to go"


def test_compare_livability_validation(client):
    """Test validation errors for side-by-side location comparison."""
    # Missing location_b
    res1 = client.post("/api/location/compare-livability", json={
        "location_a": {"lat": 28.6, "lon": 77.2},
    })
    assert res1.status_code == 400

    # Non-numeric coordinates
    res2 = client.post("/api/location/compare-livability", json={
        "location_a": {"lat": "north", "lon": 77.2},
        "location_b": {"lat": 28.5, "lon": 77.1},
    })
    assert res2.status_code == 400


@patch("requests.get", side_effect=make_mock_air_quality(45.0, with_hourly=True))
def test_compare_livability_success(mock_get, client):
    """Test comparing two locations returns winner determination and side-by-side metrics."""
    res = client.post("/api/location/compare-livability", json={
        "location_a": {"lat": 28.63, "lon": 77.22, "name": "Connaught Place"},
        "location_b": {"lat": 28.46, "lon": 77.03, "name": "Cyber City"},
        "health_profile": {"age_group": "adult"},
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "winner" in data
    assert "summary" in data
    assert data["location_a"]["name"] == "Connaught Place"
    assert data["location_b"]["name"] == "Cyber City"
    assert data["location_a"]["score"] is not None
    assert data["location_b"]["score"] is not None
