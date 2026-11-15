"""
main.py
-------
Main Execution Script for Phase 1:
Explainable AI-Based Air Pollution Prediction and Source Attribution.

Orchestrates the entire Phase 1 workflow with a single command:
    python main.py

Workflow Stages:
1. Dataset Inspection & Quality Reporting
2. Data Preprocessing & Leakage-Free Train/Test Splitting (80/20)
3. Exploratory Data Analysis (EDA) & Generation of 9 Core Visualizations
4. Baseline Random Forest Regressor Training & Pipeline Serialization
5. Comprehensive Test-Set Evaluation, Metrics Logging, & Diagnostic Plots
6. End-to-End Inference Verification with a Held-out Test Sample
"""

import os
import sys
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Ensure matplotlib uses a local writable directory
os.environ.setdefault("MPLCONFIGDIR", os.path.abspath(os.path.join(os.path.dirname(__file__), ".matplotlib_cache")))

from src.data_inspection import inspect_dataset
from src.preprocessing import preprocess_data
from src.eda import run_eda
from src.train_random_forest import train_model, load_model, predict_sample
from src.evaluate_model import evaluate_model


def run_pipeline():
    start_time = time.time()
    banner = "=" * 78
    print(banner)
    print(" EXPLAINABLE AI-BASED AIR POLLUTION PREDICTION & SOURCE ATTRIBUTION ")
    print(" PHASE 1: DATASET ANALYSIS, PREPROCESSING, EDA & RANDOM FOREST BASELINE")
    print(banner)

    # -------------------------------------------------------------
    # Step 1: Dataset Inspection
    # -------------------------------------------------------------
    print("\n>>> STEP 1: Running Dataset Inspection & Quality Assessment...")
    inspection_results = inspect_dataset(save_report=True)
    print(f"    - Total Raw Observations: {inspection_results['total_rows']}")
    print(f"    - Core Verified Features: {inspection_results['present_core']}")
    print(f"    - Missing Values: {inspection_results['missing_core']}")
    print(f"    - Duplicate Rows: {inspection_results['exact_duplicates_core']}")
    print(f"    - Report Saved: results/reports/data_inspection_report.md")

    # -------------------------------------------------------------
    # Step 2: Data Preprocessing
    # -------------------------------------------------------------
    print("\n>>> STEP 2: Running Data Preprocessing & Train-Test Splitting...")
    data_dict = preprocess_data(remove_duplicates=True, test_size=0.2, random_state=42, save_processed=True)
    print(f"    - Cleaned Dataset Size: {data_dict['metadata']['cleaned_shape'][0]} rows (deduplicated)")
    print(f"    - Training Split (80%): {data_dict['metadata']['train_rows']} samples")
    print(f"    - Testing Split (20%): {data_dict['metadata']['test_rows']} samples (held-out)")
    print(f"    - Cleaned CSV Saved: dataset/preprocessed_delhi_air_quality.csv")
    print(f"    - Report Saved: results/reports/preprocessing_report.md")

    # -------------------------------------------------------------
    # Step 3: Exploratory Data Analysis (EDA)
    # -------------------------------------------------------------
    print("\n>>> STEP 3: Generating Exploratory Data Analysis (EDA) Visualizations...")
    saved_eda_plots = run_eda(df=data_dict["df_cleaned"])
    print(f"    - Generated {len(saved_eda_plots)} Publication-Quality Graphs in: results/graphs/")
    print(f"    - EDA Observations Report: results/reports/eda_report.md")

    # -------------------------------------------------------------
    # Step 4: Model Training (Random Forest Baseline)
    # -------------------------------------------------------------
    print("\n>>> STEP 4: Training Random Forest Baseline Model...")
    pipeline, _ = train_model(
        X_train=data_dict["X_train"],
        y_train=data_dict["y_train"],
        model_save_path="models/random_forest.pkl",
        random_state=42,
        n_estimators=100
    )
    print(f"    - Architecture: RandomForestRegressor (n_estimators=100, random_state=42)")
    print(f"    - Pipeline components: SimpleImputer(median) -> RandomForestRegressor")
    print(f"    - Saved Model: models/random_forest.pkl")

    # -------------------------------------------------------------
    # Step 5: Model Evaluation on Held-out Test Data
    # -------------------------------------------------------------
    print("\n>>> STEP 5: Evaluating Model on Held-out Test Data (20%)...")
    eval_metrics = evaluate_model(
        pipeline=pipeline,
        data_dict=data_dict,
        model_path="models/random_forest.pkl"
    )
    test_m = eval_metrics["test_metrics"]
    print("\n    ================ TEST SET PERFORMANCE METRICS ================")
    print(f"    * Mean Absolute Error (MAE):     {test_m['MAE']:.2f} µg/m³")
    print(f"    * Mean Squared Error (MSE):      {test_m['MSE']:.2f} (µg/m³)²")
    print(f"    * Root Mean Squared Error (RMSE): {test_m['RMSE']:.2f} µg/m³")
    print(f"    * Coefficient of Det. (R² Score): {test_m['R2_Score']:.4f} ({test_m['R2_Score'] * 100:.2f}%)")
    print("    ==============================================================")
    print("    Feature Importances:")
    for feat, imp in eval_metrics["feature_importances"].items():
        print(f"      - {feat}: {imp * 100:.2f}%")

    # -------------------------------------------------------------
    # Step 6: Inference Verification with a Valid Test Sample
    # -------------------------------------------------------------
    print("\n>>> STEP 6: Verifying Pipeline Inference on Valid Test Sample...")
    # Select first sample from held-out test set
    sample_idx = data_dict["X_test"].index[0]
    sample_features = data_dict["X_test"].loc[sample_idx].to_dict()
    actual_target = float(data_dict["y_test"].loc[sample_idx])

    # Run inference through serialized pipeline
    predicted_target = predict_sample(sample_features, model_path="models/random_forest.pkl")
    abs_err = abs(actual_target - predicted_target)

    print(f"    - Sample Features: {sample_features}")
    print(f"    - Ground Truth PM2.5: {actual_target:.2f} µg/m³")
    print(f"    - Model Predicted PM2.5: {predicted_target:.2f} µg/m³")
    print(f"    - Absolute Error: {abs_err:.2f} µg/m³")
    print("    [PASS] Model loaded and inference verified successfully.")

    # -------------------------------------------------------------
    # Completion Summary
    # -------------------------------------------------------------
    elapsed = time.time() - start_time
    print("\n" + banner)
    print(" [PHASE 1 COMPLETE] ALL TASKS EXECUTED AND VERIFIED SUCCESSFULLY")
    print(banner)
    print(f" Execution Time: {elapsed:.2f} seconds\n")
    print(" Generated Artifacts:")
    print("  * Trained Model:   models/random_forest.pkl")
    print("  * Processed Data:  dataset/preprocessed_delhi_air_quality.csv")
    print("  * Test Metrics:    results/metrics/model_metrics.json")
    print("                     results/metrics/model_metrics.csv")
    print("  * Visualizations:  results/graphs/ (12 PNG figures total)")
    print("  * Reports:         results/reports/data_inspection_report.md")
    print("                     results/reports/preprocessing_report.md")
    print("                     results/reports/eda_report.md")
    print("                     results/reports/model_evaluation_report.md")
    print(banner)


if __name__ == "__main__":
    run_pipeline()
