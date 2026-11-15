"""
main.py
-------
Main Execution Workflow for Explainable AI-Based Air Pollution Prediction.

Supports end-to-end execution of:
- Phase 1: Data Inspection, Preprocessing, EDA, and Baseline Random Forest
- Phase 2: XGBoost Regressor Training, Hyperparameter Tuning, and Cross-Model Comparison

Usage:
    python main.py                  # Executes full workflow (uses cached models if available)
    python main.py --retrain        # Forces retraining and hyperparameter re-tuning
"""

import os
import sys
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Ensure matplotlib uses local writable directory
os.environ.setdefault("MPLCONFIGDIR", os.path.abspath(os.path.join(os.path.dirname(__file__), ".matplotlib_cache")))

from src.data_inspection import inspect_dataset
from src.preprocessing import preprocess_data
from src.eda import run_eda
from src.train_random_forest import train_model, load_model, predict_sample
from src.evaluate_model import evaluate_model
from src.train_xgboost import tune_and_train_xgboost, load_xgboost_model, predict_xgboost_sample
from src.compare_models import compare_models


def run_pipeline(force_retrain=False):
    start_time = time.time()
    banner = "=" * 80
    print(banner)
    print(" EXPLAINABLE AI-BASED AIR POLLUTION PREDICTION & SOURCE ATTRIBUTION ")
    print(" PHASES 1 & 2: DATA PREPROCESSING, RANDOM FOREST BASELINE & XGBOOST MODEL ")
    print(banner)

    # -------------------------------------------------------------
    # Step 1: Dataset Inspection
    # -------------------------------------------------------------
    print("\n>>> STEP 1: Running Dataset Inspection & Quality Assessment...")
    inspection_results = inspect_dataset(save_report=True)
    print(f"    - Raw Observations: {inspection_results['total_rows']}")
    print(f"    - Core Verified Features: {inspection_results['present_core']}")
    print(f"    - Missing Values in Core Features: {inspection_results['missing_core']}")
    print(f"    - Duplicate Rows: {inspection_results['exact_duplicates_core']}")
    print(f"    - Inspection Report: results/reports/data_inspection_report.md")

    # -------------------------------------------------------------
    # Step 2: Data Preprocessing & Leakage-Free Train-Test Splitting
    # -------------------------------------------------------------
    print("\n>>> STEP 2: Running Data Preprocessing & Train-Test Splitting (80/20)...")
    data_dict = preprocess_data(remove_duplicates=True, test_size=0.2, random_state=42, save_processed=True)
    print(f"    - Cleaned Dataset (Deduplicated): {data_dict['metadata']['cleaned_shape'][0]} rows")
    print(f"    - Training Split (80%): {data_dict['metadata']['train_rows']} samples")
    print(f"    - Testing Split (20%): {data_dict['metadata']['test_rows']} samples (held-out)")
    print(f"    - Cleaned Dataset Saved: dataset/preprocessed_delhi_air_quality.csv")
    print(f"    - Preprocessing Report: results/reports/preprocessing_report.md")

    # -------------------------------------------------------------
    # Step 3: Exploratory Data Analysis (EDA)
    # -------------------------------------------------------------
    print("\n>>> STEP 3: Generating Exploratory Data Analysis (EDA) Visualizations...")
    saved_eda_plots = run_eda(df=data_dict["df_cleaned"])
    print(f"    - Generated {len(saved_eda_plots)} Publication-Quality Graphs in: results/graphs/")
    print(f"    - EDA Report: results/reports/eda_report.md")

    # -------------------------------------------------------------
    # Step 4: Random Forest Baseline Model
    # -------------------------------------------------------------
    rf_model_path = "models/random_forest.pkl"
    print("\n>>> STEP 4: Random Forest Baseline Model Pipeline...")
    if os.path.exists(rf_model_path) and not force_retrain:
        print(f"    [INFO] Existing Random Forest model found at {rf_model_path}. Loading without retraining.")
        rf_pipeline = load_model(rf_model_path)
    else:
        print(f"    [INFO] Training Random Forest Regressor on {len(data_dict['X_train'])} training samples...")
        rf_pipeline, _ = train_model(
            X_train=data_dict["X_train"],
            y_train=data_dict["y_train"],
            model_save_path=rf_model_path,
            random_state=42,
            n_estimators=100
        )

    # Evaluate Random Forest on held-out test data
    rf_metrics = evaluate_model(pipeline=rf_pipeline, data_dict=data_dict, model_path=rf_model_path)
    rf_test_m = rf_metrics["test_metrics"]
    print(f"    - Random Forest Test MAE:  {rf_test_m['MAE']:.2f} µg/m³")
    print(f"    - Random Forest Test RMSE: {rf_test_m['RMSE']:.2f} µg/m³")
    print(f"    - Random Forest Test R²:   {rf_test_m['R2_Score']:.4f} ({rf_test_m['R2_Score'] * 100:.2f}%)")

    # -------------------------------------------------------------
    # Step 5: Phase 2 XGBoost Regressor & Hyperparameter Tuning
    # -------------------------------------------------------------
    xgb_model_path = "models/xgboost_model.pkl"
    print("\n>>> STEP 5: Phase 2 XGBoost Model & Hyperparameter Tuning...")
    if os.path.exists(xgb_model_path) and not force_retrain:
        print(f"    [INFO] Existing XGBoost model found at {xgb_model_path}. Loading without retraining.")
        xgb_pipeline = load_xgboost_model(xgb_model_path)
    else:
        print(f"    [INFO] Tuning and training XGBoost model via 5-fold CV on training set...")
        xgb_pipeline, _ = tune_and_train_xgboost(
            X_train=data_dict["X_train"],
            y_train=data_dict["y_train"],
            X_test=data_dict["X_test"],
            y_test=data_dict["y_test"],
            model_save_path=xgb_model_path,
            n_iter=30,
            random_state=42
        )

    # -------------------------------------------------------------
    # Step 6: Head-to-Head Model Comparison (Random Forest vs. XGBoost)
    # -------------------------------------------------------------
    print("\n>>> STEP 6: Conducting Cross-Model Comparison on Identical Test Split...")
    comp_df = compare_models(
        rf_model_path=rf_model_path,
        xgb_model_path=xgb_model_path
    )

    # -------------------------------------------------------------
    # Step 7: Live Inference Verification on Unseen Test Sample
    # -------------------------------------------------------------
    print("\n>>> STEP 7: Testing Live Inference on a Held-out Test Sample...")
    sample_idx = data_dict["X_test"].index[0]
    sample_features = data_dict["X_test"].loc[sample_idx].to_dict()
    ground_truth = float(data_dict["y_test"].loc[sample_idx])

    rf_pred = predict_sample(sample_features, model_path=rf_model_path)
    xgb_pred = predict_xgboost_sample(sample_features, model_path=xgb_model_path)

    print(f"    - Input Features: {sample_features}")
    print(f"    - Ground Truth PM2.5:     {ground_truth:.2f} µg/m³")
    print(f"    - Random Forest Forecast: {rf_pred:.2f} µg/m³ (Error: {abs(ground_truth - rf_pred):.2f} µg/m³)")
    print(f"    - XGBoost Forecast:       {xgb_pred:.2f} µg/m³ (Error: {abs(ground_truth - xgb_pred):.2f} µg/m³)")
    print("    [PASS] Both model pipelines verified for live prediction.")

    # -------------------------------------------------------------
    # Final Completion Summary
    # -------------------------------------------------------------
    elapsed = time.time() - start_time
    print("\n" + banner)
    print(" [PHASES 1 & 2 COMPLETE] ALL TASKS EXECUTED AND VERIFIED SUCCESSFULLY")
    print(banner)
    print(f" Execution Duration: {elapsed:.2f} seconds\n")
    print(" Summary of Generated Artifacts:")
    print("  * Serialized Models:")
    print("      - models/random_forest.pkl")
    print("      - models/xgboost_model.pkl")
    print("  * Metric Logs:")
    print("      - results/metrics/model_metrics.json (Random Forest)")
    print("      - results/metrics/xgboost_best_parameters.json (Tuned Hyperparameters)")
    print("      - results/metrics/xgboost_metrics.json (XGBoost)")
    print("      - results/metrics/model_comparison.csv (Head-to-Head Table)")
    print("  * Evaluation & Comparison Graphs:")
    print("      - results/graphs/ (17 PNG figures total)")
    print("  * Detailed Analytical Reports:")
    print("      - results/reports/data_inspection_report.md")
    print("      - results/reports/preprocessing_report.md")
    print("      - results/reports/eda_report.md")
    print("      - results/reports/model_evaluation_report.md (Random Forest)")
    print("      - results/reports/xgboost_report.md (XGBoost)")
    print("      - results/reports/model_comparison_report.md (Comparative Analysis)")
    print(banner)


if __name__ == "__main__":
    retrain_flag = "--retrain" in sys.argv
    run_pipeline(force_retrain=retrain_flag)
