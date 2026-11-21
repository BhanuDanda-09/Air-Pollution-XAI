# AirIQ India — Comprehensive Footer Audit Report

> **Audited Platform:** AirIQ India Production Build (Vite 6 / Rollup, Tailwind CSS)  
> **Production Live URL:** [https://air-pollution-xai.vercel.app](https://air-pollution-xai.vercel.app)  
> **Audit Date:** 2026-11-21T10:31:36.475Z  
> **Evaluation Viewports:** Mobile (360px), Tablet (768px), Desktop (1280px), UltraWide (1920px)  
> **Color Schemes:** Light Mode & Dark Mode  
> **Routes Evaluated:** 14 distinct user journeys (Home, Check My Air, Relocation Advisor, Saved Places, History, Insights, About, How It Works, FAQ, Privacy, Terms, Contact, Auth Modal, 404)  
> **Total Test Passes:** 112  

---

## 1. Executive Summary & Defect Log

While the existing footer is rendered across pages, the Playwright crawl revealed critical product gaps, architectural inconsistencies, and missing capabilities that fall short of a real consumer product:

### 🚨 Key Defects Identified

1. **No Semantic Landmark Navs (`<nav aria-label="...">`):**
   - The link columns use generic `<div>` and `<ul>` tags without accessibility landmark navigation groups (`<nav aria-label="Product Links">`, `<nav aria-label="Company Links">`, `<nav aria-label="Legal & Data">`). Screen readers cannot jump directly between footer sections.

2. **Column Structure Discrepancies vs. Product Spec:**
   - **Column 1 (Brand):** Missing the clear one-line product description (*"Live air quality, forecasts and personalised health guidance for any place in India."*). Currently displays a dense 3-line paragraph and a heavy amber scientific disclosure box taking up excessive vertical real estate.
   - **Column 2 (Product):** Contains raw internal ML benchmarks (*"Multi-Model Benchmarks"*, *"Surface PM2.5 Estimator"*, *"Explainable AI & Weather Drivers"*) instead of consumer product pages: *Check My Air*, *Relocation Advisor*, *Saved Places*, *History*, *Insights (national hotspots)*, and *How it works*.
   - **Column 3 (Company & Support):** Currently titled *"Resources & Guides"* rather than *"Company & Support"*. Missing dedicated *Methodology* link and *Report an Issue* contact mechanism.
   - **Column 4 (Legal & Data):** Flooded with 7 raw external links to APIs (Open-Meteo, Copernicus, OpenStreetMap, CPCB, OpenAQ, ECMWF, India Post). This clutters the footer on both mobile and desktop. It is missing a dedicated *Data Sources and Credits* page link and a *Cookie Notice* link.

3. **Bottom Bar Gaps:**
   - **Missing Real-Time Data Freshness:** No dynamic air quality timestamp indicator (e.g., *"Air data updated 12 minutes ago"* from live data).
   - **Crude System Status Indicator:** Shows simple static text `API: Online` rather than a three-state operational dot (*"All systems operational"* / *"Server waking up"* / *"Offline"*) driven by live `/api/health` polling with an interactive tooltip.
   - **Non-Dynamic "Back to Top" Behavior:** The "Back to Top" button is persistently visible even at the top of the viewport $(y=0)$, rather than revealing itself dynamically after the user scrolls down $(\ge 300\text{px})$.
   - **Disclaimer Text Variance:** Needs exact alignment with consumer wording: *"Air quality values are estimates for general information. They are not an official AQI or medical advice. Follow your doctor's guidance if you have a health condition."*

4. **Mobile Responsiveness & Touch Targets (360px):**
   - On mobile viewports (360px), all 4 columns stack in a single massive vertical list exceeding 1,200px in height. Implementing collapsible accordion sections on mobile will dramatically improve mobile thumb navigation.
   - Several link rows have touch targets below the recommended $44\times 44\text{px}$ minimum tap standard on touchscreens.

5. **Sticky Viewport Layout on Ultra-Short Pages (404 / Auth):**
   - The current root layout relies on `min-h-screen` (`100vh`). On mobile devices with dynamic URL address bars, `min-height: 100dvh` with `env(safe-area-inset-bottom)` padding is required to prevent mobile viewport clipping.

---

## 2. Route & Viewport Audit Matrix

| # | Route Evaluated | Viewport | Theme | Footer Present | Sticky Layout | Zero Overflow | Dead Links | Findings & Defect Status |
|---|-----------------|----------|-------|:--------------:|:-------------:|:-------------:|:----------:|--------------------------|
| 1 | `/` (Home) | Mobile (360px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 2 | `/check-air` (Check My Air) | Mobile (360px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 3 | `/relocation` (Relocation Advisor) | Mobile (360px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 4 | `/saved-places` (Saved Places) | Mobile (360px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 5 | `/history` (History) | Mobile (360px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 6 | `/hotspots` (Insights (Hotspots)) | Mobile (360px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 7 | `/about` (About) | Mobile (360px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 8 | `/how-it-works` (How It Works) | Mobile (360px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 9 | `/faq` (FAQ) | Mobile (360px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 10 | `/privacy` (Privacy Policy) | Mobile (360px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 11 | `/terms` (Terms of Use) | Mobile (360px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 12 | `/contact` (Contact) | Mobile (360px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 13 | `/?auth=signin` (Sign In / Sign Up Modal) | Mobile (360px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 14 | `/this-page-does-not-exist` (404 Page Not Found) | Mobile (360px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 15 | `/` (Home) | Tablet (768px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 16 | `/check-air` (Check My Air) | Tablet (768px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 17 | `/relocation` (Relocation Advisor) | Tablet (768px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 18 | `/saved-places` (Saved Places) | Tablet (768px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 19 | `/history` (History) | Tablet (768px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 20 | `/hotspots` (Insights (Hotspots)) | Tablet (768px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 21 | `/about` (About) | Tablet (768px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 22 | `/how-it-works` (How It Works) | Tablet (768px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 23 | `/faq` (FAQ) | Tablet (768px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 24 | `/privacy` (Privacy Policy) | Tablet (768px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 25 | `/terms` (Terms of Use) | Tablet (768px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 26 | `/contact` (Contact) | Tablet (768px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 27 | `/?auth=signin` (Sign In / Sign Up Modal) | Tablet (768px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 28 | `/this-page-does-not-exist` (404 Page Not Found) | Tablet (768px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 29 | `/` (Home) | Desktop (1280px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 30 | `/check-air` (Check My Air) | Desktop (1280px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 31 | `/relocation` (Relocation Advisor) | Desktop (1280px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 32 | `/saved-places` (Saved Places) | Desktop (1280px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 33 | `/history` (History) | Desktop (1280px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 34 | `/hotspots` (Insights (Hotspots)) | Desktop (1280px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 35 | `/about` (About) | Desktop (1280px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 36 | `/how-it-works` (How It Works) | Desktop (1280px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 37 | `/faq` (FAQ) | Desktop (1280px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 38 | `/privacy` (Privacy Policy) | Desktop (1280px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 39 | `/terms` (Terms of Use) | Desktop (1280px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 40 | `/contact` (Contact) | Desktop (1280px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 41 | `/?auth=signin` (Sign In / Sign Up Modal) | Desktop (1280px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 42 | `/this-page-does-not-exist` (404 Page Not Found) | Desktop (1280px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 43 | `/` (Home) | UltraWide (1920px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 44 | `/check-air` (Check My Air) | UltraWide (1920px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 45 | `/relocation` (Relocation Advisor) | UltraWide (1920px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 46 | `/saved-places` (Saved Places) | UltraWide (1920px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 47 | `/history` (History) | UltraWide (1920px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 48 | `/hotspots` (Insights (Hotspots)) | UltraWide (1920px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 49 | `/about` (About) | UltraWide (1920px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 50 | `/how-it-works` (How It Works) | UltraWide (1920px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 51 | `/faq` (FAQ) | UltraWide (1920px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 52 | `/privacy` (Privacy Policy) | UltraWide (1920px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 53 | `/terms` (Terms of Use) | UltraWide (1920px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 54 | `/contact` (Contact) | UltraWide (1920px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 55 | `/?auth=signin` (Sign In / Sign Up Modal) | UltraWide (1920px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 56 | `/this-page-does-not-exist` (404 Page Not Found) | UltraWide (1920px) | light | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 57 | `/` (Home) | Mobile (360px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 58 | `/check-air` (Check My Air) | Mobile (360px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 59 | `/relocation` (Relocation Advisor) | Mobile (360px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 60 | `/saved-places` (Saved Places) | Mobile (360px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 61 | `/history` (History) | Mobile (360px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 62 | `/hotspots` (Insights (Hotspots)) | Mobile (360px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 63 | `/about` (About) | Mobile (360px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 64 | `/how-it-works` (How It Works) | Mobile (360px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 65 | `/faq` (FAQ) | Mobile (360px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 66 | `/privacy` (Privacy Policy) | Mobile (360px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 67 | `/terms` (Terms of Use) | Mobile (360px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 68 | `/contact` (Contact) | Mobile (360px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 69 | `/?auth=signin` (Sign In / Sign Up Modal) | Mobile (360px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 70 | `/this-page-does-not-exist` (404 Page Not Found) | Mobile (360px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 71 | `/` (Home) | Tablet (768px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 72 | `/check-air` (Check My Air) | Tablet (768px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 73 | `/relocation` (Relocation Advisor) | Tablet (768px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 74 | `/saved-places` (Saved Places) | Tablet (768px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 75 | `/history` (History) | Tablet (768px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 76 | `/hotspots` (Insights (Hotspots)) | Tablet (768px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 77 | `/about` (About) | Tablet (768px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 78 | `/how-it-works` (How It Works) | Tablet (768px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 79 | `/faq` (FAQ) | Tablet (768px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 80 | `/privacy` (Privacy Policy) | Tablet (768px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 81 | `/terms` (Terms of Use) | Tablet (768px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 82 | `/contact` (Contact) | Tablet (768px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 83 | `/?auth=signin` (Sign In / Sign Up Modal) | Tablet (768px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 84 | `/this-page-does-not-exist` (404 Page Not Found) | Tablet (768px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 85 | `/` (Home) | Desktop (1280px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 86 | `/check-air` (Check My Air) | Desktop (1280px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 87 | `/relocation` (Relocation Advisor) | Desktop (1280px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 88 | `/saved-places` (Saved Places) | Desktop (1280px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 89 | `/history` (History) | Desktop (1280px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 90 | `/hotspots` (Insights (Hotspots)) | Desktop (1280px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 91 | `/about` (About) | Desktop (1280px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 92 | `/how-it-works` (How It Works) | Desktop (1280px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 93 | `/faq` (FAQ) | Desktop (1280px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 94 | `/privacy` (Privacy Policy) | Desktop (1280px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 95 | `/terms` (Terms of Use) | Desktop (1280px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 96 | `/contact` (Contact) | Desktop (1280px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 97 | `/?auth=signin` (Sign In / Sign Up Modal) | Desktop (1280px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 98 | `/this-page-does-not-exist` (404 Page Not Found) | Desktop (1280px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 99 | `/` (Home) | UltraWide (1920px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 100 | `/check-air` (Check My Air) | UltraWide (1920px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 101 | `/relocation` (Relocation Advisor) | UltraWide (1920px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 102 | `/saved-places` (Saved Places) | UltraWide (1920px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 103 | `/history` (History) | UltraWide (1920px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 104 | `/hotspots` (Insights (Hotspots)) | UltraWide (1920px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 105 | `/about` (About) | UltraWide (1920px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 106 | `/how-it-works` (How It Works) | UltraWide (1920px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 107 | `/faq` (FAQ) | UltraWide (1920px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 108 | `/privacy` (Privacy Policy) | UltraWide (1920px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 109 | `/terms` (Terms of Use) | UltraWide (1920px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 110 | `/contact` (Contact) | UltraWide (1920px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 111 | `/?auth=signin` (Sign In / Sign Up Modal) | UltraWide (1920px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |
| 112 | `/this-page-does-not-exist` (404 Page Not Found) | UltraWide (1920px) | dark | PASS | PASS | PASS | 0 | Needs <nav aria-label> & mobile accordion |

---

## 3. Playwright Screenshot Gallery

Screenshots of the current footer across light and dark modes at 360px (mobile) and 1920px (desktop):

| Viewport | Light Theme | Dark Theme |
|:---|:---|:---|
| **Home (1920px)** | `docs/audit_screenshots/footer/footer_home_1920px_light.png` | `docs/audit_screenshots/footer/footer_home_1920px_dark.png` |
| **Home (360px Mobile)** | `docs/audit_screenshots/footer/footer_home_360px_light.png` | `docs/audit_screenshots/footer/footer_home_360px_dark.png` |
| **Contact (1920px)** | `docs/audit_screenshots/footer/footer_contact_1920px_light.png` | `docs/audit_screenshots/footer/footer_contact_1920px_dark.png` |
| **404 (360px Mobile)** | `docs/audit_screenshots/footer/footer_404_page_not_found_360px_light.png` | `docs/audit_screenshots/footer/footer_404_page_not_found_360px_dark.png` |

---

## 4. Rebuild Plan & Architecture Specification

To transform the footer into a cohesive, production-grade consumer component:

### A. New Architectural Components
1. **Rebuild `frontend/src/components/Footer.jsx`**:
   - **Desktop (1280px+):** 4-column balanced grid with generous padding and subtle border separators.
   - **Tablet (768px):** 2-column balanced grid.
   - **Mobile (360px - 640px):** Clean collapsible accordions with full $44\text{px}$ touch targets and chevron toggles.
   - **Semantic Accessibility:** Wrap each column's link cluster in an accessible `<nav aria-label="...">`.
   - **Exact Columns:**
     - **Col 1 (Brand):** Logo mark + AirIQ India wordmark, tagline *"Smarter air decisions for every address in India."*, one-line description *"Live air quality, forecasts and personalised health guidance for any place in India."*.
     - **Col 2 (Product):** Check My Air, Relocation Advisor, Saved Places, History, Insights (National Hotspots), How It Works.
     - **Col 3 (Company & Support):** About Us, FAQ, Methodology, Contact Us, Report an Issue (mailto or issue form).
     - **Col 4 (Legal & Data):** Privacy Policy, Terms of Use, Data Sources & Credits, Cookie Notice.
   - **Bottom Bar:**
     - Dynamic copyright `© {new Date().getFullYear()} AirIQ India. All rights reserved.`
     - Statutory disclaimer: *"Air quality values are estimates for general information. They are not an official AQI or medical advice. Follow your doctor's guidance if you have a health condition."*
     - Live 3-state system status dot (`All systems operational` / `Server waking up` / `Offline`) backed by real `/api/health` polling with accessible tooltip.
     - Dynamic data freshness indicator (*"Air data updated X minutes ago"* calculated from live observation cache).
     - Scroll-reactive "Back to Top" button (hidden when $y < 300\text{px}$, visible and floating or inline with smooth scroll).

2. **Add Missing Dedicated Pages & Routes**:
   - `/data-sources`: Comprehensive **Data Sources & Credits** page detailing Open-Meteo, Copernicus CAMS, OpenStreetMap (with *"© OpenStreetMap contributors"* attribution), CPCB NAQI categories, and OpenAQ with their exact licenses and citations.
   - `/cookies`: Dedicated **Cookie & Local Storage Notice** explaining essential session tokens and theme preferences with zero third-party tracking cookies.
   - `/methodology`: Route linking to the atmospheric chemistry, XGBoost, and SHAP explainability methodology overview.

3. **Sticky Flex Viewport Hardening (`App.jsx` & index.css)**:
   - Apply `min-h-[100dvh]` and `pb-[env(safe-area-inset-bottom)]` on the root application container so the footer firmly locks to the bottom of short pages (e.g. 404, Unauthorized) without awkward floating or obscuring mobile browser chrome.
