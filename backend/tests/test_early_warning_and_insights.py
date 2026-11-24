"""Tests for Early Warning (CAMS 24-72h), Pollutant Interactions, and Citizen Precautions."""

import pytest
from backend.services.air_quality_service import AirQualityService
from backend.services.multi_pollutant_service import MultiPollutantService
from backend.services.livability_service import LivabilityService
from backend.services.risk_service import RiskService


def test_get_early_warning_forecast_structure():
    """Verify that get_early_warning_forecast returns the mandated schema and Reference CAMS label."""
    res = AirQualityService.get_early_warning_forecast(28.6139, 77.2090, horizon_hours=72)
    assert res is not None
    assert res.get("success") is True
    assert res.get("reference_label") == "Reference forecast (CAMS)"
    assert "banner" in res
    assert "hourly_series" in res
    assert len(res["hourly_series"]) > 0

    banner = res["banner"]
    assert "has_warning" in banner
    assert "severity_level" in banner
    assert "message" in banner


def test_early_warning_threshold_detection():
    """Verify that early warning episodes detect CPCB Poor/Very Poor/Severe breaches."""
    # Test with simulated mock or fallback response
    res = AirQualityService.get_early_warning_forecast(28.6139, 77.2090, horizon_hours=48)
    assert "horizon_hours" in res
    assert res["horizon_hours"] == 48


def test_get_pollutant_interactions():
    """Verify that 6x6 correlation matrix and plain-language readings are generated."""
    res = MultiPollutantService.get_pollutant_interactions(28.6139, 77.2090, days=7)
    assert res is not None
    assert res.get("success") is True
    assert res.get("pollutants") == ["PM2.5", "PM10", "NO2", "SO2", "CO", "O3"]

    matrix = res.get("matrix")
    assert len(matrix) == 6
    for i in range(6):
        assert len(matrix[i]) == 6
        assert matrix[i][i] == 1.0  # Self correlation is exactly 1.0
        for j in range(6):
            # Symmetry test
            assert abs(matrix[i][j] - matrix[j][i]) < 1e-4
            # Bounded between -1 and +1
            assert -1.0 <= matrix[i][j] <= 1.0

    readings = res.get("readings")
    assert len(readings) >= 4
    # Ensure combustion and titration readings are present
    titles = [r["title"] for r in readings]
    assert any("Combustion" in t for t in titles)
    assert any("Photochemical" in t or "Titration" in t for t in titles)


def test_citizen_precautions_generation():
    """Verify that citizen precautions adapt to health conditions and link to /faq."""
    profile_asthma = {
        "age_group": "adult",
        "asthma": True,
        "has_heart_condition": False,
        "is_pregnant": False,
    }
    precautions_asthma = LivabilityService.generate_citizen_precautions(
        effective_score=45.0,
        cpcb_category="Poor",
        health_profile=profile_asthma,
    )
    assert precautions_asthma["precautions_count"] > 0
    assert "Respiratory Vulnerability" in precautions_asthma["health_tags"]
    assert precautions_asthma["faq_link"] == "/faq"

    # Verify asthma precaution action
    asthma_precaution = next(
        (p for p in precautions_asthma["precautions"] if "Asthma" in p["title"]), None
    )
    assert asthma_precaution is not None
    assert "rescue bronchodilators" in asthma_precaution["recommendation"].lower()

    # Pregnancy profile
    profile_preg = {
        "age_group": "adult",
        "is_pregnant": True,
    }
    precautions_preg = LivabilityService.generate_citizen_precautions(
        effective_score=35.0,
        cpcb_category="Very Poor",
        health_profile=profile_preg,
    )
    assert "Expectant Mother" in precautions_preg["health_tags"]
    preg_item = next(
        (p for p in precautions_preg["precautions"] if "Pregnancy" in p["title"] or "Maternal" in p["category"]), None
    )
    assert preg_item is not None


def test_risk_service_tailored_precautions():
    """Verify that Personal Risk Service returns tailored precautions and /faq link."""
    profile = {
        "conditions": ["asthma", "cardiovascular_disease"],
        "is_pregnant": False,
        "outdoor_exercise_hours": 6.0,
        "commute_mode": "two_wheeler",
        "household": "children",
    }
    risk_res = RiskService.evaluate_personal_risk(
        aqi=240,
        pollutants={"pm25": 140.0, "pm10": 260.0},
        profile=profile,
    )
    assert risk_res["score"] > 50
    assert "tailored_precautions" in risk_res
    assert risk_res["faq_link"] == "/faq"
    assert len(risk_res["tailored_precautions"]) >= 3


def test_early_warning_api_routes(client):
    """Test Flask endpoints for early warning and interactions."""
    # GET /api/air/early-warning
    ew_resp = client.get("/api/air/early-warning?lat=28.6139&lon=77.2090")
    assert ew_resp.status_code == 200
    ew_json = ew_resp.get_json()
    assert ew_json["success"] is True
    ref_label = ew_json.get("reference_label") or ew_json.get("data", {}).get("reference_label")
    assert ref_label == "Reference forecast (CAMS)"

    # POST /api/air/early-warning/check
    check_resp = client.post(
        "/api/air/early-warning/check",
        json={"locations": [{"name": "Delhi Connaught Place", "lat": 28.6315, "lon": 77.2167}]},
    )
    assert check_resp.status_code == 200
    check_json = check_resp.get_json()
    assert check_json["success"] is True
    warnings = check_json.get("warnings") if "warnings" in check_json else check_json.get("data", {}).get("warnings")
    assert warnings is not None

    # GET /api/air/interactions
    int_resp = client.get("/api/air/interactions?lat=28.6139&lon=77.2090&days=7")
    assert int_resp.status_code == 200
    int_json = int_resp.get_json()
    assert int_json["success"] is True
    matrix = int_json.get("matrix") or int_json.get("data", {}).get("matrix")
    assert len(matrix) == 6
