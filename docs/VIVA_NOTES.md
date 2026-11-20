# University Viva Voce & Capstone Defense Notes

## Explainable AI-Based Air Pollution Prediction and Source Attribution
**Capstone Project Defense Guide & Methodology FAQ**

---

### Q1: Why do you strictly distinguish between "Model Feature Attribution" (SHAP) and "Chemical Source Apportionment"?
**Defense Answer:**
> *"In environmental science and air quality modeling, 'Source Apportionment' has a strict physical-chemical definition: resolving the mass contributions of specific emission sources (e.g., 28% vehicular traffic, 35% agricultural stubble burning, 15% secondary sulfate/nitrate formation, 12% road dust) using chemical speciation monitors and receptor models like US EPA Positive Matrix Factorization (PMF) or Chemical Mass Balance (CMB).*
>
> *Our project uses Explainable AI (TreeExplainer SHAP and LIME) to compute mathematical feature attribution: $\phi_i(f, x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} [f(S \cup \{i\}) - f(S)]$. This explains **what drives the machine learning model's numerical estimate** (e.g., how low boundary layer height, high relative humidity, or low wind speed elevated the prediction). Conflating model sensitivity to a feature like 'wind speed' with 'chemical emission sources' is scientifically invalid. We honestly label our explanations as **Feature Attribution (What Drives the Model)**, as required by good scientific practice."*

---

### Q2: Why serve Random Forest and XGBoost in production rather than heavy Deep Learning (LSTM / Transformers)?
**Defense Answer:**
> *"There are three compelling engineering and scientific reasons:*
>
> 1. **Render Free-Tier 512 MB RAM Constraint**: A live PyTorch or TensorFlow runtime with transformer attention layers and CUDA/CPU weights easily consumes 350–500 MB RAM at idle, triggering immediate Out-Of-Memory (OOM) SIGKILL crashes on Render free tier. Our compressed XGBoost multi-pollutant serving bundle is only **2.06 MB** on disk and uses **10.2 MB RSS** at runtime, leaving >400 MB of safe operating headroom.
> 2. **Tabular Meteorological Inductive Bias**: Meteorological station data and gridded reanalysis are tabular time-series with dense non-linear interactions (e.g., ventilation index = wind speed × boundary layer height). Gradient boosted decision trees consistently match or outperform deep models on tabular datasets without requiring millions of parameters.
> 3. **Latency and Real-Time Responsiveness**: Tree-based inference executes in <15 milliseconds per request, compared to 400–1200 ms for sequential autoregressive transformer decoding on CPU. We evaluate LSTM and Transformer offline, report their exact benchmark metrics transparently in our paper and dashboard, and serve the highly optimized XGBoost models."*

---

### Q3: How did you ensure zero data leakage across your 162,000-sample multi-city dataset?
**Defense Answer:**
> *"Data leakage is the most common flaw in academic ML papers. We implemented three strict architectural barriers:*
>
> 1. **Chronological Time Splitting**: We split all data strictly by timestamp ($T_{\text{train}} < T_{\text{val}} < T_{\text{test}}$). Shuffling rows randomly is scientifically invalid in time series because future atmospheric states leak into the training set, artificially inflating $R^2$.
> 2. **Zero-Lookahead Feature Engineering**: All rolling windows (`rolling_mean_24h`, `rolling_max_24h`), lags (`lag_1h`, `lag_6h`, `lag_24h`), and rate-of-change deltas strictly look backwards ($t - \Delta t$). No forward-looking centered rolling windows or future observations are ever used.
> 3. **Leave-Cities-Out Spatial Generalization**: In addition to chronological testing, we evaluated spatial transferability by training models on 40 cities and testing strictly on held-out unseen cities (e.g., unseen Varanasi, unseen Coimbatore). This proved our models learn true atmospheric physics rather than memorizing city-specific coordinates."*

---

### Q4: Why does the Persistence baseline perform well at 1 hour but completely collapse at 6, 24, and 72 hours?
**Defense Answer:**
> *"This reflects fundamental atmospheric physics:*
>
> - **At 1-hour horizon ($t+1$)**: Atmospheric inertia dominates. The planetary boundary layer, ambient temperature, and urban traffic emissions cannot change discontinuously in 60 minutes. Therefore, predicting $C(t+1) \approx C(t)$ achieves a high baseline $R^2 \approx 0.92\text{--}0.96$.
> - **At 6-hour, 24-hour, and 72-hour horizons**: Diurnal solar radiation cycles, thermal nocturnal inversions, and synoptic-scale wind advection completely alter pollutant concentrations. For photochemically reactive pollutants like Ozone ($O_3$) and Nitrogen Dioxide ($NO_2$), persistence collapses into negative $R^2$ (worse than predicting the mean: $NO_2$ 6h persistence $R^2 = -0.198$; $O_3$ 6h persistence $R^2 = -0.434$).
> - **ML Skill Score**: At 6h, our Random Forest achieves $R^2 = 0.643$ for $NO_2$ (Skill vs. Persistence = $+0.697$) and $R^2 = 0.769$ for $O_3$ (Skill = $+0.850$). This proves the machine learning models capture genuine non-linear atmospheric chemistry and boundary-layer physics that persistence cannot."*

---

### Q5: How does your Personal Exposure Risk Engine work, and why is it rule-based?
**Defense Answer:**
> *"The Relocation Advisor Personal Exposure Risk Engine (`risk_service.py`) calculates an individualized risk score ($0\text{--}100$) using transparent, documented WHO 2021 and CPCB guidelines:
>
> - It combines **current ambient concentration (35%)**, **24h/72h forecast (25%)**, **worst-month seasonal inversion peak (20%)**, and **annual chronic exposure (20%)**.
> - It applies clinical vulnerability multipliers derived from medical guidelines (GINA for asthma $+0.35$, GOLD for COPD $+0.40$, AHA for heart disease $+0.30$, WHO for pregnancy $+0.30$ and children $+0.25$).
> - It is intentionally rule-based and deterministic rather than an opaque neural network because clinical exposure guidance must be audit-transparent, reproducible, and explainable to both doctors and citizens. It never offers medical diagnosis—only environmental risk exposure verdicts."*

---

### Q6: How does your system comply with India's Digital Personal Data Protection (DPDP) Act 2023?
**Defense Answer:**
> *"The platform implements complete statutory data fiduciary obligations under the DPDP Act 2023:*
>
> 1. **Explicit Notice & Consent (Section 6)**: The relocation form requires unambiguous consent before processing health condition flags.
> 2. **Right to Data Portability (Section 11)**: Users can export their complete profile, health attributes, saved places, and assessment history via `GET /api/user/export-data` as a machine-readable JSON bundle.
> 3. **Right to Erasure / Account Deletion (Section 12)**: Users can permanently erase their account and all associated records via `POST /api/user/delete-account`, which cascade-deletes user profiles, health data, locations, and audit history.
> 4. **Zero Health Field Logging**: Server logs sanitize and suppress health conditions to prevent accidental credential or PII leaks in production."*

---

### Q7: How does your system provide all-India coverage down to villages and 6-digit PIN codes without crashing Render's 512 MB RAM limit?
**Defense Answer:**
> *"India has 36 States/UTs, over 780 administrative districts, ~19,300 postal delivery PIN codes, and more than 600,000 villages (Census 2011). Attempting to load millions of village names and coordinates into Python memory would require >400 MB of RAM, instantly triggering an Out-Of-Memory (OOM) SIGKILL crash on Render's 512 MB free tier.
>
> We solved this through a two-tiered spatial architecture:
>
> 1. **Lightweight In-Memory Catalogs (< 100 KB RSS)**: We store only the administrative state-district hierarchy (`india_states_districts.json`, 35.9 KB) and the 202 official CPCB CAAQMS ground monitoring stations (`cpcb_stations.json`, 35.6 KB) in memory.
> 2. **On-Demand Resolution with Persistent SQLite Disk Caching**: Villages, towns, micro-localities, and 6-digit PIN codes are resolved on-demand via the India Post API and Nominatim (strictly obeying 1 request/sec rate limits), and persisted in a lightweight SQLite disk database (`dataset/geo_cache.db`).
> 3. **Offline PIN-Prefix Routing**: Even if external geocoders fail or timeout, our built-in postal prefix routing tables map the first 2 and 3 digits of any Indian PIN code directly to its State, postal circle, and district centroid.
>
> This guarantees sub-millisecond response times, zero network dependency for cached queries, and keeps total Python process memory below 35 MB."*

---

### Q8: What are Coverage Tiers, and why is it scientifically dishonest to present village-level air quality as 'measured data'?
**Defense Answer:**
> *"In India, over 95% of geographical land area does not have a physical ambient air monitoring station within 25 km. A major ethical failure in commercial air quality apps is showing a single uncalibrated number for a rural village without stating whether it comes from a real monitoring station or a coarse mathematical model.
>
> Our platform introduces a transparent **3-Tier Coverage Framework**:
>
> - **Tier 1 (Station-Validated)**: Ground CPCB CAAQMS monitor within $\le 25\text{ km}$. We display the exact station name (e.g. *NIT Warangal - TSPCB*) and its latest ground reading alongside our model output.
> - **Tier 2 (Model-Derived City/District)**: Distance $25\text{--}50\text{ km}$ or district centroid, backed by spatial cross-validation error metrics ($R^2 = 0.81$, $\text{MAE} = 12.5\ \mu\text{g/m}^3$).
> - **Tier 3 (Gridded Regional Estimate)**: Remote village or rural area $> 50\text{ km}$ from any continuous station. The UI displays an amber badge disclosing Copernicus CAMS grid resolution ($\approx 11\text{ km}$) with a mandatory plain-language warning:
>   > **'No monitoring station nearby; this is a regional estimate, not a measurement.'**
>
> Furthermore, on Tier 3 / Low confidence queries, the health engine visibly softens verdicts to **'Indicative Only'**, while preserving strict clinical exposure multipliers for asthma, COPD, and pregnancy. This adheres to the highest standards of scientific reproducibility and medical ethics."*

