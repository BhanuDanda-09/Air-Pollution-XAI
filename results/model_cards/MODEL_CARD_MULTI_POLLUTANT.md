# Model Card: All-India Multi-Pollutant Air Quality Forecasting Models

**Version:** 2.0.0 (Capstone Upgrade)  
**Date:** November 20, 2026  
**License:** Open Academic Research License  
**Contact / Authors:** Capstone Project Team (Air Pollution XAI)  

---

## 1. Model Details

### 1.1 Architecture & Paradigms
- **Random Forest Regressor:** Multi-tree bagging ensemble (`n_estimators=75`, `max_depth=12`, `min_samples_leaf=4`) optimized for robust non-linear feature interactions without overfitting.
- **Tuned XGBoost Regressor:** Gradient boosted decision trees using histogram-based binning (`tree_method='hist'`), regularized with $L_1$ (`reg_alpha=0.1`) and $L_2$ (`reg_lambda=1.0`) penalties to prevent memorization of localized anomalies.
- **LSTM Sequence Regressor:** Recurrent neural network with 24-hour sequence lag buffers for learning temporal diurnal autocorrelation.
- **Transformer Time-Series Regressor:** Multi-head self-attention network capturing long-range atmospheric context.
- **Persistence Baseline:** Physical benchmark predicting $\hat{y}_{t+h} = y_t$, providing the mathematical baseline for Skill Score computation:
  $$\text{Skill Score} = 1 - \frac{\text{MSE}_{\text{model}}}{\text{MSE}_{\text{persistence}}}$$

### 1.2 Target Pollutants & Forecasting Horizons
- **Target Pollutants:**
  1. $\text{PM}_{2.5}$ ($\mu\text{g/m}^3$) - Fine particulate matter ($\le 2.5\,\mu\text{m}$)
  2. $\text{PM}_{10}$ ($\mu\text{g/m}^3$) - Inhalable coarse particulate matter ($\le 10\,\mu\text{m}$)
  3. $\text{NO}_2$ ($\mu\text{g/m}^3$) - Nitrogen dioxide
  4. $\text{SO}_2$ ($\mu\text{g/m}^3$) - Sulfur dioxide
  5. $\text{CO}$ ($\mu\text{g/m}^3$) - Carbon monoxide
  6. $\text{O}_3$ ($\mu\text{g/m}^3$) - Ground-level tropospheric ozone
- **Forecast Horizons:** $1\text{h}$, $6\text{h}$, $24\text{h}$, and $72\text{h}$ lead times.

---

## 2. Training Data & Preprocessing Pipeline

### 2.1 Geographic Coverage
- **45 Indian Cities** across 6 distinct geographical and meteorological zones:
  - **North (11):** Delhi, Gurugram, Noida, Faridabad, Ghaziabad, Lucknow, Kanpur, Agra, Varanasi, Amritsar, Chandigarh
  - **West (8):** Mumbai, Pune, Ahmedabad, Surat, Jaipur, Jodhpur, Nagpur, Nashik
  - **South (9):** Bengaluru, Chennai, Hyderabad, Kochi, Coimbatore, Visakhapatnam, Mysuru, Thiruvananthapuram, Madurai
  - **East (7):** Kolkata, Patna, Gaya, Muzaffarpur, Bhubaneswar, Cuttack, Ranchi
  - **Central (5):** Bhopal, Indore, Gwalior, Raipur, Jabalpur
  - **Northeast (5):** Guwahati, Shillong, Agartala, Aizawl, Imphal

### 2.2 Ingestion & Feature Engineering
- **Sources:**
  - Copernicus Atmospheric Monitoring Service (CAMS) reanalysis via Open-Meteo Air Quality API (CC BY 4.0).
  - ERA5 / ECMWF / DWD meteorological reanalysis via Open-Meteo Archive API (CC BY 4.0).
  - Central Pollution Control Board (CPCB) physical ground-truth station data (`city_day.csv`, 29,531 daily records across 26 cities).
- **Engineered Features (Zero-Leakage):**
  - Atmospheric Dispersion: Ventilation Index ($\text{wind\_speed} \times \text{boundary\_layer\_height}$), Stagnation Indicator ($\text{wind} < 2\,\text{m/s} \land \text{RH} > 70\%$).
  - Temporal & Cyclical: Diurnal $\sin/\cos$, Annual $\sin/\cos$, Day-of-week, Weekend indicator.
  - Indian Climatology: Monsoon flag (Jun–Sep), Post-monsoon crop burning window (Oct 15 – Nov 20 in Indo-Gangetic basin).
  - Topographic: Surface elevation ($4\text{m}$ to $1,525\text{m}$), geographical coordinates, regional encodings.
  - Autoregressive Lags & Rolling: $t-1\text{h}$, $t-6\text{h}$, $t-24\text{h}$ lags; $24\text{h}$ rolling mean and rolling std computed with strictly past data (`closed='left'`).

---

## 3. Evaluation Protocols & Integrity Safeguards

1. **Chronological Splitting (Zero Lookahead Leakage):**
   - The data is split strictly along the time axis: **Train (70%) < Validation (15%) < Test (15%)**.
   - Shuffling and cross-validation across time are forbidden, preventing future-to-past information leakage.
2. **Leave-Cities-Out Spatial Generalization:**
   - 6 diverse cities across different regions (`Amritsar`, `Pune`, `Chennai`, `Patna`, `Indore`, `Guwahati`) were completely isolated from the training partition and evaluated as unseen geographies to assess spatial transferability.
3. **Physical Station Ground-Truth Benchmarking:**
   - Model predictions are cross-validated against physical CPCB regulatory monitoring stations to assess real-world fidelity and reanalysis discrepancy.

---

## 4. Intended Use & Operational Limits

### Intended Use Cases
- Informational air quality forecasting across Indian metropolitan, tier-2, and industrial centers.
- Personal health exposure risk assessment and travel/relocation decision support.
- Explainability analysis showing which weather variables drive model outputs.

### Explicit Out-of-Scope & Prohibited Uses
- **NOT Medical Advice or Diagnosis:** Must never be used as a clinical diagnostic tool or substitute for professional medical care.
- **NOT Official Regulatory Compliance AQI:** While calculations adhere to CPCB breakpoint sub-index formulas, model predictions are decision-support estimates and do not replace certified statutory CAAQMS sensor telemetry.
- **NOT Chemical Emission Source Apportionment:** SHAP and LIME feature attributions quantify mathematical algorithmic sensitivity, not chemical receptor mass balances (such as EPA PMF).

---

## 5. Free-Tier Operational Constraints (Render 512 MB)
- Models are serialized with high compression (`joblib` level 3) keeping the bundle size under $30\text{ MB}$.
- Tree-based models (Random Forest, XGBoost) are served directly due to low CPU and memory footprint ($< 45\text{ MB}$ RSS), leaving over $250\text{ MB}$ of free headroom on Render's 512 MB free tier.
- Deep sequence models (LSTM, Transformer) are evaluated offline with full benchmark transparency.
