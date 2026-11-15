# Explainable AI-Based Air Pollution Prediction and Source Attribution

[![Phase 1 Complete](https://img.shields.io/badge/Phase%201-Completed-brightgreen.svg)]()
[![Phase 2 Complete](https://img.shields.io/badge/Phase%202-Completed-brightgreen.svg)]()
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)]()
[![Models: Random Forest & XGBoost](https://img.shields.io/badge/Models-RF%20%7C%20XGBoost-orange.svg)]()
[![License: Academic](https://img.shields.io/badge/Project-B.Tech%20Capstone-blueviolet.svg)]()

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Problem Statement & Motivation](#problem-statement--motivation)
3. [Project Objectives](#project-objectives)
4. [Dataset Description & Quality Audit](#dataset-description--quality-audit)
5. [Repository Structure](#repository-structure)
6. [Technologies Used](#technologies-used)
7. [Environment Setup & Installation](#environment-setup--installation)
8. [Step-by-Step Execution Guide](#step-by-step-execution-guide)
9. [Phase 1: EDA & Baseline Random Forest](#phase-1-eda--baseline-random-forest)
10. [Phase 2: XGBoost Development & Hyperparameter Tuning](#phase-2-xgboost-development--hyperparameter-tuning)
11. [Random Forest vs. XGBoost Head-to-Head Comparison](#random-forest-vs-xgboost-head-to-head-comparison)
12. [Model Interpretation & Feature Importance](#model-interpretation--feature-importance)
13. [Scientific Boundaries & Limitations](#scientific-boundaries--limitations)
14. [Future Roadmap (Phases 3 & 4)](#future-roadmap-phases-3--4)

---

## Project Overview

Air pollution is one of the most critical environmental and public health hazards in modern urban regions, with fine particulate matter ($\text{PM}_{2.5}$) being the primary contributor to severe respiratory and cardiovascular morbidity. 

This final-year B.Tech capstone project aims to design an **Explainable AI (XAI)** system for predicting ambient $\text{PM}_{2.5}$ pollutant concentrations and attributing variations to underlying meteorological drivers.

> **Current Project Status (Phases 1 & 2 Complete):**  
> - **Phase 1:** Dataset Inspection, Leak-Free Preprocessing, Exploratory Data Analysis (EDA), and a Baseline Random Forest Regressor Pipeline.  
> - **Phase 2:** XGBoost Regressor Development, 5-Fold Cross-Validated Hyperparameter Optimization (`RandomizedSearchCV`), and a rigorous head-to-head empirical comparison on an identical held-out test set.

---

## Problem Statement & Motivation

Urban centers such as the National Capital Region (Delhi) suffer from chronic, hazardous smog episodes characterized by particulate concentrations exceeding World Health Organization (WHO) and Indian National Ambient Air Quality Standards (NAAQS) by multiple folds. 

Traditional atmospheric dispersion models are computationally demanding and require extensive real-time emission inventories. While machine learning algorithms can model non-linear pollutant behavior, they often function as opaque black boxes. 

This project addresses this challenge in structured phases:
1. **Phase 1:** Establishing an empirical data understanding, leak-free preprocessing, exploratory data analysis, and an end-to-end baseline Random Forest model.
2. **Phase 2 (Completed):** Developing an optimized Extreme Gradient Boosting (`XGBRegressor`) pipeline, performing systematic hyperparameter tuning, and comparing models on identical held-out test observations.
3. **Subsequent Phases:** Implementing Explainable AI frameworks (SHAP, LIME), followed by a production full-stack application and interactive dashboard.

---

## Project Objectives

- **Dataset Verification:** Perform comprehensive auditing of raw data, feature data types, missingness, duplicates, and physical validity.
- **Leak-Free Preprocessing:** Clean extra sheet artifacts, justify and eliminate duplicate rows to prevent cross-split leakage, and encapsulate median imputation within an isolated Scikit-learn Pipeline.
- **Exploratory Data Analysis:** Generate 9 publication-grade visualizations examining target distributions, meteorological correlations, and particulate trends.
- **Baseline Machine Learning Pipeline:** Train a reproducible `RandomForestRegressor` baseline model strictly on verified meteorological features.
- **XGBoost Development & Tuning:** Construct an `XGBRegressor` pipeline and optimize key hyperparameters using 5-fold cross-validation strictly on training data.
- **Empirical Cross-Model Comparison:** Evaluate both models using identical held-out test observations, comparing MAE, MSE, RMSE, and $R^2$, and analyzing feature importance discrepancies.
- **Reproducible Execution:** Deliver a unified one-command execution script (`main.py`) and an interactive Jupyter Notebook.

---

## Dataset Description & Quality Audit

The dataset analyzed is **`Delhi Final(1).xlsx`**, containing real-world ambient environmental measurements from continuous monitoring stations in Delhi.

### Verified Column Schema:
| Column | Variable Role | Units | Description & Expected Domain |
|:---|:---|:---:|:---|
| **`PM2.5`** | **Target ($y$)** | $\mu\text{g/m}^3$ | Fine inhalable particulate matter ($\le 2.5\,\mu\text{m}$) |
| **`RH`** | **Input Feature ($X_1$)** | $\%$ | Ambient Relative Humidity ($0\text{--}100\%$) |
| **`WD`** | **Input Feature ($X_2$)** | Degrees ($^\circ$) | Wind Direction ($0\text{--}360^\circ$ clockwise from True North) |
| **`SR`** | **Input Feature ($X_3$)** | $\text{W/m}^2$ | Solar Radiation intensity |
| **`BP`** | **Input Feature ($X_4$)** | $\text{mmHg}$ | Barometric Atmospheric Pressure |
| **`AT`** | **Input Feature ($X_5$)** | $^\circ\text{C}$ | Ambient Air Temperature |

### Key Dataset Audit Findings:
- **Total Raw Observations:** 2,183 rows across 13 columns.
- **Artifact Columns:** Columns `Unnamed: 6` to `Unnamed: 12` are empty Excel artifacts (with a single text label `'Delhi'` in row 4) and were dropped.
- **Duplicate Rows:** 156 duplicate rows were identified. These arise from stagnant nocturnal conditions where sensor logs repeat. To eliminate cross-fold data leakage in tabular regression, duplicate records were dropped, yielding **2,027 unique observations**.
- **Missing Values:** Only Solar Radiation (`SR`) had missing entries (**12 out of 2,183 rows, or 0.55%**). These are cleanly imputed using training-set medians.
- **Physical Validity:** All values fall within physically realistic environmental ranges (no negative concentrations, temperatures, or impossible humidities).

---

## Repository Structure

```text
Air-Pollution-XAI/
│
├── dataset/
│   ├── Delhi Final(1).xlsx                  # Original raw Excel dataset
│   └── preprocessed_delhi_air_quality.csv   # Preprocessed, deduplicated dataset
│
├── notebooks/
│   └── 01_data_analysis.ipynb              # Complete interactive analysis notebook
│
├── src/
│   ├── __init__.py                          # Package identifier
│   ├── data_inspection.py                   # Raw data audit and quality assessment
│   ├── preprocessing.py                     # Data cleaning, split, and imputer pipeline
│   ├── eda.py                               # 9 publication-grade EDA visualizations
│   ├── train_random_forest.py               # Baseline Random Forest model training
│   ├── evaluate_model.py                    # Random Forest evaluation and metrics
│   ├── train_xgboost.py                     # Phase 2: XGBoost training and tuning
│   └── compare_models.py                    # Phase 2: Head-to-head model comparison
│
├── models/
│   ├── random_forest.pkl                    # Serialized baseline pipeline (imputer + RF)
│   └── xgboost_model.pkl                    # Serialized Phase 2 pipeline (imputer + XGBoost)
│
├── results/
│   ├── graphs/                              # 17 Generated High-DPI Visualizations
│   │   ├── pm25_distribution_histogram.png
│   │   ├── pm25_boxplot.png
│   │   ├── correlation_heatmap.png
│   │   ├── rh_vs_pm25_scatter.png
│   │   ├── wd_vs_pm25_scatter.png
│   │   ├── sr_vs_pm25_scatter.png
│   │   ├── bp_vs_pm25_scatter.png
│   │   ├── at_vs_pm25_scatter.png
│   │   ├── feature_distributions.png
│   │   ├── actual_vs_predicted.png          # Random Forest actual vs. predicted
│   │   ├── residual_plot.png                # Random Forest residuals
│   │   ├── feature_importance.png           # Random Forest feature importance
│   │   ├── xgboost_actual_vs_predicted.png  # XGBoost actual vs. predicted
│   │   ├── xgboost_residual_plot.png        # XGBoost residuals
│   │   ├── xgboost_feature_importance.png   # XGBoost feature importance
│   │   ├── model_comparison_mae.png         # Head-to-head MAE bar chart
│   │   ├── model_comparison_rmse.png        # Head-to-head RMSE bar chart
│   │   ├── model_comparison_r2.png          # Head-to-head R² bar chart
│   │   ├── model_comparison_metrics.png     # Multi-metric comparative dashboard
│   │   └── model_comparison_feature_importance.png # Grouped feature importance comparison
│   ├── metrics/                             # Empirical test-set metrics
│   │   ├── model_metrics.json               # Random Forest metrics
│   │   ├── model_metrics.csv
│   │   ├── xgboost_best_parameters.json     # Tuned XGBoost hyperparameters
│   │   ├── xgboost_metrics.json             # XGBoost metrics
│   │   └── model_comparison.csv             # Cross-model evaluation table
│   └── reports/                             # Detailed documentation reports
│       ├── data_inspection_report.md
│       ├── preprocessing_report.md
│       ├── eda_report.md
│       ├── model_evaluation_report.md       # Random Forest report
│       ├── xgboost_report.md                # Phase 2 XGBoost report
│       └── model_comparison_report.md       # Comparative analysis report
│
├── main.py                                  # One-command end-to-end execution pipeline
├── requirements.txt                         # Pinned Python dependencies
├── .gitignore                               # Git ignore configuration
└── README.md                                # Comprehensive capstone project documentation
```

---

## Technologies Used

- **Programming Language:** Python 3.11+
- **Machine Learning & Gradient Boosting:** `scikit-learn`, `xgboost`
- **Data Manipulation & I/O:** `pandas`, `openpyxl`, `numpy`
- **Visualization & Plotting:** `matplotlib`, `seaborn`
- **Model Serialization:** `joblib`
- **Interactive Computing:** `jupyter`, `ipykernel`

---

## Environment Setup & Installation

### Option 1: Standard Python Virtual Environment

```bash
# 1. Clone repository
git clone https://github.com/BhanuDanda-09/Air-Pollution-XAI.git
cd Air-Pollution-XAI

# 2. Create virtual environment
python -m venv .venv

# 3. Activate virtual environment
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt
```

### Option 2: Fast Installation via `uv`

```bash
uv venv --python 3.11 .venv
uv pip install -r requirements.txt
```

---

## Step-by-Step Execution Guide

### Run End-to-End Workflow with a Single Command

Execute the complete Phase 1 & Phase 2 pipeline:

```bash
python main.py
```

To force retraining and hyperparameter re-tuning from scratch:

```bash
python main.py --retrain
```

### Run Individual Modules Independently

```bash
# 1. Dataset Inspection only
python src/data_inspection.py

# 2. Preprocessing & Data Splitting only
python src/preprocessing.py

# 3. EDA Visualizations only
python src/eda.py

# 4. Train Random Forest Baseline only
python src/train_random_forest.py

# 5. Evaluate Random Forest only
python src/evaluate_model.py

# 6. Train & Tune XGBoost only
python src/train_xgboost.py

# 7. Run Model Comparison only
python src/compare_models.py
```

### Run Interactive Jupyter Notebook

```bash
jupyter notebook notebooks/01_data_analysis.ipynb
```

---

## Phase 1: EDA & Baseline Random Forest

In Phase 1, data auditing and exploratory analysis confirmed the absence of negative or out-of-domain measurements. Baseline modeling established an initial benchmark:
- **Architecture:** `RandomForestRegressor(n_estimators=100, random_state=42)`
- **Evaluation Partition:** 406 held-out test samples (20% split)
- **Baseline Test Metrics:**
  - $\text{MAE} = 25.62\,\mu\text{g/m}^3$
  - $\text{RMSE} = 38.05\,\mu\text{g/m}^3$
  - $R^2 = 0.7269$ ($72.69\%$ variance explained)

---

## Phase 2: XGBoost Development & Hyperparameter Tuning

In Phase 2, Extreme Gradient Boosting (`XGBRegressor`) was implemented to test whether sequential boosting and regularized tree learning improve upon bagging ensembles.

### Hyperparameter Tuning Methodology:
- **Optimization Strategy:** `RandomizedSearchCV` across 30 iterations with 5-fold cross-validation.
- **Search Space:** Tree depth ($3\text{--}8$), learning rate ($0.01\text{--}0.15$), subsampling ($0.6\text{--}1.0$), column subsampling ($0.6\text{--}1.0$), min child weight ($1\text{--}10$), and L1/L2 regularization terms ($\alpha, \lambda$).
- **Leakage Prevention:** Cross-validation was conducted **strictly on the 1,621 training samples**. The test set remained completely untouched during tuning.
- **Best 5-Fold CV Training RMSE:** **$39.25\,\mu\text{g/m}^3$**

### Optimal Hyperparameters Found:
| Hyperparameter | Value | Functional Role |
|:---|:---:|:---|
| **`n_estimators`** | `250` | Number of sequential boosting rounds |
| **`max_depth`** | `7` | Maximum tree depth per weak learner |
| **`learning_rate`** | `0.1` | Step size shrinkage ($\eta$) to prevent overfitting |
| **`subsample`** | `0.9` | Fraction of training rows sampled per tree |
| **`colsample_bytree`**| `0.8` | Feature subsampling ratio per tree |
| **`min_child_weight`**| `2` | Minimum hessian weight required in child nodes |
| **`reg_lambda`** | `5.0` | L2 leaf regularization parameter |
| **`reg_alpha`** | `0.0` | L1 leaf regularization parameter |

---

## Random Forest vs. XGBoost Head-to-Head Comparison

Both models were evaluated on the **exact same 406 held-out test observations** (`seed=42`):

| Model Architecture | MAE ($\mu\text{g/m}^3$) | MSE $(\mu\text{g/m}^3)^2$ | RMSE ($\mu\text{g/m}^3$) | $R^2$ Score | Performance Rank |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Random Forest (Baseline)** | 25.62 | 1447.90 | 38.05 | 0.7269 ($72.69\%$) | 2nd |
| **XGBoost (Tuned)** | **25.28** | **1349.57** | **36.74** | **0.7455 ($74.55\%$)** | **1st (Top)** |

### Performance Analysis:
1. **Best-Performing Model:** **XGBoost achieved superior generalization** across all four performance indicators.
2. **Error Reductions:**
   - **MAE:** Improved from $25.62\,\mu\text{g/m}^3$ to **$25.28\,\mu\text{g/m}^3$** ($0.34\,\mu\text{g/m}^3$ reduction).
   - **RMSE:** Improved from $38.05\,\mu\text{g/m}^3$ to **$36.74\,\mu\text{g/m}^3$** ($1.31\,\mu\text{g/m}^3$ reduction).
   - **$R^2$ Variance Explained:** Improved from $72.69\%$ to **$74.55\%$** ($+1.85\%$ percentage points improvement).
3. **Algorithmic Justification:**
   - Random Forest fits trees independently using bootstrap aggregation (bagging).
   - XGBoost iteratively focuses new trees on the pseudo-residuals of earlier iterations, optimizing continuous gradients and applying L2 leaf penalties (`reg_lambda=5.0`), allowing it to capture subtle non-linear atmospheric boundaries more effectively.

---

## Model Interpretation & Feature Importance

### Feature Importance Comparison:
| Feature | Physical Meaning | Random Forest (Gini %) | XGBoost (Gain %) | Consensus Role |
|:---|:---|:---:|:---:|:---|
| **`RH`** | Relative Humidity (%) | **$37.39\%$** | **$27.36\%$** | Primary driver; high humidity accelerates secondary aerosol condensation. |
| **`AT`** | Air Temperature ($^\circ\text{C}$) | $4.73\%$ | **$21.81\%$** | High gain in XGBoost; cold temperatures govern thermal inversion trapping. |
| **`BP`** | Barometric Pressure ($\text{mmHg}$) | $18.33\%$ | **$19.99\%$** | Strong consensus; anticyclonic high pressure caps atmospheric ventilation. |
| **`SR`** | Solar Radiation ($\text{W/m}^2$) | $16.77\%$ | **$16.15\%$** | Daytime solar heating deepens boundary layer mixing, diluting PM2.5. |
| **`WD`** | Wind Direction ($^\circ$) | $22.78\%$ | **$14.69\%$** | Accounts for regional transport corridors across the Delhi airshed. |

### Interpretation of Calculations:
- **Random Forest (Mean Decrease in Impurity / Gini):** Total reduction in variance across all tree splits involving the feature.
- **XGBoost (Gain):** Average improvement in the objective loss function brought by a feature across all boosting iterations.
- **Scientific Caveat:** Feature importance measures mathematical model reliance, **not emission source causation**. Attributing $\text{PM}_{2.5}$ to specific chemical sources (e.g. stubble burning vs. vehicular traffic) requires chemical speciation or receptor modeling.

---

## Scientific Boundaries & Limitations

1. **No Temporal Forecasting Claim:** The dataset has no confirmed timestamp column. Observations are treated as cross-sectional tabular samples. It cannot be presented as an autoregressive time-series forecast (e.g. ARIMA, LSTM) without genuine timestamps.
2. **Predictor Feature Boundaries:** The dataset contains only $\text{PM}_{2.5}$ and 5 meteorological variables (`RH`, `WD`, `SR`, `BP`, `AT`). No additional pollutant columns ($\text{NO}_2, \text{SO}_2, \text{CO}, \text{O}_3$) were fabricated.
3. **Feature Importance vs. Emission Causation:** Feature importance reflects model split reliance to minimize prediction error. It does **not** prove chemical or industrial emission source attribution.
4. **Current Scope:** Phase 2 provides an optimized gradient boosted regressor and empirical model benchmark, completing classical ML model development.

---

## Future Roadmap (Phases 3 & 4)

- **Phase 3:** Explainable AI (XAI) Integration with SHAP (SHapley Additive exPlanations: TreeExplainer, beeswarm plots, dependence plots, waterfall plots) and LIME (Local Interpretable Model-agnostic Explanations).
- **Phase 4:** Production Full-Stack Application (Flask/FastAPI backend, React user interface, MongoDB persistence, and cloud deployment).
