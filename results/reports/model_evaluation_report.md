# Phase 1: Random Forest Baseline Model Evaluation Report

**Model Architecture:** Scikit-Learn `RandomForestRegressor` (Baseline)
**Number of Trees (`n_estimators`):** 100
**Random State Seed:** 42 (Guarantees exact reproducibility)
**Training Sample Size:** 1621 rows (80%)
**Held-out Test Sample Size:** 406 rows (20%)

## 1. Actual Test-Set Performance Metrics
| Metric | Test Set Value | Training Set Value | Unit | Beginner-Friendly Explanation |
|:---|:---:|:---:|:---:|:---|
| **Mean Absolute Error (MAE)** | **25.62** | 10.18 | µg/m³ | On average, the model's PM2.5 prediction is off by **25.62 µg/m³** from the true monitored sensor value. |
| **Mean Squared Error (MSE)** | **1447.90** | 221.00 | (µg/m³)² | The average squared difference between predictions and actual values. Heavily penalizes large errors. |
| **Root Mean Squared Error (RMSE)** | **38.05** | 14.87 | µg/m³ | The standard deviation of the unexplained residuals (**38.05 µg/m³**). Expressed in the same units as PM2.5. |
| **Coefficient of Determination ($R^2$)** | **0.727** | 0.958 | Dimensionless | The model explains **72.7%** of the total variance in PM2.5 concentrations on previously unseen test data. |

## 2. Beginner-Friendly Metric Guide for Capstone Presentation
1. **MAE (Mean Absolute Error):** Measures the average magnitude of errors without considering their direction. If the actual PM2.5 is 150 µg/m³ and the model predicts 175 µg/m³, the absolute error is 25 µg/m³. A lower MAE indicates better precision.
2. **RMSE (Root Mean Squared Error):** Because errors are squared before being averaged, RMSE gives extra weight to large forecast errors (e.g., missing a severe smog spike). A test RMSE close to MAE indicates uniform error magnitude without massive outlier misses.
3. **$R^2$ Score (Goodness of Fit):** Compares the model's predictions to a naive baseline that simply predicts the mean PM2.5 for every sample. An $R^2$ of 0.0 means the model is no better than guessing the mean, while 1.0 means perfect prediction. Our baseline $R^2$ of **0.727 (72.7%)** demonstrates solid predictive capability using only 5 meteorological variables.

## 3. Feature Importance Analysis
| Rank | Feature Variable | Relative Importance (%) | Analytical Interpretation |
|:---:|:---|:---:|:---|
| 1 | **RH** | **37.39%** | Relative Humidity — High importance; humidity directly governs hygroscopic aerosol growth and particulate accumulation. |
| 2 | **WD** | **22.78%** | Wind Direction — Identifies geographical pollutant transport directions and localized plume advection. |
| 3 | **BP** | **18.33%** | Barometric Pressure — High atmospheric pressure creates subsidence inversions that cap vertical ventilation. |
| 4 | **SR** | **16.77%** | Solar Radiation — Controls convective mixing depth; strong solar flux enhances vertical mixing, diluting PM2.5. |
| 5 | **AT** | **4.73%** | Air Temperature — Lower surface temperatures promote ground-level thermal inversions during winter months. |

> **Important Scientific Note on Feature Importance:** Random Forest feature importance measures the decrease in node impurity (variance reduction) across decision tree splits. While it highlights which meteorological features the model relies upon to minimize PM2.5 prediction error, **it does NOT prove chemical or industrial emission source attribution**. True source attribution requires chemical speciation (ions, carbon fractions, metals) or receptor modeling (Positive Matrix Factorization / PMF).

## 4. Evaluation Visualizations Generated
- `results/graphs/actual_vs_predicted.png`: Demonstrates tight clustering of test observations along the diagonal $y = x$ reference line.
- `results/graphs/residual_plot.png`: Shows residuals centered near zero across the range of predicted PM2.5 values.
- `results/graphs/feature_importance.png`: Clearly ranks the five input meteorological features by relative Gini predictive contribution.