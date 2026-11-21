"""Application configuration for AirIQ India Flask backend."""

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

    # CORS settings - allows comma-separated origins, with safe production default for Vercel
    DEFAULT_ALLOWED_ORIGINS = [
        "https://air-pollution-xai.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    ENV_ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS")
    if ENV_ALLOWED_ORIGINS:
        if ENV_ALLOWED_ORIGINS.strip() == "*":
            CORS_ALLOWED_ORIGINS = "*"
        else:
            CORS_ALLOWED_ORIGINS = [origin.strip() for origin in ENV_ALLOWED_ORIGINS.split(",") if origin.strip()]
    else:
        CORS_ALLOWED_ORIGINS = DEFAULT_ALLOWED_ORIGINS

    # Security & Role-Based Access Control (RBAC) Settings
    SECRET_KEY = os.getenv("SECRET_KEY", "air-pollution-xai-capstone-secret-key-2026")
    JWT_EXPIRY_SECONDS = int(os.getenv("JWT_EXPIRY_SECONDS", 3600))
    ENABLE_DEMO_MODE = os.getenv("ENABLE_DEMO_MODE", "false").lower() in ("1", "true", "yes")

    # Real-world Live Assessment & Geographic Validation Settings
    DELHI_NCR_BOUNDS = {
        "lat_min": 28.1,
        "lat_max": 28.9,
        "lon_min": 76.8,
        "lon_max": 77.6,
    }
    OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
    OPEN_METEO_AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
    OPEN_METEO_TIMEOUT = 6.0  # 6-second timeout (satisfies 5-8s constraint)
    OPEN_METEO_API_KEY = os.getenv("OPEN_METEO_API_KEY", None)
    LOCATION_CACHE_TTL = 600   # 10 minutes cache validity
    LOCATION_CACHE_MAXSIZE = 256
    LOCATION_RATE_LIMIT_MAX = 30  # Max requests per minute per IP
    OPENAQ_API_KEY = os.getenv("OPENAQ_API_KEY", None)

    # Actual Training Feature Distribution Bounds for Out-of-Range Warning (No silent clamping)
    TRAINING_FEATURE_RANGES = {
        "RH": {"min": 36.0, "max": 95.0, "unit": "%", "name": "Relative Humidity"},
        "WD": {"min": 7.0, "max": 332.0, "unit": "°", "name": "Wind Direction"},
        "SR": {"min": 2.0, "max": 334.0, "unit": "W/m²", "name": "Solar Radiation"},
        "BP": {"min": 726.0, "max": 749.0, "unit": "mmHg", "name": "Barometric Pressure"},
        "AT": {"min": 11.0, "max": 23.0, "unit": "°C", "name": "Air Temperature"},
    }

    # Phase 2 Livability & Exposure Score Engine Configuration
    # Primary driver: Reference PM2.5 (CAMS model data) + forecast
    # Secondary context only: ML model estimate (trained on Delhi winter data: AT 11-23°C)
    LIVABILITY_CONFIG = {
        "weights": {
            "reference_current": 0.60,
            "reference_forecast_24h": 0.25,
            "meteorological_stagnation": 0.15,
        },
        # 4 Standard Verdicts with Baseline Thresholds
        "verdicts": [
            {
                "key": "good_to_go",
                "label": "Good to go",
                "min_baseline_score": 75,
                "color": "#10B981",  # Emerald Green
                "summary": "Air quality is favorable. Outdoor exercise, daily transit, and natural home ventilation are safe.",
                "actions": {
                    "n95_mask": "Not required for general population.",
                    "indoor_exercise": "Outdoor workouts encouraged; enjoy parks and open spaces.",
                    "windows": "Open windows for fresh air ventilation.",
                    "purifier": "Air purifiers optional.",
                },
            },
            {
                "key": "take_precautions",
                "label": "Take precautions",
                "min_baseline_score": 50,
                "color": "#F59E0B",  # Amber
                "summary": "Air quality is moderate. Sensitive individuals and vulnerable health profiles should reduce prolonged heavy exertion.",
                "actions": {
                    "n95_mask": "Advised for sensitive individuals in heavy traffic corridors.",
                    "indoor_exercise": "Healthy adults can exercise outdoors; sensitive groups should consider indoor gym workouts.",
                    "windows": "Keep windows closed during morning/evening rush hour peaks.",
                    "purifier": "Run indoor purifiers in bedrooms during sleep hours.",
                },
            },
            {
                "key": "avoid_outdoor",
                "label": "Avoid outdoor activity",
                "min_baseline_score": 30,
                "color": "#F97316",  # Orange/Dark Amber
                "summary": "Unfavorable particulate pollution. Significant risk of respiratory irritation, coughing, and cardiovascular strain.",
                "actions": {
                    "n95_mask": "N95 / FFP2 respirator strongly recommended outdoors.",
                    "indoor_exercise": "Move all cardio and athletic workouts indoors.",
                    "windows": "Keep windows and external doors closed continuously.",
                    "purifier": "Operate HEPA air purifiers continuously on medium/high speed.",
                },
            },
            {
                "key": "not_recommended",
                "label": "Not recommended",
                "min_baseline_score": 0,
                "color": "#EF4444",  # Crimson Red
                "summary": "Severe air pollution crisis. Outdoor exposure carries severe health consequences. Unfavorable for residence without continuous high-grade filtration.",
                "actions": {
                    "n95_mask": "N95/P100 respirator strictly mandatory for any outdoor transit.",
                    "indoor_exercise": "Strict indoor confinement. No strenuous physical exertion.",
                    "windows": "Seal window gaps; do not ventilate with unpurified ambient air.",
                    "purifier": "High-capacity HEPA purifiers running continuously; monitor indoor PM2.5.",
                },
            },
        ],
        "health_profile_shifts": {
            "respiratory_condition": 10,
            "heart_condition": 10,
            "pregnant": 10,
            "child": 8,
            "senior": 8,
            "outdoor_worker": 8,
            "max_total_shift": 25,  # Maximum tightening penalty
        },
    }

    MEDICAL_DISCLAIMER = (
        "Medical Disclaimer: This assessment is informational only and does not constitute medical advice, "
        "clinical diagnosis, or treatment. Consult a licensed physician for clinical respiratory or cardiovascular health management."
    )

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
