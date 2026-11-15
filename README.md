# Explainable AI-Based Air Pollution Prediction and Source Attribution

[![Phase 1 Complete](https://img.shields.io/badge/Phase%201-Completed-brightgreen.svg)]()
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)]()
[![Model: Random Forest Baseline](https://img.shields.io/badge/Model-Random%20Forest%20Baseline-orange.svg)]()
[![License: Academic](https://img.shields.io/badge/Project-B.Tech%20Capstone-blueviolet.svg)]()

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Problem Statement & Motivation](#problem-statement--motivation)
3. [Project Objectives](#project-objectives)
4. [Dataset Description](#dataset-description)
5. [Repository Structure](#repository-structure)
6. [Technologies Used](#technologies-used)
7. [Environment Setup & Installation](#environment-setup--installation)
8. [Step-by-Step Execution Guide](#step-by-step-execution-guide)
9. [Exploratory Data Analysis (EDA) Visualizations](#exploratory-data-analysis-eda-visualizations)
10. [Model Evaluation & Performance Metrics](#model-evaluation--performance-metrics)
11. [Current Phase 1 Progress Summary](#current-phase-1-progress-summary)
12. [Scientific Boundaries & Limitations](#scientific-boundaries--limitations)
13. [Future Roadmap (Phases 2 & 3)](#future-roadmap-phases-2--3)

---

## Project Overview

Air pollution is one of the most critical environmental and public health hazards in modern urban regions, with fine particulate matter ($\text{PM}_{2.5}$) being the primary contributor to severe respiratory and cardiovascular mortality. 

This final-year B.Tech capstone project aims to design an **Explainable AI (XAI)** system for predicting $\text{PM}_{2.5}$ pollutant levels and interpreting the meteorological mechanisms driving localized pollution episodes.

> **Current Phase Status (Phase 1):**  
> Complete execution and verification of **Dataset Analysis, Data Preprocessing, Exploratory Data Analysis (EDA), and a Baseline Random Forest Regressor Pipeline**.

---

## Problem Statement & Motivation

Urban centers such as the National Capital Region (Delhi) suffer from chronic, hazardous smog episodes characterized by particulate concentrations exceeding World Health Organization (WHO) and Indian National Ambient Air Quality Standards (NAAQS) by multiple folds. 

Traditional dispersion and chemical transport models are computationally demanding and require extensive real-time emission inventories. While contemporary machine learning algorithms can predict particulate matter concentrations, they often function as opaque "black boxes." 

This project addresses this challenge in structured phases:
1. **Phase 1 (This Phase):** Establishing an empirical data understanding, leak-free preprocessing, exploratory data analysis, and an end-to-end baseline regression model.
2. **Subsequent Phases:** Implementing advanced ensemble regressors, deep learning architectures, local/global Explainable AI frameworks (SHAP, LIME), and interactive decision dashboards.

---

## Project Objectives

- **Dataset Verification:** Perform comprehensive auditing of raw data, feature data types, missingness, duplicates, and physical validity.
- **Leak-Free Preprocessing:** Clean extra sheet artifacts, justify and eliminate duplicate rows to prevent cross-split leakage, and encapsulate median imputation within an isolated Scikit-learn Pipeline.
- **Exploratory Data Analysis:** Generate 9 publication-grade visualizations examining target distributions, meteorological correlations, and particulate trends.
- **Baseline Machine Learning Pipeline:** Train a reproducible `RandomForestRegressor` baseline model strictly on verified meteorological features.
- **Empirical Metric Logging:** Evaluate test-set performance using MAE, MSE, RMSE, and $R^2$ on a held-out 20% test split, generating diagnostic residual and feature importance plots.
- **Reproducible Execution:** Deliver a unified one-command execution script (`main.py`) and an interactive Jupyter Notebook.

---

## Dataset Description

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
│   └── evaluate_model.py                    # Test metrics, residual plots, and report
│
├── models/
│   └── random_forest.pkl                    # Serialized baseline pipeline (imputer + RF)
│
├── results/
│   ├── graphs/                              # 12 Generated High-DPI Visualizations
│   │   ├── pm25_distribution_histogram.png
│   │   ├── pm25_boxplot.png
│   │   ├── correlation_heatmap.png
│   │   ├── rh_vs_pm25_scatter.png
│   │   ├── wd_vs_pm25_scatter.png
│   │   ├── sr_vs_pm25_scatter.png
│   │   ├── bp_vs_pm25_scatter.png
│   │   ├── at_vs_pm25_scatter.png
│   │   ├── feature_distributions.png
│   │   ├── actual_vs_predicted.png
│   │   ├── residual_plot.png
│   │   └── feature_importance.png
│   ├── metrics/                             # Empirical test-set metrics
│   │   ├── model_metrics.json
│   │   └── model_metrics.csv
│   └── reports/                             # Detailed documentation reports
│       ├── data_inspection_report.md
│       ├── preprocessing_report.md
│       ├── eda_report.md
│       └── model_evaluation_report.md
│
├── main.py                                  # One-command end-to-end execution pipeline
├── requirements.txt                         # Exact pinned Python dependencies
├── .gitignore                               # Git ignore configuration
└── README.md                                # Comprehensive capstone project documentation
```

---

## Technologies Used

- **Programming Language:** Python 3.11+
- **Data Manipulation & I/O:** `pandas`, `openpyxl`, `numpy`
- **Visualization & Plotting:** `matplotlib`, `seaborn`
- **Machine Learning & Pipeline Engineering:** `scikit-learn`
- **Model Serialization:** `joblib`
- **Interactive Computing:** `jupyter`, `ipykernel`

---

## Environment Setup & Installation

### Option 1: Standard Python Virtual Environment

```bash
# 1. Clone repository (if working from a fresh environment)
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

Execute the complete Phase 1 pipeline from data inspection to test-set inference:

```bash
python main.py
```

This single command automatically:
1. Audits and inspects `dataset/Delhi Final(1).xlsx`.
2. Preprocesses features, deduplicates records, and splits data (80% train / 20% test).
3. Generates all 9 Exploratory Data Analysis figures in `results/graphs/`.
4. Trains the baseline `RandomForestRegressor` and serializes it to `models/random_forest.pkl`.
5. Evaluates model performance on the held-out 406 test samples, generating diagnostic plots and metrics files.
6. Executes a live test prediction on an unseen sample to verify inference readiness.

### Run Individual Modules Independently

```bash
# 1. Data Inspection only
python src/data_inspection.py

# 2. Preprocessing & Data Splitting only
python src/preprocessing.py

# 3. EDA Visualizations only
python src/eda.py

# 4. Model Training only
python src/train_random_forest.py

# 5. Model Evaluation only
python src/evaluate_model.py
```

### Run Interactive Jupyter Notebook

```bash
jupyter notebook notebooks/01_data_analysis.ipynb
```

---

## Exploratory Data Analysis (EDA) Visualizations

All generated plots are saved in `results/graphs/` with 300 DPI resolution:

1. **`pm25_distribution_histogram.png`:** Shows right-skewed distribution of $\text{PM}_{2.5}$ (mean: 147.0 $\mu\text{g/m}^3$, median: 139.0 $\mu\text{g/m}^3$) with peak values reaching up to 427 $\mu\text{g/m}^3$ during episodic winter events.
2. **`pm25_boxplot.png`:** Highlights interquartile dispersion ($\text{IQR} = 95.5\,\mu\text{g/m}^3$) and statistical high-pollution spikes above the upper whisker ($Q_3 + 1.5\times\text{IQR} = 333.25\,\mu\text{g/m}^3$).
3. **`correlation_heatmap.png`:** Quantifies linear Pearson correlations across all 6 core variables, confirming the absence of severe multicollinearity ($|r| < 0.85$).
4. **`rh_vs_pm25_scatter.png`:** Demonstrates that elevated humidity ($>70\%$) correlates with high $\text{PM}_{2.5}$ accumulation under calm winds.
5. **`wd_vs_pm25_scatter.png`:** Illustrates wind direction distributions and localized plume dispersion.
6. **`sr_vs_pm25_scatter.png`:** Shows that near-zero nocturnal solar radiation coincides with shallow boundary layers and severe particulate trapping.
7. **`bp_vs_pm25_scatter.png`:** Reflects anticyclonic subsidence inversions under high barometric pressure ($>735\,\text{mmHg}$).
8. **`at_vs_pm25_scatter.png`:** Displays the inverse relationship where colder winter temperatures ($<15^\circ\text{C}$) trap pollutants near ground level.
9. **`feature_distributions.png`:** Multi-panel grid verifying smooth, non-anomalous distributions for all 5 input features.

---

## Model Evaluation & Performance Metrics

The baseline model was evaluated strictly on the **held-out 20% test partition (406 unseen samples)**:

| Metric | Test Set Value | Training Set Value | Target Unit | Beginner-Friendly Interpretation |
|:---|:---:|:---:|:---:|:---|
| **Mean Absolute Error (MAE)** | **25.62** | 10.18 | $\mu\text{g/m}^3$ | On average, predictions deviate by only **$25.62\,\mu\text{g/m}^3$** from the ground-truth monitor reading. |
| **Mean Squared Error (MSE)** | **1447.90** | 221.00 | $(\mu\text{g/m}^3)^2$ | Average squared residual, penalizing large peak misses. |
| **Root Mean Squared Error (RMSE)** | **38.05** | 14.87 | $\mu\text{g/m}^3$ | Standard deviation of prediction residuals (**$38.05\,\mu\text{g/m}^3$**). |
| **Coefficient of Determination ($R^2$)** | **0.7269** | 0.9580 | Dimensionless | The baseline model explains **$72.69\%$ of the variance** in $\text{PM}_{2.5}$ using meteorological inputs alone. |

### Evaluation Visualizations:
- **`results/graphs/actual_vs_predicted.png`:** Scatter plot comparing true values against model forecasts along the 1:1 diagonal line.
- **`results/graphs/residual_plot.png`:** Demonstrates well-behaved, symmetric residual dispersion centered around the zero-error axis without catastrophic bias.
- **`results/graphs/feature_importance.png`:** Displays Gini impurity reduction ranking:
  - **RH (Relative Humidity):** **$37.39\%$**
  - **WD (Wind Direction):** **$22.78\%$**
  - **BP (Barometric Pressure):** **$18.33\%$**
  - **SR (Solar Radiation):** **$16.77\%$**
  - **AT (Air Temperature):** **$4.73\%$**

---

## Current Phase 1 Progress Summary

- [x] Cloned and verified the GitHub repository structure.
- [x] Located, validated, and ingested `dataset/Delhi Final(1).xlsx`.
- [x] Completed rigorous data auditing, identifying and removing empty sheet artifacts.
- [x] Handled 156 duplicate rows with scientific justification, ensuring zero train-test data leakage.
- [x] Built a Scikit-learn Pipeline with `SimpleImputer(strategy='median')` fitted strictly on training data.
- [x] Generated and saved all 9 required Exploratory Data Analysis figures in `results/graphs/`.
- [x] Trained a reproducible `RandomForestRegressor` baseline model (`seed=42`).
- [x] Serialized the trained pipeline bundle to `models/random_forest.pkl`.
- [x] Calculated and logged test-set metrics (MAE, MSE, RMSE, $R^2$) to JSON and CSV.
- [x] Generated diagnostic evaluation plots (Actual vs. Predicted, Residuals, Feature Importance).
- [x] Implemented a single-command orchestrator (`main.py`) and verified end-to-end execution.
- [x] Verified model loading and tested inference on a live test sample.
- [x] Authored an interactive analysis notebook (`notebooks/01_data_analysis.ipynb`).
- [x] Documented all scientific limitations and prepared `.gitignore`.

---

## Scientific Boundaries & Limitations

To maintain academic rigor and scientific integrity, the following limitations are explicitly documented:

1. **Absence of Timestamps:** The dataset contains no confirmed timestamp or date headers. It is strictly analyzed as cross-sectional tabular data. **No artificial timestamps were fabricated**, and this dataset cannot support genuine autoregressive time-series forecasting (e.g. ARIMA, Prophet, LSTM) without genuine temporal sequencing.
2. **Feature Scope:** The dataset contains $\text{PM}_{2.5}$ as the solitary target and 5 meteorological predictors (`RH`, `WD`, `SR`, `BP`, `AT`). **No synthetic pollutant columns** (such as $\text{NO}_2, \text{SO}_2, \text{CO}, \text{O}_3$) were invented.
3. **Feature Importance vs. Source Attribution:** Random Forest feature importance measures variance reduction across decision trees. It indicates which meteorological variables the model relied upon to minimize $\text{PM}_{2.5}$ prediction error. **It does NOT prove chemical or industrial source attribution** (e.g., vehicular vs. stubble burning vs. industrial power plants).
4. **Baseline Characterization:** Phase 1 delivers a meteorological $\text{PM}_{2.5}$ **prediction baseline**, not a completed source attribution system.

---

## Future Roadmap (Phases 2 & 3)

The following advanced capabilities will be developed in future phases according to project scope:
- **Phase 2:** Advanced Gradient Boosting (XGBoost, LightGBM, CatBoost), Hyperparameter Optimization, and Model Cross-Benchmarking.
- **Phase 3:** Explainable AI (XAI) Integration with SHAP (TreeExplainer, force plots, summary beeswarm plots) and LIME (local explanation surrogate models).
- **Phase 4:** Production Full-Stack Application (Flask/FastAPI backend, React user interface, MongoDB persistence, and cloud deployment).
