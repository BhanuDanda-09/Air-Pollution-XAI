# Capstone Viva Voce & Final Presentation Deck

**Project Title**: Explainable AI-Based Air Pollution Prediction and Source Attribution: An All-India, Multi-Pollutant, Health-Personalised Air Quality Decision System  
**Presentation Time**: 15 Minutes (+ 5 Minutes Q&A)  
**Target Audience**: Academic Evaluation Committee, External Examiners, Department Faculty  

---

## Slide 1: Title & Overview
- **Title**: Explainable AI-Based Air Pollution Prediction and Source Attribution
- **Subtitle**: An All-India, Multi-Pollutant, Health-Personalised Decision System
- **Presenter**: Final Year B.Tech Capstone Team
- **Key Deliverable**: Live Production System at [https://air-pollution-xai.vercel.app](https://air-pollution-xai.vercel.app)
- **Speaking Notes (1 min)**:
  > *"Good morning respected committee members and external examiners. Today, we present our capstone project, which upgrades air quality AI from single-city black-box demos into an all-India, multi-pollutant, health-personalized decision system. Our system covers 45 Indian cities, tracks all 6 NAAQS criteria pollutants, incorporates WHO 2021 clinical vulnerability scoring, and explains every forecast with game-theoretic SHAP feature attribution."*

---

## Slide 2: Problem Statement & Academic Gaps
- **The Challenge**: 90%+ of India breathes air exceeding WHO guidelines ($5\,\mu\text{g/m}^3$).
- **Gap 1: Single-Pollutant & Single-City**: Most student projects focus solely on Delhi $PM_{2.5}$.
- **Gap 2: The Data Leakage Pitfall**: Random train/test shuffling in literature leaks future atmospheric states into training data.
- **Gap 3: The Black-Box Disconnect**: Complex models predict numbers but fail to explain physical drivers or personalized medical risk.
- **Speaking Notes (1 min)**:
  > *"Historically, machine learning models for air quality have suffered from three major flaws: they are confined to single cities, they artificially inflate metrics through random time-series shuffling, and they operate as black boxes that treat a healthy athlete and an asthmatic child identically."*

---

## Slide 3: All-India Multi-City & Multi-Pollutant Dataset
- **Continuous 162,000-Hour Dataset**: 45 catalogued cities across all 6 Indian geographic zones.
- **6 Criteria Pollutants**: $PM_{2.5}, PM_{10}, NO_2, SO_2, CO, O_3$.
- **Physics Precursors**: ECMWF ERA5 planetary boundary layer height ($z_i$), ventilation index ($z_i \times u$), surface radiation, relative humidity, pressure tendencies.
- **Leak-Free Chronological Split**: Strict time-based splitting ($T_{\text{train}} < T_{\text{val}} < T_{\text{test}}$) and backward-only rolling windows.
- **Speaking Notes (1.5 min)**:
  > *"We built an all-India dataset covering 45 cities across North, South, West, East, Central, and Northeast regions. Crucially, all feature engineering is strictly backward-looking with zero lookahead, and data splitting is chronological, ensuring zero data leakage."*

---

## Slide 4: Multi-Horizon Forecasting & Atmospheric Physics
- **Lead Times Evaluated**: 1h, 6h, 24h, and 72h.
- **Atmospheric Inertia vs. Diurnal Decay**:
  - At **1h**: Persistence baseline achieves $R^2 \approx 0.96$ due to physical inertia.
  - At **6h**: Solar radiation and boundary layer expansion cause persistence to collapse ($NO_2$ $R^2 = -0.198$; $O_3$ $R^2 = -0.434$).
  - At **6h**: XGBoost maintains $R^2 = 0.637$ for $NO_2$ (Skill $+0.697$) and $R^2 = 0.785$ for $O_3$ (Skill $+0.850$).
- **Speaking Notes (1.5 min)**:
  > *"A critical scientific finding in our work is the behavior of atmospheric inertia. At 1 hour, predicting that current pollution will persist works well. But beyond 3 hours, solar heating and nocturnal inversions destroy persistence. Our gradient boosted models capture non-linear diurnal atmospheric chemistry where persistence fails completely."*

---

## Slide 5: Spatial Generalization (Leave-Cities-Out Testing)
- **Objective**: Measure model performance on unseen Indian cities omitted during training.
- **Validation**: Models trained on 40 cities tested on held-out unseen cities.
- **Results**:
  - **1-hour Horizon**: $R^2 = 0.9629$, $\text{RMSE} = 14.18\,\mu\text{g/m}^3$.
  - **24-hour Horizon**: $R^2 = 0.6027$, $\text{RMSE} = 34.20\,\mu\text{g/m}^3$.
- **Conclusion**: Proves models learn transferrable atmospheric physics rather than memorizing city coordinates.
- **Speaking Notes (1 min)**:
  > *"To prove our models generalize across India, we performed leave-cities-out testing. Even on cities never seen during training, the model achieves an $R^2$ of 0.60 at 24 hours, proving it learns atmospheric dynamics rather than geographic memorization."*

---

## Slide 6: Explainable AI: Feature Attribution vs. Source Apportionment
- **Game-Theoretic SHAP (TreeExplainer)**: Computes exact Shapley values $\phi_i(f, x)$ quantifying feature contributions.
- **Strict Scientific Labeling**:
  - **What SHAP is**: Mathematical Feature Attribution (what drives the ML model).
  - **What SHAP is NOT**: Chemical Mass Source Apportionment (e.g., 28% vehicular, 35% stubble burning).
  - Chemical apportionment requires physical aerosol filter speciation and Positive Matrix Factorization (PMF).
- **Speaking Notes (1.5 min)**:
  > *"One of our proudest methodological stands is honest scientific framing. We strictly label our SHAP results as 'Feature Attribution'—explaining how features like boundary layer compression or humidity drive the model. Claiming that SHAP performs chemical source apportionment without filter speciation is scientifically invalid, and our UI explicitly respects this boundary."*

---

## Slide 7: National Hotspot Exposure Leaderboard
- **Methodology**: 45 cities ranked by $P_{50}, P_{75}, P_{90}, P_{99}$ and seasonal winter/summer inversion ratios.
- **5 Regional Exposure Tiers**:
  1. *Severe Persistent Basin* (Faridabad, Delhi, Ghaziabad, Patna)
  2. *Winter Episodic Hotspot* (Kanpur, Lucknow, Varanasi, Agra)
  3. *Industrial / Transit Corridor* (Ludhiana, Surat, Ahmedabad)
  4. *Coastal Marine Dispersion* (Mumbai, Chennai, Kochi)
  5. *Highland / Clean Sanctuary* (Bengaluru, Mysuru, Shillong)
- **Speaking Notes (1 min)**:
  > *"Our hotspot analysis clusters Indian cities into five distinct vulnerability tiers. This distinguishes seasonal winter episodic spikes from year-round industrial transit corridors and coastal dispersion airsheds."*

---

## Slide 8: Health-Personalised Relocation Advisor (Core Feature)
- **Multi-Step Wizard**: Origin $\to$ Candidate Destinations $\to$ Health Profile $\to$ Decision Report.
- **Personal Exposure Risk Score ($0\text{--}100$)**:
  $$S_{\text{risk}} = \min\left(100, \left( 0.35 I_{\text{curr}} + 0.25 I_{\text{fc}} + 0.20 I_{\text{season}} + 0.20 I_{\text{ann}} \right) \cdot M_{\text{vuln}} \cdot M_{\text{exp}} \cdot M_{\text{prot}}\right)$$
- **Medical Multipliers ($M_{\text{vuln}}$)**: WHO 2021 & GINA/GOLD guidelines for Asthma ($+0.35$), COPD ($+0.40$), Cardiovascular ($+0.30$), Pregnancy ($+0.30$), Pediatric ($+0.25$).
- **Actionable Verdicts**: Highly Recommended, Recommended with Precautions, Not Recommended, Avoid.
- **Speaking Notes (2 min)**:
  > *"Here is our core innovation: the Relocation Advisor. An adult with asthma comparing Delhi to Bengaluru receives a personalized exposure risk evaluation. The engine combines real-time data, 24h forecast, seasonal peak, and annual baseline with WHO medical multipliers. Relocating from Delhi to Bengaluru produces a verified 68% personal exposure risk reduction, with practical N95 and HEPA advice."*

---

## Slide 9: Privacy & India DPDP Act 2023 Compliance
- **Statutory Data Fiduciary Architecture**:
  - **Section 6**: Clear, affirmative consent before storing sensitive health conditions.
  - **Section 11 (Data Portability)**: 1-click machine-readable JSON bundle download (`/api/user/export-data`).
  - **Section 12 (Right to Erasure)**: Complete account and health record deletion (`/api/user/delete-account`).
  - **Log Sanitization**: Health arrays stripped from all server logs.
- **Speaking Notes (1 min)**:
  > *"Because our system collects health attributes, we implemented full statutory compliance with India's Digital Personal Data Protection Act 2023, including explicit consent, automated data portability downloads, and permanent account erasure."*

---

## Slide 10: Engineering Optimization & Cloud Architecture
- **The Challenge**: Render free-tier enforces a strict **512 MB RAM ceiling**.
- **The Innovation**: Compressed XGBoost multi-pollutant serving bundle (`xgb_models_serving.joblib`):
  - File size: **2.06 MB** on disk.
  - Runtime RSS: **10.2 MB RAM**.
  - Headroom: $>400\text{ MB}$ free memory remaining on Render.
- **Frontend Architecture**: React 18, Vite rollup code splitting, 4.6s production build, Tailwind clean-air palette, light/dark mode.
- **Speaking Notes (1 min)**:
  > *"To ensure deployment on free-tier cloud infrastructure without OOM crashes, we optimized our model serving pipeline into a 2.06 MB bundle that requires only 10.2 MB of RAM, leaving plenty of headroom under Render's 512 MB ceiling."*

---

## Slide 11: Comprehensive Quality Assurance & Verification
- **Automated Tests**:
  - **99 Backend pytest Tests** (Math, API, rate limiting, cache, RBAC, DPDP).
  - **12 Frontend Unit Tests** (Validation, demo security, state persistence).
  - **18 Playwright Smoke Tests** (11 routes, document titles, 0px overflow).
  - **10 Playwright Full-Flow E2E Tests** (Authentication, live assessment, CSV export, relocation wizard, DPDP deletion).
- **Total**: **139 Passing Tests with 100% Success Rate**.
- **Speaking Notes (1 min)**:
  > *"Our system is verified by 139 automated tests across Python and Playwright. Every button, route, form, and mathematical equation is covered by automated CI/CD pipeline tests."*

---

## Slide 12: Live Demonstration & Q&A
- **Live Demo Protocol**:
  1. Quick air check at Connaught Place, Delhi (Dark mode switch).
  2. 6 Criteria Pollutants CPCB sub-index breakdown on `/live-assessment`.
  3. Relocation comparison: Delhi vs. Bengaluru for asthmatic profile on `/relocation`.
  4. 45-city Hotspot leaderboard filtering on `/hotspots`.
  5. DPDP data export and account erasure on `/privacy`.
- **Open for Questions**: Thank you!
- **Speaking Notes (1.5 min)**:
  > *"We now invite the committee to view the live deployment at air-pollution-xai.vercel.app and welcome your questions."*
