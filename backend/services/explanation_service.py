"""Explanation service computing local SHAP attributions across ML/DL models."""

from typing import Any, Dict, List
import numpy as np
import pandas as pd
from backend.config import Config
from backend.models.model_loader import get_model_loader


class ExplanationService:
    """Computes and formats local SHAP attributions."""

    @classmethod
    def explain_instance(cls, model_key: str, features: Dict[str, float]) -> Dict[str, Any]:
        """Compute SHAP feature attributions for a single observation.

        Args:
            model_key: 'random_forest', 'xgboost', or 'mlp'.
            features: Validated meteorological features.

        Returns:
            Dictionary with base_value, predicted_value, attributions, and sorted importance.
        """
        loader = get_model_loader()
        df = pd.DataFrame([features], columns=Config.FEATURE_ORDER)

        if model_key == "random_forest":
            explainer = loader.rf_explainer
            base_value = float(np.ravel(explainer.expected_value)[0])
            exp_result = explainer(df)
            shap_array = np.ravel(exp_result.values[0])
            predicted_value = float(loader.rf_model.predict(df)[0])
            explainer_type = "TreeExplainer"

        elif model_key == "xgboost":
            explainer = loader.xgb_explainer
            base_value = float(np.ravel(explainer.expected_value)[0])
            exp_result = explainer(df)
            shap_array = np.ravel(exp_result.values[0])
            predicted_value = float(loader.xgb_model.predict(df)[0])
            explainer_type = "TreeExplainer"

        elif model_key == "mlp":
            scaler = loader.mlp_scaler
            scaled = scaler.transform(df)
            explainer = loader.mlp_explainer
            base_value = float(np.ravel(explainer.expected_value)[0])
            shap_matrix = explainer.shap_values(scaled)
            shap_array = np.ravel(shap_matrix[0])
            predicted_value = float(loader.mlp_model.predict(scaled, verbose=0).flatten()[0])
            explainer_type = "KernelExplainer"

        else:
            raise ValueError(f"Unsupported model key for explanation: {model_key}")

        attributions: List[Dict[str, Any]] = []
        for idx, feat in enumerate(Config.FEATURE_ORDER):
            spec = Config.FEATURE_SPECS[feat]
            val = float(features[feat])
            sv = float(shap_array[idx])
            direction = "positive" if sv >= 0 else "negative"
            verb = "Increases" if sv >= 0 else "Decreases"
            attributions.append(
                {
                    "feature": feat,
                    "name": spec["name"],
                    "value": round(val, 2),
                    "unit": spec["unit"],
                    "shap_value": round(sv, 4),
                    "abs_shap_value": round(abs(sv), 4),
                    "direction": direction,
                    "impact": f"{verb} predicted PM2.5 by {abs(sv):.2f} µg/m³",
                }
            )

        sorted_importance = sorted(attributions, key=lambda x: x["abs_shap_value"], reverse=True)
        benchmark = Config.MODEL_BENCHMARKS.get(model_key, {})

        return {
            "model_key": model_key,
            "model_name": benchmark.get("display_name", model_key),
            "explainer_type": explainer_type,
            "base_value": round(base_value, 2),
            "predicted_value": max(0.0, round(predicted_value, 2)),
            "unit": "µg/m³",
            "features": features,
            "attributions": attributions,
            "ranked_importance": sorted_importance,
            "dominant_feature": sorted_importance[0]["name"] if sorted_importance else None,
            "scientific_disclaimer": Config.XAI_DISCLAIMER,
        }
