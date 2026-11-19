"""Model Loader singleton module.

Loads and caches trained ML/DL models and SHAP explainers on demand.
Preserves existing Phase 1, Phase 2, and Phase 4 model artifacts.
Optimized for 512MB RAM constraints on Render free tier via lazy loading.
"""

import logging
import os
import joblib
import numpy as np
import shap
from backend.config import Config

# Suppress TensorFlow verbose logging & GPU overhead for CPU-only server environments
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

logger = logging.getLogger(__name__)


class ModelLoader:
    """Singleton model loader and registry."""

    _instance = None

    def __init__(self):
        self.rf_model = None
        self.xgb_model = None
        self._mlp_model = None
        self._mlp_scaler = None

        self.rf_explainer = None
        self.xgb_explainer = None
        self._mlp_explainer = None

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

    @property
    def mlp_model(self):
        if self._mlp_model is None and self.load_status.get("mlp"):
            self._load_mlp()
        return self._mlp_model

    @mlp_model.setter
    def mlp_model(self, val):
        self._mlp_model = val

    @property
    def mlp_scaler(self):
        if self._mlp_scaler is None and self.load_status.get("mlp"):
            self._load_mlp()
        return self._mlp_scaler

    @mlp_scaler.setter
    def mlp_scaler(self, val):
        self._mlp_scaler = val

    @property
    def mlp_explainer(self):
        if self._mlp_explainer is None and self.load_status.get("mlp"):
            self._load_mlp()
        return self._mlp_explainer

    @mlp_explainer.setter
    def mlp_explainer(self, val):
        self._mlp_explainer = val

    def _load_all(self):
        """Load standard tree model artifacts and explainers."""
        # 1. Random Forest
        rf_path = Config.RF_MODEL_PATH
        if rf_path.exists():
            try:
                self.rf_model = joblib.load(rf_path)
                self.load_status["random_forest"] = True
                logger.info("Loaded Random Forest model from %s", rf_path)
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

        # 3. Check availability of MLP artifacts without loading TF/Keras into memory at startup
        mlp_path = Config.MLP_MODEL_PATH
        scaler_path = Config.MLP_SCALER_PATH
        if mlp_path.exists() and scaler_path.exists():
            self.load_status["mlp"] = True
            logger.info("MLP model and scaler artifacts verified available at %s (lazy-loaded on demand)", mlp_path)
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

    def _load_mlp(self):
        """Lazy-load Multilayer Perceptron (MLP) & Scaler only on demand."""
        if self._mlp_model is not None:
            return

        mlp_path = Config.MLP_MODEL_PATH
        scaler_path = Config.MLP_SCALER_PATH
        if mlp_path.exists() and scaler_path.exists():
            try:
                try:
                    import keras
                except ImportError:
                    from tensorflow import keras

                self._mlp_model = keras.models.load_model(mlp_path)
                self._mlp_scaler = joblib.load(scaler_path)
                self.load_status["mlp"] = True
                logger.info("Loaded MLP model and scaler on demand from %s and %s", mlp_path, scaler_path)

                try:
                    background = np.zeros((1, 5))
                    self._mlp_explainer = shap.KernelExplainer(
                        lambda x: self._mlp_model.predict(x, verbose=0).flatten(),
                        background,
                    )
                except Exception as explainer_exc:
                    logger.warning("Could not initialize SHAP KernelExplainer for MLP: %s", explainer_exc)
            except Exception as exc:
                self.load_status["mlp"] = False
                self.load_errors["mlp"] = str(exc)
                logger.error("Failed loading MLP: %s", exc)

    def get_status(self):
        """Return boolean dictionary of model availability."""
        return dict(self.load_status)

    def get_model(self, model_name: str):
        """Retrieve model object by key name."""
        name = model_name.lower()
        if name == "mlp":
            return self.mlp_model
        mapping = {
            "random_forest": self.rf_model,
            "xgboost": self.xgb_model,
        }
        return mapping.get(name)

    def get_explainer(self, model_name: str):
        """Retrieve pre-cached SHAP explainer by model name."""
        name = model_name.lower()
        if name == "mlp":
            return self.mlp_explainer
        mapping = {
            "random_forest": self.rf_explainer,
            "xgboost": self.xgb_explainer,
        }
        return mapping.get(name)


def get_model_loader():
    """Convenience helper to obtain ModelLoader singleton."""
    return ModelLoader.get_instance()
