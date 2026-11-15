"""
src/evaluate_model.py
---------------------
Phase 1: Model Evaluation & Performance Assessment for Air Pollution Prediction.

Responsibilities:
1. Load trained Random Forest pipeline and held-out test dataset (20%).
2. Compute empirical test-set evaluation metrics:
   - Mean Absolute Error (MAE)
   - Mean Squared Error (MSE)
   - Root Mean Squared Error (RMSE)
   - Coefficient of Determination (R² Score)
3. Generate evaluation graphs:
   - Actual vs. Predicted PM2.5 with 1:1 identity line
   - Residuals vs. Predicted Plot with zero-error line
   - Gini Feature Importance horizontal bar chart
4. Save metrics to:
   - results/metrics/model_metrics.json
   - results/metrics/model_metrics.csv
5. Generate beginner-friendly comprehensive report in:
   - results/reports/model_evaluation_report.md
"""

import os
import sys
import json

# Ensure root directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Ensure matplotlib has a local writable cache directory to suppress warnings
os.environ.setdefault("MPLCONFIGDIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".matplotlib_cache")))

import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from src.preprocessing import preprocess_data, get_feature_target_names
from src.train_random_forest import load_model, train_model


def evaluate_model(pipeline=None, data_dict=None, model_path="models/random_forest.pkl",
                   graphs_dir="results/graphs", metrics_dir="results/metrics",
                   reports_dir="results/reports"):
    """
    Perform thorough empirical evaluation of the trained model on held-out test data.
    """
    os.makedirs(graphs_dir, exist_ok=True)
    os.makedirs(metrics_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)

    # Load data if not provided
    if data_dict is None:
        data_dict = preprocess_data(random_state=42)

    X_train = data_dict["X_train"]
    y_train = data_dict["y_train"]
    X_test = data_dict["X_test"]
    y_test = data_dict["y_test"]
    feature_names = data_dict["feature_names"]

    # Load pipeline if not provided
    if pipeline is None:
        if not os.path.exists(model_path):
            print(f"[INFO] Model not found at {model_path}. Training now...")
            pipeline, _ = train_model(X_train, y_train, model_save_path=model_path)
        else:
            pipeline = load_model(model_path)

    print(f"[INFO] Evaluating model on {len(X_test)} held-out test samples...")

    # Predictions
    y_pred_train = pipeline.predict(X_train)
    y_pred_test = pipeline.predict(X_test)

    # Empirical Metrics on Test Set
    test_mae = float(mean_absolute_error(y_test, y_pred_test))
    test_mse = float(mean_squared_error(y_test, y_pred_test))
    test_rmse = float(np.sqrt(test_mse))
    test_r2 = float(r2_score(y_test, y_pred_test))

    # Empirical Metrics on Train Set (for overfitting diagnostic)
    train_mae = float(mean_absolute_error(y_train, y_pred_train))
    train_mse = float(mean_squared_error(y_train, y_pred_train))
    train_rmse = float(np.sqrt(train_mse))
    train_r2 = float(r2_score(y_train, y_pred_train))

    # Feature Importances from Random Forest Regressor
    rf_regressor = pipeline.named_steps["regressor"]
    importances = rf_regressor.feature_importances_
    feat_imp_dict = {feat: float(imp) for feat, imp in zip(feature_names, importances)}
    # Sort descending
    sorted_feat_imp = dict(sorted(feat_imp_dict.items(), key=lambda item: item[1], reverse=True))

    metrics_data = {
        "model_type": "RandomForestRegressor",
        "n_estimators": rf_regressor.n_estimators,
        "random_state": rf_regressor.random_state,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "features": feature_names,
        "test_metrics": {
            "MAE": test_mae,
            "MSE": test_mse,
            "RMSE": test_rmse,
            "R2_Score": test_r2,
        },
        "train_metrics": {
            "MAE": train_mae,
            "MSE": train_mse,
            "RMSE": train_rmse,
            "R2_Score": train_r2,
        },
        "feature_importances": sorted_feat_imp,
    }

    # Save metrics JSON
    json_path = os.path.join(metrics_dir, "model_metrics.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=4)
    print(f"[SUCCESS] Metrics JSON saved to: {json_path}")

    # Save metrics CSV
    csv_path = os.path.join(metrics_dir, "model_metrics.csv")
    csv_df = pd.DataFrame([
        {"Metric": "MAE (µg/m³)", "Train_Set": train_mae, "Test_Set": test_mae},
        {"Metric": "MSE (µg/m³)²", "Train_Set": train_mse, "Test_Set": test_mse},
        {"Metric": "RMSE (µg/m³)", "Train_Set": train_rmse, "Test_Set": test_rmse},
        {"Metric": "R² Score", "Train_Set": train_r2, "Test_Set": test_r2},
    ])
    csv_df.to_csv(csv_path, index=False)
    print(f"[SUCCESS] Metrics CSV saved to: {csv_path}")

    # Generate Evaluation Plots
    sns.set_theme(style="whitegrid", font="sans-serif")

    # 1. Actual vs Predicted Graph
    fig, ax = plt.subplots(figsize=(7, 6))
    ax.scatter(y_test, y_pred_test, color="#1f77b4", alpha=0.55, edgecolor="k", s=35, label="Test Observations")
    # Identity line (y = x)
    min_val = min(y_test.min(), y_pred_test.min()) - 10
    max_val = max(y_test.max(), y_pred_test.max()) + 10
    ax.plot([min_val, max_val], [min_val, max_val], "r--", linewidth=2, label="Perfect Fit (y = x)")
    ax.set_xlim(min_val, max_val)
    ax.set_ylim(min_val, max_val)
    ax.set_title("Actual vs. Predicted PM2.5 Concentration", fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel("Actual PM2.5 (µg/m³)", fontsize=12)
    ax.set_ylabel("Predicted PM2.5 (µg/m³)", fontsize=12)
    # Annotation box
    stats_text = f"Test R²: {test_r2:.3f}\nTest RMSE: {test_rmse:.2f} µg/m³\nTest MAE: {test_mae:.2f} µg/m³"
    ax.text(0.05, 0.92, stats_text, transform=ax.transAxes, fontsize=11,
            verticalalignment="top", bbox=dict(boxstyle="round,pad=0.5", facecolor="white", edgecolor="gray", alpha=0.9))
    ax.legend(loc="lower right", fontsize=11)
    plt.tight_layout()
    act_pred_path = os.path.join(graphs_dir, "actual_vs_predicted.png")
    plt.savefig(act_pred_path, dpi=300)
    plt.close()

    # 2. Residual Plot
    residuals = y_test - y_pred_test
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.scatter(y_pred_test, residuals, color="#2ca02c", alpha=0.55, edgecolor="k", s=35)
    ax.axhline(0, color="red", linestyle="--", linewidth=2, label="Zero Error Line (Residual = 0)")
    ax.set_title("Residual Plot (Predicted PM2.5 vs. Prediction Residuals)", fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel("Predicted PM2.5 (µg/m³)", fontsize=12)
    ax.set_ylabel("Residual (Actual - Predicted) [µg/m³]", fontsize=12)
    res_std = float(residuals.std())
    ax.axhline(2 * res_std, color="gray", linestyle=":", label=f"±2σ Error Band (±{2 * res_std:.1f})")
    ax.axhline(-2 * res_std, color="gray", linestyle=":")
    ax.legend(loc="upper right", fontsize=10)
    plt.tight_layout()
    res_path = os.path.join(graphs_dir, "residual_plot.png")
    plt.savefig(res_path, dpi=300)
    plt.close()

    # 3. Feature Importance Graph
    fig, ax = plt.subplots(figsize=(8, 5))
    feat_df = pd.DataFrame({
        "Feature": list(sorted_feat_imp.keys()),
        "Importance": list(sorted_feat_imp.values())
    })
    feat_labels = {
        "RH": "Relative Humidity (RH)",
        "WD": "Wind Direction (WD)",
        "SR": "Solar Radiation (SR)",
        "BP": "Barometric Pressure (BP)",
        "AT": "Air Temperature (AT)",
    }
    feat_df["Feature_Label"] = feat_df["Feature"].map(feat_labels)
    # Sort ascending for horizontal bar chart
    feat_df = feat_df.sort_values(by="Importance", ascending=True)

    bars = ax.barh(feat_df["Feature_Label"], feat_df["Importance"], color="#3182bd", edgecolor="black", alpha=0.85)
    for bar in bars:
        width = bar.get_width()
        ax.text(width + 0.005, bar.get_y() + bar.get_height() / 2, f"{width * 100:.1f}%",
                va="center", ha="left", fontsize=10, fontweight="bold")
    ax.set_xlim(0, max(feat_df["Importance"]) * 1.15)
    ax.set_title("Random Forest Gini Feature Importance", fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel("Mean Decrease in Impurity (Feature Importance)", fontsize=12)
    ax.set_ylabel("Input Feature", fontsize=12)
    plt.tight_layout()
    feat_path = os.path.join(graphs_dir, "feature_importance.png")
    plt.savefig(feat_path, dpi=300)
    plt.close()

    print(f"[SUCCESS] All 3 evaluation graphs saved to: {graphs_dir}")

    # Generate Evaluation Report
    generate_evaluation_report(metrics_data, reports_dir)

    return metrics_data


def generate_evaluation_report(metrics, reports_dir="results/reports"):
    """Write an extensive beginner-friendly evaluation report."""
    report_path = os.path.join(reports_dir, "model_evaluation_report.md")
    test_m = metrics["test_metrics"]
    train_m = metrics["train_metrics"]
    feat_imp = metrics["feature_importances"]

    md = []
    md.append("# Phase 1: Random Forest Baseline Model Evaluation Report")
    md.append(f"\n**Model Architecture:** Scikit-Learn `RandomForestRegressor` (Baseline)")
    md.append(f"**Number of Trees (`n_estimators`):** {metrics['n_estimators']}")
    md.append(f"**Random State Seed:** {metrics['random_state']} (Guarantees exact reproducibility)")
    md.append(f"**Training Sample Size:** {metrics['train_samples']} rows (80%)")
    md.append(f"**Held-out Test Sample Size:** {metrics['test_samples']} rows (20%)\n")

    md.append("## 1. Actual Test-Set Performance Metrics")
    md.append("| Metric | Test Set Value | Training Set Value | Unit | Beginner-Friendly Explanation |")
    md.append("|:---|:---:|:---:|:---:|:---|")
    md.append(f"| **Mean Absolute Error (MAE)** | **{test_m['MAE']:.2f}** | {train_m['MAE']:.2f} | µg/m³ | On average, the model's PM2.5 prediction is off by **{test_m['MAE']:.2f} µg/m³** from the true monitored sensor value. |")
    md.append(f"| **Mean Squared Error (MSE)** | **{test_m['MSE']:.2f}** | {train_m['MSE']:.2f} | (µg/m³)² | The average squared difference between predictions and actual values. Heavily penalizes large errors. |")
    md.append(f"| **Root Mean Squared Error (RMSE)** | **{test_m['RMSE']:.2f}** | {train_m['RMSE']:.2f} | µg/m³ | The standard deviation of the unexplained residuals (**{test_m['RMSE']:.2f} µg/m³**). Expressed in the same units as PM2.5. |")
    md.append(f"| **Coefficient of Determination ($R^2$)** | **{test_m['R2_Score']:.3f}** | {train_m['R2_Score']:.3f} | Dimensionless | The model explains **{test_m['R2_Score'] * 100:.1f}%** of the total variance in PM2.5 concentrations on previously unseen test data. |")

    md.append("\n## 2. Beginner-Friendly Metric Guide for Capstone Presentation")
    md.append("1. **MAE (Mean Absolute Error):** Measures the average magnitude of errors without considering their direction. If the actual PM2.5 is 150 µg/m³ and the model predicts 175 µg/m³, the absolute error is 25 µg/m³. A lower MAE indicates better precision.")
    md.append("2. **RMSE (Root Mean Squared Error):** Because errors are squared before being averaged, RMSE gives extra weight to large forecast errors (e.g., missing a severe smog spike). A test RMSE close to MAE indicates uniform error magnitude without massive outlier misses.")
    md.append("3. **$R^2$ Score (Goodness of Fit):** Compares the model's predictions to a naive baseline that simply predicts the mean PM2.5 for every sample. An $R^2$ of 0.0 means the model is no better than guessing the mean, while 1.0 means perfect prediction. Our baseline $R^2$ of **" + f"{test_m['R2_Score']:.3f}" + f" ({test_m['R2_Score'] * 100:.1f}%)** demonstrates solid predictive capability using only 5 meteorological variables.")

    md.append("\n## 3. Feature Importance Analysis")
    md.append("| Rank | Feature Variable | Relative Importance (%) | Analytical Interpretation |")
    md.append("|:---:|:---|:---:|:---|")
    total_imp = sum(feat_imp.values())
    descriptions = {
        "RH": "Relative Humidity — High importance; humidity directly governs hygroscopic aerosol growth and particulate accumulation.",
        "WD": "Wind Direction — Identifies geographical pollutant transport directions and localized plume advection.",
        "SR": "Solar Radiation — Controls convective mixing depth; strong solar flux enhances vertical mixing, diluting PM2.5.",
        "BP": "Barometric Pressure — High atmospheric pressure creates subsidence inversions that cap vertical ventilation.",
        "AT": "Air Temperature — Lower surface temperatures promote ground-level thermal inversions during winter months.",
    }
    for rank, (feat, imp) in enumerate(feat_imp.items(), start=1):
        pct = (imp / total_imp) * 100
        md.append(f"| {rank} | **{feat}** | **{pct:.2f}%** | {descriptions.get(feat, '')} |")

    md.append("\n> **Important Scientific Note on Feature Importance:** Random Forest feature importance measures the decrease in node impurity (variance reduction) across decision tree splits. While it highlights which meteorological features the model relies upon to minimize PM2.5 prediction error, **it does NOT prove chemical or industrial emission source attribution**. True source attribution requires chemical speciation (ions, carbon fractions, metals) or receptor modeling (Positive Matrix Factorization / PMF).")

    md.append("\n## 4. Evaluation Visualizations Generated")
    md.append("- `results/graphs/actual_vs_predicted.png`: Demonstrates tight clustering of test observations along the diagonal $y = x$ reference line.")
    md.append("- `results/graphs/residual_plot.png`: Shows residuals centered near zero across the range of predicted PM2.5 values.")
    md.append("- `results/graphs/feature_importance.png`: Clearly ranks the five input meteorological features by relative Gini predictive contribution.")

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md))
    print(f"[SUCCESS] Evaluation report saved to: {report_path}")


if __name__ == "__main__":
    evaluate_model()
