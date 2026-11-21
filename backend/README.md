# AirIQ India - Flask REST API Backend

A production-grade Python Flask REST API backend for the platform:
**"AirIQ India — Smarter air decisions for every address in India"**

The backend connects directly to the trained Machine Learning and Deep Learning models from Phases 1–4 to serve real-time $\text{PM}_{2.5}$ predictions, multi-model benchmarks, indicative CPCB health classifications, and Explainable AI (SHAP) feature attributions.

---

## 1. Architecture & Directory Layout

The backend follows an enterprise modular layout separating routing, request validation, model lifecycle, inference services, and explainability:

```
backend/
├── app.py                      # Flask application factory, CORS, and error handlers
├── config.py                   # Centralized configuration, bounds, and benchmark metadata
├── wsgi.py                     # WSGI production entrypoint for Gunicorn / Render
├── requirements.txt            # Python dependencies for deployment
├── Procfile                    # Cloud process runner command
├── runtime.txt                 # Python runtime version (3.11.9)
├── README.md                   # Complete API reference & deployment guide
├── models/
│   ├── __init__.py
│   └── model_loader.py         # Singleton loader caching RF, XGBoost, MLP & SHAP explainers
├── routes/
│   ├── __init__.py
│   ├── health_routes.py        # GET /api/health
│   ├── model_routes.py         # GET /api/models
│   ├── prediction_routes.py    # POST /api/predict & POST /api/compare
│   └── explanation_routes.py   # POST /api/explain
├── services/
│   ├── __init__.py
│   ├── validation_service.py   # Strict schema, type, bounds, and model validation
│   ├── prediction_service.py   # Model inference and indicative CPCB classification
│   └── explanation_service.py  # SHAP TreeExplainer & KernelExplainer computation
├── utils/
│   ├── __init__.py
│   └── response.py             # Standardized REST JSON response formatters
└── tests/
    ├── __init__.py
    ├── conftest.py             # Pytest fixtures and mock client
    ├── test_health.py          # Health and status tests
    ├── test_models.py          # Model catalogue and benchmark tests
    ├── test_prediction.py      # Predict, compare, and explain tests
    └── test_validation.py      # Input bounds, type errors, and 404/405 tests
```

---

## 2. Input Meteorological Features & Units

All prediction and explanation endpoints expect the following 5 surface meteorological features:

| Feature | Description | Verified Unit | Valid Range | Physical Significance |
| :--- | :--- | :--- | :--- | :--- |
| `RH` | Relative Humidity | `%` | `0.0` – `100.0` | Atmospheric moisture affecting aerosol hygroscopic growth |
| `WD` | Wind Direction | `degrees (°)` | `0.0` – `360.0` | Direction of incoming surface airflow (0°–360° compass) |
| `SR` | Solar Radiation | `W/m²` | `0.0` – `1500.0` | Incident solar irradiance driving photochemical reactions |
| `BP` | Barometric Pressure | **`mmHg`** | `700.0` – `780.0` | Atmospheric pressure (**strictly mmHg**, calibrated to Delhi elevation) |
| `AT` | Air Temperature | `°C` | `-20.0` – `60.0` | Dry-bulb ambient temperature influencing atmospheric boundary layer |

> **IMPORTANT SCIENTIFIC NOTE ON BAROMETRIC PRESSURE (BP):**
> The dataset values range between $720 - 755$. These represent millimeters of mercury ($\text{mmHg}$), typical for Delhi surface stations. They are **not** in hectopascals ($\text{hPa}$). Supplying values in $\text{hPa}$ (e.g. $1013$) will be strictly rejected by the validation service with an `OUT_OF_BOUNDS` error.

---

## 3. Model Catalogue & Benchmarks (Phase 4 Evaluation)

Models were rigorously evaluated on 406 untouched, held-out test observations:

| Model ID | Display Name | Paradigm | Status | Test $R^2$ | Test RMSE ($\mu\text{g/m}^3$) | Test MAE ($\mu\text{g/m}^3$) |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| `xgboost` | XGBoost Regressor (Tuned) | Gradient Boosting | **Available (Best)** | **0.7455** | **36.74** | **25.28** |
| `random_forest` | Random Forest Regressor | Bagging Ensemble | Available | 0.7269 | 38.05 | 25.62 |
| `mlp` | Multilayer Perceptron (MLP) | Feedforward Deep Learning | Available | 0.5408 | 49.34 | 37.88 |
| `lstm` | Long Short-Term Memory | Sequential Recurrent | **Blocked** | N/A | N/A | N/A |
| `transformer` | Time-Series Transformer | Self-Attention Sequential | **Blocked** | N/A | N/A | N/A |

> **Scientific Blocker on LSTM / Transformer:**
> The underlying dataset does not contain genuine continuous sequential timestamps. Training sequential time-series architectures on non-timestamped cross-sectional data introduces spurious chronological artifacts. These models are blocked pending continuous chronological data.

---

## 4. API Endpoints Reference

### 4.1 Health Check
- **URL:** `GET /api/health`
- **Description:** Verifies service health and status of loaded model artifacts.
- **Example Response (`200 OK`):**
```json
{
  "app_name": "AirIQ India Backend",
  "models_available": {
    "lstm": false,
    "mlp": true,
    "random_forest": true,
    "transformer": false,
    "xgboost": true
  },
  "status": "healthy",
  "version": "1.0.0"
}
```

---

### 4.2 Model Metadata & Benchmarks
- **URL:** `GET /api/models`
- **Description:** Returns metadata, held-out test metrics, blocking reasons, and feature validation rules.
- **Example Response (`200 OK`):**
```json
{
  "benchmark_summary": "XGBoost demonstrated top generalization with test R²=0.7455, followed by Random Forest (R²=0.7269) and MLP (R²=0.5408).",
  "best_model": "xgboost",
  "input_features": {
    "AT": {"max": 60.0, "min": -20.0, "name": "Air Temperature", "unit": "°C"},
    "BP": {"max": 780.0, "min": 700.0, "name": "Barometric Pressure", "unit": "mmHg"},
    "RH": {"max": 100.0, "min": 0.0, "name": "Relative Humidity", "unit": "%"},
    "SR": {"max": 1500.0, "min": 0.0, "name": "Solar Radiation", "unit": "W/m²"},
    "WD": {"max": 360.0, "min": 0.0, "name": "Wind Direction", "unit": "degrees"}
  },
  "models": [
    {
      "available": true,
      "description": "Best performing model on held-out test set (5-fold randomized search tuned)",
      "display_name": "XGBoost Regressor (Tuned)",
      "is_best_model": true,
      "key": "xgboost",
      "paradigm": "Gradient Boosted Decision Trees",
      "status": "available",
      "test_metrics": {"mae": 25.283, "mse": 1349.5732, "r2": 0.7455, "rmse": 36.7365}
    },
    {
      "available": false,
      "blocking_reason": "Dataset lacks genuine sequential timestamps...",
      "display_name": "Long Short-Term Memory (LSTM)",
      "is_best_model": false,
      "key": "lstm",
      "paradigm": "Recurrent Deep Learning (Sequential)",
      "status": "blocked_pending_timestamps",
      "test_metrics": null
    }
  ],
  "success": true
}
```

---

### 4.3 Predict PM2.5
- **URL:** `POST /api/predict`
- **Description:** Estimates $\text{PM}_{2.5}$ concentration and maps it to an indicative CPCB health category.
- **Request Body:**
```json
{
  "model": "xgboost",
  "features": {
    "RH": 55.0,
    "WD": 180.0,
    "SR": 350.0,
    "BP": 745.0,
    "AT": 28.0
  }
}
```
*(Alternatively, a flat structure with top-level feature keys is also accepted.)*

- **Example Response (`200 OK`):**
```json
{
  "cpcb_category": {
    "category": "Very Poor",
    "color": "#F44336",
    "disclaimer": "Indicative CPCB PM2.5 Health Band based on estimated PM2.5 concentration. This is NOT an official multi-pollutant 24-hour sub-index CPCB AQI...",
    "health_statement": "Respiratory illness to people on prolonged exposure.",
    "is_official_aqi": false
  },
  "features": {
    "AT": 28.0,
    "BP": 745.0,
    "RH": 55.0,
    "SR": 350.0,
    "WD": 180.0
  },
  "message": "PM2.5 prediction calculated successfully.",
  "model_key": "xgboost",
  "model_name": "XGBoost Regressor (Tuned)",
  "paradigm": "Gradient Boosted Decision Trees",
  "prediction": {
    "pm25": 176.09,
    "unit": "µg/m³"
  },
  "scientific_disclaimer": "Predicted PM2.5 concentration is an estimated statistical output from surface meteorological features...",
  "success": true
}
```

---

### 4.4 Multi-Model Comparison
- **URL:** `POST /api/compare`
- **Description:** Runs Random Forest, XGBoost, and MLP simultaneously on the same inputs and compares predictions against held-out test benchmarks.
- **Request Body:**
```json
{
  "features": {
    "RH": 55.0,
    "WD": 180.0,
    "SR": 350.0,
    "BP": 745.0,
    "AT": 28.0
  }
}
```
- **Example Response (`200 OK`):**
```json
{
  "best_model": "xgboost",
  "comparison_summary": "XGBoost is the top-performing model with R²=0.7455 and RMSE=36.74 µg/m³ on the 406 held-out test samples...",
  "predictions": {
    "mlp": {
      "cpcb_category": "Very Poor",
      "display_name": "Multilayer Perceptron (MLP)",
      "is_best_model": false,
      "pm25": 231.51,
      "test_benchmark": {"mae": 37.8782, "r2": 0.5408, "rmse": 49.3435},
      "unit": "µg/m³"
    },
    "random_forest": {
      "cpcb_category": "Very Poor",
      "display_name": "Random Forest Regressor",
      "is_best_model": false,
      "pm25": 207.04,
      "test_benchmark": {"mae": 25.6211, "r2": 0.7269, "rmse": 38.0513},
      "unit": "µg/m³"
    },
    "xgboost": {
      "cpcb_category": "Very Poor",
      "display_name": "XGBoost Regressor (Tuned)",
      "is_best_model": true,
      "pm25": 176.09,
      "test_benchmark": {"mae": 25.283, "r2": 0.7455, "rmse": 36.7365},
      "unit": "µg/m³"
    }
  },
  "success": true
}
```

---

### 4.5 Explainable AI (SHAP Local Feature Attribution)
- **URL:** `POST /api/explain`
- **Description:** Computes exact SHAP attributions using `TreeExplainer` (for Tree models) or `KernelExplainer` (for Neural Networks), ranking meteorological variables by influence.
- **Request Body:**
```json
{
  "model": "xgboost",
  "features": {
    "RH": 55.0,
    "WD": 180.0,
    "SR": 350.0,
    "BP": 745.0,
    "AT": 28.0
  }
}
```
- **Example Response (`200 OK`):**
```json
{
  "attributions": [
    {
      "abs_shap_value": 3.5124,
      "direction": "negative",
      "feature": "RH",
      "impact": "Decreases predicted PM2.5 by 3.51 µg/m³",
      "name": "Relative Humidity",
      "shap_value": -3.5124,
      "unit": "%",
      "value": 55.0
    },
    {
      "abs_shap_value": 40.5922,
      "direction": "positive",
      "feature": "SR",
      "impact": "Increases predicted PM2.5 by 40.59 µg/m³",
      "name": "Solar Radiation",
      "shap_value": 40.5922,
      "unit": "W/m²",
      "value": 350.0
    }
  ],
  "base_value": 144.47,
  "dominant_feature": "Solar Radiation",
  "explainer_type": "TreeExplainer",
  "model_key": "xgboost",
  "predicted_value": 176.09,
  "ranked_importance": [
    {"feature": "SR", "shap_value": 40.5922, ...},
    {"feature": "RH", "shap_value": -3.5124, ...},
    {"feature": "AT", "shap_value": -2.0925, ...},
    {"feature": "BP", "shap_value": -1.9041, ...},
    {"feature": "WD", "shap_value": -1.1936, ...}
  ],
  "scientific_disclaimer": "SHAP attributions represent local statistical feature contributions to the mathematical model output...",
  "success": true
}
```

---

## 5. Standard Error Handling

All validation and runtime errors return consistent JSON:

```json
{
  "error": {
    "code": "OUT_OF_BOUNDS",
    "details": {
      "feature": "BP",
      "name": "Barometric Pressure",
      "unit": "mmHg",
      "valid_range": [700.0, 780.0],
      "value": 850.0
    },
    "message": "Feature 'BP' (Barometric Pressure) value 850.0 is out of realistic physical range [700.0, 780.0] mmHg."
  },
  "success": false,
  "timestamp": "2026-11-15T09:35:00.000000+00:00"
}
```

Common error codes:
- `INVALID_JSON`: Body was missing or not a JSON dictionary.
- `MISSING_MODEL`: The `model` field was omitted in a single-model endpoint.
- `INVALID_MODEL`: Unrecognized model name requested.
- `MODEL_BLOCKED`: Requested an intentionally blocked model (`lstm` or `transformer`).
- `MISSING_FEATURES`: One or more of the 5 required features was omitted.
- `INVALID_FEATURE_TYPE`: A feature was supplied as string, boolean, or null.
- `OUT_OF_BOUNDS`: A feature fell outside verified physical bounds.

---

## 6. Local Development & Testing

### 6.1 Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 6.2 Run Automated Test Suite
```bash
python -m pytest backend/tests/ -v
```

### 6.3 Run Backend Server
```bash
# Standard local run (port 5000)
python backend/app.py

# Or via WSGI
python backend/wsgi.py
```

---

## 7. Production Deployment (Render / Railway / Vercel CORS)

### 7.1 Cross-Origin Resource Sharing (CORS) Configuration
To link a frontend hosted on Vercel, Netlify, or localhost, configure the environment variable:
```bash
# Comma-separated list of permitted frontend origins
export ALLOWED_ORIGINS="https://my-air-pollution-xai.vercel.app,http://localhost:3000"
```
If unset, it defaults to `*` (permissive for testing).

### 7.2 Deployment on Render
1. Create a **New Web Service** connected to the repository.
2. Set Root Directory to `backend/` (or repository root).
3. Build Command: `pip install -r backend/requirements.txt`
4. Start Command: `gunicorn --workers 2 --timeout 120 --bind 0.0.0.0:$PORT wsgi:app`
5. Ensure model files are tracked in `models/` or loaded from storage.

---

## 8. Regulatory & Scientific Disclaimers

1. **Indicative CPCB Health Bands:**
   The Central Pollution Control Board (CPCB) National Air Quality Index (AQI) protocol requires 24-hour time-weighted average concentrations across at least 3 criteria pollutants (with at least PM10 or PM2.5 mandatory). Categorizations generated by this API are indicative health bands corresponding solely to estimated 24-hour $\text{PM}_{2.5}$ concentration levels and should not be cited as official multi-pollutant AQI values.

2. **Explainable AI Attribution vs. Chemical Causality:**
   SHAP values quantify the mathematical contribution of meteorological variables to the statistical model's departure from its expected base value. They indicate observational associations (e.g., lower planetary boundary layer height under high pressure trapping particulates), but do **not** represent physical emission source apportionment or chemical transport mechanisms.
