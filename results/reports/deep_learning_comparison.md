# Cross-Model Deep Learning and Machine Learning Benchmark Report

**Project Title:** Explainable AI-Based Air Pollution Prediction and Source Attribution  
**Phase:** Phase 4 — Deep Learning and Model Comparison  
**Test Set Evaluation:** Identical 406 held-out observations ($20\%$ split, seed = 42)  
**Input Features:** 5 Verified Meteorological Features (`RH`, `WD`, `SR`, `BP`, `AT`)  
**Target Variable:** Particulate Matter 2.5 (`PM2.5`, $\mu\text{g/m}^3$)  

---

## 1. Executive Summary and Benchmark Results

All models were evaluated on the **exact same held-out test partition (406 observations)** extracted before training to eliminate data leakage.

| Model | Paradigm | MAE ($\mu\text{g/m}^3$) | MSE | RMSE ($\mu\text{g/m}^3$) | $R^2$ Score |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **XGBoost (Tuned)** | Gradient Boosted Decision Trees | **25.28** | **1349.57** | **36.74** | **0.7455** |
| **Random Forest** | Bagging Ensemble | 25.62 | 1447.90 | 38.05 | 0.7269 |
| **Multilayer Perceptron (MLP)** | Deep Feedforward Neural Network | 38.34 | 2524.01 | 50.24 | 0.5239 |

> **Key Finding:**  
> **XGBoost remains the top-performing model overall** ($R^2 = 0.7455$, $\text{RMSE} = 36.74\ \mu\text{g/m}^3$), closely followed by **Random Forest** ($R^2 = 0.7269$). The Deep Learning **Multilayer Perceptron (MLP)** achieved an $R^2$ of **0.5239** and $\text{RMSE}$ of **50.24** $\mu\text{g/m}^3$.

---

## 2. Scientific Analysis: Why Tree Ensembles Outperform MLP on this Tabular Dataset

A common misconception in data science is that deep neural networks are universally superior to traditional machine learning algorithms. In empirical benchmarks, **tree-based ensembles systematically outperform deep learning on tabular data** of small-to-medium scale ($N \approx 2,000$), supported by recent literature (*Grinsztajn et al., NeurIPS 2022*):

1. **Inductive Bias & Coordinate-Aligned Decision Boundaries:**
   - Meteorological relationships (e.g., sudden temperature inversions or calm wind thresholds) are inherently step-like and axis-aligned. Decision trees create orthogonal axis splits without needing to synthesize continuous hyperplanes.
   - Neural networks compute linear combinations followed by smooth activations, which require significantly more training samples to approximate sharp threshold step functions.
2. **Sample Efficiency on Small Tabular Datasets:**
   - With 1,621 training samples, an MLP with 11,137 trainable parameters has a parameter-to-sample ratio exceeding $6:1$. Despite $L_2$ regularization, dropout, and early stopping, the network has lower sample efficiency than gradient-boosted trees.
   - XGBoost sequentially builds shallow trees (depth 3–6) that greedily optimize residuals without overparameterization.
3. **Robustness to Extreme Outliers:**
   - Air pollution datasets in Delhi exhibit extreme seasonal pollution spikes ($> 300\ \mu\text{g/m}^3$). Decision trees are invariant to monotonic transformations and bound predictions within leaf nodes, whereas neural networks can produce exaggerated errors on extreme tails.

---

## 3. Track B Status: Time-Series Sequence Models (LSTM & Transformer)

### Dataset Investigation Findings
- The provided Excel dataset (`dataset/Delhi Final(1).xlsx`) consists of 2,027 cleaned records across 5 meteorological columns and `PM2.5`.
- **It contains NO date, time, or timestamp column.**
- The records represent cross-sectional tabular observations rather than guaranteed consecutive time intervals.

### Scientific Constraints Enforced
Per capstone project guidelines and scientific research integrity:
1. **No Artificial Sequences:** We refused to invent synthetic hourly timestamps or assume that row $i$ and row $i+1$ represent consecutive hours.
2. **No Reshaping Without Time Ordering:** Applying recurrent LSTM gates or Transformer multi-head self-attention to randomly ordered tabular rows creates false temporal correlations that violate scientific truth.
3. **Track B Formal Status:** **Blocked pending genuine chronological data.**
4. **Unblocking Protocol:** The full, production-ready LSTM and Transformer sequence forecasting pipelines are fully implemented in `src/train_lstm.py` and `src/train_transformer.py`. Placing a validated hourly CPCB dataset with a `datetime` column into `dataset/delhi_timeseries_cpcb.csv` will immediately execute chronological sequence training.

---

## 4. Visualizations Generated

All diagnostic and comparative figures are saved in high resolution (300 DPI):
- [rmse_comparison.png](../graphs/deep_learning_comparison/rmse_comparison.png): Cross-model RMSE comparison bar chart.
- [mae_comparison.png](../graphs/deep_learning_comparison/mae_comparison.png): Cross-model MAE comparison bar chart.
- [r2_comparison.png](../graphs/deep_learning_comparison/r2_comparison.png): Coefficient of determination ($R^2$) benchmark.
- [actual_vs_predicted_comparison.png](../graphs/deep_learning_comparison/actual_vs_predicted_comparison.png): 3-panel scatter comparison with 1:1 line.
- [metrics_comparison_barchart.png](../graphs/deep_learning_comparison/metrics_comparison_barchart.png): Multi-metric summary chart.
- [mlp_performance_summary.png](../graphs/mlp/mlp_performance_summary.png): 4-panel MLP training and diagnostic dashboard.

---

## 5. Final Recommendations for Capstone Defense

1. **Highlight the Empirical Rigor:** Presenting honest results where XGBoost outperforms MLP demonstrates mature scientific reasoning. Blindly claiming deep learning is superior without evidence would fail technical review.
2. **Explainability Context:** In Phase 3, SHAP and LIME revealed that Air Temperature (AT) and Relative Humidity (RH) drive non-linear pollution increases (winter inversions). XGBoost captures these non-linear splits with the lowest error.
3. **Deployment Strategy:** For tabular real-time prediction, the tuned XGBoost model remains the primary recommendation, with Random Forest as a reliable baseline and MLP as an established deep learning alternative.
