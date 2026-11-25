import joblib
import shap
import numpy as np
import pandas as pd

def compute_delhi_winter_shap():
    # Load trained XGBoost pipeline
    pipeline = joblib.load("models/xgboost_model.pkl")
    imputer = pipeline.named_steps["imputer"]
    regressor = pipeline.named_steps["regressor"]

    # Representative Delhi winter scenario
    # RH=85%, WD=290°, SR=15 W/m², BP=746 mmHg, AT=12°C
    features = ["RH", "WD", "SR", "BP", "AT"]
    raw_values = [85.0, 290.0, 15.0, 746.0, 12.0]
    x_df = pd.DataFrame([raw_values], columns=features)
    x_imp = imputer.transform(x_df)

    pred = float(regressor.predict(x_imp)[0])

    explainer = shap.TreeExplainer(regressor)
    shap_vals = explainer.shap_values(x_imp)[0]
    base_val = float(explainer.expected_value)

    print("==================================================")
    print("Delhi Winter Scenario SHAP Attribution Computation")
    print("==================================================")
    print(f"Base Value (E[f(x)]): {base_val:.6f} µg/m³ (approx {base_val:.1f})")
    print(f"Model Prediction:     {pred:.6f} µg/m³ (approx {pred:.1f})")
    print("Feature Contributions:")
    for f, val, s in zip(features, raw_values, shap_vals):
        print(f"  {f:2s} = {val:6.1f} : {s:+10.6f} µg/m³ (approx {s:+.1f})")

    shap_sum = float(np.sum(shap_vals))
    net_change = pred - base_val
    print("--------------------------------------------------")
    print(f"Sum of SHAP Contributions: {shap_sum:.6f} µg/m³ (approx {shap_sum:+.1f})")
    print(f"Net Change (Pred - Base):  {net_change:.6f} µg/m³ (approx {net_change:+.1f})")
    print(f"Base + Sum:                {base_val + shap_sum:.6f} µg/m³")
    print(f"Absolute Difference:       {abs((base_val + shap_sum) - pred):.8f}")
    
    # Assert base value + sum of contributions == prediction within 0.1
    assert abs((base_val + shap_sum) - pred) < 0.1, "Assertion failed: base + sum != pred within 0.1"
    print("Assertion PASSED: base value + sum of contributions == prediction within 0.1!")

    return {
        "base_val": base_val,
        "pred": pred,
        "features": {f: {"value": val, "shap": float(s)} for f, val, s in zip(features, raw_values, shap_vals)},
        "shap_sum": shap_sum,
        "net_change": net_change
    }

if __name__ == "__main__":
    compute_delhi_winter_shap()
