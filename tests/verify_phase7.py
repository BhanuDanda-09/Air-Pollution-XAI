"""Phase 7 Real Model Inference and SHAP Explainability Audit Script.

Tests the exact user-specified sample input:
{
  "RH": 74,
  "WD": 298,
  "SR": 5,
  "BP": 740,
  "AT": 14
}
"""

import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import json
from backend.models.model_loader import get_model_loader
from backend.services.prediction_service import PredictionService
from backend.services.explanation_service import ExplanationService

def run_audit():
    loader = get_model_loader()
    status = loader.get_status()
    print("================ MODEL LOADER STATUS ================")
    print(json.dumps(status, indent=2))

    sample_input = {
        "RH": 74.0,
        "WD": 298.0,
        "SR": 5.0,
        "BP": 740.0,
        "AT": 14.0
    }

    print("\n================ TEST INPUT (BP in mmHg) ================")
    print(json.dumps(sample_input, indent=2))

    # 1. Real Model Inference
    print("\n================ 1. INFERENCE TEST RESULTS ================")
    rf_res = PredictionService.predict_single("random_forest", sample_input)
    xgb_res = PredictionService.predict_single("xgboost", sample_input)
    mlp_res = PredictionService.predict_single("mlp", sample_input)

    print(f"Random Forest PM2.5 : {rf_res['prediction']['pm25']:.2f} µg/m³ | Indicative Category: {rf_res['cpcb_category']['category']}")
    print(f"XGBoost PM2.5       : {xgb_res['prediction']['pm25']:.2f} µg/m³ | Indicative Category: {xgb_res['cpcb_category']['category']}")
    print(f"MLP (Keras) PM2.5   : {mlp_res['prediction']['pm25']:.2f} µg/m³ | Indicative Category: {mlp_res['cpcb_category']['category']}")

    # 2. Multi-model Comparison
    print("\n================ 2. MULTI-MODEL COMPARISON ================")
    comp_res = PredictionService.compare_all(sample_input)
    print(f"Empirical Benchmark Winner : {comp_res['best_model'].upper()}")
    for model_k, data in comp_res["predictions"].items():
        print(f"  [{model_k}] Predicted: {data['pm25']} µg/m³ ({data['cpcb_category']}) | Test R²: {data['test_benchmark']['r2']}")

    # 3. SHAP Explainability Audit
    print("\n================ 3. SHAP EXPLAINABILITY AUDIT ================")
    for model_k in ["random_forest", "xgboost", "mlp"]:
        exp = ExplanationService.explain_instance(model_k, sample_input)
        base = exp["base_value"]
        pred = exp["predicted_value"]
        shap_sum = sum(item["shap_value"] for item in exp["attributions"])
        reconstructed = round(base + shap_sum, 2)
        diff = round(abs(reconstructed - pred), 4)

        print(f"\n--- Model: {model_k.upper()} ({exp['explainer_type']}) ---")
        print(f"Base Value (Expected)      : {base:.2f} µg/m³")
        print(f"Sum of SHAP Attributions   : {shap_sum:+.4f} µg/m³")
        print(f"Base + Sum of SHAP         : {reconstructed:.2f} µg/m³")
        print(f"Actual Model Prediction    : {pred:.2f} µg/m³")
        print(f"Difference |(Base+Sum)-Pred|: {diff:.4f} µg/m³")

        # Check additive consistency
        # TreeExplainer is theoretically exact (within floating point precision).
        # KernelExplainer on neural nets is a sampling-based Monte Carlo approximation.
        if exp["explainer_type"] == "TreeExplainer":
            is_exact = diff < 0.05
            print(f"Exact Additive Efficiency  : {is_exact} (TreeExplainer exact property)")
        else:
            print(f"KernelExplainer Efficiency : Diff is {diff:.4f} (Kernel approximation from zero background)")

        print("Feature Attributions Breakdown:")
        for attr in exp["attributions"]:
            sign = "+" if attr["shap_value"] >= 0 else ""
            print(f"  {attr['feature']:2s} = {attr['value']:6.1f} {attr['unit']:7s} | SHAP: {sign}{attr['shap_value']:8.4f} µg/m³ | {attr['direction'].upper():8s} | {attr['impact']}")

if __name__ == "__main__":
    run_audit()
