"""
src/train_xgboost.py
--------------------
Phase 2: XGBoost Regressor Training, Hyperparameter Tuning, and Evaluation.

Responsibilities:
1. Load identical preprocessed training and test partitions (80/20 split) from Phase 1.
2. Build an XGBRegressor pipeline with median imputation for missing values.
3. Perform 5-fold cross-validated hyperparameter tuning using RandomizedSearchCV on X_train only.
4. Save best hyperparameters to results/metrics/xgboost_best_parameters.json.
5. Fit optimal model on training set and serialize to models/xgboost_model.pkl.
6. Evaluate performance on held-out test set (MAE, MSE, RMSE, R²) and save to results/metrics/xgboost_metrics.json.
7. Generate XGBoost evaluation visualizations:
   - actual vs. predicted plot
   - residual plot
   - feature importance plot
8. Generate detailed documentation in results/reports/xgboost_report.md.
"""

import os
import sys
import json
import joblib

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Ensure matplotlib uses a local writable directory
os.environ.setdefault("MPLCONFIGDIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".matplotlib_cache")))

import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import RandomizedSearchCV, KFold
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from src.preprocessing import preprocess_data, get_feature_target_names


def tune_and_train_xgboost(X_train=None, y_train=None, X_test=None, y_test=None,
                           model_save_path="models/xgboost_model.pkl",
                           params_save_path="results/metrics/xgboost_best_parameters.json",
                           metrics_save_path="results/metrics/xgboost_metrics.json",
                           graphs_dir="results/graphs",
                           reports_dir="results/reports",
                           n_iter=30, random_state=42):
    """
    Perform hyperparameter tuning, training, evaluation, and artifact generation for XGBoost.
    """
    os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
    os.makedirs(os.path.dirname(params_save_path), exist_ok=True)
    os.makedirs(os.path.dirname(metrics_save_path), exist_ok=True)
    os.makedirs(graphs_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)

    # Load data if not provided
    data_dict = None
    if X_train is None or y_train is None or X_test is None or y_test is None:
        print("[INFO] Loading identical Phase 1 train-test partitions (random_state=42)...")
        data_dict = preprocess_data(random_state=random_state, save_processed=False)
        X_train = data_dict["X_train"]
        y_train = data_dict["y_train"]
        X_test = data_dict["X_test"]
        y_test = data_dict["y_test"]

    features, target = get_feature_target_names()
    print(f"[INFO] Training data: {len(X_train)} samples, Test data: {len(X_test)} samples")
    print(f"[INFO] Verified input features: {features}")

    # Base pipeline
    base_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("regressor", XGBRegressor(
            random_state=random_state,
            n_jobs=-1,
            objective="reg:squarederror",
            tree_method="hist"
        ))
    ])

    # Hyperparameter distributions
    param_distributions = {
        "regressor__n_estimators": [50, 100, 150, 200, 250, 300],
        "regressor__max_depth": [3, 4, 5, 6, 7, 8],
        "regressor__learning_rate": [0.01, 0.02, 0.03, 0.05, 0.08, 0.1, 0.15],
        "regressor__subsample": [0.6, 0.7, 0.8, 0.85, 0.9, 1.0],
        "regressor__colsample_bytree": [0.6, 0.7, 0.8, 0.85, 0.9, 1.0],
        "regressor__min_child_weight": [1, 2, 3, 5, 7, 10],
        "regressor__gamma": [0, 0.1, 0.2, 0.5, 1.0],
        "regressor__reg_alpha": [0, 0.01, 0.1, 1.0],
        "regressor__reg_lambda": [0.5, 1.0, 2.0, 5.0]
    }

    # 5-fold cross-validation strictly on training data
    cv = KFold(n_splits=5, shuffle=True, random_state=random_state)

    print(f"[INFO] Running RandomizedSearchCV with {n_iter} iterations across 5 folds strictly on X_train...", flush=True)
    search = RandomizedSearchCV(
        estimator=base_pipeline,
        param_distributions=param_distributions,
        n_iter=n_iter,
        scoring="neg_root_mean_squared_error",
        cv=cv,
        random_state=random_state,
        n_jobs=1,
        verbose=0
    )

    search.fit(X_train, y_train)

    best_pipeline = search.best_estimator_
    best_raw_params = search.best_params_
    best_cv_rmse = float(-search.best_score_)

    # Clean parameter keys for serialization
    best_params_clean = {k.replace("regressor__", ""): v for k, v in best_raw_params.items()}
    best_params_clean["cv_best_rmse"] = best_cv_rmse
    best_params_clean["cv_folds"] = 5
    best_params_clean["n_iter"] = n_iter

    print(f"[SUCCESS] Best 5-fold CV RMSE on training set: {best_cv_rmse:.2f} µg/m³")
    print(f"[INFO] Best Hyperparameters found: {best_params_clean}")

    # Save best parameters JSON
    with open(params_save_path, "w", encoding="utf-8") as f:
        json.dump(best_params_clean, f, indent=4)
    print(f"[SUCCESS] Saved best hyperparameters to: {params_save_path}")

    # Save trained model pipeline
    joblib.dump(best_pipeline, model_save_path)
    print(f"[SUCCESS] Saved trained XGBoost model pipeline to: {model_save_path}")

    # Predictions
    y_pred_train = best_pipeline.predict(X_train)
    y_pred_test = best_pipeline.predict(X_test)

    # Test Metrics
    test_mae = float(mean_absolute_error(y_test, y_pred_test))
    test_mse = float(mean_squared_error(y_test, y_pred_test))
    test_rmse = float(np.sqrt(test_mse))
    test_r2 = float(r2_score(y_test, y_pred_test))

    # Train Metrics (overfitting diagnostic)
    train_mae = float(mean_absolute_error(y_train, y_pred_train))
    train_mse = float(mean_squared_error(y_train, y_pred_train))
    train_rmse = float(np.sqrt(train_mse))
    train_r2 = float(r2_score(y_train, y_pred_train))

    # Extract Feature Importances from the best XGBoost model
    xgb_model = best_pipeline.named_steps["regressor"]
    importances = xgb_model.feature_importances_
    feat_imp_dict = {feat: float(imp) for feat, imp in zip(features, importances)}
    sorted_feat_imp = dict(sorted(feat_imp_dict.items(), key=lambda item: item[1], reverse=True))

    metrics_data = {
        "model_type": "XGBRegressor",
        "best_hyperparameters": best_params_clean,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "features": features,
        "test_metrics": {
            "MAE": test_mae,
            "MSE": test_mse,
            "RMSE": test_rmse,
            "R2_Score": test_r2
        },
        "train_metrics": {
            "MAE": train_mae,
            "MSE": train_mse,
            "RMSE": train_rmse,
            "R2_Score": train_r2
        },
        "feature_importances": sorted_feat_imp
    }

    # Save metrics JSON
    with open(metrics_save_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=4)
    print(f"[SUCCESS] Saved XGBoost metrics to: {metrics_save_path}")

    # Generate Evaluation Visualizations
    generate_xgboost_visualizations(y_test, y_pred_test, sorted_feat_imp, test_r2, test_rmse, test_mae, graphs_dir)

    # Generate Detailed Markdown Report
    generate_xgboost_report(metrics_data, reports_dir)

    return best_pipeline, metrics_data


def generate_xgboost_visualizations(y_test, y_pred_test, sorted_feat_imp, test_r2, test_rmse, test_mae, graphs_dir):
    """Generate and save the 3 XGBoost evaluation graphs."""
    sns.set_theme(style="whitegrid", font="sans-serif")

    # 1. Actual vs Predicted Plot
    fig, ax = plt.subplots(figsize=(7, 6))
    ax.scatter(y_test, y_pred_test, color="#e6550d", alpha=0.55, edgecolor="k", s=35, label="Test Observations")
    min_val = min(y_test.min(), y_pred_test.min()) - 10
    max_val = max(y_test.max(), y_pred_test.max()) + 10
    ax.plot([min_val, max_val], [min_val, max_val], "k--", linewidth=2, label="Perfect Fit (y = x)")
    ax.set_xlim(min_val, max_val)
    ax.set_ylim(min_val, max_val)
    ax.set_title("XGBoost: Actual vs. Predicted PM2.5 Concentration", fontsize=13, fontweight="bold", pad=12)
    ax.set_xlabel("Actual PM2.5 (µg/m³)", fontsize=11)
    ax.set_ylabel("Predicted PM2.5 (µg/m³)", fontsize=11)
    stats_text = f"Test R²: {test_r2:.3f}\nTest RMSE: {test_rmse:.2f} µg/m³\nTest MAE: {test_mae:.2f} µg/m³"
    ax.text(0.05, 0.92, stats_text, transform=ax.transAxes, fontsize=11,
            verticalalignment="top", bbox=dict(boxstyle="round,pad=0.5", facecolor="white", edgecolor="gray", alpha=0.9))
    ax.legend(loc="lower right", fontsize=11)
    plt.tight_layout()
    act_pred_path = os.path.join(graphs_dir, "xgboost_actual_vs_predicted.png")
    plt.savefig(act_pred_path, dpi=300)
    plt.close()

    # 2. Residual Plot
    residuals = y_test - y_pred_test
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.scatter(y_pred_test, residuals, color="#31a354", alpha=0.55, edgecolor="k", s=35)
    ax.axhline(0, color="red", linestyle="--", linewidth=2, label="Zero Error Line (Residual = 0)")
    ax.set_title("XGBoost: Residual Plot (Predicted PM2.5 vs. Prediction Residuals)", fontsize=13, fontweight="bold", pad=12)
    ax.set_xlabel("Predicted PM2.5 (µg/m³)", fontsize=11)
    ax.set_ylabel("Residual (Actual - Predicted) [µg/m³]", fontsize=11)
    res_std = float(residuals.std())
    ax.axhline(2 * res_std, color="gray", linestyle=":", label=f"±2σ Error Band (±{2 * res_std:.1f})")
    ax.axhline(-2 * res_std, color="gray", linestyle=":")
    ax.legend(loc="upper right", fontsize=10)
    plt.tight_layout()
    res_path = os.path.join(graphs_dir, "xgboost_residual_plot.png")
    plt.savefig(res_path, dpi=300)
    plt.close()

    # 3. XGBoost Feature Importance Plot
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
    feat_df = feat_df.sort_values(by="Importance", ascending=True)

    bars = ax.barh(feat_df["Feature_Label"], feat_df["Importance"], color="#e6550d", edgecolor="black", alpha=0.85)
    for bar in bars:
        width = bar.get_width()
        ax.text(width + 0.005, bar.get_y() + bar.get_height() / 2, f"{width * 100:.1f}%",
                va="center", ha="left", fontsize=10, fontweight="bold")
    ax.set_xlim(0, max(feat_df["Importance"]) * 1.15)
    ax.set_title("XGBoost Feature Importance (Gain / Split Contribution)", fontsize=13, fontweight="bold", pad=12)
    ax.set_xlabel("Relative Importance Weight", fontsize=11)
    ax.set_ylabel("Input Feature", fontsize=11)
    plt.tight_layout()
    feat_path = os.path.join(graphs_dir, "xgboost_feature_importance.png")
    plt.savefig(feat_path, dpi=300)
    plt.close()

    print(f"[SUCCESS] All 3 XGBoost evaluation graphs saved to: {graphs_dir}")


def generate_xgboost_report(metrics, reports_dir="results/reports"):
    """Write comprehensive XGBoost markdown report."""
    report_path = os.path.join(reports_dir, "xgboost_report.md")
    test_m = metrics["test_metrics"]
    train_m = metrics["train_metrics"]
    params = metrics["best_hyperparameters"]
    feat_imp = metrics["feature_importances"]

    md = []
    md.append("# Phase 2: XGBoost Model Development and Evaluation Report")
    md.append("\n**Model Type:** Extreme Gradient Boosting (`XGBRegressor`)")
    md.append(f"**Training Sample Size:** {metrics['train_samples']} observations (80%)")
    md.append(f"**Held-out Test Sample Size:** {metrics['test_samples']} observations (20%)\n")

    md.append("## 1. Hyperparameter Tuning Process")
    md.append("Hyperparameter optimization was conducted strictly on the training partition (`X_train`) using **`RandomizedSearchCV`** with **5-Fold Cross-Validation** to prevent test data leakage.")
    md.append(f"- **Cross-Validation Metric:** Negative Root Mean Squared Error (RMSE)")
    md.append(f"- **Best 5-Fold CV Training RMSE:** **{params.get('cv_best_rmse', 0.0):.2f} µg/m³**\n")

    md.append("### Optimal Hyperparameters Found:")
    md.append("| Hyperparameter | Selected Value | Role / Functional Significance |")
    md.append("|:---|:---:|:---|")
    param_descs = {
        "n_estimators": "Number of sequential gradient boosted decision trees.",
        "max_depth": "Maximum depth per tree; regulates tree complexity and prevents overfitting.",
        "learning_rate": "Step size shrinkage applied to each tree update ($η$).",
        "subsample": "Fraction of training rows randomly sampled prior to growing trees.",
        "colsample_bytree": "Subsample ratio of features when constructing each tree.",
        "min_child_weight": "Minimum sum of instance weight (hessian) needed in a child node.",
        "gamma": "Minimum loss reduction required to make a further partition on a leaf.",
        "reg_alpha": "L1 regularization term on leaf weights (encourages sparsity).",
        "reg_lambda": "L2 regularization term on leaf weights (smooths extreme weights)."
    }
    for k, v in params.items():
        if k in param_descs:
            md.append(f"| **`{k}`** | `{v}` | {param_descs.get(k, '')} |")

    md.append("\n## 2. Test Set Evaluation Performance")
    md.append("The tuned XGBoost model was evaluated on the **exact same 406 held-out test observations** established in Phase 1:")
    md.append("| Metric | Test Set Value | Training Set Value | Target Unit | Capstone Interpretation |")
    md.append("|:---|:---:|:---:|:---:|:---|")
    md.append(f"| **Mean Absolute Error (MAE)** | **{test_m['MAE']:.2f}** | {train_m['MAE']:.2f} | µg/m³ | The average magnitude of prediction error across test samples. |")
    md.append(f"| **Mean Squared Error (MSE)** | **{test_m['MSE']:.2f}** | {train_m['MSE']:.2f} | (µg/m³)² | Mean squared error, penalizing severe forecast deviations. |")
    md.append(f"| **Root Mean Squared Error (RMSE)** | **{test_m['RMSE']:.2f}** | {train_m['RMSE']:.2f} | µg/m³ | Standard deviation of unexplained residuals (**{test_m['RMSE']:.2f} µg/m³**). |")
    md.append(f"| **Coefficient of Det. ($R^2$)** | **{test_m['R2_Score']:.4f}** | {train_m['R2_Score']:.4f} | Dimensionless | The model accounts for **{test_m['R2_Score'] * 100:.2f}%** of test PM2.5 variance. |")

    md.append("\n## 3. XGBoost Feature Importance Breakdown")
    md.append("XGBoost calculates feature importance based on **Gain** — the average improvement in loss brought by a feature across all tree splits.")
    md.append("| Rank | Feature Variable | Relative Importance (%) | Analytical Interpretation |")
    md.append("|:---:|:---|:---:|:---|")
    total_imp = sum(feat_imp.values())
    for rank, (feat, imp) in enumerate(feat_imp.items(), start=1):
        pct = (imp / total_imp) * 100
        md.append(f"| {rank} | **{feat}** | **{pct:.2f}%** | Relative split gain contribution to PM2.5 prediction. |")

    md.append("\n> **Crucial Scientific Caution:** Feature importance indicates statistical model reliance to minimize PM2.5 error. **It does NOT prove emission causation or identify physical pollution sources**. True pollution source attribution requires chemical speciation or receptor modeling.")

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md))
    print(f"[SUCCESS] Saved XGBoost report to: {report_path}")


def load_xgboost_model(model_path="models/xgboost_model.pkl"):
    """Load serialized XGBoost pipeline."""
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"XGBoost model file not found at: {model_path}")
    return joblib.load(model_path)


def predict_xgboost_sample(sample_dict, model_path="models/xgboost_model.pkl"):
    """Run prediction on a single feature dictionary using the trained XGBoost model."""
    pipeline = load_xgboost_model(model_path)
    sample_df = pd.DataFrame([sample_dict]) if isinstance(sample_dict, dict) else sample_dict
    pred = pipeline.predict(sample_df)
    return float(pred[0])


if __name__ == "__main__":
    tune_and_train_xgboost()
