"""Unit and integration tests for location assessment endpoint and services."""

import time
from unittest.mock import MagicMock, patch
import pytest

from backend.config import Config
from backend.services.air_quality_service import AirQualityService, aq_cache
from backend.services.weather_service import HPA_TO_MMHG, WeatherService, weather_cache
from backend.utils.cache import ThreadSafeTTLCache
from backend.utils.rate_limiter import InMemoryRateLimiter


# ---------------------------------------------------------------------------
# 1. Unit Tests: Unit Conversions and Boundary Checks
# ---------------------------------------------------------------------------

def test_hpa_to_mmhg_conversion():
    """Verify standard atmospheric pressure conversion from hPa to mmHg."""
    standard_hpa = 1013.25
    expected_mmhg = round(standard_hpa * 0.750062, 2)
    assert expected_mmhg == 760.00
    assert abs(HPA_TO_MMHG - 0.750062) < 1e-6

    # Test sample pressure values
    assert round(980.0 * HPA_TO_MMHG, 2) == 735.06
    assert round(966.586 * HPA_TO_MMHG, 2) == 725.00


def test_is_within_delhi_ncr():
    """Verify geographic bounding box logic for Delhi-NCR (including Gurugram, Noida, Faridabad)."""
    # Delhi Connaught Place
    assert WeatherService.is_within_delhi_ncr(28.6315, 77.2167) is True
    # Noida (Sector 62 / City Center)
    assert WeatherService.is_within_delhi_ncr(28.5355, 77.3910) is True
    # Gurugram (Cyber City / Sector 29)
    assert WeatherService.is_within_delhi_ncr(28.4595, 77.0266) is True
    # Faridabad (Sector 16 / NIT)
    assert WeatherService.is_within_delhi_ncr(28.4089, 77.3178) is True

    # Mumbai (Outside)
    assert WeatherService.is_within_delhi_ncr(19.0760, 72.8777) is False
    # Bengaluru (Outside)
    assert WeatherService.is_within_delhi_ncr(12.9716, 77.5946) is False
    # London (Outside)
    assert WeatherService.is_within_delhi_ncr(51.5074, -0.1278) is False


def test_inspect_training_ranges_no_clamping():
    """Verify out-of-training-range warnings are produced without silent clamping."""
    # Within training baseline (Delhi winter)
    in_range_features = {
        "RH": 65.0,
        "WD": 150.0,
        "SR": 120.0,
        "BP": 735.0,
        "AT": 18.0,
    }
    has_out, warnings = WeatherService.inspect_training_ranges(in_range_features)
    assert has_out is False
    assert len(warnings) == 0

    # Summer extreme heat (AT = 42°C > 23°C max) and high radiation (SR = 600 > 334 max)
    out_range_features = {
        "RH": 25.0,  # below 36%
        "WD": 150.0,
        "SR": 600.0,  # above 334 W/m2
        "BP": 715.0,  # below 726 mmHg
        "AT": 42.0,   # above 23°C
    }
    has_out, warnings = WeatherService.inspect_training_ranges(out_range_features)
    assert has_out is True
    assert len(warnings) == 4
    # Ensure warnings specify the exact parameter and values
    warning_text = " ".join(warnings)
    assert "Relative Humidity (RH)" in warning_text
    assert "Solar Radiation (SR)" in warning_text
    assert "Barometric Pressure (BP)" in warning_text
    assert "Air Temperature (AT)" in warning_text


# ---------------------------------------------------------------------------
# 2. Unit Tests: Thread-Safe TTL Cache
# ---------------------------------------------------------------------------

def test_thread_safe_ttl_cache():
    """Verify cache get, set, TTL expiry, and size limits."""
    cache = ThreadSafeTTLCache(maxsize=3, ttl=1)

    cache.set("a", 100)
    cache.set("b", 200)
    assert cache.get("a") == 100
    assert cache.get("b") == 200
    assert cache.get("nonexistent") is None

    # Test eviction when exceeding maxsize
    cache.set("c", 300)
    cache.set("d", 400)
    assert len(cache) <= 3

    # Test TTL expiration
    time.sleep(1.1)
    assert cache.get("a") is None
    assert cache.get("b") is None


# ---------------------------------------------------------------------------
# 3. Unit Tests: In-Memory Rate Limiter
# ---------------------------------------------------------------------------

def test_in_memory_rate_limiter():
    """Verify rate limiter allows up to limit and blocks 429 afterwards."""
    limiter = InMemoryRateLimiter(max_requests=3, window_seconds=60)
    ip = "192.168.1.50"

    allowed1, rem1, _ = limiter.is_allowed(ip)
    allowed2, rem2, _ = limiter.is_allowed(ip)
    allowed3, rem3, _ = limiter.is_allowed(ip)
    allowed4, rem4, retry_after = limiter.is_allowed(ip)

    assert allowed1 is True and rem1 == 2
    assert allowed2 is True and rem2 == 1
    assert allowed3 is True and rem3 == 0
    assert allowed4 is False and rem4 == 0
    assert retry_after > 0


# ---------------------------------------------------------------------------
# 4. Integration Tests: POST /api/location/assess
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def clear_caches_and_limits():
    """Clear singleton caches before and after each test."""
    weather_cache.clear()
    aq_cache.clear()
    yield
    weather_cache.clear()
    aq_cache.clear()


def mock_open_meteo_weather_response(*args, **kwargs):
    """Mock standard Open-Meteo weather API response."""
    url = args[0] if args else kwargs.get("url", "")
    mock_resp = MagicMock()
    mock_resp.status_code = 200

    if "forecast" in url:
        mock_resp.json.return_value = {
            "current": {
                "time": "2026-11-16T12:00",
                "temperature_2m": 22.5,
                "relative_humidity_2m": 62.0,
                "wind_direction_10m": 140.0,
                "surface_pressure": 985.0,  # 985 * 0.750062 = 738.81 mmHg
                "shortwave_radiation": 180.0,
            }
        }
        return mock_resp

    if "air-quality" in url:
        mock_resp.json.return_value = {
            "current": {
                "time": "2026-11-16T12:00",
                "pm2_5": 115.4,
                "european_aqi": 85,
                "us_aqi": 182,
            }
        }
        return mock_resp

    return mock_resp


@patch("requests.get", side_effect=mock_open_meteo_weather_response)
def test_location_assess_success_delhi(mock_get, client):
    """Test full assessment flow for a valid coordinate in Delhi."""
    res = client.post("/api/location/assess", json={"lat": 28.6139, "lon": 77.2090})
    assert res.status_code == 200
    data = res.get_json()

    assert data["success"] is True

    # Location checks
    assert data["location"]["is_delhi_ncr"] is True
    assert data["location"]["validity"] == "valid_training_region"
    assert data["location"]["validity_warning"] is None

    # Model prediction
    assert "pm25" in data["model_prediction"]
    assert data["model_prediction"]["model_key"] == "xgboost"
    assert data["model_prediction"]["pm25"] > 0
    assert "cpcb_category" in data["model_prediction"]

    # Reference PM2.5 checks - must be named "Reference PM2.5 (CAMS model data)"
    ref_aq = data["reference_air_quality"]
    assert ref_aq["reference_pm25"] == 115.4
    assert ref_aq["reference_label"] == "Reference PM2.5 (CAMS model data)"
    assert ref_aq["status"] == "available"

    # Comparison discrepancy
    comp = data["model_vs_reference_comparison"]
    assert comp is not None
    assert comp["reference_pm25"] == 115.4
    assert comp["reference_label"] == "Reference PM2.5 (CAMS model data)"
    assert "delta" in comp
    assert "discrepancy_explanation" in comp

    # Meteorological inputs & conversion
    inputs = data["meteorological_inputs"]
    features = inputs["features"]
    assert features["AT"] == 22.5
    assert features["RH"] == 62.0
    assert features["BP"] == 738.81  # Converted from 985 hPa

    # SHAP feature attributions
    shap = data["shap_attributions"]
    assert "attributions" in shap
    assert len(shap["attributions"]) == 5
    assert "attribution_focus" in shap


@patch("requests.get", side_effect=mock_open_meteo_weather_response)
def test_location_assess_outside_delhi_warning(mock_get, client):
    """Test outside-Delhi assessment returns validity='outside_training_region' and explicit warning."""
    # Mumbai coordinates
    res = client.post("/api/location/assess", json={"lat": 19.0760, "lon": 72.8777})
    assert res.status_code == 200
    data = res.get_json()

    assert data["success"] is True
    assert data["location"]["is_delhi_ncr"] is False
    assert data["location"]["validity"] == "outside_training_region"
    assert "outside the model's validated training region" in data["location"]["validity_warning"]
    assert "regional_limitation" in data["scientific_disclaimers"]


def mock_air_quality_failure(*args, **kwargs):
    """Mock weather succeeding but air quality service failing with timeout/500."""
    url = args[0] if args else kwargs.get("url", "")
    if "forecast" in url:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "current": {
                "time": "2026-11-16T12:00",
                "temperature_2m": 20.0,
                "relative_humidity_2m": 55.0,
                "wind_direction_10m": 120.0,
                "surface_pressure": 980.0,
                "shortwave_radiation": 200.0,
            }
        }
        return mock_resp

    if "air-quality" in url:
        mock_resp = MagicMock()
        mock_resp.status_code = 503
        mock_resp.raise_for_status.side_effect = Exception("CAMS service timeout")
        return mock_resp

    return MagicMock(status_code=404)


@patch("requests.get", side_effect=mock_air_quality_failure)
def test_reference_api_failure_fallback(mock_get, client):
    """Verify that if Reference API fails, model prediction is still returned with reference=null."""
    res = client.post("/api/location/assess", json={"lat": 28.6139, "lon": 77.2090})
    assert res.status_code == 200
    data = res.get_json()

    assert data["success"] is True
    # Model prediction still succeeds
    assert data["model_prediction"]["pm25"] > 0
    # Reference PM2.5 is null/unavailable
    assert data["reference_air_quality"]["reference_pm25"] is None
    assert data["reference_air_quality"]["status"] == "unavailable"
    # Comparison is None
    assert data["model_vs_reference_comparison"] is None


@patch("requests.get", side_effect=Exception("Connection refused"))
def test_weather_api_failure_returns_502(mock_get, client):
    """Verify that if live weather cannot be fetched, endpoint returns 502 Bad Gateway."""
    res = client.post("/api/location/assess", json={"lat": 28.6139, "lon": 77.2090})
    assert res.status_code == 502
    body = res.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == "WEATHER_SERVICE_ERROR"


def test_location_assess_validation_errors(client):
    """Verify request validation for missing, invalid, or out-of-bounds coordinates."""
    # Empty body
    res = client.post("/api/location/assess", data="bad", content_type="application/json")
    assert res.status_code == 400

    # Missing lon
    res = client.post("/api/location/assess", json={"lat": 28.5})
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "MISSING_COORDINATES"

    # Non-numeric
    res = client.post("/api/location/assess", json={"lat": "north", "lon": 77.2})
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "INVALID_COORDINATES"

    # Physical latitude out of bounds
    res = client.post("/api/location/assess", json={"lat": 95.0, "lon": 77.2})
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "COORDINATES_OUT_OF_BOUNDS"


@patch("requests.get", side_effect=mock_open_meteo_weather_response)
def test_location_assess_rate_limiter_blocks(mock_get, client):
    """Verify rate limiter blocks the 31st request from a single IP."""
    # Use a custom unique IP header to avoid polluting other tests
    test_ip = "198.51.100.99"
    headers = {"X-Forwarded-For": test_ip}

    for i in range(Config.LOCATION_RATE_LIMIT_MAX):
        res = client.post("/api/location/assess", json={"lat": 28.6, "lon": 77.2}, headers=headers)
        assert res.status_code == 200, f"Request {i+1} failed"

    # The 31st request should be rejected with 429
    blocked_res = client.post("/api/location/assess", json={"lat": 28.6, "lon": 77.2}, headers=headers)
    assert blocked_res.status_code == 429
    body = blocked_res.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == "RATE_LIMIT_EXCEEDED"


@patch("requests.get", side_effect=mock_open_meteo_weather_response)
def test_location_assess_rate_limiter_trusted_proxy_header(mock_get, client):
    """Verify that get_client_ip uses the last (trusted-proxy) entry in X-Forwarded-For."""
    from backend.routes.location_routes import get_client_ip
    with client.application.test_request_context(
        "/api/location/assess",
        headers={"X-Forwarded-For": "spoofed_untrusted_client, 203.0.113.50"},
    ):
        ip = get_client_ip()
        assert ip == "203.0.113.50"

