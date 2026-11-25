"""Tests for dynamic place-specific and health-tailored precaution generation engine."""

import pytest
from backend.services.risk_service import RiskService
from backend.services.livability_service import LivabilityService


def _build_mock_place_context(
    name="Test City",
    pm25=30.0,
    o3=25.0,
    dust=2.0,
    governing_pollutant="PM2.5",
    aqi=75,
    cpcb_category="Satisfactory",
    temp_c=24.0,
    humidity=50.0,
    wind_speed=6.0,
    elevation=100.0,
    annual_mean_pm25=25.0,
    worst_month_name="January",
    worst_mean_pm25=45.0,
    best_month_name="July",
    best_mean_pm25=15.0,
    inversion_factor=1.3,
):
    """Utility to generate controlled, deterministic mock place context."""
    return {
        "name": name,
        "lat": 12.97,
        "lon": 77.59,
        "elevation": elevation,
        "current_air": {
            "pm25": pm25,
            "o3": o3,
            "dust": dust,
            "overall_aqi": aqi,
            "cpcb_category": cpcb_category,
            "governing_pollutant": governing_pollutant,
            "pollutants": {
                "PM2.5": {"concentration": pm25, "unit": "µg/m³"},
                "O3": {"concentration": o3, "unit": "µg/m³"},
            },
        },
        "current_weather": {
            "temperature": temp_c,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "elevation": elevation,
        },
        "climatology": {
            "annual_mean_pm25": annual_mean_pm25,
            "best_month": {"month": 7, "month_name": best_month_name, "mean_pm25": best_mean_pm25},
            "worst_month": {"month": 1, "month_name": worst_month_name, "mean_pm25": worst_mean_pm25},
            "winter_inversion_factor": inversion_factor,
            "monthly_pm25": [
                {"month": i, "month_name": f"Month {i}", "mean_pm25": 20.0 + i * 2}
                for i in range(1, 13)
            ],
        },
        "forecast": {
            "mean_pm25_24h": pm25,
            "best_time_today": RiskService.calculate_best_time_today(
                place_name=name,
                governing_pollutant=governing_pollutant,
                current_pm25=pm25,
                current_o3=o3,
                inversion_factor=inversion_factor,
            ),
        },
    }


def test_distinct_destinations_produce_distinct_precautions():
    """Requirement: Two destinations with different data must produce distinct precaution sets."""
    profile = {
        "conditions": ["asthma"],
        "age_group": "adult",
        "is_pregnant": False,
        "commute_mode": "two_wheeler",
    }

    # Bengaluru scenario: Ozone governing, high elevation (910m), moderate temperature, low inversion
    bengaluru_ctx = _build_mock_place_context(
        name="Bengaluru",
        pm25=32.0,
        o3=68.0,
        governing_pollutant="O3",
        elevation=910.0,
        temp_c=22.0,
        humidity=58.0,
        annual_mean_pm25=24.0,
        inversion_factor=1.35,
    )

    # Delhi scenario: PM2.5 governing, severe winter inversion (2.8x), cold air (12C), low elevation (214m)
    delhi_ctx = _build_mock_place_context(
        name="Delhi",
        pm25=185.0,
        o3=18.0,
        governing_pollutant="PM2.5",
        elevation=214.0,
        temp_c=12.0,
        humidity=78.0,
        annual_mean_pm25=98.0,
        inversion_factor=2.8,
    )

    bengaluru_precautions = RiskService.generate_place_precautions(bengaluru_ctx, profile)
    delhi_precautions = RiskService.generate_place_precautions(delhi_ctx, profile)

    # Both must produce non-empty lists
    assert len(bengaluru_precautions) > 0
    assert len(delhi_precautions) > 0

    bengaluru_texts = {p["text"] for p in bengaluru_precautions}
    delhi_texts = {p["text"] for p in delhi_precautions}

    # Precaution sets must not be identical
    assert bengaluru_texts != delhi_texts

    # Bengaluru must have ozone-specific guidance, Delhi must have severe inversion guidance
    assert any("ozone" in t.lower() for t in bengaluru_texts)
    assert any("inversion factor reaches" in t.lower() for t in delhi_texts)


def test_identical_data_produces_identical_output():
    """Requirement: Identical data must produce deterministic, identical output."""
    profile = {"conditions": ["cardiovascular_disease"], "age_group": "senior"}
    ctx1 = _build_mock_place_context(name="Pune", pm25=42.0, o3=30.0, elevation=560.0)
    ctx2 = _build_mock_place_context(name="Pune", pm25=42.0, o3=30.0, elevation=560.0)

    res1 = RiskService.generate_place_precautions(ctx1, profile)
    res2 = RiskService.generate_place_precautions(ctx2, profile)

    assert len(res1) == len(res2)
    for p1, p2 in zip(res1, res2):
        assert p1["id"] == p2["id"]
        assert p1["category"] == p2["category"]
        assert p1["text"] == p2["text"]
        assert p1["trigger"] == p2["trigger"]
        assert p1["priority"] == p2["priority"]
        assert p1["source"] == p2["source"]


def test_ozone_governed_place_never_recommends_midday_exercise():
    """Requirement: An ozone-governed place never recommends midday exercise (must avoid 12:00-5:00 PM)."""
    profile = {"conditions": ["asthma"]}
    ctx = _build_mock_place_context(
        name="Sunny City",
        pm25=28.0,
        o3=75.0,
        governing_pollutant="O3",
    )

    precautions = RiskService.generate_place_precautions(ctx, profile)
    ozone_item = next((p for p in precautions if "ozone" in p["text"].lower()), None)

    assert ozone_item is not None
    # Must warn to avoid midday / afternoon exercise when solar radiation drives photochemical reactions
    assert "avoid" in ozone_item["text"].lower()
    assert "12:00" in ozone_item["text"] or "midday" in ozone_item["text"].lower() or "afternoon" in ozone_item["text"].lower()
    # Must NOT recommend midday exercise
    assert "exercise during midday" not in ozone_item["text"].lower()

    # Best time today must also steer clear of midday (11:00-17:00)
    best_time = ctx["forecast"]["best_time_today"]
    assert "12:00 PM" not in best_time.get("window", "") and "2:00 PM" not in best_time.get("window", "")


def test_suitable_destination_receives_maintenance_advice():
    """Requirement: A suitable destination receives maintenance advice rather than warning-heavy text."""
    # Profile limit for general adult without conditions is ~35 µg/m³
    profile = {"conditions": [], "age_group": "adult", "is_pregnant": False}
    # Clean place with annual mean 18.0 µg/m³
    ctx = _build_mock_place_context(
        name="Kochi Clean",
        pm25=18.0,
        o3=20.0,
        annual_mean_pm25=18.0,
        worst_mean_pm25=28.0,
        inversion_factor=1.1,
    )

    suitability_info = RiskService.classify_destination_suitability(ctx, profile)
    assert suitability_info["suitability"] == "Suitable"
    assert len(suitability_info["numeric_reasons"]) >= 2

    precautions = RiskService.generate_place_precautions(ctx, profile, suitability_info)
    move_item = next((p for p in precautions if p["category"] == "If you move here"), None)

    assert move_item is not None
    assert "favorable annual air baseline" in move_item["text"].lower()
    assert "maintenance" in move_item["text"].lower()
    # Must not contain severe crisis warnings
    assert "severe" not in move_item["text"].lower()
    assert "crisis" not in move_item["text"].lower()


def test_every_precaution_has_all_required_structured_fields():
    """Requirement: Every precaution item must have {id, category, text, trigger, priority, source}."""
    profile = {"conditions": ["asthma", "hypertension"], "age_group": "senior"}
    ctx = _build_mock_place_context(
        name="Varied City",
        pm25=85.0,
        o3=45.0,
        dust=55.0,
        temp_c=36.0,
        humidity=74.0,
        elevation=850.0,
        inversion_factor=2.1,
    )

    precautions = RiskService.generate_place_precautions(ctx, profile)
    assert len(precautions) >= 4

    for p in precautions:
        assert isinstance(p.get("id"), str) and len(p["id"]) > 0
        assert isinstance(p.get("category"), str) and len(p["category"]) > 0
        assert isinstance(p.get("text"), str) and len(p["text"]) > 0
        assert isinstance(p.get("trigger"), str) and len(p["trigger"]) > 0
        assert p.get("priority") in ("High", "Medium", "Low")
        assert isinstance(p.get("source"), str) and len(p["source"]) > 0
        assert "general advisory" in p["source"].lower() or "health-based" in p["source"].lower() or "guidance" in p["source"].lower() or "advisory" in p["source"].lower()


def test_livability_service_integrates_place_precautions():
    """Requirement: Check My Air (LivabilityService) must integrate place precautions."""
    reference_info = {
        "reference_pm25": 45.0,
        "reference_label": "CAMS Reference",
        "governing_pollutant": "PM2.5",
        "o3": 35.0,
        "dust": 10.0,
        "forecast_24h": {"mean_pm25": 42.0, "trend": "stable"},
        "best_time_today": {"window": "11:00 AM – 1:00 PM"},
    }
    weather_info = {
        "latitude": 28.61,
        "longitude": 77.23,
        "is_delhi_ncr": True,
        "raw_weather": {
            "temperature_2m_c": 14.0,
            "relative_humidity_2m_pct": 75.0,
            "wind_speed_10m_kmh": 6.0,
            "elevation_m": 214.0,
            "surface_pressure_hpa": 1012.0,
            "shortwave_radiation_wm2": 180.0,
        },
        "features": {"RH": 75.0, "WD": 180.0, "SR": 180.0, "BP": 759.0, "AT": 14.0},
    }
    ml_prediction = {"model_key": "xgboost", "pm25": 48.0}
    health_profile = {"conditions": ["asthma"], "age_group": "adult"}

    eval_res = LivabilityService.evaluate_livability(
        reference_info=reference_info,
        weather_info=weather_info,
        ml_prediction=ml_prediction,
        health_profile=health_profile,
    )

    assert "place_precautions" in eval_res
    assert len(eval_res["place_precautions"]) > 0
    # Citizen precautions should also reflect place precautions
    assert eval_res["citizen_precautions"]["precautions_count"] > 0
    prec_cats = {p.get("category") for p in eval_res["citizen_precautions"]["precautions"]}
    assert any("Weather" in c or "Every day" in c or "Seasonal" in c for c in prec_cats)
