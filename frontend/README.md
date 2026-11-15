# Air Pollution XAI - React Frontend Dashboard

A modern, responsive, and interactive environmental analytics dashboard for the capstone project:
**"Explainable AI-Based Air Pollution Prediction and Source Attribution"**

Built with **React 18**, **Vite**, **Tailwind CSS**, **Chart.js**, and **Lucide React**, connecting directly to the Flask REST API backend to provide real-time $\text{PM}_{2.5}$ predictions, multi-model held-out benchmark comparisons, indicative CPCB health classifications, and Explainable AI (SHAP) local feature attributions.

---

## 1. Features & Capabilities

- **Interactive PM2.5 Prediction Form:** Real-time input validation across the 5 verified meteorological features (`RH`, `WD`, `SR`, `BP`, `AT`).
  - *Strict physical calibration:* Barometric Pressure is strictly displayed and transmitted in **mmHg** (700–780 mmHg).
- **Indicative CPCB Health Bands:** Automatic classification into official CPCB 24-hr concentration ranges (*Good, Satisfactory, Moderate, Poor, Very Poor, Severe*) with health statements and regulatory disclaimers.
- **Model Comparison Suite:** Compares Random Forest, tuned XGBoost, and Deep Learning (MLP) on user inputs while highlighting held-out test benchmarks ($R^2=0.7455$ for XGBoost).
- **Explainable AI (SHAP) Visualizer:** Interactive horizontal bar charts illustrating exact local feature contributions ($\mu\text{g/m}^3$) pushing predictions higher or lower relative to the model baseline.
- **Telemetry & Status Monitoring:** Live status indicators querying `/api/health` and `/api/models`.
- **Zero Hallucination:** Directly parses actual JSON payloads from the Flask API without simulating or faking predictions.

---

## 2. Project Layout

```
frontend/
├── public/
│   └── favicon.svg             # Custom environmental SVG favicon
├── src/
│   ├── assets/                 # Static imagery and logos
│   ├── components/
│   │   ├── Navbar.jsx          # Responsive header with mobile drawer & live status
│   │   ├── Sidebar.jsx         # Alternative/drawer sidebar navigation
│   │   ├── Footer.jsx          # Academic attribution, GitHub link, disclaimers
│   │   ├── StatCard.jsx        # Modern analytics card with badge & trend indicators
│   │   ├── LoadingSpinner.jsx  # Animated spinner with loading messages
│   │   ├── ErrorMessage.jsx    # User-friendly error alert with retry button
│   │   ├── PredictionForm.jsx  # Input sliders/numeric controls with presets
│   │   ├── PredictionResult.jsx# PM2.5 spotlight & indicative CPCB category display
│   │   ├── ModelComparison.jsx # 3-way comparative card and bar chart visualization
│   │   ├── SHAPExplanation.jsx # Tri-metric breakdown & attributions table
│   │   ├── FeatureImportanceChart.jsx # Diverging horizontal SHAP bar chart
│   │   └── PerformanceChart.jsx # Held-out benchmark metrics comparison chart
│   ├── pages/
│   │   ├── Home.jsx            # Landing page with problem statement & CTA
│   │   ├── Dashboard.jsx       # System metrics & held-out test benchmarks
│   │   ├── Prediction.jsx      # Single-model prediction workflow
│   │   ├── ModelComparisonPage.jsx # Multi-model comparative scenario analysis
│   │   ├── Explainability.jsx  # SHAP local attribution explorer
│   │   └── About.jsx           # Methodology, dataset, and scientific boundaries
│   ├── services/
│   │   ├── api.js              # Centralized Axios client with error interceptors
│   │   └── predictionService.js# Typed API consumer functions
│   ├── hooks/
│   │   ├── useModels.js        # SWR-style model catalogue & health hook
│   │   └── usePrediction.js    # Prediction, comparison, and explanation controller
│   ├── utils/
│   │   ├── validation.js       # Meteorological bounds & client-side verification
│   │   └── formatters.js       # CPCB color mappings and number formatters
│   ├── App.jsx                 # Route provider and global shell
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
└── README.md                   # This documentation
```

---

## 3. Getting Started

### 3.1 Prerequisites
- **Node.js:** v18.0.0 or higher (v24.x tested)
- **npm:** v9.0.0 or higher (v11.x tested)
- **Backend Server:** Python Flask backend running on `http://127.0.0.1:5000` (from `backend/`)

### 3.2 Installation
From the repository root:
```bash
cd frontend
npm install
```

### 3.3 Environment Setup
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Ensure `VITE_API_URL` points to your backend instance:
```env
# Local Flask server
VITE_API_URL=http://127.0.0.1:5000
```

### 3.4 Running the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 3.5 Running Unit Tests
```bash
npm test
```

### 3.6 Production Build
```bash
npm run build
```
Build output is generated in `frontend/dist/`.

---

## 4. API Integration Details

The frontend integrates with all 5 Flask backend endpoints:

| Action | API Route | Hook / Method |
| :--- | :--- | :--- |
| **System Health** | `GET /api/health` | `predictionService.getHealth()` |
| **Model Metadata** | `GET /api/models` | `predictionService.getModels()` |
| **Single Prediction** | `POST /api/predict` | `predictionService.predictPM25(model, features)` |
| **Model Comparison** | `POST /api/compare` | `predictionService.compareModels(features)` |
| **SHAP Explanation** | `POST /api/explain` | `predictionService.explainPrediction(model, features)` |

### Input Features Schema
- **Relative Humidity (`RH`):** `0.0 – 100.0 %`
- **Wind Direction (`WD`):** `0.0 – 360.0 degrees`
- **Solar Radiation (`SR`):** `0.0 – 1500.0 W/m²`
- **Barometric Pressure (`BP`):** **`700.0 – 780.0 mmHg`** *(Strictly mmHg; sea level / hPa values are rejected)*
- **Air Temperature (`AT`):** `-20.0 – 60.0 °C`

---

## 5. Vercel Deployment Guide

The frontend is ready for zero-configuration deployment to **Vercel**:

1. **Push Code:** Push repository to GitHub.
2. **Import Project on Vercel:**
   - Framework Preset: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Configure Environment Variables:**
   Add `VITE_API_URL` with your deployed Render backend URL:
   ```
   VITE_API_URL = https://air-pollution-xai-backend.onrender.com
   ```
4. **Client-Side Routing (`vercel.json`):**
   `frontend/vercel.json` contains SPA rewrite rules so page refreshes on `/dashboard`, `/prediction`, etc. do not return 404:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
5. **Backend CORS Setup:**
   On Render, set `ALLOWED_ORIGINS` to your Vercel deployment URL (e.g. `https://my-app.vercel.app`).

---

## 6. Scientific & Regulatory Integrity

1. **Indicative CPCB Bands:** The UI clearly notes that categories represent *indicative concentration bands* derived from estimated 24-hr $\text{PM}_{2.5}$, and do not constitute an official regulatory multi-pollutant CPCB AQI.
2. **No False Causal Attribution:** SHAP visualizations are accompanied by clear explanations stating that attributions represent local statistical feature weights in the mathematical model and do not establish physical chemical emission causality.
3. **No Fabricated Data:** Empty states, spinners, and informative error banners are presented until live API responses arrive.
