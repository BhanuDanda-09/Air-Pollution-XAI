"""
src/lime_explainability.py
--------------------------
Phase 3: LIME (Local Interpretable Model-agnostic Explanations) for Random Forest & XGBoost.

Responsibilities:
1. Initialize LimeTabularExplainer using the training dataset (X_train).
2. Use the 5 verified input features: RH, WD, SR, BP, AT.
3. Use the existing trained models (Random Forest and XGBoost).
4. Apply the correct preprocessing pipeline before predicting in LIME.
5. Explain at least five representative observations from the held-out test dataset:
   - Lowest PM2.5 observation
   - 25th percentile PM2.5 observation
   - Median PM2.5 observation
   - 75th percentile PM2.5 observation
   - Highest PM2.5 observation (severe smog spike)
6. Generate explanations in both HTML and high-resolution PNG formats inside:
   - results/graphs/lime/random_forest/
   - results/graphs/lime/xgboost/
7. Save numerical LIME feature contribution weights in:
   - results/metrics/lime/rf_lime_sample_contributions.csv
   - results/metrics/lime/xgboost_lime_sample_contributions.csv
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
from lime import lime_tabular

from src.preprocessing import preprocess_data, get_feature_target_names


def explain_model_lime(model_name="random_forest", pipeline=None, data_dict=None,
                       output_graph_dir=None, output_metrics_dir="results/metrics/lime",
                       num_samples=5):
    """
    Generate LIME local surrogate explanations for representative test instances.

    Parameters
    ----------
    model_name : str
        'random_forest' or 'xgboost'
    pipeline : sklearn.pipeline.Pipeline, optional
        Fitted pipeline.
    data_dict : dict, optional
        Preprocessed dataset dictionary.
    num_samples : int, default=5
        Number of representative instances to explain.
    """
    if output_graph_dir is None:
        output_graph_dir = f"results/graphs/lime/{model_name}"

    os.makedirs(output_graph_dir, exist_ok=True)
    os.makedirs(output_metrics_dir, exist_ok=True)

    # 1. Load data
    if data_dict is None:
        print("[INFO] Loading preprocessed dataset for LIME explainability...")
        data_dict = preprocess_data(random_state=42, save_processed=False)

    X_train = data_dict["X_train"]
    X_test = data_dict["X_test"]
    y_test = data_dict["y_test"]
    features, target = get_feature_target_names()

    # 2. Load model pipeline
    if pipeline is None:
        model_file = "models/random_forest.pkl" if model_name == "random_forest" else "models/xgboost_model.pkl"
        if not os.path.exists(model_file):
            raise FileNotFoundError(f"Model file {model_file} not found. Please train it first.")
        pipeline = joblib.load(model_file)

    display_name = "Random Forest" if model_name == "random_forest" else "XGBoost"
    print(f"\n[INFO] === Calculating LIME Local Explanations for {display_name} ===")

    # 3. Create prediction wrapper function that maps 2D numpy array to DataFrame
    def predict_wrapper(numpy_array_2d):
        df_in = pd.DataFrame(numpy_array_2d, columns=features)
        return pipeline.predict(df_in)

    # 4. Initialize LimeTabularExplainer on actual training data
    # We set discretize_continuous=False to obtain continuous linear feature weights and avoid
    # zero-variance bin truncation errors with continuous meteorological distributions
    explainer = lime_tabular.LimeTabularExplainer(
        training_data=X_train.values,
        feature_names=features,
        mode="regression",
        discretize_continuous=False,
        random_state=42
    )

    # 5. Select 5 representative test instances spanning the air pollution spectrum
    y_test_arr = y_test.values
    test_indices = [
        int(np.argmin(y_test_arr)),                        # Min PM2.5
        int(np.argsort(y_test_arr)[len(y_test_arr) // 4]), # 25th percentile
        int(np.argsort(y_test_arr)[len(y_test_arr) // 2]), # Median PM2.5
        int(np.argsort(y_test_arr)[3 * len(y_test_arr) // 4]), # 75th percentile
        int(np.argmax(y_test_arr))                         # Max PM2.5 (Severe Smog)
    ]
    sample_labels = [
        "01_Min_PM2.5",
        "02_25th_Percentile",
        "03_Median_PM2.5",
        "04_75th_Percentile",
        "05_Max_PM2.5_Smog_Spike"
    ]

    all_lime_records = []

    for idx, label in zip(test_indices, sample_labels):
        sample_row = X_test.iloc[idx]
        sample_values = sample_row.values
        actual_val = float(y_test.iloc[idx])
        pred_val = float(predict_wrapper(sample_values.reshape(1, -1))[0])

        # Generate LIME explanation
        exp = explainer.explain_instance(
            data_row=sample_values,
            predict_fn=predict_wrapper,
            num_features=len(features)
        )

        # A. Save as High-Resolution PNG
        fig = exp.as_pyplot_figure()
        plt.title(f"{display_name} LIME Explanation: {label}\nActual PM2.5: {actual_val:.1f} | Predicted: {pred_val:.1f} µg/m³",
                  fontsize=11, fontweight="bold", pad=12)
        plt.xlabel("LIME Feature Weight / Impact (µg/m³)", fontsize=10)
        plt.tight_layout()
        png_path = os.path.join(output_graph_dir, f"lime_{label}.png")
        fig.savefig(png_path, dpi=300, bbox_inches="tight")
        plt.close(fig)

        # B. Save as Interactive HTML
        html_path = os.path.join(output_graph_dir, f"lime_{label}.html")
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(exp.as_html())

        # C. Extract numerical contribution weights
        for feat_name, weight in exp.as_list():
            all_lime_records.append({
                "Model": display_name,
                "Sample_Type": label,
                "Test_Index": idx,
                "Actual_PM2.5": round(actual_val, 2),
                "Predicted_PM2.5": round(pred_val, 2),
                "Feature": feat_name,
                "Feature_Value": round(float(sample_row[feat_name]), 2),
                "LIME_Weight": round(float(weight), 4),
                "Impact_Direction": "Increases PM2.5" if weight > 0 else "Decreases PM2.5"
            })

        print(f"  [+] Explained {label} (Idx {idx}): Actual={actual_val:.1f}, Pred={pred_val:.1f} µg/m³ -> PNG & HTML saved.")

    # 6. Save numerical metrics to CSV
    prefix = "rf" if model_name == "random_forest" else "xgboost"
    lime_csv_path = os.path.join(output_metrics_dir, f"{prefix}_lime_sample_contributions.csv")
    lime_df = pd.DataFrame(all_lime_records)
    lime_df.to_csv(lime_csv_path, index=False)
    print(f"[SUCCESS] Saved LIME numerical metrics to: {lime_csv_path}")

    return {
        "model_name": model_name,
        "lime_df": lime_df,
        "sample_indices": test_indices,
        "output_graph_dir": output_graph_dir
    }


def run_all_lime_explanations():
    """Execute LIME explanations for both Random Forest and XGBoost."""
    print("=" * 70)
    print("       PHASE 3: LIME LOCAL EXPLAINABILITY ANALYSIS (5 SAMPLES)        ")
    print("=" * 70)

    data_dict = preprocess_data(random_state=42, save_processed=False)

    rf_lime = explain_model_lime(model_name="random_forest", data_dict=data_dict)
    xgb_lime = explain_model_lime(model_name="xgboost", data_dict=data_dict)

    print("\n" + "=" * 70)
    print("           LIME EXPLAINABILITY COMPLETED FOR BOTH MODELS             ")
    print("=" * 70)
    return rf_lime, xgb_lime


if __name__ == "__main__":
    run_all_lime_explanations()
