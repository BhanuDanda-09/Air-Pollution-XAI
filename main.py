"""
main.py
-------
Main Execution Workflow for Explainable AI-Based Air Pollution Prediction and Source Attribution.

Supports modular execution across all project phases:
- Phase 1: Data Inspection, Preprocessing, EDA, and Baseline Random Forest Pipeline
- Phase 2: XGBoost Regressor Development, 5-Fold Cross-Validation Tuning, & Model Comparison
- Phase 3: Explainable AI using SHAP (TreeExplainer) and LIME (LimeTabularExplainer)
- Complete: End-to-end execution across all phases

CLI Usage:
    python main.py                  # Executes complete workflow (Phases 1, 2, and 3)
    python main.py --phase 1        # Executes Phase 1 only (Dataset, Preprocessing, EDA, RF Baseline)
    python main.py --phase 2        # Executes Phase 2 only (XGBoost & Model Comparison)
    python main.py --phase 3        # Executes Phase 3 only (SHAP & LIME Explainability)
    python main.py --retrain        # Forces model retraining and hyperparameter re-tuning
"""

import os
import sys
import time
import argparse

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Ensure matplotlib uses local writable directory and non-interactive Agg backend
os.environ.setdefault("MPLCONFIGDIR", os.path.abspath(os.path.join(os.path.dirname(__file__), ".matplotlib_cache")))
import matplotlib
matplotlib.use("Agg")

from src.data_inspection import inspect_dataset
from src.preprocessing import preprocess_data
from src.eda import run_eda
from src.train_random_forest import train_model, load_model, predict_sample
from src.evaluate_model import evaluate_model
from src.train_xgboost import tune_and_train_xgboost, load_xgboost_model, predict_xgboost_sample
from src.compare_models import compare_models
from src.shap_explainability import explain_model_shap
from src.lime_explainability import explain_model_lime
from src.compare_explanations import run_explainability_comparison


def get_or_load_data(random_state=42):
    """Load or preprocess data cleanly."""
    return preprocess_data(remove_duplicates=True, test_size=0.2, random_state=random_state, save_processed=True)


def get_or_train_rf(data_dict, force_retrain=False):
    """Load or train Random Forest pipeline."""
    rf_model_path = "models/random_forest.pkl"
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
    return rf_pipeline


def get_or_train_xgb(data_dict, force_retrain=False):
    """Load or train/tune XGBoost pipeline."""
    xgb_model_path = "models/xgboost_model.pkl"
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
    return xgb_pipeline


def run_phase_1(data_dict=None, force_retrain=False):
    """Execute Phase 1 Workflow."""
    print("\n" + "=" * 70)
    print(" >>> EXECUTING PHASE 1: DATASET INSPECTION, PREPROCESSING & BASELINE RF")
    print("=" * 70)

    # 1. Dataset Inspection
    print("\n[PHASE 1 - Step 1] Running Dataset Inspection...")
    inspect_results = inspect_dataset(save_report=True)
    print(f"  - Total Observations: {inspect_results['total_rows']}")
    print(f"  - Core Features: {inspect_results['present_core']}")

    # 2. Preprocessing
    if data_dict is None:
        print("\n[PHASE 1 - Step 2] Running Data Preprocessing & 80/20 Train-Test Splitting...")
        data_dict = get_or_load_data()
    print(f"  - Cleaned Rows: {data_dict['metadata']['cleaned_shape'][0]} (Deduplicated)")
    print(f"  - Train Set: {data_dict['metadata']['train_rows']} rows, Test Set: {data_dict['metadata']['test_rows']} rows")

    # 3. EDA
    print("\n[PHASE 1 - Step 3] Generating 9 Publication-Grade EDA Visualizations...")
    run_eda(df=data_dict["df_cleaned"])

    # 4. Train & Evaluate Random Forest
    print("\n[PHASE 1 - Step 4] Random Forest Baseline Model Training & Evaluation...")
    rf_pipeline = get_or_train_rf(data_dict, force_retrain=force_retrain)
    rf_eval = evaluate_model(pipeline=rf_pipeline, data_dict=data_dict, model_path="models/random_forest.pkl")

    rf_m = rf_eval["test_metrics"]
    print(f"\n  * Random Forest Test MAE:  {rf_m['MAE']:.2f} µg/m³")
    print(f"  * Random Forest Test RMSE: {rf_m['RMSE']:.2f} µg/m³")
    print(f"  * Random Forest Test R²:   {rf_m['R2_Score']:.4f} ({rf_m['R2_Score']*100:.2f}%)")
    return data_dict, rf_pipeline


def run_phase_2(data_dict=None, force_retrain=False):
    """Execute Phase 2 Workflow."""
    print("\n" + "=" * 70)
    print(" >>> EXECUTING PHASE 2: XGBOOST REGRESSOR & CROSS-MODEL COMPARISON")
    print("=" * 70)

    if data_dict is None:
        data_dict = get_or_load_data()

    # Ensure Random Forest model is available
    get_or_train_rf(data_dict, force_retrain=False)

    # Train/Tune XGBoost
    print("\n[PHASE 2 - Step 1] XGBoost Model Development & Hyperparameter Tuning...")
    xgb_pipeline = get_or_train_xgb(data_dict, force_retrain=force_retrain)

    # Cross-Model Comparison
    print("\n[PHASE 2 - Step 2] Head-to-Head Model Comparison on Identical Test Set...")
    comp_df = compare_models(
        rf_model_path="models/random_forest.pkl",
        xgb_model_path="models/xgboost_model.pkl"
    )
    return data_dict, xgb_pipeline, comp_df


def run_phase_3(data_dict=None):
    """Execute Phase 3 Workflow (SHAP & LIME)."""
    print("\n" + "=" * 70)
    print(" >>> EXECUTING PHASE 3: EXPLAINABLE AI USING SHAP AND LIME")
    print("=" * 70)

    if data_dict is None:
        data_dict = get_or_load_data()

    # Ensure models exist
    rf_pipeline = get_or_train_rf(data_dict, force_retrain=False)
    xgb_pipeline = get_or_train_xgb(data_dict, force_retrain=False)

    # 1. SHAP Explanations
    print("\n[PHASE 3 - Step 1] Calculating SHAP Global and Local Explanations...")
    rf_shap = explain_model_shap(model_name="random_forest", pipeline=rf_pipeline, data_dict=data_dict)
    xgb_shap = explain_model_shap(model_name="xgboost", pipeline=xgb_pipeline, data_dict=data_dict)

    # 2. LIME Explanations
    print("\n[PHASE 3 - Step 2] Generating LIME Local Explanations across Representative Samples...")
    rf_lime = explain_model_lime(model_name="random_forest", pipeline=rf_pipeline, data_dict=data_dict)
    xgb_lime = explain_model_lime(model_name="xgboost", pipeline=xgb_pipeline, data_dict=data_dict)

    # 3. Cross-Method Comparison
    print("\n[PHASE 3 - Step 3] Conducting Cross-Method Explainability Comparison (SHAP vs. LIME)...")
    comp_exp = run_explainability_comparison()

    return rf_shap, xgb_shap, rf_lime, xgb_lime, comp_exp


def main():
    parser = argparse.ArgumentParser(description="Explainable AI-Based Air Pollution Prediction & Source Attribution")
    parser.add_argument(
        "--phase",
        choices=["1", "2", "3", "all"],
        default="all",
        help="Specify project phase to execute: '1' (Baseline), '2' (XGBoost & Comparison), '3' (SHAP & LIME), or 'all' (default)"
    )
    parser.add_argument(
        "--retrain",
        action="store_true",
        help="Force retraining and tuning of models rather than loading cached weights"
    )
    args = parser.parse_args()

    start_time = time.time()
    banner = "=" * 80
    print(banner)
    print(" EXPLAINABLE AI-BASED AIR POLLUTION PREDICTION & SOURCE ATTRIBUTION ")
    print(f" EXECUTION TARGET: PHASE {args.phase.upper()}")
    print(banner)

    data_dict = None

    if args.phase == "1":
        run_phase_1(force_retrain=args.retrain)
    elif args.phase == "2":
        data_dict = get_or_load_data()
        run_phase_2(data_dict=data_dict, force_retrain=args.retrain)
    elif args.phase == "3":
        data_dict = get_or_load_data()
        run_phase_3(data_dict=data_dict)
    else:  # all
        data_dict, rf_pipeline = run_phase_1(force_retrain=args.retrain)
        _, xgb_pipeline, _ = run_phase_2(data_dict=data_dict, force_retrain=args.retrain)
        run_phase_3(data_dict=data_dict)

    elapsed = time.time() - start_time
    print("\n" + banner)
    print(" [EXECUTION COMPLETE] ALL REQUESTED PIPELINE STAGES VERIFIED SUCCESSFULLY")
    print(banner)
    print(f" Total Elapsed Time: {elapsed:.2f} seconds")
    print("\n Key Output Locations:")
    print("  * Serialized Models:        models/random_forest.pkl, models/xgboost_model.pkl")
    print("  * Phase 1 EDA Visuals:      results/graphs/ (9 plots)")
    print("  * Phase 2 Comparison Plots: results/graphs/model_comparison_*.png (5 plots)")
    print("  * Phase 3 SHAP Explanations:results/graphs/shap/ (Beeswarm, Bar, Dependence, Waterfall, Force)")
    print("  * Phase 3 LIME Local Plots: results/graphs/lime/ (PNG plots & Interactive HTMLs)")
    print("  * Numerical Metrics:        results/metrics/ (RF, XGBoost, Comparison, SHAP, LIME)")
    print("  * Analytical Reports:       results/reports/ (data_inspection, preprocessing, eda,")
    print("                                                 model_evaluation, xgboost_report,")
    print("                                                 model_comparison, explainability_comparison,")
    print("                                                 phase3_report)")
    print(banner)


if __name__ == "__main__":
    main()
