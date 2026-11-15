"""Tests for /api/models catalogue endpoint."""


def test_get_models_list(client):
    """Test retrieving complete model catalogue and benchmarks."""
    response = client.get("/api/models")
    assert response.status_code == 200
    data = response.get_json()

    assert data["success"] is True
    assert data["best_model"] == "xgboost"
    assert "models" in data
    assert len(data["models"]) == 5

    models_by_key = {m["key"]: m for m in data["models"]}

    # Verify XGBoost (top model)
    xgb = models_by_key["xgboost"]
    assert xgb["available"] is True
    assert xgb["is_best_model"] is True
    assert xgb["test_metrics"]["r2"] == 0.7455

    # Verify Random Forest
    rf = models_by_key["random_forest"]
    assert rf["available"] is True
    assert rf["is_best_model"] is False
    assert rf["test_metrics"]["r2"] == 0.7269

    # Verify MLP
    mlp = models_by_key["mlp"]
    assert mlp["available"] is True
    assert mlp["test_metrics"]["r2"] == 0.5408

    # Verify LSTM and Transformer are blocked with reason
    for seq_model in ["lstm", "transformer"]:
        sm = models_by_key[seq_model]
        assert sm["available"] is False
        assert sm["status"] == "blocked_pending_timestamps"
        assert "blocking_reason" in sm

    # Verify input feature schema contains strict units and bounds
    features_meta = data["input_features"]
    assert "BP" in features_meta
    assert features_meta["BP"]["unit"] == "mmHg"
    assert features_meta["BP"]["min"] == 700.0
    assert features_meta["BP"]["max"] == 780.0
