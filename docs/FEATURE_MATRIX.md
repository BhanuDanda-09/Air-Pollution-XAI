# Feature Matrix & Verification Audit

## Capstone System: Explainable AI-Based Air Pollution Prediction and Source Attribution
**Release Version**: `2.0.0` | **Status**: 100% Implemented & Verified | **Date**: November 20, 2026

---

## 1. Abstract & Core Requirements Mapping

| Abstract Requirement | Specification & Architecture | Backend Endpoint / Service | Frontend Route & Component | Status |
|:---|:---|:---|:---|:---:|
| **Criteria Pollutants** | $PM_{2.5}, PM_{10}, NO_2, SO_2, CO, O_3$ with official CPCB 2014 sub-index calculation | `/api/air/current`, `/api/air/forecast` (`multi_pollutant_service.py`) | `/live-assessment`, `/relocation` (`LiveAssessmentResult.jsx`, `RelocationAdvisorPage.jsx`) | **VERIFIED** |
| **All-India Coverage** | 45 catalogued cities across North, South, West, East, Central, Northeast | `/api/cities`, `/api/geocode` (`city_service.py`) | Navigation, preset buttons, city picker dropdowns | **VERIFIED** |
| **Multi-Horizon Models** | Persistence, Random Forest, XGBoost, LSTM, Transformer (1h, 6h, 24h, 72h lead times) | `train_multi_pollutant_models.py`, `models/all_india/xgb_models_serving.joblib` | `/comparison`, `/prediction` (`ModelComparisonPage.jsx`) | **VERIFIED** |
| **Explainable AI (XAI)** | TreeExplainer SHAP & LIME meteorological drivers strictly labeled *"Feature Attribution"* | `GET/POST /api/explain` (`explanation_routes.py`, `explain_multi_pollutant.py`) | `/explainability` (`Explainability.jsx`, `SHAPExplanation.jsx`) | **VERIFIED** |
| **Hotspot Analysis** | Percentiles ($P_{50}, P_{75}, P_{90}, P_{99}$), seasonal winter/summer ratios, 5 vulnerability tiers | `/api/hotspots` (`hotspot_service.py`) | `/hotspots` (`HotspotsPage.jsx`) | **VERIFIED** |
| **Relocation Advisor** | Multi-place comparison (origin vs 1-4 destinations), WHO 2021 & CPCB sensitivity multipliers | `POST /api/relocation/compare` (`risk_service.py`) | `/relocation` (`RelocationAdvisorPage.jsx`) | **VERIFIED** |
| **DPDP Act 2023** | Explicit consent, data export (`/api/user/export-data`), right to erasure (`/api/user/delete-account`) | `user_routes.py`, `risk_service.py` | `/privacy` (`PrivacyPage.jsx`, `RelocationAdvisorPage.jsx`) | **VERIFIED** |
| **Memory Ceiling** | Render 512 MB free tier ceiling respected (lightweight XGBoost serving bundle: 2.06 MB) | `xgb_models_serving.joblib`, lazy imports | Server health monitor, cold start banner | **VERIFIED** |

---

## 2. Backend REST API Endpoints

| Endpoint | Method | Purpose | Rate Limit | Timeout | Tests Status |
|:---|:---:|:---|:---:|:---:|:---:|
| `/api/health` | `GET` | Service liveness, model status, version | None | <5ms | **PASSED** |
| `/api/cities` | `GET` | Nationwide 45-city catalog with coordinates, state, region | 60/min | <10ms | **PASSED** |
| `/api/geocode` | `GET` | India-only Nominatim and local city geocoding lookup | 60/min | 6s | **PASSED** |
| `/api/air/current` | `GET` | Live Copernicus CAMS 6-pollutant readings + CPCB AQI | 60/min | 6s | **PASSED** |
| `/api/air/forecast` | `POST` | 1h, 6h, 24h, 72h forecasts with ±1.96×RMSE uncertainty bands | 60/min | 6s | **PASSED** |
| `/api/air/history` | `GET` | Past 7-day hourly multi-pollutant trajectory | 60/min | 6s | **PASSED** |
| `/api/air/climatology` | `GET` | Monthly means, best/worst months, winter inversion factors | 60/min | <10ms | **PASSED** |
| `/api/hotspots` | `GET` | 45-city exposure rankings, regional summaries, vulnerability tiers | 60/min | <10ms | **PASSED** |
| `/api/relocation/compare` | `POST` | Personal exposure risk scoring, candidate destination ranking | 40/min | 6s | **PASSED** |
| `/api/explain` | `GET/POST`| TreeExplainer SHAP local attributions & global importance | 30/min | 6s | **PASSED** |
| `/api/user/export-data` | `GET` | DPDP Act 2023 complete personal data export bundle | 10/min | <50ms | **PASSED** |
| `/api/user/delete-account`| `POST`| DPDP Act 2023 permanent erasure of user account & health data | 10/min | <50ms | **PASSED** |

---

## 3. Frontend Pages, Forms, and Interactive Components

| Page / Component | URL Path | Key User Actions & Controls | Responsiveness | E2E Tests Status |
|:---|:---|:---|:---:|:---:|
| **Navbar & Header** | Global | Brand link, Check My Air, Relocation Advisor, Saved Places, Insights dropdown, More dropdown, Dark mode toggle, Auth button / User menu | 360px – 1920px (0px overflow) | **PASSED** |
| **Home Page** | `/` | Hero section, "Check Your Air Now" interactive card, 45-city preset selection, "How It Works" 3-step guide, Feature discovery grid | 360px – 1920px | **PASSED** |
| **Live Assessment** | `/live-assessment` | GPS geolocate, coordinate inputs, Delhi preset, 6-pollutant CPCB sub-index cards, model telemetry | 360px – 1920px | **PASSED** |
| **Relocation Advisor** | `/relocation` | 4-step wizard: Origin/Destinations $\to$ Health Profile (Asthma, COPD, etc.) $\to$ Household/DPDP Consent $\to$ Comparative Decision Report with Personal Risk score | 360px – 1920px | **PASSED** |
| **National Hotspots** | `/hotspots` | 45-city national ranking table, regional filters (North, South, etc.), vulnerability tier filters, search bar | 360px – 1920px | **PASSED** |
| **Saved Places** | `/saved-places` | Add place modal, edit/rename modal, delete confirmation, CSV data export, threshold alert configuration | 360px – 1920px | **PASSED** |
| **Exposure History** | `/history` | Assessment log list, filter/search, interactive SVG exposure trend chart, clear history | 360px – 1920px | **PASSED** |
| **Privacy & DPDP** | `/privacy` | DPDP Act statutory disclosures, Download Complete Data Bundle (`/api/user/export-data`), Permanently Delete Account (`/api/user/delete-account`) | 360px – 1920px | **PASSED** |
| **About & Methodology** | `/about` | Research design, data source attributions, Section 7 Viva Voce FAQ | 360px – 1920px | **PASSED** |
| **Footer** | Global | 4-column layout, quick links, CPCB / WHO / DPDP disclosures, university & author attribution | 360px – 1920px | **PASSED** |

---

## 4. Verification Test Summary

- **Backend Test Suite (pytest)**: 99 / 99 Unit and Integration Tests Passed.
- **Frontend Test Suite (Jest / Node)**: 12 / 12 Unit Test Suites Passed.
- **Playwright Smoke Tests**: 18 / 18 Routes and Breakpoint Tests Passed.
- **Playwright Full Flow E2E Tests**: 10 / 10 End-to-End User Journeys Passed.
