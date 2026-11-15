"""Tests for input validation, edge cases, and error handlers."""


def test_missing_json_body(client):
    """Test rejection when request body is not JSON."""
    response = client.post("/api/predict", data="not json", content_type="text/plain")
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data["error"]["code"] in ["INVALID_JSON", "INVALID_JSON_BODY"]


def test_missing_model_field(client, sample_features):
    """Test rejection when 'model' field is missing from predict."""
    payload = {"features": sample_features}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "MISSING_MODEL"


def test_blocked_lstm_rejection(client, sample_features):
    """Test requesting LSTM returns 400 explaining time-series blocker."""
    payload = {"model": "lstm", "features": sample_features}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "MODEL_BLOCKED"
    assert "timestamp" in data["error"]["message"].lower()


def test_blocked_transformer_rejection(client, sample_features):
    """Test requesting Transformer returns 400 explaining time-series blocker."""
    payload = {"model": "transformer", "features": sample_features}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "MODEL_BLOCKED"


def test_unknown_model_rejection(client, sample_features):
    """Test requesting an unsupported model returns 400 INVALID_MODEL."""
    payload = {"model": "support_vector_regressor", "features": sample_features}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_MODEL"


def test_missing_feature(client, sample_features):
    """Test rejection when a required feature (e.g. BP) is omitted."""
    incomplete = dict(sample_features)
    del incomplete["BP"]
    payload = {"model": "xgboost", "features": incomplete}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "MISSING_FEATURES"
    assert "BP" in data["error"]["details"]["missing_features"]


def test_out_of_bounds_bp_high(client, sample_features):
    """Test rejection when Barometric Pressure is out of mmHg range (>780)."""
    invalid = dict(sample_features)
    invalid["BP"] = 850.0  # Common error if someone assumes hPa instead of mmHg
    payload = {"model": "xgboost", "features": invalid}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "OUT_OF_BOUNDS"
    assert data["error"]["details"]["unit"] == "mmHg"


def test_out_of_bounds_bp_low(client, sample_features):
    """Test rejection when Barometric Pressure is below 700 mmHg."""
    invalid = dict(sample_features)
    invalid["BP"] = 650.0
    payload = {"model": "xgboost", "features": invalid}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "OUT_OF_BOUNDS"


def test_out_of_bounds_rh(client, sample_features):
    """Test rejection when Relative Humidity is > 100%."""
    invalid = dict(sample_features)
    invalid["RH"] = 120.0
    payload = {"model": "xgboost", "features": invalid}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "OUT_OF_BOUNDS"


def test_invalid_feature_string_type(client, sample_features):
    """Test rejection when a feature is given as a string."""
    invalid = dict(sample_features)
    invalid["AT"] = "thirty"
    payload = {"model": "xgboost", "features": invalid}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_FEATURE_TYPE"


def test_not_found_endpoint(client):
    """Test requesting a nonexistent route returns 404 with JSON error."""
    response = client.get("/api/nonexistent")
    assert response.status_code == 404
    data = response.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "NOT_FOUND"


def test_method_not_allowed(client):
    """Test GET on a POST-only endpoint returns 405."""
    response = client.get("/api/predict")
    assert response.status_code == 405
    data = response.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "METHOD_NOT_ALLOWED"
