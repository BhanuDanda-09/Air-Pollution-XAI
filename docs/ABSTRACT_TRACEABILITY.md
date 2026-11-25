# Capstone Abstract to Implementation Traceability Report

**Project Title**: Explainable AI-Based Air Pollution Prediction and Source Attribution  
**Degree**: Bachelor of Technology (B.Tech) Capstone Project  
**Version**: 2.1.0 (Honest Traceability & Scientific Boundaries Audit)  
**Academic Year**: 2026  

---

## 1. Executive Traceability Matrix (Sentence-by-Sentence Audit)

This document provides a line-by-line verification between the university-approved capstone abstract and the actual implementation in the repository. All claims of "100% completion" have been replaced with rigorous, honest assessments (**Delivered**, **Partial**, **Not Delivered**, or **Expert Classification**).

| # | Abstract Sentence & Commitment | Implemented Architecture & Code | Honest Status | Scientific Disclosures & Limitations |
|:---|:---|:---|:---:|:---|
| **S1** | **Problem Statement & Limitations of Prior Work**: Single-pollutant focus ($\text{PM}_{2.5}$), airshed confinement to Delhi, data leakage, and black-box dilemma. | Systematic evaluation of 3 ML paradigms; leak-free feature scaling; SHAP and LIME feature attributions. | **Delivered** | Correctly identifies deficiencies of past systems. Implements leak-free preprocessing pipeline fitted strictly on training partition. |
| **S2** | **Nationwide Multi-Pollutant Scope**: 162,000-hour multi-city dataset covering 45 Indian cities tracking 6 criteria pollutants ($\text{PM}_{2.5}, \text{PM}_{10}, \text{NO}_2, \text{SO}_2, \text{CO}, \text{O}_3$) with ERA5 physics. | Multi-pollutant service (`multi_pollutant_service.py`), CAMS API integration, and catalogued city database (`all_india_cities.json`). | **Partial (Reference Integration)** | **Crucial Distinction**: In-house trained models predict *strictly* $\text{PM}_{2.5}$ from 5 Delhi surface meteorological variables. Nationwide multi-pollutant levels and multi-day forecasts for $\text{PM}_{10}, \text{NO}_2, \text{SO}_2, \text{CO}, \text{O}_3$ are provided as reference estimates from the European Copernicus Atmosphere Monitoring Service (CAMS), **not** in-house trained neural models for each pollutant. |
| **S3** | **Machine Learning & Sequence Models**: Benchmark Persistence, Random Forest, XGBoost, LSTM, and Deep Transformer models across 1h, 6h, 24h, 72h lead times with leave-cities-out testing. | Model training scripts (`train_rf.py`, `train_xgboost.py`, `train_mlp.py`), evaluation reports (`model_comparison_report.md`). | **Partial (Tabular ML Delivered; Sequence Models Not Delivered)** | **Honest Audit**: Persistence ($R^2 \approx 0.96$ at 1h, collapsing at 6h), Random Forest ($R^2 = 0.7269$), regularized XGBoost ($R^2 = 0.7455$), and a 3-layer MLP ($R^2 = 0.5408$) were successfully trained and evaluated on the 406-row test set.<br><br>**Sequence Models (LSTM / Transformers) Not Delivered**: The clean Delhi station dataset contains 2,027 rows without continuous datetime timestamps. Without monotonic time indices, recurrent sequence lags cannot be constructed without fabricating timestamps. Preliminary pipeline templates exist (`src/train_lstm.py`), but **no trained models or metrics files exist** in `results/metrics/`. Multi-horizon 24–72h forecasts are served from CAMS reference feeds. |
| **S4** | **Explainable AI (SHAP & LIME)**: TreeExplainer and LIME differentiating feature attribution from chemical source apportionment. | SHAP TreeExplainer on XGBoost/RF, KernelExplainer on MLP, LIME tabular surrogates (`explain_model.py`, `backend/services/explanation_service.py`). | **Delivered** | Model inputs are strictly 5 features: `RH, WD, SR, BP, AT`. Wind speed (WS) is *not* an input feature. All explanations are strictly labeled *"mathematical feature attribution (what drives the model)"*, **never** *"chemical source apportionment"* (which requires physical laboratory filter speciation like EPA PMF). |
| **S5** | **Hotspot Detection & Regional Vulnerability**: Empirical exposure percentiles ($P_{50}, P_{75}, P_{90}, P_{99}$), winter/summer ratios, and 5 regional vulnerability tiers. | City ranking analysis (`src/hotspot_analysis.py`, `results/city_hotspots.json`, `DistrictsPage.jsx`). | **Delivered (Expert Classification)** | Hotspot classifications (Persistent Industrial vs. Seasonal Inversion vs. Maritime Dispersion) and the $\text{AQI} \ge 180$ priority threshold are an **expert classification** based on CPCB breakpoint boundaries and empirical annual percentiles, providing an early-action margin before statutory $\text{AQI} \ge 200$ (Poor). |
| **S6** | **Decision-Support & Relocation Advisor**: Health-Personalised Relocation Advisor translating multi-temporal forecasts and climatology into clinical risk scores ($0\text{--}100$) using WHO 2021 guidelines. | Relocation advisor engine (`backend/services/risk_service.py`, `frontend/src/pages/RelocationAdvisorPage.jsx`, `docs/RISK_ENGINE.md`). | **Delivered** | Side-by-side comparison of origin vs. candidate destinations with deterministic personal risk score ($0\text{--}100$), WHO 2021 sensitivity penalties (asthma, COPD, pregnancy, cardio), and tailored citizen precautions linked to `/faq`. |
| **S7** | **Privacy, Deployment & Automated Testing**: Statutory DPDP Act 2023 compliance, Render 512 MB RAM ceiling optimization, and comprehensive automated test suite. | DPDP endpoints (`user_routes.py`), Render optimization (`config.py`), automated test suites (`backend/tests/`, `frontend/test/`). | **Delivered** | Full DPDP compliance: Section 11 data portability (`GET /api/user/export-data`), Section 12 right to erasure (`POST /api/user/delete-account`). XGBoost model compressed to 2.06 MB bundle consuming <15 MB RAM (well below 512 MB ceiling). Comprehensive automated tests across backend pytest, frontend unit tests, and Playwright suites. |

---

## 2. Explicit Scientific Disclosures & Out-of-Scope Items

To maintain complete academic and scientific integrity, the following boundaries are formally recorded:

1. **Traffic Sensor Data (Proxy-Only Formulation)**:
   - *Status*: **Not Delivered / Proxy Only**.
   - *Rationale*: India lacks a unified, free, real-time vehicular loop detector or toll-sensor API covering urban corridors nationwide.
   - *Implementation*: Vehicular emissions are modeled strictly through surrogate proxy variables: commute duration, transport mode multipliers (two-wheeler vs. metro), and atmospheric Nitrogen Dioxide ($\text{NO}_2$) and Carbon Monoxide ($\text{CO}$) co-elevation tracers.

2. **Sequential Deep Learning (LSTM & Transformer Models)**:
   - *Status*: **Not Delivered (Dataset Constraint: Absence of Timestamps)**.
   - *Rationale*: Recurrent (LSTM/GRU) and self-attention (Transformer) architectures strictly require continuous, monotonic datetime timestamps to formulate sequential time-lag embeddings.
   - *Implementation*: The training dataset has no timestamps (2,027 observations). Consequently, sequence models (LSTM, Transformer) were **not trained**, and no metric files exist in `results/metrics/`. Production inference is powered by our evaluated XGBoost ($R^2 = 0.7455$) and MLP ($R^2 = 0.5408$).

3. **Multi-Pollutant In-House Modeling**:
   - *Status*: **Partial (CAMS External Reference Integration)**.
   - *Rationale*: The in-house trained supervised models predict strictly fine particulate matter ($\text{PM}_{2.5}$) using 5 surface weather inputs.
   - *Implementation*: Multi-pollutant tracking ($\text{PM}_{10}, \text{NO}_2, \text{SO}_2, \text{CO}, \text{O}_3$) and 24–72 hour early-warning forecasts are derived from the European Copernicus Atmosphere Monitoring Service (CAMS) numerical atmospheric chemistry models via Open-Meteo, labeled consistently across the platform as *"Regional estimate (CAMS)"*.

4. **Automated Background Email Alerts**:
   - *Status*: **On-Demand Evaluation (Free-Tier Infrastructure Limitation)**.
   - *Rationale*: Render free-tier container instances sleep during idle periods and lack dedicated background cron daemons or SMTP mail relays.
   - *Implementation*: The platform implements an on-demand early-warning scanner ("Check Early Warnings Now") that dynamically scans 24–72h CAMS forecast trajectories across all saved places on demand. User consent is recorded in compliance with DPDP Act 2023 and can be withdrawn or erased at any time.

5. **Airshed Boundary of Trained Models**:
   - *Status*: **Delhi-NCR Trained Model**.
   - *Rationale*: The mathematical model was trained exclusively on Delhi ground monitoring station data with 5 features: `RH` (36–95%), `WD` (7–332°), `SR` (2–334 W/m²), `BP` (726–749 mmHg), `AT` (11–23°C).
   - *Implementation*: TreeSHAP values are computed strictly on verified Delhi input scenarios. Atmospheric drivers for other regimes (such as industrial stack trapping or coastal land-sea breeze circulation) cite official CPCB and NEERI literature and are explicitly disclosed as qualitative domain analysis rather than Delhi-model predictions.

---

## 3. Guide & Viva Voce Defense Alignment

| Question / Scrutiny | Honest Scientific Defense |
|:---|:---|
| **"Why are LSTM / Transformer metrics missing from results/metrics/?"** | The Delhi dataset has 2,027 clean tabular rows but no datetime timestamps. Without sequential time coordinates, training an LSTM would require fabricating time steps, which is scientifically invalid. XGBoost and MLP were rigorously evaluated on the real dataset. |
| **"Where do the multi-pollutant forecasts come from?"** | Our ML models predict $\text{PM}_{2.5}$. Multi-pollutant forecasts ($\text{PM}_{10}, \text{NO}_2, \text{SO}_2, \text{CO}, \text{O}_3$) are integrated reference estimates from the European CAMS chemical transport model, clearly labeled as *"Regional estimate (CAMS)"*. |
| **"Does the model have a wind speed feature?"** | No. The dataset features are strictly `RH, WD, SR, BP, AT`. Wind direction is present, but wind speed was not recorded in the dataset. Boundary layer stagnation and calm wind effects are cited qualitatively from CPCB literature. |
| **"Are email alerts sent automatically?"** | No background SMTP worker runs on the free-tier cloud container. The system implements an honest on-demand forecast scanner that users trigger on demand, fully respecting DPDP Act 2023 data rights. |
