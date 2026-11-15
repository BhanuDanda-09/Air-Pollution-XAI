"""
src/preprocessing.py
--------------------
Phase 1: Data Preprocessing Pipeline for Air Pollution Prediction.

Responsibilities:
1. Load Excel dataset.
2. Select and verify the 5 input features: RH, WD, SR, BP, AT, and target PM2.5.
3. Handle duplicates with justified rationale (to prevent train/test data leakage).
4. Perform 80/20 train-test split using reproducible random state (seed=42).
5. Build a Scikit-learn preprocessing pipeline for median imputation fitted strictly on X_train.
6. Export preprocessed data and generate results/reports/preprocessing_report.md.
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline


def get_feature_target_names():
    """Return verified feature and target names."""
    features = ["RH", "WD", "SR", "BP", "AT"]
    target = "PM2.5"
    return features, target


def load_raw_data(file_path="dataset/Delhi Final(1).xlsx"):
    """Load raw dataset from Excel file."""
    candidate_paths = [
        file_path,
        "dataset/Delhi Final.xlsx",
        "Delhi Final(1).xlsx",
        "Delhi Final.xlsx",
    ]
    for p in candidate_paths:
        if os.path.exists(p):
            df = pd.read_excel(p)
            return df
    raise FileNotFoundError(f"Dataset Excel file not found. Checked: {candidate_paths}")


def preprocess_data(file_path=None, remove_duplicates=True, test_size=0.2, random_state=42, save_processed=True):
    """
    Load, clean, validate, and split the dataset.

    Parameters
    ----------
    file_path : str, optional
        Path to raw Excel file.
    remove_duplicates : bool, default=True
        Whether to drop exact duplicate rows to prevent train-test data leakage.
    test_size : float, default=0.2
        Proportion of held-out test data (80% train, 20% test).
    random_state : int, default=42
        Reproducibility seed.
    save_processed : bool, default=True
        Whether to save preprocessed CSV dataset.

    Returns
    -------
    dict containing:
        - X_train, X_test, y_train, y_test
        - feature_names, target_name
        - cleaned_df, raw_df
        - metadata
    """
    raw_df = load_raw_data(file_path) if file_path else load_raw_data()
    raw_shape = raw_df.shape

    features, target = get_feature_target_names()
    core_cols = [target] + features

    # Verify all expected columns exist
    missing_cols = [c for c in core_cols if c not in raw_df.columns]
    if missing_cols:
        raise ValueError(f"Required columns missing from dataset: {missing_cols}")

    # Extract core columns (dropping artifact columns Unnamed: 6 to 12)
    df_core = raw_df[core_cols].copy()

    # Investigate & handle duplicates
    dup_count_initial = int(df_core.duplicated().sum())
    if remove_duplicates:
        df_cleaned = df_core.drop_duplicates().reset_index(drop=True)
        dup_action = f"Removed {dup_count_initial} duplicate rows to eliminate train/test data leakage."
    else:
        df_cleaned = df_core.copy()
        dup_action = f"Kept {dup_count_initial} duplicate rows."

    cleaned_shape = df_cleaned.shape

    # Separate X (features) and y (target)
    X = df_cleaned[features].copy()
    y = df_cleaned[target].copy()

    # Train-test split (80% train, 20% test, random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, shuffle=True
    )

    # Imputer inspection on training set
    imputer = SimpleImputer(strategy="median")
    imputer.fit(X_train)
    learned_medians = dict(zip(features, [float(m) for m in imputer.statistics_]))

    # Missing counts in train and test
    train_nulls = X_train.isnull().sum().to_dict()
    test_nulls = X_test.isnull().sum().to_dict()

    metadata = {
        "raw_shape": raw_shape,
        "cleaned_shape": cleaned_shape,
        "initial_duplicates": dup_count_initial,
        "duplicate_action": dup_action,
        "features": features,
        "target": target,
        "test_size": test_size,
        "random_state": random_state,
        "train_rows": len(X_train),
        "test_rows": len(X_test),
        "learned_medians": learned_medians,
        "train_nulls": train_nulls,
        "test_nulls": test_nulls,
    }

    # Save cleaned dataset if requested
    if save_processed:
        os.makedirs("dataset", exist_ok=True)
        processed_path = "dataset/preprocessed_delhi_air_quality.csv"
        df_cleaned.to_csv(processed_path, index=False)
        print(f"[SUCCESS] Cleaned dataset saved to: {processed_path}")

    # Generate preprocessing report
    generate_preprocessing_report(metadata)

    return {
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test,
        "feature_names": features,
        "target_name": target,
        "df_cleaned": df_cleaned,
        "metadata": metadata,
    }


def create_preprocessor():
    """
    Create a Scikit-Learn Imputer transformer.
    Fitted strictly on training data to prevent data leakage.
    """
    return SimpleImputer(strategy="median")


def generate_preprocessing_report(meta, report_path="results/reports/preprocessing_report.md"):
    """Write markdown documentation of preprocessing decisions."""
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    md = []
    md.append("# Phase 1: Data Preprocessing Documentation")
    md.append("\n## 1. Preprocessing Summary Overview")
    md.append(f"- **Raw Dataset Shape:** {meta['raw_shape'][0]} rows, {meta['raw_shape'][1]} columns")
    md.append(f"- **Cleaned Dataset Shape:** {meta['cleaned_shape'][0]} rows, {meta['cleaned_shape'][1]} columns")
    md.append(f"- **Input Features (5):** `{', '.join(meta['features'])}`")
    md.append(f"- **Target Variable:** `{meta['target']}`")
    md.append(f"- **Train-Test Split Ratio:** 80% Training ({meta['train_rows']} rows) / 20% Testing ({meta['test_rows']} rows)")
    md.append(f"- **Random State Seed:** `{meta['random_state']}` (Ensures 100% reproducible splits)")

    md.append("\n## 2. Duplicate Handling Decision")
    md.append(f"- **Duplicates Identified:** {meta['initial_duplicates']} rows")
    md.append(f"- **Action Taken:** {meta['duplicate_action']}")
    md.append("- **Justification:** In tabular machine learning without timestamp sequence awareness, having exact identical rows present in both training and test sets constitutes cross-fold data leakage, artificially inflating test $R^2$ and underestimating generalization error. Deduplication ensures strict independence of the held-out test set.")

    md.append("\n## 3. Missing Value Imputation & Leakage Prevention")
    md.append("- **Missingness in Training Set (`X_train`):** " + str(meta["train_nulls"]))
    md.append("- **Missingness in Testing Set (`X_test`):** " + str(meta["test_nulls"]))
    md.append("- **Imputation Strategy:** `SimpleImputer(strategy='median')`")
    md.append("- **Leakage Guard:** The imputer is fitted strictly on `X_train`. The test set `X_test` is transformed using the training-derived medians.")
    md.append("- **Learned Training Medians:**")
    for feat, med in meta["learned_medians"].items():
        md.append(f"  - `{feat}`: **{med:.2f}**")

    md.append("\n## 4. Artifact & Out-of-Scope Column Removal")
    md.append("- The 7 empty/artifact columns (`Unnamed: 6` to `Unnamed: 12`) present in the raw Excel spreadsheet were excluded.")
    md.append("- No synthetic timestamps or artificial pollutant columns were fabricated, strictly adhering to project specifications.")

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md))
    print(f"[SUCCESS] Preprocessing report saved to: {report_path}")


if __name__ == "__main__":
    preprocess_data()
