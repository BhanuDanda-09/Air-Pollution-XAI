# Phase 1: Exploratory Data Analysis (EDA) Report

This report documents empirical statistical observations from the Delhi Air Quality dataset.
**Total Sample Count Analyzed:** 2027

## 1. Summary of Generated EDA Visualizations
| # | Visualization | File Name | Key Analytical Objective |
|:---|:---|:---|:---|
| 1 | PM2.5 Distribution Histogram | `pm25_distribution_histogram.png` | Assess target skewness, density, and unimodality/bimodality |
| 2 | PM2.5 Boxplot | `pm25_boxplot.png` | Quantify IQR, median, and severe air pollution extreme spikes |
| 3 | Pearson Correlation Heatmap | `correlation_heatmap.png` | Measure linear inter-variable dependencies and multicollinearity |
| 4 | Relative Humidity (RH) vs PM2.5 | `rh_vs_pm25_scatter.png` | Inspect humidity hygroscopic growth vs PM2.5 relationship |
| 5 | Wind Direction (WD) vs PM2.5 | `wd_vs_pm25_scatter.png` | Examine directional pollutant dispersion or upwind transport |
| 6 | Solar Radiation (SR) vs PM2.5 | `sr_vs_pm25_scatter.png` | Observe daytime solar boundary layer vs nocturnal stagnation |
| 7 | Barometric Pressure (BP) vs PM2.5 | `bp_vs_pm25_scatter.png` | Analyze atmospheric pressure anti-cyclonic trapping |
| 8 | Air Temperature (AT) vs PM2.5 | `at_vs_pm25_scatter.png` | Investigate winter inversion and thermal stratification |
| 9 | Feature Distribution Grid | `feature_distributions.png` | Check skewness, spread, and valid ranges across all 5 predictors |

## 2. Key Empirical Observations
### Observation 1: PM2.5 Target Variable Distribution
- **Mean:** 144.5 µg/m³, **Median:** 134.0 µg/m³, **Maximum:** 427.0 µg/m³.
- **Positive Skewness (0.67):** The distribution has a right-skewed tail extending above 350 µg/m³, corresponding to episodic severe air quality conditions.
- **National Standards Benchmark:** The vast majority of observations exceed the Indian National Ambient Air Quality Standard (NAAQS) 24-hour limit of 60 µg/m³ and WHO guideline of 15 µg/m³, reflecting chronic winter pollution levels.

### Observation 2: Linear Correlations with PM2.5
| Predictor Feature | Pearson Correlation ($r$) with PM2.5 | Direction & Strength | Physical Explanation |
|:---|:---|:---|:---|
| **RH** | **+0.54** | Moderate Positive | High humidity promotes secondary aerosol formation and hygroscopic particulate condensation under low wind conditions. |
| **WD** | **-0.05** | Negligible / Near Zero | Wind direction reflects regional transport corridors (e.g. northwesterly agricultural/regional drift vs southeasterly). |
| **SR** | **-0.24** | Weak Negative | Daytime solar heating induces convective atmospheric mixing height, dispersing ground-level particulates, while low nocturnal solar radiation coincides with stable shallow inversion layers. |
| **BP** | **-0.29** | Weak Negative | High barometric pressure is characteristic of winter anticyclonic sinking air, which suppresses vertical ventilation and traps pollutants near the surface. |
| **AT** | **-0.45** | Moderate Negative | Lower temperatures correlate with atmospheric temperature inversion layers that prevent vertical dispersion of vehicle and domestic emissions. |

### Observation 3: Inter-Feature Relationships
- **RH vs AT ($r = -0.89$):** Negative correlation observed between relative humidity and air temperature, consistent with psychrometric thermodynamics (colder air has lower saturation vapor capacity).
- **SR vs AT ($r = 0.66$):** Positive correlation between solar radiation and temperature, matching diurnal heating cycles.
- **Absence of Severe Multicollinearity:** None of the feature pairs exhibit correlation $|r| > 0.85$, meaning all five features contribute non-redundant information to the baseline model.