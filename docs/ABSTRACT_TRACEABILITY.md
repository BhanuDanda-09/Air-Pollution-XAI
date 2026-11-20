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

---

## 2. Items Honestly Marked as Partial or Deferred

In academic research, transparently stating boundaries strengthens the defense. The following aspects were deliberately scoped with clear justifications:

1. **Traffic Sensor Data**:
   - *Status*: **Proxy-Based (Deferred to Future Work)**.
   - *Rationale*: India lacks a unified, free, real-time vehicular count API covering all 45 cities.
   - *Implementation*: Modeled via commute duration, transport mode multipliers (two-wheeler vs. metro), and road network density proxies rather than inventing synthetic traffic counts.
2. **Deep Learning Serving on Free Tier**:
   - *Status*: **Offline Benchmarked & Documented**.
   - *Rationale*: Serving PyTorch/TensorFlow sequence models live consumes >350 MB RAM, risking OOM termination on Render's 512 MB free tier.
   - *Implementation*: Benchmarked offline, reported transparently in `results/multi_pollutant_benchmarks.json` and the frontend comparison dashboard, while serving regularized XGBoost models (<11 MB RAM).

---

## 3. Guide & Viva Voce Discussion Points

When presenting to your project guide and evaluation committee, highlight these key engineering strengths:
- **Zero Data Leakage**: Explain how chronological train/val/test splits and backward-only rolling windows prevent the common leakage traps found in published student literature.
- **Atmospheric Physics vs. Persistence Horizon Decay**: Demonstrate why persistence excels at 1 hour ($R^2 \approx 0.96$) but collapses beyond 3 hours ($R^2 < 0.58$ and negative for $O_3$), proving that machine learning captures non-linear diurnal chemistry.
- **Responsible AI**: Emphasize why the health engine is rule-based and transparent rather than a black box, and why SHAP is strictly labeled as model feature attribution rather than chemical mass apportionment.
