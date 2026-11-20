# Changelog

All notable changes to the **Air Pollution XAI** capstone platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-11-20

### Added
- **Phase A — All-India Multi-Pollutant ML & Atmospheric Physics Dataset**:
  - Continuous 162,000-hour multi-city dataset (`dataset/all_india_hourly_multicity.csv`, 109.9 MB) covering 45 Indian cities across North, South, West, East, Central, and Northeast regions.
  - Multi-pollutant tracking for all 6 criteria pollutants: $PM_{2.5}, PM_{10}, NO_2, SO_2, CO, O_3$.
  - Evaluation across 1h, 6h, 24h, and 72h lead times comparing Persistence Baseline, Random Forest, XGBoost, LSTM, and Deep Transformer.
  - Leave-cities-out unseen spatial transferability validation ($R^2 = 0.9629$ at 1h; $R^2 = 0.6027$ at 24h).
  - Saved benchmarks in `results/multi_pollutant_benchmarks.json` and `.csv` (168 benchmark metrics).
  - TreeExplainer SHAP attribution benchmarks in `results/multi_pollutant_shap.json` with strict scientific labeling (*"Feature attribution / What drives the model"*, never *"Chemical source apportionment"*).
  - Nationwide exposure hotspot ranking ($P_{50}, P_{75}, P_{90}, P_{99}$, winter/summer ratios) across 5 cluster tiers in `results/city_hotspots.json`.
  - Compressed XGBoost multi-pollutant serving bundle (`models/all_india/xgb_models_serving.joblib`, 2.06 MB) consuming only 10.2 MB RSS at runtime, respecting Render's 512 MB RAM ceiling.
  - Comprehensive documentation in `docs/DATA_AND_MODELS.md` and `results/model_cards/MODEL_CARD_MULTI_POLLUTANT.md`.
- **Phase B — Multi-Pollutant REST API Architecture**:
  - Implemented `/api/cities`, `/api/geocode`, `/api/air/current`, `/api/air/forecast`, `/api/air/history`, `/api/air/climatology`, `/api/hotspots`, `/api/relocation/compare`.
  - Multi-pollutant SHAP local explanations in `/api/explain` with complete backward compatibility for legacy callers.
  - Thread-safe TTL caching (300s), in-memory IP rate limiting, 6-second timeouts, and graceful offline regional fallbacks.
  - Dynamic coverage and confidence banners ("directly_trained" vs "regional_proxy" with distance metrics; 422 for coordinates outside India).
- **Phase C — Health-Personalised Relocation Advisor Decision Engine**:
  - 4-step wizard form collecting origin, candidate destinations, health conditions (Asthma, COPD, cardiovascular, hypertension, diabetes, pregnancy, children, elderly), symptom severity, and commute modes.
  - Deterministic rule-based Personal Exposure Risk score ($0\text{--}100$) based on WHO 2021 guidelines and CPCB NAAQS breakpoints.
  - Side-by-side comparative decision report ranking candidate cities with expected exposure change ($\Delta\text{Risk}$), clinical explanations, and actionable N95/HEPA advice.
  - Complete engine documentation in `docs/RISK_ENGINE.md`.
- **Phase D — Statutory DPDP Act 2023 Compliance & Persistence**:
  - Explicit health data processing consent checkbox.
  - Right to Data Portability: `GET /api/user/export-data` returning full JSON bundle of personal profile, health attributes, saved places, and assessment history.
  - Right to Erasure: `POST /api/user/delete-account` cascading permanent account, health profile, locations, and audit deletion.
  - Zero health field logging in backend application logs.
- **Phase E — Clean-Air Visual Identity & Rebuilt UI**:
  - Redesigned Navbar with 4 primary links (`Home`, `Check My Air`, `Relocation Advisor`, `Saved Places`), `Insights` dropdown, `More` dropdown, and dark mode toggle.
  - Built `RelocationAdvisorPage.jsx`, `HotspotsPage.jsx`, `PrivacyPage.jsx`.
  - Enhanced `LiveAssessmentPage.jsx` with 6 criteria pollutants CPCB sub-index cards and coverage badge.
  - Comprehensive 4-column footer with CPCB / WHO / DPDP disclosures and academic citations.
- **Phase F — End-to-End Quality & Verification**:
  - Full Playwright E2E suite (`frontend/test/e2e_full_flow.mjs`) verifying all 10 browser user journeys.
  - Playwright smoke test suite (`frontend/test/e2e_smoke.mjs`) verifying 18 route and breakpoint checks with 0px horizontal overflow.
  - Comprehensive feature matrix in `docs/FEATURE_MATRIX.md` and capstone viva voce guide in `docs/VIVA_NOTES.md`.
- **Full Flow End-to-End Test Suite**:
  - Implemented `frontend/test/e2e_full_flow.mjs` verifying authentication, live assessment, saved places CSV export, 7-day exposure SVG chart, and logout flow.
  - Updated GitHub Actions (`.github/workflows/ci.yml`) to run both smoke tests and full flow tests on every push.
- **Viva Voce Defense & Capstone FAQ**:
  - Added dedicated Section 7 to `About.jsx` covering XGBoost vs. Deep Learning sample complexity, zero data leakage validation protocols, barometric pressure units (mmHg vs. hPa), and Copernicus CAMS satellite AOD integration.
- **Accessible Error Boundary**:
  - Implemented `ErrorBoundary.jsx` around React lazy route suspense blocks with "Reload Page" and "Back to Home" recovery CTAs.
- **Dark Mode Theming**:
  - Added Tailwind `darkMode: 'class'` support across all components.
  - Implemented `ThemeContext` providing persistent theme state (`light`, `dark`, `system`) with OS color scheme listeners.
  - Added theme toggle buttons in desktop Navbar and mobile drawer with accessible Sun/Moon indicators.
- **Unified Loading Skeletons & Cold-Start Wake-up Banner**:
  - Created `PageSkeleton.jsx` supporting `dashboard`, `assessment`, `table`, `card`, `form`, and `generic` variants with smooth shimmer animation and accessible ARIA attributes.
  - Standardized `ColdStartNotice.jsx` across all data pages with automated 5-second Render spin-up wake-up messaging.
- **Route Code-Splitting & Dynamic Meta Tags**:
  - Converted static page route imports in `App.jsx` to `React.lazy()` with `Suspense` fallback.
  - Created `usePageMeta.js` hook updating document title, meta description, and Open Graph tags per route.
  - Added custom `NotFoundPage.jsx` (`/404`) with safe navigation CTAs.
- **Saved Places & History Enhancements**:
  - Added inline search/filter input for saved places and audit history.
  - Added modal for editing/renaming saved places and changing category labels.
  - Added delete confirmation dialogs with cancellation safeguards for saved places and history records.
  - Added interactive SVG **Personal Exposure Trend Chart** in `HistoryPage.jsx` visualizing PM2.5 progression relative to CPCB standards.
  - Added `PUT /api/user/locations/<id>`, `DELETE /api/user/history/<id>`, and `DELETE /api/user/history` backend endpoints.
- **DevOps, Security & CI**:
  - Added Playwright end-to-end smoke test suite (`frontend/test/e2e_smoke.mjs`) verifying all 11 routes, dark mode, modal dialogues, and responsive overflow.
  - Updated GitHub Actions workflow (`.github/workflows/ci.yml`) to run pytest on Python 3.11, npm test, npm run build, and Playwright smoke tests.
  - Added `/health` root endpoint for external uptime pingers (UptimeRobot, cron-job.org).
  - Added `backend/tests/test_memory_load.py` load test verifying stable memory under assessment load.
  - Added security headers in `frontend/vercel.json` (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).

### Changed
- **Navigation & Layout**:
  - Consolidated 11 top-level links to 4 primary links (`Home`, `Live Assessment`, `Livability`, `Saved Places`), `Insights` dropdown, and `More` dropdown.
  - Replaced wide "Online" status pill with micro status dot and tooltip.
  - Fixed horizontal scrollbar across all breakpoints (360px, 768px, 1280px, 1920px, 2560px) via `overflow-x: clip` and responsive input layout.
- **Home Page Redesign**:
  - Rewrote hero section around real-world benefit ("Is the air safe where you are right now?").
  - Added interactive **"Check Your Air Now"** card with popular Delhi-NCR presets and live mini-verdict preview.
  - Added collapsible scientific disclaimer accordion.
  - Added 3-step **"How Pollution XAI Works"** walkthrough and 4 feature discovery cards.
- **Performance & Memory Optimization**:
  - Implemented lazy-loading for Keras/TensorFlow MLP model and SHAP KernelExplainer, reducing initial backend process memory from ~521 MB to ~295 MB (saving 226 MB of RAM on Render free-tier).
  - Configured Rollup vendor chunking (`vendor-react`, `vendor-charts`, `vendor-icons`), keeping main entry bundle to 115 kB (35 kB gzip).
- **Accessibility & WCAG AA**:
  - Enhanced contrast of muted text (`text-slate-400` → `text-slate-500` / `text-slate-600`).
  - Added `role="region"` and `aria-live="polite"` to assessment and prediction results.
  - Paired CPCB color tags with text labels and distinct geometric status icons (`CheckCircle2`, `AlertTriangle`, `ShieldAlert`, `XCircle`).
  - Added `prefers-reduced-motion` media queries.

### Fixed
- Fixed 360px mobile horizontal overflow on `/prediction` and header right cluster.
- Fixed 768px tablet horizontal overflow on `/livability` persona buttons.
- Fixed character encoding glitches (`R²`, `µg/m³`, `°C`, `W/m²`, `≤`, `•`) across Dashboard, About, Live Assessment, and Prediction pages.
- Fixed missing `role="dialog"` and Escape key listeners in authentication and deletion modals.

---

## [1.0.0] - 2026-11-15
- Initial capstone release with Random Forest, tuned XGBoost, and MLP models.
- Live assessment with Open-Meteo and Copernicus CAMS PM2.5.
- Livability scoring engine and basic SHAP feature explainability.
