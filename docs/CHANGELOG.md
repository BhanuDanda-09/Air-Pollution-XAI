# Changelog

All notable changes to the **Air Pollution XAI** capstone platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-11-20

### Added
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
