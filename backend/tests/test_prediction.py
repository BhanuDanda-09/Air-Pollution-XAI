"""Tests for prediction, comparison, and explanation endpoints."""


def test_predict_xgboost(client, sample_features):
    """Test single PM2.5 prediction using XGBoost."""
    payload = {
        "model": "xgboost",
        "features": sample_features,
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.get_json()

    assert data["success"] is True
    assert data["model_key"] == "xgboost"
    assert "prediction" in data
    assert data["prediction"]["unit"] == "µg/m³"
    assert isinstance(data["prediction"]["pm25"], float)
    assert data["prediction"]["pm25"] > 0

    assert "cpcb_category" in data
    assert "category" in data["cpcb_category"]
    assert "disclaimer" in data["cpcb_category"]
    assert data["cpcb_category"]["is_official_aqi"] is False
    assert "scientific_disclaimer" in data


def test_predict_random_forest(client, sample_features):
    """Test single PM2.5 prediction using Random Forest."""
    payload = {
        "model": "random_forest",
        "features": sample_features,
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.get_json()

    assert data["success"] is True
    assert data["model_key"] == "random_forest"
    assert isinstance(data["prediction"]["pm25"], float)


def test_predict_mlp(client, sample_features):
    """Test single PM2.5 prediction using MLP."""
    payload = {
        "model": "mlp",
        "features": sample_features,
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.get_json()

    assert data["success"] is True
    assert data["model_key"] == "mlp"
    assert isinstance(data["prediction"]["pm25"], float)


def test_predict_flat_payload_format(client, sample_features):
    """Test that flat feature payload format works transparently."""
    payload = {"model": "xgboost"}
    payload.update(sample_features)
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["model_key"] == "xgboost"


def test_compare_models(client, sample_features):
    """Test multi-model comparison across RF, XGBoost, and MLP."""
    payload = {"features": sample_features}
    response = client.post("/api/compare", json=payload)
    assert response.status_code == 200
    data = response.get_json()

    assert data["success"] is True
    assert data["best_model"] == "xgboost"
    assert "predictions" in data

    preds = data["predictions"]
    for m in ["random_forest", "xgboost", "mlp"]:
        assert m in preds
        assert "pm25" in preds[m]
        assert "cpcb_category" in preds[m]
        assert "test_benchmark" in preds[m]

    assert preds["xgboost"]["is_best_model"] is True
    assert preds["xgboost"]["available"] is True
    assert preds["xgboost"]["status"] == "success"
    assert data["successful_models"] == 3
    assert data["has_partial_failures"] is False


def test_compare_models_partial_failure(client, sample_features, monkeypatch):
    """Test graceful multi-model comparison when one model (e.g. MLP) is unavailable."""
    from backend.models.model_loader import get_model_loader
    loader = get_model_loader()

    # Simulate MLP being unavailable
    original_status = dict(loader.load_status)
    monkeypatch.setattr(loader, "load_status", {
        "random_forest": True,
        "xgboost": True,
        "mlp": False,
        "lstm": False,
        "transformer": False,
    })
    monkeypatch.setattr(loader, "load_errors", {"mlp": "Simulated GPU/RAM loading failure"})

    payload = {"features": sample_features}
    response = client.post("/api/compare", json=payload)
    assert response.status_code == 200
    data = response.get_json()

    assert data["success"] is True
    assert data["has_partial_failures"] is True
    assert data["successful_models"] == 2
    assert "predictions" in data

    preds = data["predictions"]
    # XGBoost and RF should succeed
    assert preds["xgboost"]["available"] is True
    assert preds["xgboost"]["status"] == "success"
    assert isinstance(preds["xgboost"]["pm25"], float)

    assert preds["random_forest"]["available"] is True
    assert preds["random_forest"]["status"] == "success"
    assert isinstance(preds["random_forest"]["pm25"], float)

    # MLP should be marked unavailable without fabricated prediction
    assert preds["mlp"]["available"] is False
    assert preds["mlp"]["status"] == "unavailable"
    assert preds["mlp"]["pm25"] is None
    assert preds["mlp"]["cpcb_category"] is None
    assert "error" in preds["mlp"]

    # Precomputed benchmark metrics must remain 100% preserved
    assert preds["mlp"]["test_benchmark"]["r2"] == 0.5408
    assert preds["mlp"]["test_benchmark"]["rmse"] == 49.3435
    assert preds["mlp"]["test_benchmark"]["mae"] == 37.8782


def test_compare_models_inference_exception(client, sample_features, monkeypatch):
    """Test graceful comparison handling when a model throws an unexpected inference exception."""
    from backend.services.prediction_service import PredictionService

    orig_predict_single = PredictionService.predict_single

    def mock_predict_single(model_key, features):
        if model_key == "mlp":
            raise RuntimeError("Simulated Keras CUDA OOM error")
        return orig_predict_single(model_key, features)

    monkeypatch.setattr(PredictionService, "predict_single", mock_predict_single)

    payload = {"features": sample_features}
    response = client.post("/api/compare", json=payload)
    assert response.status_code == 200
    data = response.get_json()

    assert data["success"] is True
    assert data["has_partial_failures"] is True
    preds = data["predictions"]
    assert preds["xgboost"]["status"] == "success"
    assert preds["random_forest"]["status"] == "success"
    assert preds["mlp"]["status"] == "failed"
    assert preds["mlp"]["available"] is False
    assert preds["mlp"]["pm25"] is None
    assert "CUDA OOM" in preds["mlp"]["error"]
    assert preds["mlp"]["test_benchmark"]["r2"] == 0.5408


def test_explain_xgboost(client, sample_features):
    """Test SHAP explanation computation for XGBoost."""
    payload = {
        "model": "xgboost",
        "features": sample_features,
    }
    response = client.post("/api/explain", json=payload)
    assert response.status_code == 200
    data = response.get_json()

    assert data["success"] is True
    assert data["model_key"] == "xgboost"
    assert data["explainer_type"] == "TreeExplainer"
    assert "base_value" in data
    assert "predicted_value" in data
    assert "attributions" in data
    assert len(data["attributions"]) == 5
    assert len(data["ranked_importance"]) == 5
    assert "scientific_disclaimer" in data


def test_explain_random_forest(client, sample_features):
    """Test SHAP explanation computation for Random Forest."""
    payload = {
        "model": "random_forest",
        "features": sample_features,
    }
    response = client.post("/api/explain", json=payload)
    assert response.status_code == 200
    data = response.get_json()

    assert data["success"] is True
    assert data["model_key"] == "random_forest"
    assert data["explainer_type"] == "TreeExplainer"
    assert len(data["attributions"]) == 5


def test_explain_mlp(client, sample_features):
    """Test SHAP explanation computation for MLP using KernelExplainer."""
    payload = {
        "model": "mlp",
        "features": sample_features,
    }
    response = client.post("/api/explain", json=payload)
    assert response.status_code == 200
    data = response.get_json()

    assert data["success"] is True
    assert data["model_key"] == "mlp"
    assert data["explainer_type"] == "KernelExplainer"
    assert len(data["attributions"]) == 5
