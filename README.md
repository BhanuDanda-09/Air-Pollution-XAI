# Explainable AI-Based Air Pollution Prediction and Source Attribution

[![Phase 1 Complete](https://img.shields.io/badge/Phase%201-Completed-brightgreen.svg)]()
[![Phase 2 Complete](https://img.shields.io/badge/Phase%202-Completed-brightgreen.svg)]()
[![Phase 3 Complete](https://img.shields.io/badge/Phase%203-Completed-brightgreen.svg)]()
[![Phase 4 Complete](https://img.shields.io/badge/Phase%204-Completed-brightgreen.svg)]()
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)]()
[![TensorFlow: Keras 3](https://img.shields.io/badge/Deep%20Learning-TensorFlow%20%7C%20Keras%203-orange.svg)]()
[![Explainability: SHAP & LIME](https://img.shields.io/badge/XAI-SHAP%20%7C%20LIME-purple.svg)]()
[![License: Academic](https://img.shields.io/badge/Project-B.Tech%20Capstone-blueviolet.svg)]()

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Problem Statement & Motivation](#problem-statement--motivation)
3. [Project Objectives Across Phases](#project-objectives-across-phases)
4. [Dataset Description & Quality Audit](#dataset-description--quality-audit)
5. [Repository Structure](#repository-structure)
6. [Technologies Used](#technologies-used)
7. [Environment Setup & Installation](#environment-setup--installation)
8. [Step-by-Step Execution Guide](#step-by-step-execution-guide)
9. [Phase 1: EDA & Baseline Random Forest](#phase-1-eda--baseline-random-forest)
10. [Phase 2: XGBoost Development & Model Comparison](#phase-2-xgboost-development--model-comparison)
11. [Phase 3: Explainable AI using SHAP & LIME](#phase-3-explainable-ai-using-shap--lime)
12. [Phase 4: Deep Learning & Sequence Modeling](#phase-4-deep-learning--sequence-modeling)
    - [Track A: Multilayer Perceptron (MLP) Deep Learning](#track-a-multilayer-perceptron-mlp-deep-learning)
    - [Track B: Time-Series Sequence Models (LSTM & Transformer)](#track-b-time-series-sequence-models-lstm--transformer)
    - [Cross-Model Benchmark (RF vs. XGBoost vs. MLP)](#cross-model-benchmark-rf-vs-xgboost-vs-mlp)
    - [Interactive Prediction Tool](#interactive-prediction-tool)
13. [Crucial Scientific Limitations](#crucial-scientific-limitations)
14. [Future Roadmap (Phase 5)](#future-roadmap-phase-5)

---

## Project Overview

Air pollution is among the most severe environmental health emergencies in modern urban areas, with fine particulate matter ($\text{PM}_{2.5}$) being the primary contributor to cardiovascular and pulmonary illnesses.

This final-year B.Tech capstone project establishes a complete **Explainable AI (XAI)** framework for predicting ambient $\text{PM}_{2.5}$ concentrations and demystifying the underlying meteorological drivers behind localized pollution spikes in Delhi.

> **Project Status (Phases 1, 2, 3, and 4 Complete):**  
> - **Phase 1:** Dataset Audit, Leak-Free Preprocessing, Exploratory Data Analysis (EDA), and Baseline Random Forest Regressor.  
> - **Phase 2:** XGBoost Regressor with 5-Fold Cross-Validation Tuning (`RandomizedSearchCV`) and Head-to-Head Model Comparison.  
> - **Phase 3:** Global and Local Explainability using **SHAP** (`TreeExplainer`) and **LIME** (`LimeTabularExplainer`), generating beeswarm plots, dependence curves, waterfall breakdowns, force plots, and local surrogate explanations.  
> - **Phase 4:** Deep Learning Multilayer Perceptron (MLP) via TensorFlow/Keras, Time-Series Sequence Modeling verification (LSTM & Transformer), Comprehensive 3-Model Benchmark, and Interactive Prediction CLI.

---

## Problem Statement & Motivation

Urban airsheds like the National Capital Region (Delhi) regularly endure toxic winter smog episodes where $\text{PM}_{2.5}$ levels exceed World Health Organization (WHO) safety thresholds by more than 20-fold. 

While machine learning models can capture non-linear interactions between weather patterns and aerosol accumulation, standard models operate as opaque "black boxes." In critical decision-support environments such as municipal environmental departments, stakeholders cannot blindly trust black-box outputs. 

This project bridges the gap between **predictive accuracy** and **interpretability** through structured, rigorous phases.

---

## Project Objectives Across Phases

- **Phase 1:** Clean artifact columns, eliminate 156 duplicate rows to prevent train-test leakage, generate 9 publication-grade EDA visualizations, and train a reproducible `RandomForestRegressor` baseline pipeline.
- **Phase 2:** Develop an `XGBRegressor` pipeline, optimize hyperparameters across 30 iterations with 5-fold cross-validation strictly on training data, evaluate on the identical held-out test set, and compare performance head-to-head.
- **Phase 3:** Apply **SHAP** (`TreeExplainer`) for global feature ranking and local game-theoretic attributions; apply **LIME** (`LimeTabularExplainer`) for continuous local neighborhood surrogates across 5 representative pollution scenarios; evaluate consensus and explain divergence between global and local explanation paradigms.

---

## Dataset Description & Quality Audit

The dataset analyzed is **`Delhi Final(1).xlsx`**, containing real-world continuous ambient air monitoring records from Delhi.

### Verified Column Schema:
| Column | Role | Units | Physical Bounds | Description |
|:---|:---|:---:|:---:|:---|
| **`PM2.5`** | **Target ($y$)** | $\mu\text{g/m}^3$ | $[1.0, 427.0]$ | Fine inhalable particulate matter ($\le 2.5\,\mu\text{m}$) |
| **`RH`** | **Feature ($X_1$)** | $\%$ | $[36.0, 95.0]$ | Ambient Relative Humidity |
| **`WD`** | **Feature ($X_2$)** | Degrees ($^\circ$) | $[7.0, 332.0]$ | Wind Direction ($0\text{--}360^\circ$ clockwise from True North) |
| **`SR`** | **Feature ($X_3$)** | $\text{W/m}^2$ | $[2.0, 334.0]$ | Solar Radiation intensity |
| **`BP`** | **Feature ($X_4$)** | $\text{mmHg}$ | $[726.0, 749.0]$ | Barometric Atmospheric Pressure |
| **`AT`** | **Feature ($X_5$)** | $^\circ\text{C}$ | $[11.0, 23.0]$ | Ambient Air Temperature |

### Quality Audit & Preprocessing Decisions:
- **Raw Dimensions:** 2,183 rows across 13 columns.
- **Artifact Columns:** Columns `Unnamed: 6` to `Unnamed: 12` contained 100% `NaN` values (with one stray text label `'Delhi'` in row 4) and were dropped.
- **Deduplication:** 156 duplicate rows were identified and removed. Because the dataset lacks timestamps, keeping identical rows creates cross-fold data leakage where identical samples appear in both train and test partitions. Removing duplicates left **2,027 unique samples**.
- **Missing Values:** Only `SR` contained missing entries (**12 out of 2,183 rows, or 0.55%**). These are cleanly imputed using `SimpleImputer(strategy='median')` fitted strictly on `X_train` ($160.0\,\text{W/m}^2$) within an isolated pipeline.
- **Partitions:** 80% Training ($1,621$ observations) and 20% Held-out Testing ($406$ observations) with `random_state=42`.

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
│   └── 01_data_analysis.ipynb              # Comprehensive 22-cell interactive analysis notebook
│
├── src/
│   ├── __init__.py                          # Package identifier
│   ├── data_inspection.py                   # Raw data audit and quality assessment
│   ├── preprocessing.py                     # Data cleaning, split, and imputer pipeline
│   ├── eda.py                               # 9 publication-grade EDA visualizations
│   ├── train_random_forest.py               # Phase 1: Baseline Random Forest pipeline
│   ├── evaluate_model.py                    # Phase 1: Random Forest test evaluation
│   ├── train_xgboost.py                     # Phase 2: XGBoost training and tuning
│   ├── compare_models.py                    # Phase 2: Head-to-head model comparison
│   ├── shap_explainability.py               # Phase 3: SHAP global & local explainability
│   ├── lime_explainability.py               # Phase 3: LIME local surrogate explanations
│   ├── compare_explanations.py              # Phase 3: Cross-method SHAP vs LIME comparison
│   ├── train_mlp.py                         # Phase 4 Track A: Multilayer Perceptron (MLP) training
│   ├── predict_mlp.py                       # Phase 4: Interactive PM2.5 prediction CLI
│   ├── train_lstm.py                        # Phase 4 Track B: LSTM sequence forecasting (validated)
│   ├── train_transformer.py                 # Phase 4 Track B: Transformer forecasting (validated)
│   └── compare_deep_learning.py             # Phase 4: Cross-model DL vs ML benchmark
│
├── models/
│   ├── random_forest.pkl                    # Serialized baseline pipeline (imputer + RF)
│   ├── xgboost_model.pkl                    # Serialized Phase 2 pipeline (imputer + XGBoost)
│   ├── mlp_model.keras                      # Serialized Phase 4 MLP model (TensorFlow/Keras)
│   └── mlp_scaler.pkl                       # Serialized feature scaling pipeline for MLP
│
├── results/
│   ├── graphs/                              # Generated High-Resolution Visualizations
│   │   ├── (Phase 1 EDA: 9 PNG plots)
│   │   ├── (Phase 1 RF: 3 diagnostic PNG plots)
│   │   ├── (Phase 2 XGBoost: 3 diagnostic PNG plots)
│   │   ├── (Phase 2 Comparison: 5 comparative PNG plots)
│   │   ├── shap/                            # Phase 3 SHAP Visualizations
│   │   ├── lime/                            # Phase 3 LIME Visualizations
│   │   ├── mlp/                             # Phase 4 MLP Diagnostic Plots (Loss, Error, Summary)
│   │   └── deep_learning_comparison/        # Phase 4 Comparison Plots (RMSE, MAE, R², Scatter, Metrics)
│   ├── metrics/                             # Metric logs and tabular outputs
│   │   ├── model_metrics.json               # Random Forest metrics
│   │   ├── xgboost_metrics.json             # XGBoost metrics
│   │   ├── mlp_metrics.json                 # MLP metrics
│   │   ├── mlp_training_history.csv         # Epoch-by-epoch loss convergence
│   │   ├── deep_learning_comparison.csv     # 3-way cross-model performance table
│   │   └── explainability_comparison.csv    # Cross-method explainability table
│   └── reports/                             # Detailed analytical markdown reports
│       ├── (Phases 1-3 analytical reports)
│       ├── deep_learning_comparison.md      # Deep learning comparative report
│       └── phase4_report.md                 # Comprehensive Phase 4 Capstone Report
│
├── main.py                                  # Modular CLI orchestrator supporting all phases (1-4)
├── requirements.txt                         # Pinned Python dependencies
├── .gitignore                               # Git ignore configuration
└── README.md                                # Comprehensive capstone project documentation
```

---

## Technologies Used

- **Programming Language:** Python 3.11+
- **Deep Learning Frameworks:** `tensorflow` (2.22.x), `keras` (3.x)
- **Machine Learning & Gradient Boosting:** `scikit-learn`, `xgboost`
- **Explainable AI Frameworks:** `shap` (0.54.1), `lime` (0.2.0.1)
- **Data Manipulation & Scientific Computing:** `pandas`, `openpyxl`, `numpy`, `scipy`
- **Visualization & Plotting:** `matplotlib` (Agg backend), `seaborn`
- **Model Serialization:** `joblib`, native Keras `.keras` HDF5/zip format
- **Interactive Computing:** `jupyter`, `ipykernel`

---

## Environment Setup & Installation

### Option 1: Standard Virtual Environment

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

# 4. Install all dependencies
pip install -r requirements.txt
```

### Option 2: Fast Installation via `uv`

```bash
uv venv --python 3.11 .venv
uv pip install -r requirements.txt
```

---

## Step-by-Step Execution Guide

### Run via Modular Command-Line Options

The unified orchestrator `main.py` provides targeted phase execution without redundant retraining:

```bash
# Execute Phase 1 only (Dataset Inspection, Preprocessing, EDA, RF Baseline)
python main.py --phase 1

# Execute Phase 2 only (XGBoost Training, Tuning & Model Comparison)
python main.py --phase 2

# Execute Phase 3 only (SHAP & LIME Global and Local Explainability)
python main.py --phase 3

# Execute Phase 4 only (MLP Deep Learning, Time-Series Audit & 3-Way Benchmark)
python main.py --phase 4

# Execute Complete Workflow (Phases 1 through 4 sequentially)
python main.py

# Force Model Retraining & Tuning from Scratch
python main.py --retrain
```

### Run Individual Modules Independently

```bash
python src/data_inspection.py        # Dataset quality audit
python src/preprocessing.py          # Data cleaning & 80/20 split
python src/eda.py                    # 9 EDA figures
python src/train_random_forest.py    # Random Forest baseline training
python src/evaluate_model.py         # Random Forest evaluation
python src/train_xgboost.py          # XGBoost 5-fold CV tuning
python src/compare_models.py         # RF vs. XGBoost comparison
python src/shap_explainability.py    # SHAP global & local explanations
python src/lime_explainability.py    # LIME local explanations
python src/compare_explanations.py   # SHAP vs. LIME cross-method comparison
python src/train_mlp.py              # Multilayer Perceptron (MLP) training
python src/predict_mlp.py --example  # Interactive PM2.5 prediction tool
python src/train_lstm.py             # LSTM time-series sequence pipeline
python src/train_transformer.py      # Transformer time-series pipeline
python src/compare_deep_learning.py  # 3-Way ML vs DL cross-model comparison
```

---

## Phase 1: EDA & Baseline Random Forest

Baseline Random Forest modeling established an initial benchmark:
- **Architecture:** `RandomForestRegressor(n_estimators=100, random_state=42)`
- **Evaluation Partition:** 406 held-out test samples (20% split)
- **Baseline Test Metrics:**
  - $\text{MAE} = 25.62\,\mu\text{g/m}^3$
  - $\text{RMSE} = 38.05\,\mu\text{g/m}^3$
  - $R^2 = 0.7269$ ($72.69\%$ variance explained)

---

## Phase 2: XGBoost Development & Model Comparison

Extreme Gradient Boosting (`XGBRegressor`) was optimized using `RandomizedSearchCV` with 5-fold cross-validation strictly on `X_train` (Best CV RMSE: $39.25\,\mu\text{g/m}^3$).

### Head-to-Head Comparison on Identical 406 Test Samples:
| Model Architecture | MAE ($\mu\text{g/m}^3$) | MSE $(\mu\text{g/m}^3)^2$ | RMSE ($\mu\text{g/m}^3$) | $R^2$ Score | Performance Rank |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Random Forest (Baseline)** | 25.62 | 1447.90 | 38.05 | 0.7269 ($72.69\%$) | 2nd |
| **XGBoost (Tuned)** | **25.28** | **1349.57** | **36.74** | **0.7455 ($74.55\%$)** | **1st (Top)** |

**Key Takeaway:** XGBoost achieved lower error ($\Delta\text{MAE} = -0.34\,\mu\text{g/m}^3$, $\Delta\text{RMSE} = -1.31\,\mu\text{g/m}^3$) and explained $+1.85\%$ more variance in $\text{PM}_{2.5}$, benefiting from gradient residual boosting and $L_2$ leaf weight regularization (`reg_lambda=5.0`).

---

## Phase 3: Explainable AI using SHAP & LIME

### Introduction to Explainable AI
Machine learning models are frequently deployed as black boxes that output point predictions without providing physical or logical justifications. In environmental forecasting, knowing *why* a model predicted $350\,\mu\text{g/m}^3$ (a severe public health emergency) versus $50\,\mu\text{g/m}^3$ is critical for regulatory validation and emergency interventions.

### Why Both SHAP and LIME Are Used
1. **SHAP (SHapley Additive exPlanations):**
   - Grounded in cooperative game theory (Lloyd Shapley, Nobel Prize in Economics).
   - Computes the unique additive attribution values that satisfy four fundamental mathematical properties: **Efficiency**, **Symmetry**, **Dummy Player**, and **Additivity**.
   - Provides **both Global Explainability** (aggregating attributions across all 406 test instances) and **Local Explainability** (waterfall and force plots).
2. **LIME (Local Interpretable Model-agnostic Explanations):**
   - Treats the model as a completely black box.
   - Perturbs the feature space around a single test point, weights perturbations using an exponential distance metric, and trains an interpretable linear surrogate model locally.
   - Provides **strictly Local Explainability**, answering: *“In the immediate meteorological vicinity of this specific observation, how does each feature nudge the prediction?”*

### SHAP Methodology & Findings

Using `shap.TreeExplainer`, SHAP values were calculated across all 406 held-out test observations for both Random Forest and XGBoost. Input features were passed through the pipeline's median imputer, strictly preserving feature names.

#### Global Feature Importance Ranking (Mean Absolute SHAP Value):
| Rank | Feature | Random Forest Mean \|SHAP\| | RF Rel. % | XGBoost Mean \|SHAP\| | XGB Rel. % | Consensus Role |
|:---:|:---|:---:|:---:|:---:|:---:|:---|
| **1** | **`RH` (Relative Humidity)** | **$37.49\,\mu\text{g/m}^3$** | **$48.11\%$** | **$32.42\,\mu\text{g/m}^3$** | **$40.76\%$** | Unanimous top driver; humidity drives secondary aerosol condensation. |
| **2** | **`WD` (Wind Direction)** | $12.02\,\mu\text{g/m}^3$ | $15.42\%$ | **$14.10\,\mu\text{g/m}^3$** | **$17.73\%$** | Ranks #2 in XGBoost; captures regional transport corridors into Delhi. |
| **3** | **`SR` (Solar Radiation)** | $13.12\,\mu\text{g/m}^3$ | $16.83\%$ | $13.59\,\mu\text{g/m}^3$ | $17.09\%$ | Strong consensus #2/#3; dictates daytime convective boundary layer depth. |
| **4** | **`BP` (Barometric Pressure)**| $12.25\,\mu\text{g/m}^3$ | $15.73\%$ | $11.83\,\mu\text{g/m}^3$ | $14.87\%$ | Consistent negative attribution; anticyclonic subsidence traps air. |
| **5** | **`AT` (Air Temperature)** | $3.04\,\mu\text{g/m}^3$ | $3.90\%$ | $7.60\,\mu\text{g/m}^3$ | $9.55\%$ | Higher attribution in XGBoost; captures winter thermal inversion caps. |

#### Visualizations Generated in `results/graphs/shap/`:
- **Summary Beeswarm Plots:** Reveal that high `RH` (red dots) shifts predictions strongly positive, while high `SR` and higher `AT` shift predictions negative (convective dispersion).
- **Global Feature Importance Plots:** Quantify mean absolute impact in physical concentration units ($\mu\text{g/m}^3$).
- **Dependence Plots:** Reveal non-linear threshold effects (e.g. sharp upward inflection in $\text{PM}_{2.5}$ when relative humidity exceeds $70\%$).
- **Waterfall & Force Plots:** Detail the step-by-step additive progression from base value ($144.2\,\mu\text{g/m}^3$) to the final prediction.

### LIME Methodology & Findings

Using `LimeTabularExplainer` initialized on the training dataset (`X_train`), local surrogate explanations were computed across 5 diverse test scenarios representing the complete air quality spectrum:

| Scenario | Test Index | Actual $\text{PM}_{2.5}$ | RF Forecast | XGBoost Forecast | Dominant Local Drivers Identified by LIME |
|:---|:---:|:---:|:---:|:---:|:---|
| **1. Minimum Pollution** | Idx 78 | $6.0\,\mu\text{g/m}^3$ | $53.8\,\mu\text{g/m}^3$ | $42.8\,\mu\text{g/m}^3$ | Moderate humidity ($69\%$) and high pressure ($742\,\text{mmHg}$) counterbalanced extreme spike potential. |
| **2. 25th Percentile** | Idx 134 | $91.0\,\mu\text{g/m}^3$ | $123.0\,\mu\text{g/m}^3$ | $120.6\,\mu\text{g/m}^3$ | Moderate solar radiation ($322\,\text{W/m}^2$) provided local daytime ventilation. |
| **3. Median Pollution** | Idx 127 | $132.0\,\mu\text{g/m}^3$ | $145.5\,\mu\text{g/m}^3$ | $127.8\,\mu\text{g/m}^3$ | Balanced atmospheric state; humidity ($74\%$) balanced by moderate wind. |
| **4. 75th Percentile** | Idx 100 | $186.0\,\mu\text{g/m}^3$ | $179.8\,\mu\text{g/m}^3$ | $178.9\,\mu\text{g/m}^3$ | High humidity ($90\%$) pushed predictions upwards by $+35.7\,\mu\text{g/m}^3$. |
| **5. Severe Smog Spike** | Idx 13 | $353.0\,\mu\text{g/m}^3$ | $322.7\,\mu\text{g/m}^3$ | $325.1\,\mu\text{g/m}^3$ | Extreme humidity ($89\%$) and low temperature ($11^\circ\text{C}$) combined to drive a massive $+27.8\,\mu\text{g/m}^3$ local push. |

*Generated Output Formats:* Saved as both publication-ready PNG figures and interactive standalone HTML files in `results/graphs/lime/`.

### SHAP vs. LIME Cross-Method Comparison

| Analytical Dimension | SHAP (`TreeExplainer`) | LIME (`LimeTabularExplainer`) |
|:---|:---|:---|
| **Analytical Scope** | **Global & Local:** Explains entire dataset & individuals. | **Strictly Local:** Explains single point instances. |
| **Theoretical Foundation**| Cooperative Game Theory (Shapley Values). | Local Linear Perturbation Regression. |
| **Additivity Property** | **Guaranteed:** $\sum \phi_i = f(x) - E[f(x)]$. | Not guaranteed to sum to prediction exactly. |
| **Feature Correlation** | Handled natively via tree path marginalization. | Assumes perturbation independence around local radius. |
| **Computational Speed**| Fast exact tree traversal ($O(TLD^2)$). | Slower; stochastically samples hundreds of perturbations. |

---

## Phase 4: Deep Learning & Sequence Modeling

Phase 4 evaluates deep neural networks for particulate prediction across two distinct methodological tracks:

### Track A: Multilayer Perceptron (MLP) Deep Learning
- **Framework:** TensorFlow 2.22 / Keras 3.
- **Input Features:** 5 Standardized Meteorological Variables (`RH`, `WD`, `SR`, `BP` in mmHg, `AT`).
- **Data Scaling:** `StandardScaler` and `SimpleImputer` fitted **strictly on the sub-training partition ($X_{\text{sub-train}}$, $N=1,377$) after the validation split**, ensuring zero validation and test leakage; serialized to `models/mlp_scaler.pkl`.
- **Validation Split:** 15% sub-partition ($N=244$) of training data for early stopping and learning rate reduction.
- **Architecture:**
  - Input Layer: 5 features
  - Hidden Layer 1: 128 neurons (ReLU) + $L_2$ Regularization ($10^{-4}$) + Dropout (0.20)
  - Hidden Layer 2: 64 neurons (ReLU) + $L_2$ Regularization ($10^{-4}$) + Dropout (0.10)
  - Hidden Layer 3: 32 neurons (ReLU)
  - Output Layer: 1 linear neuron ($\text{PM}_{2.5}$)
- **Total Parameters:** 11,137 trainable parameters.
- **Convergence:** Trained across 200 epochs with Adam optimizer ($\alpha = 0.001$), early stopping (`patience=25`), and `ReduceLROnPlateau`.
- **Saved Model:** `models/mlp_model.keras`.

### Track B: Time-Series Sequence Models (LSTM & Transformer)
- **Dataset Investigation:** The primary dataset `dataset/Delhi Final(1).xlsx` consists of 2,027 cross-sectional tabular observations **without any date or timestamp column**.
- **Scientific Integrity Boundary:**
  - We refuse to synthesize artificial hourly dates or pretend consecutive rows are consecutive hours.
  - We refuse to reshape tabular rows into fake sequence matrices, which produces invalid autocorrelation.
- **Formal Status:** **Track B is documented as BLOCKED pending genuine chronological data.**
- **Production Readiness:** Full sequence pipelines for **LSTM** (`src/train_lstm.py`) and **Transformer with Positional Encoding & Multi-Head Self-Attention** (`src/train_transformer.py`) are implemented. Once an hourly CPCB/OpenAQ dataset with a `datetime` column is placed at `dataset/delhi_timeseries_cpcb.csv`, both sequence models will execute immediately.

### Cross-Model Benchmark (RF vs. XGBoost vs. MLP)
All three paradigms evaluated on the identical 406 held-out test observations ($20\%$ test split, seed = 42):

| Model Architecture | Paradigm | Test MAE ($\mu\text{g/m}^3$) | Test MSE | Test RMSE ($\mu\text{g/m}^3$) | Test $R^2$ Score | Overall Rank |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **XGBoost (Tuned)** | Gradient Boosted Decision Trees | **25.28** | **1349.57** | **36.74** | **0.7455 ($74.55\%$)** | **1st (Best)** |
| **Random Forest** | Bagging Ensemble of Trees | 25.62 | 1447.90 | 38.05 | 0.7269 ($72.69\%$) | 2nd |
| **Multilayer Perceptron (MLP)** | Deep Feedforward Neural Net | 37.88 | 2434.79 | 49.34 | 0.5408 ($54.08\%$) | 3rd |

> **Scientific Insight:** XGBoost and Random Forest decisively outperform the MLP on this tabular dataset. Because meteorological interactions involve sharp physical thresholds (temperature inversions, wind corridors), decision trees naturally partition orthogonal feature space with high sample efficiency. This benchmark empirically confirms established machine learning literature (*Grinsztajn et al., NeurIPS 2022*).

### Interactive Prediction Tool
A verified command-line inference tool is available at `src/predict_mlp.py`. It accepts Barometric Pressure in verified dataset units ($\text{mmHg}$) and clearly displays indicative CPCB $\text{PM}_{2.5}$ health severity bands with explicit disclaimers distinguishing them from official multi-pollutant 24-hr CPCB AQI:

```bash
# Run with capstone example parameters (BP in mmHg)
python src/predict_mlp.py --example

# Or specify custom meteorological observations
python src/predict_mlp.py --rh 74 --wd 298 --sr 5 --bp 740 --at 14
```

---

## Crucial Scientific Limitations

To ensure academic and regulatory integrity during capstone defense, the following limitations are explicitly documented:

1. **Model Reliance vs. Emission Causation:** SHAP and LIME describe **how the trained model utilizes inputs to calculate output concentrations**. They quantify statistical and algorithmic reliance, **NOT physical emission causation**.
2. **Inability to Attribute Chemical Sources:** Meteorological feature importance cannot prove or differentiate between actual physical emission sources such as:
   - Vehicular traffic exhaust
   - Agricultural stubble burning plumes
   - Industrial coal-fired power plants
   - Construction and road dust re-suspension
3. **Absence of Chemical Speciation:** Conclusive source apportionment requires receptor modeling (Positive Matrix Factorization / PMF) applied to chemical tracer species (organic carbon, elemental carbon, sulfate, nitrate, heavy metal tracers), which are not present in this meteorological dataset.
4. **Phase 3 & 4 Characterization:** These phases deliver **Explainable $\text{PM}_{2.5}$ Prediction, Model-Based Feature Attribution, and Comparative Deep Learning**, not a completed chemical source apportionment system.
5. **Absence of Timestamp Column:** Sequence forecasting (LSTM, GRU, Transformer) cannot be performed on the primary Excel dataset without verified chronological time stamps.

---

## Future Roadmap (Phase 5)

- **Phase 5:** Production Full-Stack Application (Flask/FastAPI REST API, React interactive user dashboard with live SHAP waterfall widgets, MongoDB persistence, and cloud container deployment).
