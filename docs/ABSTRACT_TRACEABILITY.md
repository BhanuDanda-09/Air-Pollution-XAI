# Capstone Abstract to Implementation Traceability Report

**Project Title**: Explainable AI-Based Air Pollution Prediction and Source Attribution  
**Degree**: Bachelor of Technology (B.Tech) Capstone Project  
**Version**: 2.0.0 (All-India Multi-Pollutant & Health-Personalised Decision System)  
**Academic Year**: 2026  

---

## 1. Abstract Commitment vs. Implementation Matrix

This document provides a line-by-line verification between the university-approved capstone abstract and the final software, machine learning models, and decision-support systems delivered in the repository.

| Approved Abstract Commitment | Implemented System Architecture | Primary Artifacts & Code | Implementation Status | Notes for Project Guide |
|:---|:---|:---|:---:|:---|
| **1. Multi-Pollutant Scope ($PM_{2.5}, PM_{10}, NO_2, SO_2, CO, O_3$)** | Ingested, standardized, and benchmarked all six criteria pollutants across hourly reanalysis and CPCB ground-truth stations. | `src/data_pipeline_all_india.py`, `backend/services/multi_pollutant_service.py` | **100% Complete** | Official CPCB 2014 breakpoint formula applied to compute individual sub-indices and overall AQI. $CO$ correctly converted from $\mu\text{g/m}^3$ to $\text{mg/m}^3$. |
| **2. Nationwide All-India Spatial Scope** | 45 catalogued cities across North, South, West, East, Central, and Northeast regions. | `dataset/all_india_cities.json`, `backend/services/city_service.py` | **100% Complete** | 162,000-hour continuous dataset constructed without temporal leakage. Includes metros, industrial centers, and hill sanctuaries. |
| **3. Machine Learning & Sequence Models (RF, XGBoost, LSTM, Transformer)** | Benchmarked Persistence baseline, Random Forest, XGBoost, LSTM, and Deep Transformer across 1h, 6h, 24h, and 72h lead horizons. | `src/train_multi_pollutant_models.py`, `results/multi_pollutant_benchmarks.json` | **100% Complete** | XGBoost models exported to compressed 2.06 MB bundle (`xgb_models_serving.joblib`) to run within Render 512 MB RAM ceiling. Deep models evaluated offline and reported in dashboard. |
| **4. Explainable AI for Meteorological Drivers (SHAP & LIME)** | TreeExplainer SHAP computed for all 6 pollutants; LIME local surrogates evaluated across pollution scenarios. | `src/explain_multi_pollutant.py`, `results/multi_pollutant_shap.json`, `backend/routes/explanation_routes.py` | **100% Complete** | Strictly framed as *"feature attribution (what drives the model)"*, **never** *"chemical source apportionment"*, honoring scientific integrity. |
| **5. Hotspot Detection & Vulnerability Analysis** | Empirical exposure percentiles ($P_{50}, P_{75}, P_{90}, P_{99}$), winter/summer ratios, and 5 regional vulnerability tiers. | `src/hotspot_analysis.py`, `results/city_hotspots.json`, `frontend/src/pages/HotspotsPage.jsx` | **100% Complete** | 45 cities ranked; identifies Severe Persistent Basins vs. Coastal Marine Dispersion vs. Clean Sanctuaries. |
| **6. Decision-Support & Actionable Guidance** | Health-Personalised Relocation Advisor comparing origin vs. candidate destinations with rule-based Personal Exposure Risk score ($0\text{--}100$). | `backend/services/risk_service.py`, `frontend/src/pages/RelocationAdvisorPage.jsx`, `docs/RISK_ENGINE.md` | **100% Complete** | Transparent, deterministic scoring based on WHO 2021 air quality guidelines and CPCB NAAQS. Sensitive profiles (asthma, COPD, pregnancy) receive stricter thresholds. |
| **7. Privacy & Data Protection Compliance** | Statutory compliance with India's Digital Personal Data Protection (DPDP) Act 2023. | `backend/routes/user_routes.py`, `frontend/src/pages/PrivacyPage.jsx` | **100% Complete** | Explicit consent, Section 11 data portability (`GET /api/user/export-data`), Section 12 right to erasure (`POST /api/user/delete-account`). Zero logging of health fields. |
| **8. Real-Time Production Deployment** | Free-tier deployment on Vercel (Frontend) and Render (Backend) with automated CI/CD and uptime pinger. | `frontend/vercel.json`, `backend/app.py`, `.github/workflows/ci.yml` | **100% Complete** | Maintained $<15\text{ MB}$ memory footprint; cold start wake-up banner implemented. |
| **9. Nationwide Hierarchy & Transparent Coverage Tiers** | All-India resolution (State, District, City, Town, Village, 6-digit PIN code) with 3-tier coverage badges and scheduled district precomputations. | `backend/services/location_resolver.py`, `backend/routes/geo_routes.py`, `frontend/src/components/LocationHierarchySelector.jsx`, `frontend/src/components/CoverageTierBadge.jsx`, `frontend/src/pages/DistrictsPage.jsx`, `.github/workflows/district_precompute.yml` | **100% Complete** | 36 States/UTs, 323 districts, 202 CPCB stations. Tier 1 ($\le 25\text{ km}$ station), Tier 2 ($25\text{--}50\text{ km}$ district model), Tier 3 ($>50\text{ km}$ gridded estimate with plain-language disclosure: *"No monitoring station nearby; this is a regional estimate, not a measurement"*). |
| **10. Early Warning System (CAMS 24–72h)** | 24–72 hour hourly forecast from Open-Meteo CAMS for saved places and assessed coordinates. Shows forecast timeline and "Warning" banner when pollutants enter Poor, Very Poor, or Severe bands, with expected start time and duration. Includes on-demand "Check Now" and optional consent-based email alerts. | `backend/services/air_quality_service.py`, `backend/routes/air_routes.py`, `frontend/src/components/EarlyWarningBanner.jsx`, `frontend/src/pages/SavedPlacesPage.jsx` | **100% Complete** | All forecast values strictly labeled *"Reference forecast (CAMS)"* and compared against statutory CPCB 2014 breakpoint standards. |
| **11. Multi-Pollutant Interactions & Atmospheric Coupling** | 7-day rolling history across all 6 criteria pollutants ($PM_{2.5}, PM_{10}, NO_2, SO_2, CO, O_3$) with a $6 \times 6$ Pearson correlation heatmap and plain-language atmospheric chemistry readings. | `backend/services/multi_pollutant_service.py`, `frontend/src/components/PollutantInteractionsSection.jsx` | **100% Complete** | Synthesizes combustion coupling ($PM_{2.5} + CO$), photochemical titration ($O_3 \text{ vs } NO_2$), particulate co-elevation, secondary sulfates, and vehicular exhaust tracers. |
| **12. Authority Insights & Statutory GRAP Schedule** | Insights for Authorities dashboard featuring (a) districts/states needing attention now, (b) persistent vs. seasonal hotspots, (c) dominant meteorological drivers from SHAP, and (d) recommended-actions table by severity band. | `frontend/src/pages/DistrictsPage.jsx` | **100% Complete** | Directly cites official Commission for Air Quality Management (CAQM) Act 2021 Stage I–IV schedule and prominently marks recommendations as advisory. |
| **13. Citizen Precautions Linked to FAQ** | Condition-tailored citizen precautions for respiratory/asthma, cardiovascular, pregnancy, senior citizens, children, and outdoor commuters in every verdict and relocation report. | `backend/services/livability_service.py`, `backend/services/risk_service.py`, `frontend/src/components/LivabilityScoreCard.jsx`, `frontend/src/pages/RelocationAdvisorPage.jsx` | **100% Complete** | Synthesizes WHO 2021 Clinical Guidelines and CPCB Health Advisory Protocols with one-click direct links to `/faq`. |

---

## 2. Items Honestly Marked as Out of Scope (Scientific Boundaries)

In academic research, transparently stating boundaries strengthens the defense. The following aspects were deliberately kept out of scope with clear justifications:

1. **Real-Time Traffic Sensor Telemetry**:
   - *Status*: **Out of Scope (Proxy-Based Evaluation)**.
   - *Scientific Rationale*: India lacks a unified, free, real-time vehicular count API covering urban corridors. Rather than synthesizing fabricated sensor numbers, urban traffic intensity is modeled through real-world surrogate tracers: commute duration, transport mode multipliers (two-wheeler vs. metro), road network density, and diurnal Nitrogen Dioxide ($NO_2$) and Carbon Monoxide ($CO$) co-elevation.
2. **Live Deep Sequence Model Serving (Multi-Layer LSTM / Transformers)**:
   - *Status*: **Out of Scope for Production Web Service (Offline Benchmarked)**.
   - *Engineering Rationale*: Serving PyTorch/TensorFlow deep sequence models live consumes >350 MB RAM, risking Out-Of-Memory (OOM) process termination on Render's 512 MB free-tier container budget.
   - *Implementation*: Deep sequence models were thoroughly trained and benchmarked offline (reported in `results/multi_pollutant_benchmarks.json` and the dashboard), while production web serving runs compressed, regularized gradient boosted decision trees (`xgb_models_serving.joblib`, 2.06 MB on disk, <12 MB RAM footprint).
3. **Multi-Pollutant Chemical Mass Apportionment Models**:
   - *Status*: **Out of Scope (Feature Attribution Distinguished from Source Apportionment)**.
   - *Scientific Rationale*: Algorithmic feature attribution (SHAP TreeExplainer and LIME) reveals mathematical feature influences on model predictions (what drives the model). It cannot substitute for physical laboratory chemical speciation assays (e.g. EPA Positive Matrix Factorization / PMF) which physically measure heavy metals, ions, and elemental carbon from quartz filter tapes to separate vehicular exhaust from biomass smoke. AirIQ India adheres to scientific integrity by disclosing this boundary upfront.

---

## 3. Guide & Viva Voce Discussion Points

When presenting to your project guide and evaluation committee, highlight these key engineering strengths:
- **Zero Data Leakage**: Explain how chronological train/val/test splits and backward-only rolling windows prevent the common leakage traps found in published student literature.
- **Atmospheric Physics vs. Persistence Horizon Decay**: Demonstrate why persistence excels at 1 hour ($R^2 \approx 0.96$) but collapses beyond 3 hours ($R^2 < 0.58$ and negative for $O_3$), proving that machine learning captures non-linear diurnal chemistry.
- **Responsible AI**: Emphasize why the health engine is rule-based and transparent rather than a black box, and why SHAP is strictly labeled as model feature attribution rather than chemical mass apportionment.
