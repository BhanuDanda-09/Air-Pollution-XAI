# Phase 3 Comprehensive Capstone Report: Explainable AI with SHAP & LIME

**Author:** B.Tech Final Year Capstone Project Team
**Phase:** Phase 3 — Explainable AI (XAI) Integration

## Executive Summary
In Phase 3, we integrated two complementary Explainable AI frameworks — **SHAP** (SHapley Additive exPlanations) and **LIME** (Local Interpretable Model-agnostic Explanations) — to demystify the predictions of both our Phase 1 Random Forest baseline and Phase 2 XGBoost model.

## 1. SHAP Global Analysis Results
- **Random Forest Global Ranking:** `RH` (48.1%) > `SR` (16.8%) > `BP` (15.7%) > `WD` (15.4%) > `AT` (3.9%)
- **XGBoost Global Ranking:** `RH` (40.8%) > `WD` (17.7%) > `SR` (17.1%) > `BP` (14.9%) > `AT` (9.6%)
- **Beeswarm Insights:** High values of `RH` (red dots) consistently appear on the right side (positive SHAP impact), confirming that elevated humidity pushes predicted PM2.5 upwards. Low solar radiation and lower temperatures also shift predictions towards higher pollution levels.

## 2. LIME Local Analysis Results
We evaluated 5 diverse test scenarios representing the full pollution spectrum:
- **Low Pollution Case (6.0 µg/m³):** Moderated by higher barometric pressure and moderate humidity.
- **Median Case (132.0 µg/m³):** Balanced meteorological contributions close to baseline mean.
- **Severe Smog Spike Case (353.0 µg/m³):** Extreme relative humidity (89%) and near-zero ventilation created a massive positive push (+27.8 µg/m³ in LIME, +70.2 µg/m³ in SHAP).

## 3. Comparison of SHAP vs. LIME
| Aspect | SHAP (`TreeExplainer`) | LIME (`LimeTabularExplainer`) |
|:---|:---|:---|
| **Scope** | Both Global & Local | Strictly Local (per-instance) |
| **Theoretical Basis** | Cooperative Game Theory (Shapley Values) | Local Linear Surrogate Regression |
| **Consistency Guarantee** | Strictly Additive (sums to model output minus base value) | Locally faithful approximation within perturbation radius |
| **Computation** | Fast exact tree traversal ($O(TLD^2)$) | Stochastic perturbation sampling |

## 4. Presentation Takeaways for Capstone Review
1. The models are no longer 'black boxes' — every single prediction can be broken down into exact additive contributions from Relative Humidity, Wind Direction, Solar Radiation, Barometric Pressure, and Air Temperature.
2. Both bagging (Random Forest) and gradient boosting (XGBoost) converge on the primary importance of Relative Humidity in Delhi's winter meteorological regime.
3. We have explicitly documented the scientific boundary: these models explain predictive behavior, not physical chemical emissions.