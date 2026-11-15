# Phase 6 Technical Report: React Frontend Development & Visual Explainable AI Dashboard

**Project Title:** Explainable AI-Based Air Pollution Prediction and Source Attribution  
**Phase:** Phase 6 — Interactive React Frontend Dashboard  
**Date:** November 15, 2026  
**Status:** Completed, Built, and Validated (Build & Unit Tests 100% Passing)

---

## 1. Executive Summary

Phase 6 delivers a responsive web user interface located in `frontend/`. Built with **React 18**, **Vite**, **Tailwind CSS**, and **Chart.js**, the dashboard interfaces with the Flask REST API backend constructed in Phase 5.

The frontend enables interactive $\text{PM}_{2.5}$ estimation, real-time input validation, multi-model held-out benchmark comparisons, indicative Central Pollution Control Board (CPCB) health categorization, and instance-level Explainable AI (SHAP) feature attribution visualizations.

All scientific boundaries established across Phases 1 through 5 are upheld:
- **Barometric Pressure ($\text{BP}$):** Strictly calibrated and displayed in **$\text{mmHg}$** ($700.0 - 780.0\,\text{mmHg}$).
- **Indicative CPCB Health Bands:** Prominently distinguished from an official multi-pollutant 24-hr CPCB AQI.
- **Statistical vs. Causal Attribution:** SHAP feature attributions are clearly explained as mathematical contributions to model predictions, with explicit disclaimers rejecting claims of chemical emission source attribution.
- **Sequential Model Blocker:** LSTM and Transformer models are shown as blocked pending genuine timestamped data.

---

## 2. Frontend Architecture & Directory Layout

The application employs a modular, component-driven React architecture:

```
frontend/
├── public/
│   └── favicon.svg             # Custom environmental SVG icon
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Top navigation bar with active route highlighting & API status indicator
│   │   ├── Sidebar.jsx         # Navigation drawer for responsive mobile & tablet viewports
│   │   ├── Footer.jsx          # Academic citations, repository link, and regulatory disclaimers
│   │   ├── StatCard.jsx        # Telemetry metric cards with badge indicators
│   │   ├── LoadingSpinner.jsx  # Animated spinner with loading messages
│   │   ├── ErrorMessage.jsx    # Standardized error banner with retry triggers
│   │   ├── PredictionForm.jsx  # Input sliders, numeric controls, presets, and validation errors
│   │   ├── PredictionResult.jsx# PM2.5 spotlight & indicative CPCB category display
│   │   ├── ModelComparison.jsx # 3-way comparative card and bar chart visualization
│   │   ├── SHAPExplanation.jsx # Tri-metric breakdown, table, and SHAP visualizer
│   │   ├── FeatureImportanceChart.jsx # Diverging horizontal bar chart (red=increasing, teal=decreasing)
│   │   └── PerformanceChart.jsx # Held-out benchmark metrics comparison chart (R², RMSE, MAE)
│   ├── pages/
│   │   ├── Home.jsx            # Landing page with problem statement and call-to-actions
│   │   ├── Dashboard.jsx       # Telemetry, model benchmarks, and meteorological specifications
│   │   ├── Prediction.jsx      # Single-model prediction workflow
│   │   ├── ModelComparisonPage.jsx # Multi-model comparative scenario analysis
│   │   ├── Explainability.jsx  # SHAP local attribution explorer
│   │   └── About.jsx           # Methodology, dataset, and scientific boundaries
│   ├── services/
│   │   ├── api.js              # Centralized Axios client with error interceptors
│   │   └── predictionService.js# Typed API consumer functions
│   ├── hooks/
│   │   ├── useModels.js        # Hook for model catalogue and health status
│   │   └── usePrediction.js    # Controller for predict, compare, and explain operations
│   ├── utils/
│   │   ├── validation.js       # Meteorological bounds & client-side verification
│   │   └── formatters.js       # CPCB color mappings and number formatters
│   ├── App.jsx                 # Route provider and global layout shell
│   ├── main.jsx                # React DOM root entry
│   └── index.css               # Tailwind directives and custom scrollbars
├── test/
│   └── validation.test.js      # Automated unit test suite
├── .env.example                # Example environment file
├── vercel.json                 # SPA client-side rewrite rules for Vercel
├── vite.config.js              # Vite bundler configuration
├── tailwind.config.js          # Extended brand colors & typography
├── postcss.config.js           # PostCSS configuration
├── package.json                # Pinned dependencies and build scripts
└── README.md                   # Full frontend documentation
```

---

## 3. Technology Stack & Dependencies

| Layer | Package / Tool | Version | Purpose |
| :--- | :--- | :---: | :--- |
| **Framework** | `react` / `react-dom` | `^18.3.1` | Component-based UI runtime |
| **Build Tool** | `vite` | `^6.0.7` | Fast ES-module development and production bundling |
| **Styling** | `tailwindcss` | `^3.4.17` | Utility-first responsive design system |
| **Routing** | `react-router-dom` | `^7.1.3` | Client-side routing with active state tracking |
| **Visualizations** | `chart.js` / `react-chartjs-2` | `^4.4.7` / `^5.3.0` | High-performance interactive canvas charts |
| **HTTP Client** | `axios` | `^1.7.9` | Promise-based REST client with centralized interceptors |
| **Icons** | `lucide-react` | `^0.469.0` | Accessible, clean UI iconography |

---

## 4. Page Implementations & Capabilities

### 4.1 Home Page (`/`)
- Hero banner with project title and mission statement: *"Predict PM2.5 concentrations using meteorological indicators and understand how machine learning models influence their predictions."*
- Explanations of fine particulate matter ($\text{PM}_{2.5}$) and surface meteorology interaction.
- Prominent call-to-action buttons navigating to `/prediction` and `/dashboard`.
- Prominent scientific disclaimer separating statistical estimations from certified monitor readings.

### 4.2 Dashboard Page (`/dashboard`)
- **4 Real-Time Telemetry Cards:**
  1. Top-performing model (`XGBoost (Tuned)`).
  2. Best held-out test $R^2$ score ($0.7455$).
  3. Best held-out test RMSE ($36.74\,\mu\text{g/m}^3$).
  4. Number of active trained models ($3$ active, $2$ blocked).
- **Benchmark Chart:** Interactive Chart.js bar chart allowing toggle between $R^2$, RMSE, and MAE across Random Forest, XGBoost, and MLP.
- **Model Status:** Available deployed models vs. blocked time-series models with explicit rationale.
- **Input Specifications Grid:** Display of all 5 features with units and bounds.

### 4.3 Prediction Page (`/prediction`)
- User-friendly form with sliders and numeric inputs.
- Quick scenario presets (*Winter Stagnation*, *Typical Monsoon*, *Standard Delhi Baseline*).
- Real-time client-side validation enforcing physical limits.
- Model selector dropdown (Random Forest, XGBoost [default], MLP).
- **Result Spotlight:** Large numeric readout of estimated $\text{PM}_{2.5}$ ($\mu\text{g/m}^3$), indicative CPCB health category pill with color-coding, health statement, and direct link to SHAP explainability.

### 4.4 Model Comparison Page (`/comparison`)
- Simultaneously runs all three available models on user inputs via `POST /api/compare`.
- Three comparative cards displaying predicted $\text{PM}_{2.5}$, indicative CPCB category, and held-out test benchmark metrics.
- Comparative bar chart visually contrasting single-instance model outputs.
- Educational note distinguishing held-out model generalization from single-instance variance.

### 4.5 Explainability Page (`/explainability`)
- Queries `POST /api/explain` to extract instance-level SHAP values.
- **Tri-Metric Summary:** Base expected value ($\mu\text{g/m}^3$), net feature shift, and final predicted output.
- **Diverging Horizontal Bar Chart:** Red bars indicate variables pushing $\text{PM}_{2.5}$ above baseline (positive SHAP); teal bars indicate variables mitigating $\text{PM}_{2.5}$ below baseline (negative SHAP).
- **Detailed Table:** Enumerates input values, SHAP values, directional impact, and plain-English interpretations.
- **Disclaimer:** Explicit clarification that SHAP reflects mathematical feature weights rather than chemical emissions causality.

### 4.6 About Page (`/about`)
- Academic documentation detailing:
  1. Problem statement.
  2. Project objectives.
  3. Dataset characteristics (Delhi surface observations, $2,027$ clean samples).
  4. Machine learning architectures (RF baseline, tuned XGBoost).
  5. Deep learning architecture (Keras 3 MLP).
  6. Explainable AI methodology (SHAP TreeExplainer & KernelExplainer).
  7. Scientific boundaries and project limitations.

---

## 5. Automated Build & Test Results

### 5.1 Unit Tests (`npm test`)
```
> air-pollution-xai-frontend@1.0.0 test
> node test/validation.test.js

Running frontend unit tests...
✓ All 7 frontend unit test suites passed successfully.
```
- Test 1: Verified valid default parameters pass validation.
- Test 2: Verified high $\text{BP}$ ($>780\,\text{mmHg}$) is rejected.
- Test 3: Verified low $\text{BP}$ ($<700\,\text{mmHg}$) is rejected.
- Test 4: Verified high $\text{RH}$ ($>100\%$) is rejected.
- Test 5: Verified missing feature is rejected.
- Test 6: Verified non-numeric string input is rejected.
- Test 7: Verified CPCB style color mappings and number formatting.

### 5.2 Production Build (`npm run build`)
```
> air-pollution-xai-frontend@1.0.0 build
> vite build

vite v6.4.6 building for production...
transforming...
✓ 1674 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.01 kB │ gzip:   0.56 kB
dist/assets/index-BHLvlQi8.css   34.84 kB │ gzip:   6.22 kB
dist/assets/index-DdZL5S6O.js   479.98 kB │ gzip: 156.79 kB
✓ built in 5.17s
```
Zero errors, warnings, or broken imports.

---

## 6. Vercel Deployment Configuration

1. **SPA Rewrites (`frontend/vercel.json`):**
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
   Ensures deep links and page refreshes on `/dashboard`, `/prediction`, etc. route directly to `index.html`.
2. **Environment Variable Configuration:**
   The frontend reads `VITE_API_URL` to dynamically target the deployed backend (e.g. on Render) without hardcoded localhost references.

---

## 7. Conclusion & Next Steps

Phase 6 is completed. The React frontend provides an academic dashboard connecting directly to the Flask backend from Phase 5.

**Local Commit Information:**
- All Phase 6 files created under `frontend/` and `results/reports/phase6_report.md`.
- No modifications were made to Phase 1–5 model artifacts, training scripts, or datasets.
