# Phase 1: Dataset Inspection & Quality Report

**Dataset Source File:** `dataset/Delhi Final(1).xlsx`
**Total Observations (Rows):** 2183
**Total Features (Columns):** 13

## 1. Column Verification & Structure
| Column Name | Status | Type | Description |
|:---|:---|:---|:---|
| **PM2.5** | Verified Core Variable | `int64` | Target: Fine Particulate Matter concentration (µg/m³) |
| **RH** | Verified Core Variable | `int64` | Feature: Relative Humidity (%) |
| **WD** | Verified Core Variable | `int64` | Feature: Wind Direction (degrees clockwise from North, 0–360°) |
| **SR** | Verified Core Variable | `float64` | Feature: Solar Radiation (W/m²) |
| **BP** | Verified Core Variable | `int64` | Feature: Barometric Pressure (mmHg) |
| **AT** | Verified Core Variable | `int64` | Feature: Ambient Air Temperature (°C) |
| `Unnamed: 6` | Unnamed / Artifact Column | Object / Float | Non-feature Excel artifact column |
| `Unnamed: 7` | Unnamed / Artifact Column | Object / Float | Non-feature Excel artifact column |
| `Unnamed: 8` | Unnamed / Artifact Column | Object / Float | Non-feature Excel artifact column |
| `Unnamed: 9` | Unnamed / Artifact Column | Object / Float | Non-feature Excel artifact column |
| `Unnamed: 10` | Unnamed / Artifact Column | Object / Float | Non-feature Excel artifact column |
| `Unnamed: 11` | Unnamed / Artifact Column | Object / Float | Non-feature Excel artifact column |
| `Unnamed: 12` | Unnamed / Artifact Column | Object / Float | Non-feature Excel artifact column |

> **Finding on Extra Columns:** The Excel sheet contains 7 artifact columns (`Unnamed: 6` to `Unnamed: 12`). Inspection shows these columns contain entirely `NaN` values across all rows, with only a single stray text label `'Delhi'` in row 4 of `Unnamed: 12`. These columns are not environmental variables and will be dropped during preprocessing.

## 2. Missing Values Analysis
| Column | Missing Count | Missing Percentage (%) | Treatment Recommendation |
|:---|:---|:---|:---|
| **PM2.5** | 0 | 0.00% | None needed (100% complete) |
| **RH** | 0 | 0.00% | None needed (100% complete) |
| **WD** | 0 | 0.00% | None needed (100% complete) |
| **SR** | 12 | 0.55% | Impute using training-set Median via Scikit-Learn Pipeline |
| **BP** | 0 | 0.00% | None needed (100% complete) |
| **AT** | 0 | 0.00% | None needed (100% complete) |

> **Missing Value Decision:** Only Solar Radiation (`SR`) contains missing values: **12 out of 2,183 rows (0.55%)**. Because 0.55% is very small, using a median imputer inside the Scikit-learn Pipeline prevents data leakage (the median is learned only from `X_train`) and preserves all observations.

## 3. Duplicate Rows Investigation
- **Identical duplicate rows across core columns:** `156`
- **Total rows involved in duplicate clusters:** `281`

### Duplicate Investigation Analysis:
1. **Physical Cause:** Continuous environmental air quality monitoring stations sample data at fixed intervals (e.g., 15 minutes or 1 hour). During stagnant nocturnal weather (zero solar radiation, near-zero wind velocity, stable temperature), sensor readings often stay identical across consecutive timestamps.
2. **Machine Learning Risk (Data Leakage):** Because this dataset does not have explicit timestamps, observations are treated as tabular samples. If exact duplicate rows are preserved, a random train-test split would place identical feature-target pairs into both training and testing sets, artificially inflating test metrics.
3. **Preprocessing Decision:** To guarantee honest generalization, duplicate rows are removed during preprocessing, leaving **2,027 unique observations**.

## 4. Statistical Summary (Core Variables)
| Variable | Count | Mean | Std Dev | Min | 25% | Median (50%) | 75% | Max | Skewness | Kurtosis |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| **PM2.5** | 2183 | 147.02 | 72.67 | 1.00 | 94.50 | 139.00 | 190.00 | 427.00 | 0.61 | 0.20 |
| **RH** | 2183 | 65.85 | 15.57 | 36.00 | 51.00 | 68.00 | 79.00 | 95.00 | -0.19 | -1.20 |
| **WD** | 2183 | 159.84 | 67.84 | 7.00 | 114.00 | 153.00 | 212.00 | 332.00 | 0.30 | -0.53 |
| **SR** | 2171 | 126.86 | 142.87 | 2.00 | 5.00 | 5.00 | 307.50 | 334.00 | 0.43 | -1.69 |
| **BP** | 2183 | 737.65 | 6.29 | 726.00 | 730.00 | 740.00 | 742.00 | 749.00 | -0.70 | -0.85 |
| **AT** | 2183 | 15.03 | 2.75 | 11.00 | 13.00 | 15.00 | 17.00 | 23.00 | 0.52 | -0.64 |

## 5. Physical Range and Domain Validity Checks
| Variable | Observed Range | Expected Physical Domain | Validity Status | Notes |
|:---|:---|:---|:---|:---|
| **PM2.5** | [1.0, 427.0] | Realistic environmental bounds | **PASSED (Valid)** | No negative or physically impossible values |
| **RH** | [36.0, 95.0] | Realistic environmental bounds | **PASSED (Valid)** | No negative or physically impossible values |
| **WD** | [7.0, 332.0] | Realistic environmental bounds | **PASSED (Valid)** | No negative or physically impossible values |
| **SR** | [2.0, 334.0] | Realistic environmental bounds | **PASSED (Valid)** | No negative or physically impossible values |
| **BP** | [726.0, 749.0] | Realistic environmental bounds | **PASSED (Valid)** | No negative or physically impossible values |
| **AT** | [11.0, 23.0] | Realistic environmental bounds | **PASSED (Valid)** | No negative or physically impossible values |

## 6. Target Variable (PM2.5) Distribution Analysis
- **Sample Count:** 2183
- **Mean:** 147.02 µg/m³
- **Standard Deviation:** 72.67 µg/m³
- **Minimum:** 1.00 µg/m³
- **Median (50th percentile):** 139.00 µg/m³
- **Maximum:** 427.00 µg/m³
- **Interquartile Range (IQR):** 95.50 µg/m³
- **Distribution Skewness:** 0.61 (moderate positive right-skewness)
- **Kurtosis:** 0.20
- **Statistical IQR Outliers:** 31 rows above Q3 + 1.5×IQR (333.2 µg/m³)

> **Scientific Context:** High PM2.5 values (up to 427 µg/m³) are well-documented severe winter smog episodes in the National Capital Region (Delhi), where meteorological stagnation traps particulate emissions. These values represent genuine pollution spikes rather than measurement errors.