# Phase 2: Random Forest vs. XGBoost Model Comparison Report

**Project Title:** Explainable AI-Based Air Pollution Prediction and Source Attribution
**Evaluation Split:** Exactly identical held-out test set (406 observations, 20% split, `seed=42`).

## 1. Test Performance Comparison Table
| Model Architecture | MAE (µg/m³) | MSE (µg/m³)² | RMSE (µg/m³) | $R^2$ Score | Performance Rank |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Random Forest (Baseline)** | 25.62 | 1447.90 | 38.05 | 0.7269 (72.69%) | 2nd (Baseline) |
| **XGBoost (Tuned)** | **25.28** | **1349.57** | **36.74** | **0.7455** (74.55%) | **1st (Top)** |

## 2. Quantitative Empirical Findings
1. **Better-Performing Model:** **XGBoost** demonstrated superior generalization on unseen test data across all evaluated metrics.
2. **Error Reductions:**
   - **Mean Absolute Error (MAE):** Reduced from 25.62 µg/m³ to **25.28 µg/m³** (an improvement of **0.34 µg/m³**).
   - **Root Mean Squared Error (RMSE):** Reduced from 38.05 µg/m³ to **36.74 µg/m³** (an improvement of **1.31 µg/m³**).
   - **$R^2$ Score (Variance Explained):** Increased from 0.7269 (72.69%) to **0.7455 (74.55%)**, accounting for an additional **1.85 percentage points** of PM2.5 variation.

## 3. Algorithmic Reasons for Performance Difference
- **Ensemble Paradigm:** Random Forest uses **Bagging** (Bootstrap Aggregating) where trees are grown independently in parallel and averaged. XGBoost uses **Gradient Boosting**, where trees are built sequentially to directly minimize the residual errors of preceding trees using gradient descent in functional space.
- **Regularization Mechanisms:** XGBoost natively penalizes model complexity via L1 ($\alpha$) and L2 ($\lambda$) leaf weight regularization and tree depth pruning ($\gamma$), effectively mitigating overfitting on localized meteorological anomalies.
- **Continuous Optimization:** Gradient boosting optimizes continuous loss surfaces more aggressively than uniform bagging, allowing closer approximations of non-linear PM2.5 atmospheric dynamics.

## 4. Feature Importance Comparison
Comparing how the two algorithms rank meteorological features:
| Feature | Variable Meaning | Random Forest (Gini %) | XGBoost (Gain %) | Consensus Role |
|:---|:---|:---:|:---:|:---|
| **RH** | Relative humidity / Meteorology | 37.4% | 27.4% | Consistently identified as a major driver of particulate variation |
| **WD** | Relative humidity / Meteorology | 22.8% | 14.7% | Consistently identified as a major driver of particulate variation |
| **SR** | Relative humidity / Meteorology | 16.8% | 16.2% | Consistently identified as a major driver of particulate variation |
| **BP** | Relative humidity / Meteorology | 18.3% | 20.0% | Consistently identified as a major driver of particulate variation |
| **AT** | Relative humidity / Meteorology | 4.7% | 21.8% | Consistently identified as a major driver of particulate variation |

### Scientific Distinction in Importance Calculations:
1. **Random Forest (Mean Decrease in Impurity / Gini):** Measures the total variance reduction achieved across all split nodes where a feature is chosen.
2. **XGBoost (Gain):** Measures the average fractional contribution of each feature to the gradient improvement of the loss function across all boosted trees.
3. **Scientific Caution:** While these metrics illuminate how models utilize features to optimize predictions, **neither metric proves physical emission source attribution**. Attributing pollution to vehicular traffic, agricultural burning, or industry requires chemical tracer speciation, which is outside the scope of Phase 2.