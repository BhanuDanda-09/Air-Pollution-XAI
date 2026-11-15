"""Model Loader singleton module.

Loads and caches trained ML/DL models and SHAP explainers on demand.
Preserves existing Phase 1, Phase 2, and Phase 4 model artifacts.
"""

import logging
import os
import joblib
import numpy as np

# Suppress TensorFlow verbose logging
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

try:
    import keras
except ImportError:
    try:
        from tensorflow import keras
    except ImportError:
        keras = None

import shap
from backend.config import Config

logger = logging.getLogger(__name__)


class ModelLoader:
    """Singleton model loader and registry."""

    _instance = None

    def __init__(self):
        self.rf_model = None
        self.xgb_model = None
        self.mlp_model = None
        self.mlp_scaler = None

        self.rf_explainer = None
        self.xgb_explainer = None
        self.mlp_explainer = None

        self.load_status = {
            "random_forest": False,
            "xgboost": False,
            "mlp": False,
            "lstm": False,
            "transformer": False,
        }
        self.load_errors = {}
        self._load_all()

    @classmethod
    def get_instance(cls):
        """Get or initialize singleton instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_all(self):
        """Load all available model artifacts and initialize explainers."""
        # 1. Random Forest
        rf_path = Config.RF_MODEL_PATH
        if rf_path.exists():
            try:
                self.rf_model = joblib.load(rf_path)
                self.load_status["random_forest"] = True
                logger.info("Loaded Random Forest model from %s", rf_path)
                # Initialize TreeExplainer on inner regressor
                regressor = (
                    self.rf_model.named_steps["regressor"]
                    if hasattr(self.rf_model, "named_steps")
                    else self.rf_model
                )
                self.rf_explainer = shap.TreeExplainer(regressor)
            except Exception as exc:
                self.load_errors["random_forest"] = str(exc)
                logger.error("Failed loading Random Forest: %s", exc)
        else:
            self.load_errors["random_forest"] = f"Artifact not found at {rf_path}"
            logger.warning("Random Forest artifact not found at %s", rf_path)

        # 2. XGBoost
        xgb_path = Config.XGB_MODEL_PATH
        if xgb_path.exists():
            try:
                self.xgb_model = joblib.load(xgb_path)
                self.load_status["xgboost"] = True
                logger.info("Loaded XGBoost model from %s", xgb_path)
                regressor = (
                    self.xgb_model.named_steps["regressor"]
                    if hasattr(self.xgb_model, "named_steps")
                    else self.xgb_model
                )
                self.xgb_explainer = shap.TreeExplainer(regressor)
            except Exception as exc:
                self.load_errors["xgboost"] = str(exc)
                logger.error("Failed loading XGBoost: %s", exc)
        else:
            self.load_errors["xgboost"] = f"Artifact not found at {xgb_path}"
            logger.warning("XGBoost artifact not found at %s", xgb_path)

        # 3. Multilayer Perceptron (MLP) & Scaler
        mlp_path = Config.MLP_MODEL_PATH
        scaler_path = Config.MLP_SCALER_PATH
        if mlp_path.exists() and scaler_path.exists():
            try:
                if keras is not None:
                    self.mlp_model = keras.models.load_model(mlp_path)
                else:
                    raise ImportError("Keras/TensorFlow is not available.")
                self.mlp_scaler = joblib.load(scaler_path)
                self.load_status["mlp"] = True
                logger.info("Loaded MLP model and scaler from %s and %s", mlp_path, scaler_path)
                # KernelExplainer with zero-centered normalized background (5 features)
                try:
                    background = np.zeros((1, 5))
                    self.mlp_explainer = shap.KernelExplainer(
                        lambda x: self.mlp_model.predict(x, verbose=0).flatten(),
                        background,
                    )
                except Exception as explainer_exc:
                    logger.warning("Could not initialize SHAP KernelExplainer for MLP: %s", explainer_exc)
            except Exception as exc:
                self.load_status["mlp"] = False
                self.load_errors["mlp"] = str(exc)
                logger.error("Failed loading MLP: %s", exc)
        else:
            missing = []
            if not mlp_path.exists():
                missing.append(str(mlp_path))
            if not scaler_path.exists():
                missing.append(str(scaler_path))
            self.load_errors["mlp"] = f"Missing artifacts: {', '.join(missing)}"
            logger.warning("MLP artifacts missing: %s", missing)

        # LSTM & Transformer remain intentionally False (blocked pending timestamps)
        self.load_status["lstm"] = False
        self.load_status["transformer"] = False

    def get_status(self):
        """Return boolean dictionary of model availability."""
        return dict(self.load_status)

    def get_model(self, model_name: str):
        """Retrieve model object by key name."""
        mapping = {
            "random_forest": self.rf_model,
            "xgboost": self.xgb_model,
            "mlp": self.mlp_model,
        }
        return mapping.get(model_name.lower())

    def get_explainer(self, model_name: str):
        """Retrieve pre-cached SHAP explainer by model name."""
        mapping = {
            "random_forest": self.rf_explainer,
            "xgboost": self.xgb_explainer,
            "mlp": self.mlp_explainer,
        }
        return mapping.get(model_name.lower())


def get_model_loader():
    """Convenience helper to obtain ModelLoader singleton."""
    return ModelLoader.get_instance()
