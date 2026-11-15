# Phase 5 Technical Report: Flask REST API Backend & Explainable AI Service

**Project Title:** Explainable AI-Based Air Pollution Prediction and Source Attribution  
**Phase:** Phase 5 — Production-Grade Python Flask REST API Backend  
**Date:** November 15, 2026  
**Status:** Completed & Validated (23/23 Automated Pytest Tests Passing)

---

## 1. Executive Summary

Phase 5 successfully establishes a production-grade, modular Python Flask REST API backend located in `backend/`. This backend connects directly to the trained machine learning and deep learning pipelines developed across Phases 1 through 4, providing real-time inference, multi-model benchmarking, indicative CPCB health classifications, and Explainable AI (SHAP) feature attributions.

All five strict scientific boundaries established in previous phases were strictly enforced:
1. **Model Artifact Preservation:** Pre-trained artifacts (`random_forest.pkl`, `xgboost_model.pkl`, `mlp_model.keras`, `mlp_scaler.pkl`) are loaded directly without modification or retraining.
2. **Physical Unit Calibration:** Barometric Pressure (`BP`) is strictly maintained and validated in millimeters of mercury ($\text{mmHg}$, valid range: $700.0 - 780.0\,\text{mmHg}$). Supplying values in hectopascals ($\text{hPa}$) is rejected by the validation service.
3. **Indicative CPCB Classification:** The API explicitly designates health categories as "Indicative CPCB $\text{PM}_{2.5}$ Health Bands" and distinguishes them from official 24-hour multi-pollutant CPCB AQI calculations.
4. **Time-Series Integrity (Blocker Enforced):** Long Short-Term Memory (LSTM) and Transformer architectures remain strictly flagged as blocked (`blocked_pending_timestamps`) because the cross-sectional dataset lacks genuine sequential timestamps. Requests attempting to invoke them return an informative `400 Bad Request`.
5. **Explainability Attribution Boundary:** SHAP local explanations explicitly include a scientific disclaimer stating that attributions represent local statistical feature importance within the mathematical model and do not constitute physical chemical emission causality or source apportionment.

---

## 2. System Architecture & Modular Layout

The backend adopts an enterprise-level separation of concerns:

```
backend/
├── app.py                      # Application factory, CORS, and centralized error handlers
├── config.py                   # Central configuration, feature specifications, and benchmark metrics
├── wsgi.py                     # Production WSGI entrypoint for Gunicorn and container hosts
├── requirements.txt            # Production dependencies with pinned/compatible versions
├── Procfile                    # Cloud deployment process definition (Gunicorn)
├── runtime.txt                 # Specified Python version (python-3.11.9)
├── README.md                   # Full developer documentation and curl/Postman reference
├── models/
│   ├── __init__.py
│   └── model_loader.py         # Singleton caching RF, XGBoost, MLP, and SHAP explainers
├── routes/
│   ├── __init__.py
│   ├── health_routes.py        # GET /api/health
│   ├── model_routes.py         # GET /api/models
│   ├── prediction_routes.py    # POST /api/predict, POST /api/compare
│   └── explanation_routes.py   # POST /api/explain
├── services/
│   ├── __init__.py
│   ├── validation_service.py   # Strict schema, numeric type, boundary, and model checking
│   ├── prediction_service.py   # ML/DL inference and CPCB health band mapping
│   └── explanation_service.py  # SHAP TreeExplainer & KernelExplainer execution
├── utils/
│   ├── __init__.py
│   └── response.py             # Standardized REST JSON response helpers
└── tests/
    ├── __init__.py
    ├── conftest.py             # Test fixtures and mock WSGI client
    ├── test_health.py          # System health and index route assertions
    ├── test_models.py          # Model catalogue and benchmark verification
    ├── test_prediction.py      # Predict, compare, and explain functional tests
    └── test_validation.py      # Edge case bounds, type checks, and 400/404/405 error tests
```

---

## 3. Implemented API Endpoints

### 3.1 `GET /api/health`
- **Purpose:** Verifies backend operational status and reports model readiness.
- **Response Format:**
  ```json
  {
    "app_name": "Air Pollution XAI Backend",
    "models_available": {
      "random_forest": true,
      "xgboost": true,
      "mlp": true,
      "lstm": false,
      "transformer": false
    },
    "status": "healthy",
    "version": "1.0.0"
  }
  ```

### 3.2 `GET /api/models`
- **Purpose:** Exposes complete metadata, paradigm descriptions, test benchmarks, and feature requirements.
- **Key Details:**
  - Highlights `xgboost` as the top-performing model ($R^2 = 0.7455$, $\text{RMSE} = 36.74\,\mu\text{g/m}^3$).
  - Explains the temporal data blocker for `lstm` and `transformer`.
  - Exposes the schema for all 5 meteorological features including units and allowable ranges.

### 3.3 `POST /api/predict`
- **Purpose:** Computes predicted $\text{PM}_{2.5}$ concentration and maps it to an indicative CPCB category.
- **Parameters:**
  - `model`: `"random_forest"`, `"xgboost"`, or `"mlp"`.
  - `features`: `{"RH": float, "WD": float, "SR": float, "BP": float, "AT": float}` (or flat dictionary).
- **Output:** Predicted $\text{PM}_{2.5}$ ($\mu\text{g/m}^3$), indicative CPCB health band, color hex code, health statement, and disclaimers.

### 3.4 `POST /api/compare`
- **Purpose:** Evaluates all 3 available models on the exact same inputs in a single call.
- **Output:** Side-by-side predictions for Random Forest, XGBoost, and MLP, mapped against their held-out test benchmarks ($R^2$, RMSE, MAE). Highlights XGBoost as the empirical benchmark winner.

### 3.5 `POST /api/explain`
- **Purpose:** Computes instance-level Explainable AI feature attributions using SHAP.
- **Methodology:**
  - **Random Forest & XGBoost:** Utilizes `shap.TreeExplainer` on the underlying fitted ensemble regressors.
  - **MLP:** Utilizes `shap.KernelExplainer` using a standardized zero-vector baseline across normalized inputs.
- **Output:** Base expected value ($\mu\text{g/m}^3$), predicted value, directional impact (positive/negative), absolute SHAP contribution, and feature ranking by magnitude.

---

## 4. Input Validation & Physical Bounds Specification

The `ValidationService` enforces realistic atmospheric physics:

| Variable | Description | Verified Unit | Allowed Range | Validation Handling |
| :--- | :--- | :---: | :---: | :--- |
| `RH` | Relative Humidity | `%` | `0.0 – 100.0` | Values $> 100\%$ or $< 0\%$ return `OUT_OF_BOUNDS` (400) |
| `WD` | Wind Direction | `degrees (°)` | `0.0 – 360.0` | Compass range constraint; outside returns 400 |
| `SR` | Solar Radiation | `W/m²` | `0.0 – 1500.0` | High noon Delhi solar maximum bounds |
| `BP` | Barometric Pressure | **`mmHg`** | **`700.0 – 780.0`** | **Strictly mmHg**. Sea-level or hPa values ($>780$) rejected |
| `AT` | Air Temperature | `°C` | `-20.0 – 60.0` | Realistic North Indian meteorological envelope |

---

## 5. Automated Pytest Verification Results

A comprehensive test suite was executed across 23 discrete test scenarios:

```
============================= test session starts =============================
platform win32 -- Python 3.14.6, pytest-9.2.0, pluggy-1.7.0
rootdir: C:\Users\danda\OneDrive\Desktop\Air-Pollution-XAI
collected 23 items

backend/tests/test_health.py::test_health_check PASSED                   [  4%]
backend/tests/test_health.py::test_root_index PASSED                     [  8%]
backend/tests/test_models.py::test_get_models_list PASSED                [ 13%]
backend/tests/test_prediction.py::test_predict_xgboost PASSED            [ 17%]
backend/tests/test_prediction.py::test_predict_random_forest PASSED      [ 21%]
backend/tests/test_prediction.py::test_predict_mlp PASSED                [ 26%]
backend/tests/test_prediction.py::test_predict_flat_payload_format PASSED [ 30%]
backend/tests/test_prediction.py::test_compare_models PASSED             [ 34%]
backend/tests/test_prediction.py::test_explain_xgboost PASSED            [ 39%]
backend/tests/test_prediction.py::test_explain_random_forest PASSED      [ 43%]
backend/tests/test_prediction.py::test_explain_mlp PASSED                [ 47%]
backend/tests/test_validation.py::test_missing_json_body PASSED          [ 52%]
backend/tests/test_validation.py::test_missing_model_field PASSED        [ 56%]
backend/tests/test_validation.py::test_blocked_lstm_rejection PASSED     [ 60%]
backend/tests/test_validation.py::test_blocked_transformer_rejection PASSED [ 65%]
backend/tests/test_validation.py::test_unknown_model_rejection PASSED    [ 69%]
backend/tests/test_validation.py::test_missing_feature PASSED            [ 73%]
backend/tests/test_validation.py::test_out_of_bounds_bp_high PASSED      [ 78%]
backend/tests/test_validation.py::test_out_of_bounds_bp_low PASSED       [ 82%]
backend/tests/test_validation.py::test_out_of_bounds_rh PASSED           [ 86%]
backend/tests/test_validation.py::test_invalid_feature_string_type PASSED [ 91%]
backend/tests/test_validation.py::test_not_found_endpoint PASSED         [ 95%]
backend/tests/test_validation.py::test_method_not_allowed PASSED         [100%]

============================= 23 passed in 0.95s ==============================
```

**Key Verification Outcomes:**
- All endpoints respond with HTTP 200 on valid inputs.
- All invalid payloads (out-of-range BP, missing features, invalid strings) return HTTP 400 with structured JSON error details.
- Rejection of LSTM and Transformer returns clear explanations regarding temporal dataset constraints.
- SHAP calculations for all three models execute seamlessly without memory or type errors.

---

## 6. Deployment Readiness

1. **WSGI Concurrency:** `backend/wsgi.py` and `backend/Procfile` are configured with Gunicorn (`--workers 2 --timeout 120`) for multi-worker cloud hosting (e.g. Render, Railway, AWS).
2. **CORS Flexibility:** Configured via `flask-cors` with environment variable `ALLOWED_ORIGINS` to support secure cross-origin communication with future React frontends hosted on Vercel, Netlify, or localhost.
3. **Reproducibility:** `backend/requirements.txt` and `backend/runtime.txt` lock compatible library versions.

---

## 7. Conclusion & Next Steps

Phase 5 has delivered a robust, modular, and mathematically verified REST API backend ready to power user interfaces and external analytical integrations.

**Upcoming Phase:**
- **Phase 6:** Modern, responsive React frontend development connecting to this Flask API, featuring interactive prediction sliders, real-time CPCB gauge visualizations, multi-model radar/bar comparisons, and visual SHAP waterfall/force diagrams.
