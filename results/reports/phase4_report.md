# Phase 4 Capstone Report: Deep Learning for Air Pollution Prediction

**Project Title:** Explainable AI-Based Air Pollution Prediction and Source Attribution  
**Academic Degree:** Final-Year B.Tech Capstone Project  
**Author:** Bhanu Danda  
**GitHub Repository:** [Air-Pollution-XAI](https://github.com/BhanuDanda-09/Air-Pollution-XAI.git)  
**Phase:** Phase 4 — Deep Learning Models, Comparative Benchmarks, and Scientific Validation  

---

## 1. Introduction

Particulate Matter 2.5 ($\text{PM}_{2.5}$) is a critical atmospheric pollutant consisting of fine inhalable particles with diameters $2.5\\ \mu\text{m}$ or smaller. In the National Capital Region (NCR) of Delhi, meteorological variations—such as winter atmospheric boundary layer contraction, low surface winds, and high relative humidity—heavily exacerbate ground-level particulate accumulation.

Following the completion of **Phase 1** (Data Preprocessing, EDA, and Baseline Random Forest), **Phase 2** (Tuned XGBoost Regressor), and **Phase 3** (SHAP and LIME Explainability), **Phase 4** extends the project into **Deep Learning paradigms**.

This phase evaluates whether neural network architectures can improve predictive precision over tree-based ensembles, investigates sequence modeling for temporal forecasting, and applies rigorous scientific validation to dataset boundaries.

---

## 2. Project Objectives for Phase 4

1. **Implement Track A (Tabular Deep Learning):** Develop, tune, and evaluate a Multilayer Perceptron (MLP) using TensorFlow/Keras on the verified 5 meteorological features to predict $\text{PM}_{2.5}$.
2. **Prevent Data Leakage:** Fit all imputers and standard scalers strictly on the training partition ($N = 1,621$) and evaluate on the identical held-out test partition ($N = 406$, seed = 42).
3. **Investigate Track B (Time-Series Forecasting):** Formally assess whether the dataset supports sequence models (LSTM and Transformer). If genuine timestamps are absent, maintain scientific integrity by marking Track B as blocked pending suitable chronological records without synthesizing fake timestamps.
4. **Benchmark Cross-Model Performance:** Compare Random Forest (Phase 1), XGBoost (Phase 2), and MLP (Phase 4) across Mean Absolute Error (MAE), Mean Squared Error (MSE), Root Mean Squared Error (RMSE), and the Coefficient of Determination ($R^2$).
5. **Interactive Prediction Interface:** Provide a verified command-line and interactive script (`src/predict_mlp.py`) for live inference and demonstration.

---

## 3. Dataset Description and Verification

- **Primary Dataset:** `dataset/Delhi Final(1).xlsx`
- **Cleaned Dataset:** `dataset/preprocessed_delhi_air_quality.csv`
- **Total Valid Observations:** 2,027 rows (after removing 156 duplicate rows in Phase 1 to prevent train-test data leakage).
- **Core Input Features (5 Meteorological Variables):**
  1. `RH` — Relative Humidity ($\%$)
  2. `WD` — Wind Direction (degrees, $0^{\circ} - 360^{\circ}$)
  3. `SR` — Solar Radiation ($\text{W/m}^2$)
  4. `BP` — Barometric Pressure ($\text{mmHg}$)
  5. `AT` — Air Temperature ($^{\circ}\text{C}$)
- **Target Variable:**
  - `PM2.5` — Particulate Matter $2.5$ mass concentration ($\mu\text{g/m}^3$).
- **Partitioning Strategy:**
  - **Training Set:** 1,621 samples ($80\%$)
  - **Sub-Training Set for MLP:** 1,377 samples ($85\%$ of training partition)
  - **Validation Set for MLP:** 244 samples ($15\%$ of training partition, used for early stopping and learning rate scheduling)
  - **Held-Out Test Set:** 406 samples ($20\%$, completely untouched until final benchmark)

---

## 4. Why MLP Was Selected for Track A

Tabular cross-sectional data consists of independent feature vectors without spatial grids (like images) or sequential continuity (like speech or audio). For tabular regression:
- **Multilayer Perceptrons (MLPs)** serve as the foundational deep learning architecture.
- An MLP uses fully connected dense layers with non-linear activation functions (ReLU) to learn continuous multivariate mappings between meteorological parameters and particulate concentrations.
- It provides a direct baseline to assess whether gradient descent over continuous parameter spaces can compete with tree-based recursive partitioning on small tabular datasets.

---

## 5. Multilayer Perceptron (MLP) Architecture

Implemented in `src/train_mlp.py` using **TensorFlow 2.22** and **Keras 3**:

```
Layer (type)               Output Shape          Param #      Activation / Purpose
===================================================================================
meteorological_input       (None, 5)                   0      Raw scaled inputs [RH, WD, SR, BP, AT]
hidden_layer_1 (Dense)     (None, 128)               768      ReLU + L2 Regularization (1e-4)
dropout_1 (Dropout)        (None, 128)                 0      Rate = 0.20 (Prevents co-adaptation)
hidden_layer_2 (Dense)     (None, 64)              8,256      ReLU + L2 Regularization (1e-4)
dropout_2 (Dropout)        (None, 64)                  0      Rate = 0.10 (Regularization)
hidden_layer_3 (Dense)     (None, 32)              2,080      ReLU feature compression
pm25_output (Dense)        (None, 1)                  33      Linear regression output (PM2.5)
===================================================================================
Total Trainable Parameters: 11,137 (43.50 KB)
```

### Hyperparameters and Leak-Free Preprocessing Protocols
- **Validation-First Partitioning:** To guarantee zero data leakage between sub-training and validation partitions, the $1,621$ training samples were partitioned **first** into $1,377$ sub-training samples ($85\%$) and $244$ validation samples ($15\%$).
- **Strictly Isolated Preprocessing Fitting:** Both `SimpleImputer(strategy='median')` and `StandardScaler()` were fitted **strictly on the $1,377$ sub-training samples only**. The validation and held-out test sets were transformed using the pre-fitted transformer without re-calculating means, variances, or medians. Serialized to `models/mlp_scaler.pkl`.
- **Loss Function:** Mean Squared Error ($\text{MSE}$).
- **Evaluation Metric:** Mean Absolute Error ($\text{MAE}$).
- **Optimizer:** Adam ($\alpha = 0.001$, $\beta_1 = 0.9, \beta_2 = 0.999$).
- **Batch Size:** 32.
- **Maximum Epochs:** 200.
- **Early Stopping:** `patience = 25`, monitoring `val_loss`, restoring best model weights.
- **Learning Rate Scheduler:** `ReduceLROnPlateau` (factor = 0.5, patience = 10, minimum $\alpha = 10^{-5}$).
- **Checkpointing:** Best model serialized to `models/mlp_model.keras`.

---

## 6. Track B Status: Time-Series Sequence Models (LSTM & Transformer)

### Formal Dataset Limitation
The existing workspace dataset `dataset/Delhi Final(1).xlsx` **contains NO date, time, or timestamp column**.

### Scientific Integrity Decisions
1. **Refusal to Fabricate Synthetic Sequences:** In some amateur projects, tabular rows are artificially assigned hourly timestamps or reshaped into arrays of $(N, \text{lookback}, D)$ assuming that consecutive rows are consecutive time intervals. This violates basic scientific principles:
   - Rows in Excel spreadsheets may originate from different monitoring stations, unsorted log queries, or non-uniform sampling schedules.
   - Creating sequences without verified chronological timestamps results in spurious correlations and invalidates research conclusions.
2. **Current Status:** **Track B is formally marked as BLOCKED pending genuine chronological data.**
3. **Preparedness:** Complete, production-grade training modules for **LSTM** (`src/train_lstm.py`) and **Transformer** (`src/train_transformer.py`) are fully implemented and ready in the repository. Once an hourly or daily CPCB/OpenAQ CSV with a `datetime` column is supplied at `dataset/delhi_timeseries_cpcb.csv`, both sequence models will execute immediately.

---

## 7. Model Evaluation Metrics

Performance is benchmarked across four standard regression metrics on the **held-out test set ($N = 406$)**:

$$\text{MAE} = \frac{1}{N} \sum_{i=1}^N |y_i - \hat{y}_i|$$

$$\text{MSE} = \frac{1}{N} \sum_{i=1}^N (y_i - \hat{y}_i)^2$$

$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N (y_i - \hat{y}_i)^2}$$

$$R^2 = 1 - \frac{\sum_{i=1}^N (y_i - \hat{y}_i)^2}{\sum_{i=1}^N (y_i - \bar{y})^2}$$

---

## 8. Cross-Model Comparison Results

All three models evaluated on the identical 406 test samples:

| Model | Paradigm | Test MAE ($\mu\text{g/m}^3$) | Test MSE | Test RMSE ($\mu\text{g/m}^3$) | Test $R^2$ Score | Overall Rank |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **XGBoost (Tuned)** | Gradient Boosted Decision Trees | **25.28** | **1349.57** | **36.74** | **0.7455** | **1st** |
| **Random Forest** | Bagging Ensemble | 25.62 | 1447.90 | 38.05 | 0.7269 | 2nd |
| **Multilayer Perceptron (MLP)** | Deep Feedforward Neural Network | 37.88 | 2434.79 | 49.34 | 0.5408 | 3rd |

---

## 9. Key Findings and Scientific Observations

### A. Why Tree-Based Ensembles Outperform MLP on Small Tabular Data
1. **Axis-Aligned Decision Boundaries vs. Smooth Manifolds:**  
   Meteorological phenomena exhibit sharp thresholds (e.g., wind speed dropping below $1.5\ \text{m/s}$ or temperature inversions setting in). Decision trees natively partition continuous feature space with axis-parallel cuts. Neural networks attempt to approximate these step functions with continuous sigmoidal or ReLU hyperplanes, requiring far more training data.
2. **Sample Efficiency:**  
   With $1,621$ training samples and 5 features, gradient-boosted trees greedily construct shallow, high-signal decision rules. The MLP has $11,137$ parameters, leading to higher variance and lower generalization power despite dropout and $L_2$ regularization.
3. **Empirical Literature Agreement:**  
   This result aligns with NeurIPS research (*Grinsztajn et al., 2022: "Why do tree-based models still outperform deep learning on typical tabular data?"*), confirming that tree-based models remain the gold standard for tabular regression.

### B. Convergence of the MLP
- The MLP converged steadily over 200 epochs, reducing training loss from $24,539.68$ to $2,466.41$ MSE and validation MAE to $39.47\ \mu\text{g/m}^3$.
- The absence of divergent validation loss confirms that dropout ($0.2$) and learning rate scheduling successfully prevented catastrophic overfitting.

---

## 10. Generated Visualizations

All graphs have been generated and saved at 300 DPI:

1. **MLP Diagnostics (`results/graphs/mlp/`):**
   - [mlp_loss_curve.png](../graphs/mlp/mlp_loss_curve.png): Training and validation loss convergence across epochs.
   - [mlp_actual_vs_predicted.png](../graphs/mlp/mlp_actual_vs_predicted.png): Scatter plot of predicted vs actual test $\text{PM}_{2.5}$ with ideal 1:1 fit line.
   - [mlp_residual_plot.png](../graphs/mlp/mlp_residual_plot.png): Residuals vs predicted concentrations.
   - [mlp_prediction_error_distribution.png](../graphs/mlp/mlp_prediction_error_distribution.png): Histogram and KDE of prediction errors centered near zero.
   - [mlp_performance_summary.png](../graphs/mlp/mlp_performance_summary.png): Comprehensive 4-panel dashboard summary.

2. **Cross-Model Comparison (`results/graphs/deep_learning_comparison/`):**
   - [rmse_comparison.png](../graphs/deep_learning_comparison/rmse_comparison.png): Cross-model RMSE comparison bar chart.
   - [mae_comparison.png](../graphs/deep_learning_comparison/mae_comparison.png): Cross-model MAE comparison bar chart.
   - [r2_comparison.png](../graphs/deep_learning_comparison/r2_comparison.png): $R^2$ score comparison.
   - [actual_vs_predicted_comparison.png](../graphs/deep_learning_comparison/actual_vs_predicted_comparison.png): Side-by-side 3-panel scatter comparison.
   - [metrics_comparison_barchart.png](../graphs/deep_learning_comparison/metrics_comparison_barchart.png): Multi-metric grouped summary.

---

## 11. Interactive Prediction Tool

An inference tool is available at `src/predict_mlp.py`. It provides input validation, scales features using the leak-free fitted pipeline, and outputs predictions alongside indicative CPCB PM2.5 health severity breakpoint categories:

```bash
# Run with verified capstone example parameters (BP in mmHg)
python src/predict_mlp.py --example

# Or specify custom meteorological observations
python src/predict_mlp.py --rh 74 --wd 298 --sr 5 --bp 740 --at 14
```

**Sample Output:**
```
=================================================================
      AIR POLLUTION XAI — PM2.5 NEURAL ESTIMATION REPORT      
=================================================================
Model Architecture: Multilayer Perceptron (MLP) Deep Learning
Underlying Engine:  TensorFlow / Keras 3.x
-----------------------------------------------------------------
INPUT METEOROLOGICAL PARAMETERS:
  • RH  (Relative Humidity   ):    74.00 %
  • WD  (Wind Direction      ):   298.00 degrees
  • SR  (Solar Radiation     ):     5.00 W/m2
  • BP  (Barometric Pressure ):   740.00 mmHg
  • AT  (Air Temperature     ):    14.00 °C
-----------------------------------------------------------------
PREDICTED PM2.5 CONCENTRATION:  157.06 µg/m³
INDICATIVE CPCB PM2.5 HEALTH BAND:  Very Poor (121 - 250 µg/m³)
-----------------------------------------------------------------
SCIENTIFIC NOTICES & REGULATORY DISCLAIMERS:
  * Model Prediction: This value is an AI regression estimation
    derived from 5 instantaneous meteorological indicators, NOT an
    in-situ certified regulatory particulate monitor measurement.
  * AQI Distinction: This output reflects an indicative single-pollutant
    health severity band based on CPCB PM2.5 concentration breakpoints.
    It is NOT an official CPCB AQI calculation, which requires a 24-hour
    time-weighted running average and multi-pollutant sub-index aggregation.
=================================================================
```

---

## 12. Conclusion and Next Steps

Phase 4 successfully introduces deep learning into the capstone pipeline while adhering to scientific standards:
- **Tuned XGBoost** remains the best-performing model ($R^2 = 0.7455$, $\text{RMSE} = 36.74\ \mu\text{g/m}^3$), closely followed by **Random Forest** ($R^2 = 0.7269$).
- **Multilayer Perceptron (MLP)** provides a leak-free neural network baseline ($R^2 = 0.5408$, $\text{RMSE} = 49.34\ \mu\text{g/m}^3$).
- **Track B (Time-Series)** is documented and blocked due to the lack of timestamps in the current dataset, preserving research integrity. Production-grade scripts for LSTM and Transformer are implemented and waiting for verified chronological data.
- All code, metrics, and figures are documented, reproducible, and ready for capstone presentation.
