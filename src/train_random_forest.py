"""
src/train_random_forest.py
--------------------------
Phase 1: Baseline Random Forest Regressor Training for Air Pollution Prediction.

Responsibilities:
1. Load preprocessed training and test partitions (80/20 split).
2. Construct a unified Scikit-learn Pipeline with:
   - SimpleImputer(strategy='median') to handle any missing feature inputs
   - RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
3. Fit the pipeline strictly on the training set (X_train, y_train).
4. Save the trained pipeline bundle to models/random_forest.pkl using joblib.
5. Provide helper functions to load the model and run inference on new observations.
"""

import os
import sys

# Ensure root directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

from src.preprocessing import preprocess_data, get_feature_target_names


def train_model(X_train=None, y_train=None, model_save_path="models/random_forest.pkl", random_state=42, n_estimators=100):
    """
    Build, fit, and serialize the baseline Random Forest Pipeline.

    Parameters
    ----------
    X_train : pd.DataFrame, optional
        Training feature matrix. If None, loaded via preprocess_data().
    y_train : pd.Series, optional
        Training target vector. If None, loaded via preprocess_data().
    model_save_path : str, default="models/random_forest.pkl"
        Destination file path for the joblib serialized pipeline.
    random_state : int, default=42
        Seed for reproducibility.
    n_estimators : int, default=100
        Number of decision trees in the forest.

    Returns
    -------
    pipeline : sklearn.pipeline.Pipeline
        Fitted Scikit-learn Pipeline.
    data_dict : dict
        Dictionary of datasets and metadata.
    """
    data_dict = None
    if X_train is None or y_train is None:
        print("[INFO] Loading and preprocessing dataset for training...")
        data_dict = preprocess_data(random_state=random_state)
        X_train = data_dict["X_train"]
        y_train = data_dict["y_train"]

    features, target = get_feature_target_names()
    print(f"[INFO] Training Random Forest Regressor on {len(X_train)} samples with features: {features}...")

    # Build Pipeline: Median Imputer + RandomForestRegressor
    # Keeping imputer and regressor together guarantees consistent inference on raw input dictionaries/DataFrames
    pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("regressor", RandomForestRegressor(
                n_estimators=n_estimators,
                random_state=random_state,
                n_jobs=-1
            )),
        ]
    )

    # Fit pipeline strictly on training data
    pipeline.fit(X_train, y_train)
    print(f"[SUCCESS] Model training complete.")

    # Save model pipeline
    os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
    joblib.dump(pipeline, model_save_path)
    print(f"[SUCCESS] Saved trained model pipeline to: {model_save_path}")

    return pipeline, data_dict


def load_model(model_path="models/random_forest.pkl"):
    """Load a previously serialized model pipeline."""
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at: {model_path}")
    pipeline = joblib.load(model_path)
    return pipeline


def predict_sample(sample_dict, model_path="models/random_forest.pkl"):
    """
    Run prediction on a single dictionary or DataFrame of features.

    Example
    -------
    sample = {"RH": 85, "WD": 180, "SR": 15, "BP": 728, "AT": 14}
    pred = predict_sample(sample)
    """
    pipeline = load_model(model_path)
    if isinstance(sample_dict, dict):
        sample_df = pd.DataFrame([sample_dict])
    else:
        sample_df = sample_dict

    pred = pipeline.predict(sample_df)
    return float(pred[0])


if __name__ == "__main__":
    train_model()
