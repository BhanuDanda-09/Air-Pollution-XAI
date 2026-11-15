# Phase 1: Data Preprocessing Documentation

## 1. Preprocessing Summary Overview
- **Raw Dataset Shape:** 2183 rows, 13 columns
- **Cleaned Dataset Shape:** 2027 rows, 6 columns
- **Input Features (5):** `RH, WD, SR, BP, AT`
- **Target Variable:** `PM2.5`
- **Train-Test Split Ratio:** 80% Training (1621 rows) / 20% Testing (406 rows)
- **Random State Seed:** `42` (Ensures 100% reproducible splits)

## 2. Duplicate Handling Decision
- **Duplicates Identified:** 156 rows
- **Action Taken:** Removed 156 duplicate rows to eliminate train/test data leakage.
- **Justification:** In tabular machine learning without timestamp sequence awareness, having exact identical rows present in both training and test sets constitutes cross-fold data leakage, artificially inflating test $R^2$ and underestimating generalization error. Deduplication ensures strict independence of the held-out test set.

## 3. Missing Value Imputation & Leakage Prevention
- **Missingness in Training Set (`X_train`):** {'RH': 0, 'WD': 0, 'SR': 11, 'BP': 0, 'AT': 0}
- **Missingness in Testing Set (`X_test`):** {'RH': 0, 'WD': 0, 'SR': 1, 'BP': 0, 'AT': 0}
- **Imputation Strategy:** `SimpleImputer(strategy='median')`
- **Leakage Guard:** The imputer is fitted strictly on `X_train`. The test set `X_test` is transformed using the training-derived medians.
- **Learned Training Medians:**
  - `RH`: **67.00**
  - `WD`: **153.00**
  - `SR`: **9.00**
  - `BP`: **740.00**
  - `AT`: **15.00**

## 4. Artifact & Out-of-Scope Column Removal
- The 7 empty/artifact columns (`Unnamed: 6` to `Unnamed: 12`) present in the raw Excel spreadsheet were excluded.
- No synthetic timestamps or artificial pollutant columns were fabricated, strictly adhering to project specifications.