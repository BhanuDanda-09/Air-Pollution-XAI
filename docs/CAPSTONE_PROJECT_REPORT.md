# Explainable AI-Based Air Pollution Prediction and Source Attribution
## Comprehensive Capstone Project Report & Scientific Documentation

**Academic Program**: Bachelor of Technology (B.Tech) in Computer Science & Engineering / Data Science  
**Project Title**: Explainable AI-Based Air Pollution Prediction and Source Attribution: An All-India, Multi-Pollutant, Health-Personalised Decision System  
**System Version**: 2.0.0 Production Release  
**Live Production Deployments**:  
- Frontend Application: [https://air-pollution-xai.vercel.app](https://air-pollution-xai.vercel.app)  
- Backend API Service: [https://air-pollution-xai.onrender.com](https://air-pollution-xai.onrender.com)  
- Source Repository: [https://github.com/BhanuDanda-09/Air-Pollution-XAI](https://github.com/BhanuDanda-09/Air-Pollution-XAI)  

---

## Abstract

Ambient air pollution represents one of the most critical public health emergencies across urban India, where particulate matter and toxic trace gases frequently exceed World Health Organization (WHO) safety thresholds by more than twenty-fold. While predictive machine learning (ML) models have demonstrated utility in estimating aerosol accumulation from meteorological precursors, historical systems have suffered from three fundamental scientific and architectural deficiencies: (1) single-pollutant focus (typically only $\text{PM}_{2.5}$) localized to a single airshed (such as Delhi-NCR); (2) temporal data leakage and optimistic bias from random dataset shuffling; and (3) opaque "black-box" decision outputs lacking individualized, clinical health-risk contextualization.

This capstone project engineers a comprehensive, nationwide, multi-pollutant, explainable air quality decision-support ecosystem. We construct a leak-free, continuous 162,000-hour multi-city dataset covering 45 Indian cities across six geographical zones (North, South, West, East, Central, and Northeast), tracking six criteria pollutants ($\text{PM}_{2.5}, \text{PM}_{10}, \text{NO}_2, \text{SO}_2, \text{CO}, \text{O}_3$) alongside ECMWF ERA5 planetary boundary layer physics and surface meteorology. We benchmark Persistence baseline, Random Forest, regularized XGBoost, LSTM, and Deep Transformer models across 1h, 6h, 24h, and 72h horizons, evaluating spatial transferability via leave-cities-out testing ($R^2 = 0.9629$ at 1h; $R^2 = 0.6027$ at 24h).

To explain model predictions, we implement Game-Theoretic TreeExplainer SHAP and LIME, strictly differentiating mathematical feature attribution from chemical source apportionment. We design an empirical Hotspot Analysis identifying five vulnerability tiers across Indian cities. Crucially, we develop a transparent, rule-based Personal Exposure Risk Engine (`risk_service.py`) and a "From vs. To" Relocation Advisor, translating multi-temporal pollution forecasts and seasonal climatology into personalized clinical risk scores ($0\text{--}100$) using WHO 2021 air quality guidelines and GINA/GOLD medical vulnerability multipliers. The platform is fully compliant with India's Digital Personal Data Protection (DPDP) Act 2023, is optimized for free-tier cloud deployment (Render 512 MB RAM ceiling respected with a 2.06 MB XGBoost serving bundle), and is validated by a 140-test automated suite (99 backend pytest, 12 frontend unit, 18 Playwright smoke, and 10 Playwright full-flow E2E tests).

---

## Chapter 1: Introduction & Problem Statement

### 1.1 The Indian Air Quality Crisis
According to the State of Global Air report and the Central Pollution Control Board (CPCB), over 90% of India's population resides in areas where annual average $\text{PM}_{2.5}$ levels exceed the WHO guideline of $5\,\mu\text{g/m}^3$ and the National Ambient Air Quality Standard (NAAQS) of $40\,\mu\text{g/m}^3$. In the Indo-Gangetic Plain (IGP), severe winter meteorological conditions—characterized by shallow nocturnal planetary boundary layers ($<150\,\text{m}$), low wind speeds ($<1.5\,\text{m/s}$), and intense thermal inversions—trap primary emissions (vehicular exhaust, biomass burning, and industrial effluent) and accelerate secondary aerosol formation.

### 1.2 Limitations of Existing Machine Learning Approaches
1. **Airshed Confinement**: Prior academic capstones have predominantly trained on isolated single-station Delhi data, failing to generalize to southern highland sanctuaries (e.g., Bengaluru) or coastal marine dispersion zones (e.g., Mumbai, Kochi).
2. **Methodological Data Leakage**: In published literature, standard K-fold cross-validation is frequently applied to time-series data with random row shuffling. This leaks future atmospheric states into training partitions, yielding deceptively inflated $R^2$ scores ($>0.98$) that collapse during real-time deployment.
3. **The Black-Box Dilemma**: Standard deep neural networks produce point estimates without quantifying the physical drivers (e.g., boundary layer compression vs. humidity-driven hygroscopic growth).
4. **Disconnection from Public Health**: A raw reading of $142\,\mu\text{g/m}^3\,\text{PM}_{2.5}$ has drastically different physiological implications for an adult with hyper-reactive asthma compared to a healthy adult. Existing tools lack personalized, rule-based exposure assessment.

### 1.3 Project Objectives
- Construct an all-India hourly dataset across 45 catalogued cities tracking all 6 NAAQS criteria pollutants.
- Implement leak-free chronological train/val/test splits and leave-cities-out unseen spatial generalization tests.
- Train, benchmark, and serve multi-horizon forecasting models (1h, 6h, 24h, 72h) optimized for a 512 MB RAM hosting limit.
- Provide game-theoretic SHAP feature attributions with strict scientific terminology.
- Build a health-personalized Relocation Advisor engine based on WHO 2021 guidelines.
- Guarantee statutory compliance with India's Digital Personal Data Protection (DPDP) Act 2023.

---

## Chapter 2: Literature Review & Scientific Foundations

### 2.1 Atmospheric Physics & Boundary-Layer Dynamics
Pollutant concentrations $C(t)$ at the ground surface are governed by the atmospheric continuity equation:

$$\frac{\partial C}{\partial t} + \mathbf{u} \cdot \nabla C = \nabla \cdot (K \nabla C) + S - R$$

where $\mathbf{u}$ is the wind velocity field, $K$ is the eddy diffusivity tensor, $S$ denotes emission sources, and $R$ represents atmospheric deposition and photochemical loss. The depth of the planetary boundary layer ($z_i$) dictates the effective volume available for pollutant dispersion. When $z_i$ drops during winter nights, the ventilation index ($V = z_i \times u_{10}$) collapses below $1000\,\text{m}^2/\text{s}$, causing severe particulate accumulation regardless of emission variations.

### 2.2 Time Series Forecasting Paradigms
- **Persistence Baseline**: $C(t+h) = C(t)$. Strong baseline at $h=1\text{h}$ due to atmospheric inertia, but degrades rapidly as diurnal solar and thermal cycles take effect ($h \ge 6\text{h}$).
- **Gradient Boosted Decision Trees (XGBoost / LightGBM)**: State-of-the-art for tabular meteorological time-series, effectively learning non-linear boundary-layer interactions without requiring high memory runtimes.
- **Deep Sequence Architectures (LSTM / Transformer)**: Capture long-term multi-step temporal dependencies but require significant compute and memory resources.

### 2.3 Mathematical Feature Attribution vs. Chemical Source Apportionment
- **TreeExplainer SHAP**: Computes exact Shapley values from cooperative game theory:

$$\phi_i(f, x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} [f(S \cup \{i\}) - f(S)]$$

SHAP determines which meteorological features drive the model's output.
- **Chemical Source Apportionment**: Solves the mass-balance receptor model:

$$x_{ij} = \sum_{k=1}^p g_{ik} f_{kj} + e_{ij}$$

using physical tools like Positive Matrix Factorization (PMF) on chemical speciation filters (elemental carbon, ions, organic markers). Conflating SHAP with chemical source apportionment is a recognized scientific error; our platform maintains scientific integrity by labeling SHAP as **Feature Attribution**.

---

## Chapter 3: Dataset Ingestion & Leak-Free Pipeline

### 3.1 Spatial Representation: 45 Catalogued Indian Cities
Cities were selected across all six regional zones to capture diverse climatic, topographic, and emission regimes:
- **North (11)**: Delhi, Faridabad, Gurugram, Noida, Ghaziabad, Meerut, Kanpur, Lucknow, Agra, Varanasi, Ludhiana.
- **South (9)**: Bengaluru, Chennai, Hyderabad, Visakhapatnam, Coimbatore, Madurai, Kochi, Thiruvananthapuram, Mysuru.
- **West (8)**: Mumbai, Pune, Ahmedabad, Surat, Jaipur, Jodhpur, Nagpur, Nashik.
- **East (7)**: Kolkata, Patna, Gaya, Muzaffarpur, Bhubaneswar, Cuttack, Ranchi.
- **Central (5)**: Bhopal, Indore, Gwalior, Jabalpur, Raipur.
- **Northeast (5)**: Guwahati, Agartala, Shillong, Imphal, Kohima.

### 3.2 Data Sources & Verification
1. **Copernicus Atmosphere Monitoring Service (CAMS) Reanalysis**: Hourly gridded surface concentrations for $\text{PM}_{2.5}, \text{PM}_{10}, \text{NO}_2, \text{SO}_2, \text{CO}, \text{O}_3$ via Open-Meteo Air Quality API (Open Database License / CC BY 4.0).
2. **ECMWF ERA5 Atmospheric Reanalysis**: Temperature ($2\text{m}$), relative humidity, wind speed and direction ($10\text{m}$), surface pressure, shortwave solar radiation, and boundary layer height.
3. **CPCB Ground-Truth Validation**: City-level continuous ground monitoring benchmarks (`dataset/cpcb_ground_truth_city_day.csv`).

### 3.3 Zero-Lookahead Feature Engineering
All feature transformations strictly reference historical timestamps ($t - \Delta t$):
- **Lag Features**: $t-1\text{h}, t-2\text{h}, t-3\text{h}, t-6\text{h}, t-12\text{h}, t-24\text{h}, t-48\text{h}, t-72\text{h}$.
- **Rolling Windows**: Backward-looking rolling mean, standard deviation, minimum, and maximum over 6h, 12h, and 24h windows.
- **Physical Atmospheric Parameterizations**: Ventilation index ($V = z_i \times u$), dew point spread ($T - T_d$), pressure tendencies ($\Delta P_{6\text{h}}$).
- **Cyclical Time Encoding**: Sine and cosine transformations of hour-of-day ($[0, 23]$) and day-of-year ($[1, 365]$).

---

## Chapter 4: Multi-Pollutant Predictive Modeling & Benchmarks

### 4.1 Chronological Evaluation & Horizon Decay
Models were trained on historical records and evaluated on held-out chronological test periods across 1h, 6h, 24h, and 72h lead horizons.

```
Horizon Performance Summary:
┌───────────┬─────────┬──────────────────┬──────────────┬──────────────┬────────────────┐
│ Pollutant │ Horizon │ Persistence R²   │ RF R²        │ XGBoost R²   │ Skill vs Pers. │
├───────────┼─────────┼──────────────────┼──────────────┼──────────────┼────────────────┤
│ PM2.5     │ 1h      │ 0.962            │ 0.966        │ 0.965        │ +0.080         │
│ PM2.5     │ 6h      │ 0.575            │ 0.738        │ 0.715        │ +0.383         │
│ PM2.5     │ 24h     │ 0.320            │ 0.612        │ 0.598        │ +0.429         │
│ PM2.5     │ 72h     │ 0.112            │ 0.448        │ 0.435        │ +0.378         │
│ PM10      │ 6h      │ 0.542            │ 0.710        │ 0.695        │ +0.371         │
│ NO2       │ 6h      │ -0.198 (Failed)  │ 0.643        │ 0.637        │ +0.697         │
│ O3        │ 6h      │ -0.434 (Failed)  │ 0.769        │ 0.785        │ +0.850         │
│ SO2       │ 6h      │ 0.410            │ 0.602        │ 0.591        │ +0.325         │
│ CO        │ 6h      │ 0.518            │ 0.685        │ 0.672        │ +0.347         │
└───────────┴─────────┴──────────────────┴──────────────┴──────────────┴────────────────┘
```

### 4.2 Why Persistence Fails at Extended Horizons
At 1-hour ($t+1$), atmospheric inertia dominates: $C(t+1) \approx C(t)$. However, by 6 hours, diurnal solar radiation triggers boundary layer expansion, convective mixing, and photochemical ozone titration ($NO + O_3 \to NO_2 + O_2$). Because persistence assumes static concentrations, its $R^2$ turns negative for photochemically active species ($NO_2$ and $O_3$). In contrast, XGBoost captures these non-linear diurnal cycles, maintaining high skill scores ($+0.697$ to $+0.850$).

### 4.3 Spatial Generalization (Leave-Cities-Out Validation)
To assess operational transferability to ungauged locations, models were evaluated on held-out cities omitted from training:
- **1-hour Horizon**: $R^2 = 0.9629$, $\text{RMSE} = 14.18\,\mu\text{g/m}^3$, $\text{MAE} = 8.42\,\mu\text{g/m}^3$.
- **24-hour Horizon**: $R^2 = 0.6027$, $\text{RMSE} = 34.20\,\mu\text{g/m}^3$, $\text{MAE} = 22.15\,\mu\text{g/m}^3$.

---

## Chapter 5: Explainable AI & Feature Attribution

### 5.1 TreeExplainer Attribution
Using `shap.TreeExplainer`, Shapley values were computed across all six criteria pollutants:
- **Particulate Matter ($\text{PM}_{2.5}, \text{PM}_{10}$)**: Dominated by surface ventilation index ($z_i \times u$), prior 24-hour accumulation lag, and relative humidity (hygroscopic aerosol swelling).
- **Nitrogen Dioxide ($\text{NO}_2$)**: Dominated by diurnal rush-hour flags, low boundary layer height, and low wind speeds.
- **Ozone ($\text{O}_3$)**: Governed primarily by peak shortwave solar radiation ($\text{W/m}^2$) and high ambient temperature, reflecting photochemical formation.

### 5.2 LIME Local Neighborhood Surrogates
Local Interpretable Model-agnostic Explanations (LIME) were fitted in the local perturbation space of individual city observations, validating that local linear slopes agree in directionality with non-linear SHAP contributions.

---

## Chapter 6: Spatial Hotspot Detection & Vulnerability Tiers

Using historical exposure distributions, seasonal ratios, and peak-to-median multipliers, cities were categorized into five empirical tiers (`results/city_hotspots.json`):
1. **Severe Persistent Basin** (e.g., Faridabad, Delhi, Ghaziabad, Patna): Mean $\text{PM}_{2.5} > 65\,\mu\text{g/m}^3$, $P_{99} > 200\,\mu\text{g/m}^3$, winter/summer ratio $>1.75$. Severe winter stagnation basin.
2. **Winter Episodic Hotspot** (e.g., Kanpur, Lucknow, Varanasi, Agra): Moderate annual baseline but acute winter inversion spikes.
3. **Industrial / Transit Corridor** (e.g., Ludhiana, Surat, Ahmedabad, Gwalior): High year-round industrial and vehicular baseline.
4. **Coastal Marine Dispersion** (e.g., Mumbai, Chennai, Kochi, Visakhapatnam): Diurnal sea-breeze circulation providing natural aerosol ventilation.
5. **Highland / Clean Sanctuary** (e.g., Bengaluru, Mysuru, Shillong): Elevated topography and consistent precipitation maintaining low annual exposure.

---

## Chapter 7: Health-Personalised Relocation Advisor

### 7.1 Mathematical Formulation of Personal Exposure Risk
The Personal Exposure Risk Score ($S_{\text{risk}} \in [0, 100]$) is computed as:

$$S_{\text{risk}} = \min\left(100, \left( w_c I_{\text{curr}} + w_f I_{\text{fc}} + w_s I_{\text{season}} + w_a I_{\text{ann}} \right) \cdot M_{\text{vuln}} \cdot M_{\text{exp}} \cdot M_{\text{prot}}\right)$$

where $w_c = 0.35, w_f = 0.25, w_s = 0.20, w_a = 0.20$.

### 7.2 Medical Sensitivity Multipliers ($M_{\text{vuln}}$)
Based on WHO 2021 air quality guidelines, GINA 2023, and GOLD 2024:
- **Asthma**: $+0.35$ (hyper-reactive airways; particulate spikes trigger bronchospasms).
- **COPD / Chronic Bronchitis**: $+0.40$ (irreversible alveolar damage; acute exacerbation risk).
- **Cardiovascular Disease**: $+0.30$ (systemic vascular inflammation, thrombosis risk).
- **Hypertension / Diabetes**: $+0.15$ (endothelial dysfunction).
- **Pregnancy**: $+0.30$ (transplacental particulate translocation; preterm birth risk).
- **Pediatric (<5 Years)**: $+0.25$ (immature lung parenchyma, elevated minute ventilation).
- **Geriatric (>65 Years)**: $+0.25$ (diminished mucociliary clearance).

$$M_{\text{vuln}} = \min\left(2.20, 1.0 + \sum_{i \in \text{conditions}} M_i\right)$$

### 7.3 Protection & Mitigation Factors ($M_{\text{prot}}$)
- **True HEPA Indoor Air Purifier**: $M_{\text{prot}} = 0.85$ (15% net risk reduction).
- **N95 Respirator Compliance during Poor Episodes**: $M_{\text{prot}} = 0.85$.
- **Combined HEPA + N95**: $M_{\text{prot}} = 0.72$.

### 7.4 Comparative Verdict Generation
For candidate destination cities relative to origin:

$$\Delta \text{Risk} = \frac{S_{\text{origin}} - S_{\text{dest}}}{S_{\text{origin}}} \times 100\%$$

- **Highly Recommended**: $\Delta \text{Risk} \ge 40\%$ and $S_{\text{dest}} < 45$.
- **Recommended with Precautions**: $\Delta \text{Risk} \ge 15\%$ and $S_{\text{dest}} < 65$.
- **Neutral / Marginal Benefit**: $-15\% < \Delta \text{Risk} < 15\%$.
- **Not Recommended**: $S_{\text{dest}} \ge 70$ or $\Delta \text{Risk} \le -15\%$.
- **Avoid (Severe Exposure Hazard)**: $S_{\text{dest}} \ge 85$ or destination in Severe Persistent Basin with $P_{90} > 150\,\mu\text{g/m}^3$.

---

## Chapter 8: Software Engineering & DPDP Act 2023 Architecture

### 8.1 Render Free-Tier Memory Optimization
Render free-tier enforces a strict **512 MB RAM ceiling**. Initial attempts to load scikit-learn Random Forest, TensorFlow MLP, and PyTorch Transformer simultaneously consumed $>520\text{ MB}$, triggering Out-Of-Memory (OOM) SIGKILL crashes.  
**Solution**: We extracted tuned histogram gradient-boosted XGBoost models into a compressed serving bundle (`models/all_india/xgb_models_serving.joblib`, **2.06 MB**). At runtime, this bundle consumes only **10.2 MB RSS**, providing over $400\text{ MB}$ of safe operating headroom on Render free tier.

### 8.2 India DPDP Act 2023 Statutory Implementation
- **Section 6 (Notice and Consent)**: Explicit affirmative consent checkbox prior to processing health condition flags.
- **Section 11 (Right to Data Portability)**: `GET /api/user/export-data` compiles and returns a complete, machine-readable JSON bundle of the user's profile, health attributes, saved places, and assessment history.
- **Section 12 (Right to Erasure)**: `POST /api/user/delete-account` executes a cascade deletion across user records, health profiles, saved places, and history tables.
- **Log Sanitization**: Health condition arrays are suppressed from backend application logs to prevent credential or personal health data leaks.

---

## Chapter 9: Experimental Verification & Quality Assurance

### 9.1 Automated Test Suites Summary
- **Backend Pytest Suite**: **99 / 99 Tests Passed** in 15.17s.
  - Verification of CPCB breakpoint math across all 6 pollutants.
  - Risk engine boundary tests (asthmatic child vs. healthy adult verification).
  - Geocoding, reverse geocoding, and outside-India rejection (HTTP 422).
  - Rate limiting (60 req/min) and thread-safe TTL cache invalidation.
  - Role-Based Access Control (RBAC) and DPDP data export/deletion.
- **Frontend Unit Test Suite**: **12 / 12 Test Suites Passed**.
  - Input parameter validation, demo security gating, session management.
- **Playwright Smoke Test Suite**: **18 / 18 Tests Passed**.
  - Route titles, dark mode toggle, accessible dialogs, and 0px horizontal overflow across 360px, 768px, 1280px, and 1920px viewports.
- **Playwright Full Flow E2E Suite**: **10 / 10 Tests Passed**.
  - Hermetic end-to-end verification of the complete user journey: authentication, live assessment, CSV export, SVG trend charting, logout, relocation advisor report generation, hotspot table filtering, and DPDP erasure.

---

## Chapter 10: Conclusion & Future Scope

### 10.1 Capstone Conclusion
This project demonstrates that environmental machine learning systems can achieve high predictive fidelity across multiple criteria pollutants while maintaining transparency, scientific integrity, and public health utility. By replacing opaque black-box models with leak-free gradient boosted decision trees, game-theoretic SHAP explanations, and a WHO-aligned Personal Exposure Risk Engine, the platform delivers actionable decision-support for citizens and municipal stakeholders across India.

### 10.2 Future Scope
1. **Coupling with Numerical Weather Prediction (WRF-Chem)**: Integrating physical chemical transport models with ML surrogates for high-resolution street-canyon modeling.
2. **Dense Low-Cost Sensor Networks**: Calibrating crowd-sourced IoT sensor streams against CPCB regulatory reference monitors using transfer learning.
3. **Automated Early-Warning Push Notifications**: Expanding threshold alert notifications via Web Push API and automated SMS for vulnerable demographic groups.

---

## References
1. Central Pollution Control Board (CPCB), *National Air Quality Index: Standard Operating Procedure & Calculation Methodology*, Ministry of Environment, Forest and Climate Change, Government of India, 2014.
2. World Health Organization (WHO), *WHO Global Air Quality Guidelines: Particulate matter (PM2.5 and PM10), ozone, nitrogen dioxide, sulfur dioxide and carbon monoxide*, Geneva: World Health Organization, 2021.
3. Lundberg, S. M., & Lee, S. I., "A unified approach to interpreting model predictions", *Advances in Neural Information Processing Systems (NeurIPS)*, 30, 2017.
4. Global Initiative for Asthma (GINA), *Global Strategy for Asthma Management and Prevention*, 2023.
5. Global Initiative for Chronic Obstructive Lung Disease (GOLD), *Global Strategy for the Diagnosis, Management, and Prevention of Chronic Obstructive Pulmonary Disease*, 2024.
6. Ministry of Law and Justice, *The Digital Personal Data Protection Act, 2023 (No. 22 of 2023)*, The Gazette of India, Government of India, 2023.
