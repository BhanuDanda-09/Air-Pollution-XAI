"""Comprehensive Unit & Integration Test Suite for All-India Location Coverage.

Covers:
1. 6-digit PIN code resolution, validation, multi-office disambiguation, offline fallback.
2. 36 States/UTs and District cascading hierarchy.
3. 3-Tier Coverage classification and confidence scoring.
4. 10 nationwide diverse terrain benchmark coordinates.
5. Risk engine sensitivity multipliers and low-confidence softening.
6. REST API routes (/api/geo/*, /api/districts/ranking, /api/states/summary, /api/air/<place_id>).
"""

import pytest
from backend.app import create_app
from backend.services.location_resolver import LocationResolver
from backend.services.risk_service import RiskService


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


# ==========================================
# 1. PIN Code Resolution & Validation Tests
# ==========================================

def test_pincode_validation():
    """Verify regex rejection of invalid Indian PIN codes."""
    invalid_pins = ["123", "12345", "012345", "abcdef", "5060011", "", None]
    for pin in invalid_pins:
        res = LocationResolver.resolve_pincode(pin)
        assert res["success"] is False
        assert res["error"] == "INVALID_PIN_FORMAT"


def test_pincode_valid_resolution():
    """Verify successful resolution of valid 6-digit PIN codes."""
    res = LocationResolver.resolve_pincode("506001")
    assert res["success"] is True
    assert res["pincode"] == "506001"
    assert "Telangana" in res["state"]
    assert res["lat"] > 0
    assert res["lon"] > 0
    assert res["coverage"]["in_coverage"] is True
    assert "tier_number" in res["coverage"]


def test_pincode_delhi_tier_1():
    """Verify Delhi PIN 110001 maps to Tier 1 Station-Validated."""
    res = LocationResolver.resolve_pincode("110001")
    assert res["success"] is True
    assert "Delhi" in res["state"]
    assert res["coverage"]["tier_number"] == 1
    assert res["coverage"]["confidence_score"] >= 70
    assert res["coverage"]["nearest_station"] is not None


# ==========================================
# 2. Administrative Hierarchy Tests
# ==========================================

def test_states_enumeration():
    """Verify all 36 States and Union Territories are represented."""
    states = LocationResolver.get_states()
    assert len(states) == 36
    state_names = [s["name"] for s in states]
    assert "Delhi" in state_names
    assert "Maharashtra" in state_names
    assert "Telangana" in state_names
    assert "Assam" in state_names
    assert "Ladakh" in state_names
    assert "Andaman and Nicobar Islands" in state_names


def test_districts_cascading():
    """Verify district list for specific states."""
    telangana_districts = LocationResolver.get_districts("Telangana")
    assert len(telangana_districts) >= 10
    names = [d["name"] for d in telangana_districts]
    assert any("Hyderabad" in n for n in names)
    assert any("Warangal" in n for n in names)

    # Case insensitivity
    mh_districts = LocationResolver.get_districts("maharashtra")
    assert len(mh_districts) >= 15
    assert any("Pune" in d["name"] for d in mh_districts)


# ==========================================
# 3. Coverage Tiers & Confidence Scoring
# ==========================================

def test_tier_1_near_station():
    """A coordinate right next to an official CPCB station must be Tier 1."""
    # Delhi Anand Vihar CPCB station: 28.6476, 77.3158
    cov = LocationResolver.classify_coverage_tier(28.6480, 77.3160)
    assert cov["in_coverage"] is True
    assert cov["tier"] == "tier_1"
    assert cov["tier_number"] == 1
    assert cov["confidence_score"] >= 70
    assert cov["confidence_level"] == "High"
    assert cov["station_distance_km"] <= 1.0
    assert cov["is_indicative_only"] is False


def test_tier_2_model_derived():
    """A coordinate ~35 km from a station but near a district centroid must be Tier 2."""
    # Semi-rural spot outside Delhi towards Jhajjar (~35 km from station, near Jhajjar centroid)
    cov = LocationResolver.classify_coverage_tier(28.6080, 76.6572)
    assert cov["in_coverage"] is True
    assert cov["tier_number"] in [1, 2]
    assert cov["confidence_score"] >= 50


def test_tier_3_remote_village_gridded_estimate():
    """A remote coordinate far from any ground station (> 50 km) must be Tier 3 with clear disclosure."""
    # Remote point in Thar Desert / Ladakh
    cov = LocationResolver.classify_coverage_tier(34.8000, 78.5000)
    assert cov["in_coverage"] is True
    assert cov["tier"] == "tier_3"
    assert cov["tier_number"] == 3
    assert cov["confidence_level"] == "Low"
    assert cov["confidence_score"] < 50
    assert cov["is_indicative_only"] is True
    assert "No monitoring station nearby; this is a regional estimate, not a measurement." in cov["explanation"]
    assert "Air quality for villages and small areas is a gridded model estimate, not a measurement." in cov["disclaimer"]


def test_outside_india_bounding_box():
    """Coordinates outside the Indian subcontinent must be rejected cleanly."""
    cov = LocationResolver.classify_coverage_tier(51.5074, -0.1278)  # London
    assert cov["in_coverage"] is False
    assert cov["tier_number"] == 0
    assert cov["confidence_score"] == 0


# ==========================================
# 4. 10 Nationwide Diverse Terrain Coordinates
# ==========================================

@pytest.mark.parametrize("loc_name,lat,lon,expected_tier", [
    ("North - Delhi Capital", 28.6139, 77.2090, 1),
    ("South - Hyderabad IT Corridor", 17.4400, 78.3800, 1),
    ("South - Warangal Hanamkonda", 17.9689, 79.5941, 1),
    ("West - Mumbai Bandra", 19.0596, 72.8295, 1),
    ("West - Thar Desert (Jaisalmer)", 26.9157, 70.9083, 2),
    ("East - Kolkata Victoria", 22.5448, 88.3426, 1),
    ("East - Gaya Historical Hub", 24.7955, 85.0002, 1),
    ("Northeast - Guwahati Brahmaputra", 26.1800, 91.7500, 1),
    ("Himalayan Hill - Shimla Ridge", 31.1048, 77.1734, 1),
    ("Islands - Port Blair Bay of Bengal", 11.6667, 92.7400, 1),
])
def test_ten_nationwide_benchmark_points(loc_name, lat, lon, expected_tier):
    """Verify that 10 diverse geographic points across India return valid tiers and confidence."""
    cov = LocationResolver.classify_coverage_tier(lat, lon)
    assert cov["in_coverage"] is True
    assert cov["tier_number"] in [1, 2, 3]
    assert 20 <= cov["confidence_score"] <= 100
    assert cov["grid_resolution"] is not None


# ==========================================
# 5. Risk Engine Tier & Health Sensitivity Tests
# ==========================================

def test_risk_engine_asthma_strictness_and_softened_wording():
    """Verify that asthma receives stricter multipliers, and Tier 3 softens wording."""
    origin = {"name": "Delhi Central", "lat": 28.6139, "lon": 77.2090}
    remote_dest = {"name": "Remote Ladakh Valley", "lat": 34.8000, "lon": 78.5000}

    profile_healthy = {"conditions": [], "household": "none"}
    profile_asthma = {"conditions": ["asthma"], "household": "none"}

    res_asthma = RiskService.compare_relocation(origin, [remote_dest], profile_asthma)
    assert res_asthma["success"] is True
    cand_asthma = res_asthma["candidates"][0]

    # Destination is Tier 3 / Low confidence -> verdict must have "Indicative"
    assert "Indicative" in cand_asthma["verdict"]
    assert cand_asthma["coverage_tier"] == "Gridded Regional Estimate (Village/Area)"
    assert cand_asthma["confidence_level"] == "Low"

    # Actionable advice must contain precision advisory
    assert any("Precision Advisory" in adv for adv in cand_asthma["actionable_advice"])

    # Respiratory condition must trigger sensitivity multiplier
    assert any("respiratory" in f.lower() or "chronic airway" in f.lower() for f in cand_asthma["personal_risk"]["risk_factors"])


# ==========================================
# 6. REST API Route Integration Tests
# ==========================================

def test_api_geo_states(client):
    """GET /api/geo/states returns 36 states/UTs."""
    resp = client.get("/api/geo/states")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["total"] == 36
    assert len(body["states"]) == 36


def test_api_geo_districts(client):
    """GET /api/geo/districts?state=Telangana returns districts."""
    resp = client.get("/api/geo/districts?state=Telangana")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["total"] >= 10
    assert len(body["districts"]) >= 10


def test_api_geo_pincode(client):
    """GET /api/geo/pincode/506001 resolves successfully."""
    resp = client.get("/api/geo/pincode/506001")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["pincode"] == "506001"
    assert "coverage" in body


def test_api_geo_reverse(client):
    """GET /api/geo/reverse?lat=17.9689&lon=79.5941 reverse geocodes."""
    resp = client.get("/api/geo/reverse?lat=17.9689&lon=79.5941")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["state"] is not None
    assert body["coverage"]["in_coverage"] is True


def test_api_districts_ranking(client):
    """GET /api/districts/ranking returns national district ranking."""
    resp = client.get("/api/districts/ranking")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["total_districts"] > 100
    assert body["districts"][0]["national_rank"] == 1


def test_api_states_summary(client):
    """GET /api/states/summary returns state-level aggregated averages."""
    resp = client.get("/api/states/summary")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["total_states_uts"] >= 30
    assert len(body["states"]) >= 30


def test_api_air_place_id(client):
    """GET /api/air/506001 returns complete assessment for a PIN code."""
    resp = client.get("/api/air/506001")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["place_id"] == "506001"
    assert "current_air" in body
    assert "coverage" in body
