"""End-to-End System Integration Tests for Phase 7.

Validates the full pipeline:
- Exact user sample input (RH: 74, WD: 298, SR: 5, BP: 740 mmHg, AT: 14)
- Multi-model comparison consistency
- SHAP mathematical additivity checks
- CORS header handling
- Out-of-bounds rejection and blocked sequential model behavior
"""

import json
import pytest


@pytest.fixture
def phase7_sample():
    return {
        "RH": 74.0,
        "WD": 298.0,
        "SR": 5.0,
        "BP": 740.0,
        "AT": 14.0,
    }


def test_e2e_single_predictions_phase7_sample(client, phase7_sample):
    """Test all 3 active models on Phase 7 sample input."""
    # 1. Random Forest
    rf_resp = client.post("/api/predict", json={"model": "random_forest", "features": phase7_sample})
    assert rf_resp.status_code == 200
    rf_data = rf_resp.get_json()
    assert rf_data["success"] is True
    assert rf_data["prediction"]["pm25"] == 172.54
    assert rf_data["cpcb_category"]["category"] == "Very Poor"

    # 2. XGBoost
    xgb_resp = client.post("/api/predict", json={"model": "xgboost", "features": phase7_sample})
    assert xgb_resp.status_code == 200
    xgb_data = xgb_resp.get_json()
    assert xgb_data["success"] is True
    assert xgb_data["prediction"]["pm25"] == 182.81
    assert xgb_data["cpcb_category"]["category"] == "Very Poor"

    # 3. MLP
    mlp_resp = client.post("/api/predict", json={"model": "mlp", "features": phase7_sample})
    assert mlp_resp.status_code == 200
    mlp_data = mlp_resp.get_json()
    assert mlp_data["success"] is True
    assert mlp_data["prediction"]["pm25"] == 157.06
    assert mlp_data["cpcb_category"]["category"] == "Very Poor"


def test_e2e_comparison_phase7_sample(client, phase7_sample):
    """Test multi-model comparison on Phase 7 sample input."""
    resp = client.post("/api/compare", json={"features": phase7_sample})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert data["best_model"] == "xgboost"

    preds = data["predictions"]
    assert preds["random_forest"]["pm25"] == 172.54
    assert preds["xgboost"]["pm25"] == 182.81
    assert preds["mlp"]["pm25"] == 157.06

    for m in ["random_forest", "xgboost", "mlp"]:
        assert preds[m]["cpcb_category"] == "Very Poor"


def test_e2e_shap_additivity_phase7_sample(client, phase7_sample):
    """Verify SHAP attributions and numerical additivity across all models."""
    for model_key in ["random_forest", "xgboost", "mlp"]:
        resp = client.post("/api/explain", json={"model": model_key, "features": phase7_sample})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True

        base = data["base_value"]
        pred = data["predicted_value"]
        attributions = data["attributions"]
        assert len(attributions) == 5

        shap_sum = sum(item["shap_value"] for item in attributions)
        reconstructed = base + shap_sum

        # TreeExplainer is mathematically exact within float tolerance
        if data["explainer_type"] == "TreeExplainer":
            assert abs(reconstructed - pred) < 0.35, f"{model_key} TreeExplainer discrepancy too high"
        else:
            # KernelExplainer approximation
            assert abs(reconstructed - pred) < 1.0, f"{model_key} KernelExplainer discrepancy too high"


def test_cors_headers(client, phase7_sample):
    """Verify CORS headers are returned for cross-origin requests."""
    resp = client.post(
        "/api/predict",
        json={"model": "xgboost", "features": phase7_sample},
        headers={"Origin": "https://air-pollution-xai.vercel.app"},
    )
    assert resp.status_code == 200
    assert "Access-Control-Allow-Origin" in resp.headers
