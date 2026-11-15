"""
src/shap_explainability.py
--------------------------
Phase 3: SHAP (SHapley Additive exPlanations) for Random Forest and XGBoost.

Responsibilities:
1. Load existing trained model pipelines (Random Forest and XGBoost).
2. Load held-out test dataset (20%, 406 samples) with verified features: RH, WD, SR, BP, AT.
3. Transform input features through the pipeline's median imputer while preserving feature names.
4. Calculate SHAP values using shap.TreeExplainer for both models.
5. Generate all required visualizations for BOTH models:
   - A. SHAP Summary Beeswarm Plot
   - B. SHAP Global Feature Importance Plot (mean |SHAP|)
   - C. SHAP Dependence Plots (for top features)
   - D. SHAP Waterfall Plot (for an individual test sample)
   - E. SHAP Force Plot (PNG and interactive HTML)
6. Calculate and save numerical results to results/metrics/shap/:
   - Global mean absolute SHAP values, ranking, mean positive and negative contributions.
   - Individual feature contributions for representative test observations.
"""

import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Ensure matplotlib uses local writable directory and non-interactive Agg backend
os.environ.setdefault("MPLCONFIGDIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".matplotlib_cache")))
import matplotlib
matplotlib.use("Agg")

import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import shap

from src.preprocessing import preprocess_data, get_feature_target_names


def explain_model_shap(model_name="random_forest", pipeline=None, data_dict=None,
                       output_graph_dir=None, output_metrics_dir="results/metrics/shap"):
    """
    Compute and save comprehensive SHAP explanations for a given model.

    Parameters
    ----------
    model_name : str
        'random_forest' or 'xgboost'
    pipeline : sklearn.pipeline.Pipeline, optional
        Fitted pipeline containing imputer and regressor.
    data_dict : dict, optional
        Data dictionary from preprocess_data().
    """
    if output_graph_dir is None:
        output_graph_dir = f"results/graphs/shap/{model_name}"

    os.makedirs(output_graph_dir, exist_ok=True)
    os.makedirs(output_metrics_dir, exist_ok=True)

    # 1. Load data if needed
    if data_dict is None:
        print("[INFO] Loading preprocessed dataset for SHAP explainability...")
        data_dict = preprocess_data(random_state=42, save_processed=False)

    X_train = data_dict["X_train"]
    X_test = data_dict["X_test"]
    y_test = data_dict["y_test"]
    features, target = get_feature_target_names()

    # 2. Load model pipeline if needed
    if pipeline is None:
        model_file = "models/random_forest.pkl" if model_name == "random_forest" else "models/xgboost_model.pkl"
        if not os.path.exists(model_file):
            raise FileNotFoundError(f"Model file {model_file} not found. Please train it first.")
        pipeline = joblib.load(model_file)

    display_name = "Random Forest" if model_name == "random_forest" else "XGBoost"
    print(f"\n[INFO] === Calculating SHAP Explanations for {display_name} ===")

    # 3. Apply Imputer Transformation while strictly preserving Feature Names
    imputer = pipeline.named_steps["imputer"]
    regressor = pipeline.named_steps["regressor"]

    X_test_imputed = pd.DataFrame(
        imputer.transform(X_test),
        columns=features,
        index=X_test.index
    )

    # 4. TreeExplainer calculation
    print(f"[INFO] Initializing shap.TreeExplainer for {display_name}...")
    explainer = shap.TreeExplainer(regressor)
    shap_explanation = explainer(X_test_imputed)
    shap_values = shap_explanation.values  # Shape: (N, num_features)

    base_value = float(explainer.expected_value) if np.isscalar(explainer.expected_value) else float(explainer.expected_value[0])
    print(f"[SUCCESS] Computed SHAP values for {len(X_test_imputed)} test samples. Base expected value: {base_value:.2f} µg/m³")

    # -------------------------------------------------------------
    # A. SHAP Summary Beeswarm Plot
    # -------------------------------------------------------------
    plt.figure(figsize=(9, 6))
    shap.plots.beeswarm(shap_explanation, show=False, max_display=len(features))
    plt.title(f"{display_name}: SHAP Summary Beeswarm Plot", fontsize=14, fontweight="bold", pad=12)
    plt.xlabel("SHAP Value (Impact on PM2.5 Prediction in µg/m³)", fontsize=11)
    plt.tight_layout()
    beeswarm_path = os.path.join(output_graph_dir, "shap_summary_beeswarm.png")
    plt.savefig(beeswarm_path, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"[SUCCESS] Saved Beeswarm plot: {beeswarm_path}")

    # -------------------------------------------------------------
    # B. SHAP Global Feature Importance Bar Plot
    # -------------------------------------------------------------
    plt.figure(figsize=(8, 5))
    shap.plots.bar(shap_explanation, show=False, max_display=len(features))
    plt.title(f"{display_name}: SHAP Global Feature Importance (Mean |SHAP|)", fontsize=14, fontweight="bold", pad=12)
    plt.xlabel("Mean |SHAP Value| (Average Absolute Impact on PM2.5 in µg/m³)", fontsize=11)
    plt.tight_layout()
    bar_path = os.path.join(output_graph_dir, "shap_global_feature_importance.png")
    plt.savefig(bar_path, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"[SUCCESS] Saved Global Feature Importance bar plot: {bar_path}")

    # -------------------------------------------------------------
    # C. SHAP Dependence Plots (for all 5 core features)
    # -------------------------------------------------------------
    # Compute mean absolute SHAP to rank features for dependence plotting
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    sorted_feat_indices = np.argsort(mean_abs_shap)[::-1]
    top_feature = features[sorted_feat_indices[0]]

    for feat in features:
        plt.figure(figsize=(7, 5))
        # Interaction feature: choose top feature if different, else second top
        interaction_feat = top_feature if feat != top_feature else features[sorted_feat_indices[1]]
        shap.plots.scatter(shap_explanation[:, feat], color=shap_explanation[:, interaction_feat], show=False)
        plt.title(f"{display_name}: SHAP Dependence Plot for {feat} (Colored by {interaction_feat})", fontsize=12, fontweight="bold", pad=10)
        plt.ylabel(f"SHAP Value for {feat} (µg/m³)", fontsize=10)
        plt.xlabel(f"Actual Value of {feat}", fontsize=10)
        plt.tight_layout()
        dep_path = os.path.join(output_graph_dir, f"shap_dependence_{feat}.png")
        plt.savefig(dep_path, dpi=300, bbox_inches="tight")
        plt.close()
    print(f"[SUCCESS] Saved Dependence plots for all 5 features in: {output_graph_dir}")

    # -------------------------------------------------------------
    # D. SHAP Waterfall Plot (for Test Observation #0)
    # -------------------------------------------------------------
    sample_idx = 0
    plt.figure(figsize=(9, 6))
    shap.plots.waterfall(shap_explanation[sample_idx], show=False, max_display=len(features))
    plt.title(f"{display_name}: SHAP Waterfall Explanation (Test Sample #{sample_idx})", fontsize=13, fontweight="bold", pad=12)
    plt.tight_layout()
    waterfall_path = os.path.join(output_graph_dir, f"shap_waterfall_sample_{sample_idx}.png")
    plt.savefig(waterfall_path, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"[SUCCESS] Saved Waterfall plot: {waterfall_path}")

    # -------------------------------------------------------------
    # E. SHAP Force Plot (PNG and HTML)
    # -------------------------------------------------------------
    # Generate matplotlib force plot
    try:
        force_plot = shap.force_plot(
            base_value,
            shap_values[sample_idx],
            X_test_imputed.iloc[sample_idx],
            matplotlib=True,
            show=False
        )
        force_png_path = os.path.join(output_graph_dir, f"shap_force_sample_{sample_idx}.png")
        plt.title(f"{display_name}: SHAP Force Plot (Sample #{sample_idx})", fontsize=12, fontweight="bold", pad=20)
        plt.tight_layout()
        plt.savefig(force_png_path, dpi=300, bbox_inches="tight")
        plt.close()
        print(f"[SUCCESS] Saved Force PNG plot: {force_png_path}")
    except Exception as e:
        print(f"[WARNING] Matplotlib force plot generation skipped: {e}")

    # Generate interactive HTML force plot
    force_html = shap.force_plot(
        base_value,
        shap_values[sample_idx],
        X_test_imputed.iloc[sample_idx]
    )
    force_html_path = os.path.join(output_graph_dir, f"shap_force_sample_{sample_idx}.html")
    shap.save_html(force_html_path, force_html)
    print(f"[SUCCESS] Saved Interactive Force HTML: {force_html_path}")

    # -------------------------------------------------------------
    # 5. Numerical Results Calculation & Serialization
    # -------------------------------------------------------------
    # 5.1 Global Feature Importance Metrics
    global_metrics_list = []
    for idx in sorted_feat_indices:
        feat = features[idx]
        m_abs = float(mean_abs_shap[idx])
        vals = shap_values[:, idx]
        pos_contrib = float(vals[vals > 0].mean()) if (vals > 0).any() else 0.0
        neg_contrib = float(vals[vals < 0].mean()) if (vals < 0).any() else 0.0
        pct = (m_abs / mean_abs_shap.sum()) * 100

        global_metrics_list.append({
            "Feature": feat,
            "Mean_Absolute_SHAP": round(m_abs, 3),
            "Relative_Importance_Pct": round(pct, 2),
            "Mean_Positive_Contribution": round(pos_contrib, 3),
            "Mean_Negative_Contribution": round(neg_contrib, 3)
        })

    global_df = pd.DataFrame(global_metrics_list)
    prefix = "rf" if model_name == "random_forest" else "xgboost"
    global_csv_path = os.path.join(output_metrics_dir, f"{prefix}_shap_global_importance.csv")
    global_df.to_csv(global_csv_path, index=False)
    print(f"[SUCCESS] Saved Global SHAP metrics CSV: {global_csv_path}")

    # 5.2 Representative Sample Explanations (5 diverse samples)
    # Pick: Lowest PM2.5, 25th percentile, Median, 75th percentile, Highest PM2.5
    y_test_arr = y_test.values
    selected_indices = [
        int(np.argmin(y_test_arr)),                        # Min
        int(np.argsort(y_test_arr)[len(y_test_arr) // 4]), # 25th
        int(np.argsort(y_test_arr)[len(y_test_arr) // 2]), # Median
        int(np.argsort(y_test_arr)[3 * len(y_test_arr) // 4]), # 75th
        int(np.argmax(y_test_arr))                         # Max
    ]
    sample_labels = ["Minimum_PM2.5", "25th_Percentile", "Median_PM2.5", "75th_Percentile", "Maximum_PM2.5_Smog_Spike"]

    sample_rows = []
    for s_idx, label in zip(selected_indices, sample_labels):
        row_features = X_test_imputed.iloc[s_idx].to_dict()
        pred_val = float(pipeline.predict(X_test.iloc[[s_idx]])[0])
        actual_val = float(y_test.iloc[s_idx])

        row_dict = {
            "Sample_Type": label,
            "Test_Index": s_idx,
            "Actual_PM2.5": round(actual_val, 2),
            "Predicted_PM2.5": round(pred_val, 2),
            "Base_Value": round(base_value, 2)
        }
        for feat in features:
            f_idx = features.index(feat)
            row_dict[f"{feat}_Value"] = round(row_features[feat], 2)
            row_dict[f"{feat}_SHAP"] = round(float(shap_values[s_idx, f_idx]), 3)

        sample_rows.append(row_dict)

    samples_df = pd.DataFrame(sample_rows)
    samples_csv_path = os.path.join(output_metrics_dir, f"{prefix}_shap_sample_contributions.csv")
    samples_df.to_csv(samples_csv_path, index=False)
    print(f"[SUCCESS] Saved Sample SHAP contributions CSV: {samples_csv_path}")

    return {
        "model_name": model_name,
        "base_value": base_value,
        "global_importance_df": global_df,
        "sample_contributions_df": samples_df,
        "shap_values": shap_values,
        "features": features
    }


def run_all_shap_explanations():
    """Run SHAP explanations for both Random Forest and XGBoost."""
    print("=" * 70)
    print("       PHASE 3: SHAP GLOBAL AND LOCAL EXPLAINABILITY ANALYSIS        ")
    print("=" * 70)

    data_dict = preprocess_data(random_state=42, save_processed=False)

    rf_shap = explain_model_shap(model_name="random_forest", data_dict=data_dict)
    xgb_shap = explain_model_shap(model_name="xgboost", data_dict=data_dict)

    print("\n" + "=" * 70)
    print("           SHAP EXPLAINABILITY COMPLETED FOR BOTH MODELS             ")
    print("=" * 70)
    return rf_shap, xgb_shap


if __name__ == "__main__":
    run_all_shap_explanations()
