"""Application configuration for Air Pollution XAI Flask backend."""

import os
from pathlib import Path


class Config:
    """Base backend configuration."""

    BASE_DIR = Path(__file__).resolve().parent
    PROJECT_ROOT = BASE_DIR.parent

    # Allow custom models directory via environment variable or default to project root models/
    ENV_MODELS_DIR = os.getenv("MODELS_DIR")
    if ENV_MODELS_DIR:
        MODELS_DIR = Path(ENV_MODELS_DIR).resolve()
    elif (PROJECT_ROOT / "models" / "random_forest.pkl").exists():
        MODELS_DIR = PROJECT_ROOT / "models"
    elif (Path.cwd() / "models" / "random_forest.pkl").exists():
        MODELS_DIR = Path.cwd() / "models"
    elif (BASE_DIR / "models" / "random_forest.pkl").exists():
        MODELS_DIR = BASE_DIR / "models"
    else:
        MODELS_DIR = PROJECT_ROOT / "models"

    RF_MODEL_PATH = MODELS_DIR / "random_forest.pkl"
    XGB_MODEL_PATH = MODELS_DIR / "xgboost_model.pkl"
    MLP_MODEL_PATH = MODELS_DIR / "mlp_model.keras"
    MLP_SCALER_PATH = MODELS_DIR / "mlp_scaler.pkl"

    # Server settings
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 5000))
    DEBUG = os.getenv("FLASK_DEBUG", "0").lower() in ("1", "true", "yes")
    ENV = os.getenv("FLASK_ENV", "production" if not DEBUG else "development")

    # CORS settings - allows comma-separated origins, e.g. "https://myapp.vercel.app,http://localhost:3000"
    CORS_ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")
    if CORS_ALLOWED_ORIGINS != "*":
        CORS_ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]

    # Meteorological feature definitions with strict validation bounds & units
    # Note: Barometric Pressure (BP) is strictly calibrated in mmHg (not hPa).
    FEATURE_SPECS = {
        "RH": {
            "name": "Relative Humidity",
            "unit": "%",
            "min": 0.0,
            "max": 100.0,
            "description": "Atmospheric moisture saturation ratio",
        },
        "WD": {
            "name": "Wind Direction",
            "unit": "degrees",
            "min": 0.0,
            "max": 360.0,
            "description": "Compass angle of wind origin (0°-360°)",
        },
        "SR": {
            "name": "Solar Radiation",
            "unit": "W/m²",
            "min": 0.0,
            "max": 1500.0,
            "description": "Incident solar irradiance",
        },
        "BP": {
            "name": "Barometric Pressure",
            "unit": "mmHg",
            "min": 700.0,
            "max": 780.0,
            "description": "Atmospheric pressure in millimeters of mercury (verified dataset unit)",
        },
        "AT": {
            "name": "Air Temperature",
            "unit": "°C",
            "min": -20.0,
            "max": 60.0,
            "description": "Ambient dry-bulb air temperature",
        },
    }

    FEATURE_ORDER = ["RH", "WD", "SR", "BP", "AT"]

    # Official CPCB 24-hr PM2.5 Indicative Concentration Breakpoints (ug/m3)
    CPCB_BANDS = [
        {"max": 30.0, "category": "Good", "color": "#4CAF50", "health_statement": "Minimal impact."},
        {"max": 60.0, "category": "Satisfactory", "color": "#8BC34A", "health_statement": "Minor breathing discomfort to sensitive people."},
        {"max": 90.0, "category": "Moderate", "color": "#FFEB3B", "health_statement": "Breathing discomfort to people with lung disease, asthma, and heart conditions."},
        {"max": 120.0, "category": "Poor", "color": "#FF9800", "health_statement": "Breathing discomfort to most people on prolonged exposure."},
        {"max": 250.0, "category": "Very Poor", "color": "#F44336", "health_statement": "Respiratory illness to people on prolonged exposure."},
        {"max": float("inf"), "category": "Severe", "color": "#9C27B0", "health_statement": "Affects healthy people and seriously impacts those with existing respiratory conditions."},
    ]

    # Benchmark results from Phase 4 rigorous 406-sample held-out test evaluation
    MODEL_BENCHMARKS = {
        "random_forest": {
            "display_name": "Random Forest Regressor",
            "paradigm": "Traditional ML (Bagging Ensemble)",
            "test_r2": 0.7269,
            "test_rmse": 38.0513,
            "test_mae": 25.6211,
            "test_mse": 1447.9012,
            "is_best": False,
            "is_available": True,
            "status": "available",
            "description": "100-tree bagging ensemble with median imputation",
        },
        "xgboost": {
            "display_name": "XGBoost Regressor (Tuned)",
            "paradigm": "Gradient Boosted Decision Trees",
            "test_r2": 0.7455,
            "test_rmse": 36.7365,
            "test_mae": 25.2830,
            "test_mse": 1349.5732,
            "is_best": True,
            "is_available": True,
            "status": "available",
            "description": "Best performing model on held-out test set (5-fold randomized search tuned)",
        },
        "mlp": {
            "display_name": "Multilayer Perceptron (MLP)",
            "paradigm": "Deep Learning (Feedforward Neural Network)",
            "test_r2": 0.5408,
            "test_rmse": 49.3435,
            "test_mae": 37.8782,
            "test_mse": 2434.7852,
            "is_best": False,
            "is_available": True,
            "status": "available",
            "description": "Keras 3 sequential 3-hidden-layer feedforward network with leak-free preprocessing",
        },
        "lstm": {
            "display_name": "Long Short-Term Memory (LSTM)",
            "paradigm": "Recurrent Deep Learning (Sequential)",
            "test_r2": None,
            "test_rmse": None,
            "test_mae": None,
            "test_mse": None,
            "is_best": False,
            "is_available": False,
            "status": "blocked_pending_timestamps",
            "description": "Blocked pending genuine temporal sequencing. Dataset lacks genuine timestamps.",
        },
        "transformer": {
            "display_name": "Time-Series Transformer",
            "paradigm": "Self-Attention Deep Learning (Sequential)",
            "test_r2": None,
            "test_rmse": None,
            "test_mae": None,
            "test_mse": None,
            "is_best": False,
            "is_available": False,
            "status": "blocked_pending_timestamps",
            "description": "Blocked pending genuine temporal sequencing. Dataset lacks genuine timestamps.",
        },
    }

    # Standardized disclaimers
    CPCB_DISCLAIMER = (
        "Indicative CPCB PM2.5 Health Band based on estimated PM2.5 concentration. "
        "This is NOT an official multi-pollutant 24-hour sub-index CPCB AQI, which requires "
        "24-hour reference monitoring across multiple criteria pollutants (PM10, NO2, SO2, CO, O3, NH3)."
    )
    XAI_DISCLAIMER = (
        "SHAP attributions represent local statistical feature contributions to the mathematical model output. "
        "They indicate which meteorological variables shifted the prediction relative to the baseline, but do "
        "NOT establish physical emission causality or replace chemical transport / dispersion modeling."
    )
    GENERAL_DISCLAIMER = (
        "Predicted PM2.5 concentration is an estimated statistical output from surface meteorological features. "
        "It does not replace regulatory reference-grade air quality monitoring stations or source emission inventories."
    )
