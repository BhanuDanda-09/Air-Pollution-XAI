"""Validation service for API requests and meteorological features."""

import math
from typing import Any, Dict, List, Optional, Tuple
from backend.config import Config
from backend.models.model_loader import get_model_loader


class ValidationService:
    """Validates request bodies, model selectors, and meteorological parameters."""

    AVAILABLE_MODELS = ["random_forest", "xgboost", "mlp"]
    BLOCKED_MODELS = ["lstm", "transformer"]

    @classmethod
    def validate_model_selection(cls, model_name: Optional[str]) -> Tuple[bool, Optional[str], Optional[str], Optional[dict], int]:
        """Validate requested model identifier.

        Returns:
            (is_valid, error_message, error_code, error_details, status_code)
        """
        if not model_name or not isinstance(model_name, str):
            return (
                False,
                "The 'model' field is required. Must be one of: 'random_forest', 'xgboost', 'mlp'.",
                "MISSING_MODEL",
                {"allowed_models": cls.AVAILABLE_MODELS},
                400,
            )

        model_key = model_name.strip().lower()

        if model_key in cls.BLOCKED_MODELS:
            return (
                False,
                f"Model '{model_name}' is not currently available. Time-series architectures (LSTM, Transformer) "
                "are scientifically blocked pending a dataset with genuine sequential timestamps. "
                "Please select 'random_forest', 'xgboost', or 'mlp'.",
                "MODEL_BLOCKED",
                {
                    "requested_model": model_name,
                    "reason": "Dataset lacks sequential temporal order; artificial sequencing violates ML integrity.",
                    "available_models": cls.AVAILABLE_MODELS,
                },
                400,
            )

        if model_key not in cls.AVAILABLE_MODELS:
            return (
                False,
                f"Unknown model '{model_name}'. Allowed models are: {', '.join(cls.AVAILABLE_MODELS)}.",
                "INVALID_MODEL",
                {
                    "requested_model": model_name,
                    "available_models": cls.AVAILABLE_MODELS,
                },
                400,
            )

        loader = get_model_loader()
        status = loader.get_status()
        if not status.get(model_key, False):
            return (
                False,
                f"Model '{model_name}' is currently unavailable on the server due to an artifact loading failure.",
                "MODEL_UNAVAILABLE",
                {
                    "model": model_key,
                    "load_error": loader.load_errors.get(model_key, "Unknown loading failure"),
                },
                503,
            )

        return (True, None, None, None, 200)

    @classmethod
    def extract_and_validate_features(cls, payload: Any) -> Tuple[bool, Optional[Dict[str, float]], Optional[str], Optional[str], Optional[dict], int]:
        """Extract and strictly validate the 5 meteorological features.

        Accepts either nested: `{"features": {"RH": 55, ...}}`
        or flat: `{"RH": 55, "WD": 180, ...}`.

        Returns:
            (is_valid, clean_features_dict, error_message, error_code, error_details, status_code)
        """
        if not isinstance(payload, dict):
            return (
                False,
                None,
                "Request body must be a valid JSON object.",
                "INVALID_JSON_BODY",
                None,
                400,
            )

        # Allow either {"features": {...}} or direct {...}
        features_dict = payload.get("features") if isinstance(payload.get("features"), dict) else payload

        missing_fields: List[str] = []
        for feat in Config.FEATURE_ORDER:
            if feat not in features_dict:
                missing_fields.append(feat)

        if missing_fields:
            return (
                False,
                None,
                f"Missing required meteorological feature(s): {', '.join(missing_fields)}.",
                "MISSING_FEATURES",
                {
                    "missing_features": missing_fields,
                    "required_features": Config.FEATURE_ORDER,
                },
                400,
            )

        validated: Dict[str, float] = {}

        for feat in Config.FEATURE_ORDER:
            val = features_dict[feat]
            spec = Config.FEATURE_SPECS[feat]

            # Type check
            if not isinstance(val, (int, float)) or isinstance(val, bool):
                return (
                    False,
                    None,
                    f"Feature '{feat}' must be a numeric value, received type '{type(val).__name__}'.",
                    "INVALID_FEATURE_TYPE",
                    {"feature": feat, "value": val, "expected_type": "number"},
                    400,
                )

            # Check finite
            val_float = float(val)
            if math.isnan(val_float) or math.isinf(val_float):
                return (
                    False,
                    None,
                    f"Feature '{feat}' has an invalid numerical value (NaN or Inf).",
                    "INVALID_NUMERIC_VALUE",
                    {"feature": feat, "value": str(val)},
                    400,
                )

            # Range bounds check
            min_val = spec["min"]
            max_val = spec["max"]
            if val_float < min_val or val_float > max_val:
                unit = spec["unit"]
                return (
                    False,
                    None,
                    f"Feature '{feat}' ({spec['name']}) value {val_float} is out of realistic physical range "
                    f"[{min_val}, {max_val}] {unit}.",
                    "OUT_OF_BOUNDS",
                    {
                        "feature": feat,
                        "name": spec["name"],
                        "value": val_float,
                        "valid_range": [min_val, max_val],
                        "unit": unit,
                    },
                    400,
                )

            validated[feat] = val_float

        return (True, validated, None, None, None, 200)
