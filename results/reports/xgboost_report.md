# Phase 2: XGBoost Model Development and Evaluation Report

**Model Type:** Extreme Gradient Boosting (`XGBRegressor`)
**Training Sample Size:** 1621 observations (80%)
**Held-out Test Sample Size:** 406 observations (20%)

## 1. Hyperparameter Tuning Process
Hyperparameter optimization was conducted strictly on the training partition (`X_train`) using **`RandomizedSearchCV`** with **5-Fold Cross-Validation** to prevent test data leakage.
- **Cross-Validation Metric:** Negative Root Mean Squared Error (RMSE)
- **Best 5-Fold CV Training RMSE:** **39.25 µg/m³**

### Optimal Hyperparameters Found:
| Hyperparameter | Selected Value | Role / Functional Significance |
|:---|:---:|:---|
| **`subsample`** | `0.9` | Fraction of training rows randomly sampled prior to growing trees. |
| **`reg_lambda`** | `5.0` | L2 regularization term on leaf weights (smooths extreme weights). |
| **`reg_alpha`** | `0` | L1 regularization term on leaf weights (encourages sparsity). |
| **`n_estimators`** | `250` | Number of sequential gradient boosted decision trees. |
| **`min_child_weight`** | `2` | Minimum sum of instance weight (hessian) needed in a child node. |
| **`max_depth`** | `7` | Maximum depth per tree; regulates tree complexity and prevents overfitting. |
| **`learning_rate`** | `0.1` | Step size shrinkage applied to each tree update ($η$). |
| **`gamma`** | `0` | Minimum loss reduction required to make a further partition on a leaf. |
| **`colsample_bytree`** | `0.8` | Subsample ratio of features when constructing each tree. |

## 2. Test Set Evaluation Performance
The tuned XGBoost model was evaluated on the **exact same 406 held-out test observations** established in Phase 1:
| Metric | Test Set Value | Training Set Value | Target Unit | Capstone Interpretation |
|:---|:---:|:---:|:---:|:---|
| **Mean Absolute Error (MAE)** | **25.28** | 8.85 | µg/m³ | The average magnitude of prediction error across test samples. |
| **Mean Squared Error (MSE)** | **1349.57** | 155.94 | (µg/m³)² | Mean squared error, penalizing severe forecast deviations. |
| **Root Mean Squared Error (RMSE)** | **36.74** | 12.49 | µg/m³ | Standard deviation of unexplained residuals (**36.74 µg/m³**). |
| **Coefficient of Det. ($R^2$)** | **0.7455** | 0.9704 | Dimensionless | The model accounts for **74.55%** of test PM2.5 variance. |

## 3. XGBoost Feature Importance Breakdown
XGBoost calculates feature importance based on **Gain** — the average improvement in loss brought by a feature across all tree splits.
| Rank | Feature Variable | Relative Importance (%) | Analytical Interpretation |
|:---:|:---|:---:|:---|
| 1 | **RH** | **27.36%** | Relative split gain contribution to PM2.5 prediction. |
| 2 | **AT** | **21.81%** | Relative split gain contribution to PM2.5 prediction. |
| 3 | **BP** | **19.99%** | Relative split gain contribution to PM2.5 prediction. |
| 4 | **SR** | **16.15%** | Relative split gain contribution to PM2.5 prediction. |
| 5 | **WD** | **14.69%** | Relative split gain contribution to PM2.5 prediction. |

> **Crucial Scientific Caution:** Feature importance indicates statistical model reliance to minimize PM2.5 error. **It does NOT prove emission causation or identify physical pollution sources**. True pollution source attribution requires chemical speciation or receptor modeling.