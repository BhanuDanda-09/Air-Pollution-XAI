# Phase 3: Explainability Comparison Report (SHAP vs. LIME)

**Project Title:** Explainable AI-Based Air Pollution Prediction and Source Attribution
**Models Analyzed:** Random Forest Regressor & Extreme Gradient Boosting (XGBoost)

## 1. Cross-Method Feature Importance & Attribution Table
| Feature | Random Forest SHAP Importance | XGBoost SHAP Importance | LIME Local Observations |
|:---|:---:|:---:|:---|
| **RH** | 37.48 µg/m³ (48.1%) | 32.42 µg/m³ (40.8%) | Strongest positive local push across all samples; high humidity persistently inflates predicted PM2.5 (+27 to +37 µg/m³). |
| **SR** | 13.12 µg/m³ (16.8%) | 13.59 µg/m³ (17.1%) | Consistently acts as a major driver; daytime solar radiation adds significant positive linear offsets (+5 to +24 µg/m³). |
| **BP** | 12.25 µg/m³ (15.7%) | 11.83 µg/m³ (14.9%) | Exerts a consistent negative local offset (-8 to -13 µg/m³), moderating predictions under stable atmospheric pressure. |
| **WD** | 12.02 µg/m³ (15.4%) | 14.10 µg/m³ (17.7%) | Modest local sensitivity (-2 to +4 µg/m³); varies depending on whether wind blows from regional emission corridors. |
| **AT** | 3.04 µg/m³ (3.9%) | 7.60 µg/m³ (9.6%) | Minor local impact (-1 to +2 µg/m³); acts as a secondary modulation factor in both bagging and boosting trees. |

## 2. Agreement & Consensus Across Explanation Methods
1. **Relative Humidity (RH) as Dominant Driver:** Both SHAP and LIME, across both Random Forest and XGBoost, unanimously identify `RH` as the most influential feature. High humidity drives secondary particulate formation and hygroscopic growth.
2. **Barometric Pressure (BP) as Consistently Stabilizing Factor:** Both methods reveal that higher barometric pressure exerts a negative attribution offset in local predictions, consistent with high-pressure anti-cyclonic caps that stabilize surface air.
3. **Solar Radiation (SR) Convective Modulation:** Both SHAP dependence plots and LIME weights show that solar radiation strongly influences daytime mixing depths, creating sharp inflection points between daytime convective dilution and nocturnal accumulation.

## 3. Why Global and Local Explanations Can Differ
- **Global Explanations (SHAP Summary/Bar):** Integrate contributions across all 406 test instances to identify average overall reliance. A feature like `WD` (Wind Direction) has moderate global importance across all wind angles.
- **Local Explanations (LIME / SHAP Waterfall):** Fit a local surrogate model specifically in the immediate neighborhood of a single query observation. For a specific calm night observation, wind direction may have negligible local weight because wind speed is stagnant, while relative humidity accounts for almost all local variance.
- **Mathematical Foundations:** SHAP computes exact Shapley values from cooperative game theory (ensuring efficiency, symmetry, and additivity). LIME fits an interpretable linear surrogate weighted by an exponential distance kernel around the perturbation sphere.

## 4. Crucial Scientific Limitations
> **IMPORTANT:** SHAP and LIME explain **how the trained model maps inputs to outputs**. They describe statistical reliance, **NOT physical causation**.
> Feature importance alone cannot differentiate between physical emission sources such as vehicular exhaust, industrial power generation, construction dust, or agricultural biomass burning.
> Therefore, Phase 3 outputs are characterized as **Explainable PM2.5 Prediction and Model-Based Attribution**, not conclusive physical source apportionment.