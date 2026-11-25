"""Comprehensive Unit Tests for CPCB Band Alignment of Check My Air Verdict Messages.

Validates that:
1. Verdict wording aligns strictly with the CPCB category of the current PM2.5 value.
2. For 91-120 µg/m³ (Poor), 'Severe' and 'crisis' wording NEVER appears.
3. 'Severe' wording is used strictly and exclusively for the Severe band (> 250 µg/m³).
4. Sensitive health profiles receive stricter, tailored clinical guidance across all 6 CPCB bands.
5. Score logic (composite_score, effective_score, subscores) remains completely unchanged.
"""

import pytest
from backend.services.livability_service import LivabilityService


# Standard non-sensitive healthy adult profile
STANDARD_PROFILE = {"age_group": "adult"}

# Sensitive health profiles (asthma, COPD, senior, pregnancy, etc.)
SENSITIVE_PROFILE = {
    "age_group": "senior",
    "has_respiratory_condition": True,
    "asthma": True,
}

# 6 CPCB PM2.5 Bands with representative concentration values (µg/m³)
CPCB_BAND_SCENARIOS = [
    {
        "band": "Good",
        "pm25": 18.0,
        "range_desc": "0-30 µg/m³",
        "expected_category": "Good",
    },
    {
        "band": "Satisfactory",
        "pm25": 45.0,
        "range_desc": "31-60 µg/m³",
        "expected_category": "Satisfactory",
    },
    {
        "band": "Moderate",
        "pm25": 75.0,
        "range_desc": "61-90 µg/m³",
        "expected_category": "Moderate",
    },
    {
        "band": "Poor",
        "pm25": 105.0,  # 91 - 120 µg/m³
        "range_desc": "91-120 µg/m³",
        "expected_category": "Poor",
    },
    {
        "band": "Very Poor",
        "pm25": 185.0,  # 121 - 250 µg/m³
        "range_desc": "121-250 µg/m³",
        "expected_category": "Very Poor",
    },
    {
        "band": "Severe",
        "pm25": 320.0,  # > 250 µg/m³
        "range_desc": "> 250 µg/m³",
        "expected_category": "Severe",
    },
]


def make_mock_inputs(pm25_val: float):
    """Generate consistent mock inputs for evaluate_livability."""
    ref_info = {
        "reference_pm25": pm25_val,
        "reference_label": "Regional estimate (CAMS)",
        "reference_source": "Copernicus CAMS",
        "forecast_trend": "stable",
        "forecast_best_time": {"hour": "14:00", "pm25": pm25_val * 0.9},
        "seven_day_forecast": {
            "trend": "stable",
            "days": [{"date": "2026-11-25", "mean_pm25": pm25_val, "cpcb_category": "Good"}],
        },
    }
    weather_info = {
        "features": {"RH": 60.0, "WD": 180.0, "SR": 150.0, "BP": 745.0, "AT": 18.0},
        "is_delhi_ncr": True,
        "validity": "valid",
        "validity_warning": None,
    }
    ml_prediction = {
        "model_key": "xgboost",
        "model_name": "Tuned XGBoost",
        "pm25": pm25_val * 1.05,
        "cpcb_category": {"category": "Moderate"},
    }
    return ref_info, weather_info, ml_prediction


# ===========================================================================
# 1. Unit Tests: CPCB Category Determination
# ===========================================================================

@pytest.mark.parametrize("scenario", CPCB_BAND_SCENARIOS)
def test_get_cpcb_category_all_bands(scenario):
    """Test that get_cpcb_category accurately classifies PM2.5 across all 6 CPCB bands."""
    cat = LivabilityService.get_cpcb_category(scenario["pm25"])
    assert cat == scenario["expected_category"]


def test_get_cpcb_category_boundaries():
    """Test exact boundary points for CPCB PM2.5 breakpoints."""
    assert LivabilityService.get_cpcb_category(0.0) == "Good"
    assert LivabilityService.get_cpcb_category(30.0) == "Good"
    assert LivabilityService.get_cpcb_category(30.1) == "Satisfactory"
    assert LivabilityService.get_cpcb_category(60.0) == "Satisfactory"
    assert LivabilityService.get_cpcb_category(60.1) == "Moderate"
    assert LivabilityService.get_cpcb_category(90.0) == "Moderate"
    assert LivabilityService.get_cpcb_category(90.1) == "Poor"
    assert LivabilityService.get_cpcb_category(120.0) == "Poor"
    assert LivabilityService.get_cpcb_category(120.1) == "Very Poor"
    assert LivabilityService.get_cpcb_category(250.0) == "Very Poor"
    assert LivabilityService.get_cpcb_category(250.1) == "Severe"
    assert LivabilityService.get_cpcb_category(500.0) == "Severe"
    assert LivabilityService.get_cpcb_category(None) == "Unknown"


# ===========================================================================
# 2. Unit Tests: 6 Bands × 2 Health Profiles (12 Scenarios)
# ===========================================================================

@pytest.mark.parametrize("scenario", CPCB_BAND_SCENARIOS)
def test_verdict_messaging_standard_profile(scenario):
    """Verify verdict messaging for standard (non-sensitive) healthy adult across all 6 bands."""
    ref_info, weather_info, ml_prediction = make_mock_inputs(scenario["pm25"])
    result = LivabilityService.evaluate_livability(
        reference_info=ref_info,
        weather_info=weather_info,
        ml_prediction=ml_prediction,
        health_profile=STANDARD_PROFILE,
    )

    summary = result["summary"]
    advice = result["tailored_advice"]
    persona = result["persona_guidance"]
    cpcb_cat = result["cpcb_category"]

    # 1. Assert CPCB category matches expected
    assert cpcb_cat == scenario["expected_category"]

    # 2. Strict User Requirement: For Poor (91-120), do NOT say 'Severe' or 'crisis'
    if scenario["expected_category"] == "Poor":
        assert "severe" not in summary.lower(), f"Poor band summary must not contain 'severe': {summary}"
        assert "crisis" not in summary.lower(), f"Poor band summary must not contain 'crisis': {summary}"
        for key, text in advice.items():
            assert "severe" not in text.lower(), f"Poor band advice '{key}' must not contain 'severe': {text}"
            assert "crisis" not in text.lower(), f"Poor band advice '{key}' must not contain 'crisis': {text}"
        assert "severe" not in persona["general"]["details"].lower()
        assert "severe" not in persona["outdoor"]["details"].lower()

    # 3. Strict User Requirement: 'Severe' wording only for Severe band (> 250 µg/m³)
    if scenario["expected_category"] == "Severe":
        assert "severe" in summary.lower(), f"Severe band summary must contain 'severe': {summary}"
    else:
        assert "severe" not in summary.lower(), f"Non-severe band summary must not contain 'severe': {summary}"

    # 4. Verify 4 tailored advice keys exist
    assert "n95_mask" in advice
    assert "indoor_exercise" in advice
    assert "windows" in advice
    assert "purifier" in advice


@pytest.mark.parametrize("scenario", CPCB_BAND_SCENARIOS)
def test_verdict_messaging_sensitive_profile(scenario):
    """Verify verdict messaging for sensitive health profile across all 6 bands."""
    ref_info, weather_info, ml_prediction = make_mock_inputs(scenario["pm25"])
    result = LivabilityService.evaluate_livability(
        reference_info=ref_info,
        weather_info=weather_info,
        ml_prediction=ml_prediction,
        health_profile=SENSITIVE_PROFILE,
    )

    summary = result["summary"]
    advice = result["tailored_advice"]
    persona = result["persona_guidance"]
    cpcb_cat = result["cpcb_category"]

    # 1. Assert CPCB category matches expected
    assert cpcb_cat == scenario["expected_category"]

    # 2. Strict User Requirement: For Poor (91-120), do NOT say 'Severe' or 'crisis'
    if scenario["expected_category"] == "Poor":
        assert "severe" not in summary.lower(), f"Poor band sensitive summary must not contain 'severe': {summary}"
        assert "crisis" not in summary.lower(), f"Poor band sensitive summary must not contain 'crisis': {summary}"
        for key, text in advice.items():
            assert "severe" not in text.lower(), f"Poor band advice '{key}' must not contain 'severe': {text}"
            assert "crisis" not in text.lower(), f"Poor band advice '{key}' must not contain 'crisis': {text}"
        assert "severe" not in persona["general"]["details"].lower()
        assert "severe" not in persona["outdoor"]["details"].lower()

    # 3. Strict User Requirement: 'Severe' wording only for Severe band (> 250 µg/m³)
    if scenario["expected_category"] == "Severe":
        assert "severe" in summary.lower(), f"Severe band summary must contain 'severe': {summary}"
    else:
        assert "severe" not in summary.lower(), f"Non-severe band summary must not contain 'severe': {summary}"


# ===========================================================================
# 3. Unit Tests: Sensitive Profile Receives Stricter Advice Than Standard
# ===========================================================================

@pytest.mark.parametrize("scenario", CPCB_BAND_SCENARIOS)
def test_sensitive_profile_receives_stricter_advice(scenario):
    """Verify that sensitive profiles receive stricter, more protective advice than standard profiles."""
    ref_info, weather_info, ml_prediction = make_mock_inputs(scenario["pm25"])

    standard_res = LivabilityService.evaluate_livability(
        reference_info=ref_info,
        weather_info=weather_info,
        ml_prediction=ml_prediction,
        health_profile=STANDARD_PROFILE,
    )

    sensitive_res = LivabilityService.evaluate_livability(
        reference_info=ref_info,
        weather_info=weather_info,
        ml_prediction=ml_prediction,
        health_profile=SENSITIVE_PROFILE,
    )

    std_advice = standard_res["tailored_advice"]
    sens_advice = sensitive_res["tailored_advice"]

    # Sensitive summary must differ from standard summary to provide personalized guidance
    assert standard_res["summary"] != sensitive_res["summary"], (
        f"Sensitive summary must be tailored for band {scenario['band']}"
    )

    # In Moderate and Poor bands, sensitive profile should have stronger mask advice
    if scenario["band"] in ("Moderate", "Poor", "Very Poor"):
        assert "N95" in sens_advice["n95_mask"] or "respirator" in sens_advice["n95_mask"].lower()

    # In Poor and Very Poor, sensitive exercise advice should recommend avoiding outdoor exertion
    if scenario["band"] in ("Poor", "Very Poor", "Severe"):
        assert "avoid" in sens_advice["indoor_exercise"].lower() or "indoors" in sens_advice["indoor_exercise"].lower()


# ===========================================================================
# 4. Unit Tests: Score Logic Invariance
# ===========================================================================

def test_score_logic_strictly_unchanged():
    """Verify that score computation and numerical outputs are strictly preserved."""
    ref_info, weather_info, ml_prediction = make_mock_inputs(105.0)  # Poor band

    res = LivabilityService.evaluate_livability(
        reference_info=ref_info,
        weather_info=weather_info,
        ml_prediction=ml_prediction,
        health_profile=STANDARD_PROFILE,
    )

    # Verify score components and weights
    comp = res["score_components"]
    assert comp["reference_current"]["weight"] == 0.60
    assert comp["reference_forecast_24h"]["weight"] == 0.25
    assert comp["meteorological_ventilation"]["weight"] == 0.15

    # Verify subscores are non-zero numbers
    assert 20.0 <= comp["reference_current"]["subscore"] <= 35.0  # CPCB Poor subscore range
    assert res["score"] is not None
    assert 0 <= res["score"] <= 100
    assert res["raw_score"] == res["score"]  # With standard adult profile (0 shift)
