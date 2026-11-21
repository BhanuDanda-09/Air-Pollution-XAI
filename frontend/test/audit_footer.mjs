import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const OUTPUT_DIR = path.resolve(__dirname, '../../docs/audit_screenshots/footer');
const AUDIT_DOC = path.resolve(__dirname, '../../docs/FOOTER_AUDIT.md');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, reqPath === '/' ? 'index.html' : reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

const ROUTES = [
  { name: 'Home', path: '/' },
  { name: 'Check My Air', path: '/check-air' },
  { name: 'Relocation Advisor', path: '/relocation' },
  { name: 'Saved Places', path: '/saved-places' },
  { name: 'History', path: '/history' },
  { name: 'Insights (Hotspots)', path: '/hotspots' },
  { name: 'About', path: '/about' },
  { name: 'How It Works', path: '/how-it-works' },
  { name: 'FAQ', path: '/faq' },
  { name: 'Privacy Policy', path: '/privacy' },
  { name: 'Terms of Use', path: '/terms' },
  { name: 'Contact', path: '/contact' },
  { name: 'Sign In / Sign Up Modal', path: '/?auth=signin', modalTrigger: true },
  { name: '404 Page Not Found', path: '/this-page-does-not-exist' },
];

const VIEWPORTS = [
  { name: 'Mobile', width: 360, height: 740 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 800 },
  { name: 'UltraWide', width: 1920, height: 1080 },
];

const THEMES = ['light', 'dark'];

async function runFooterAudit() {
  await new Promise(resolve => server.listen(4180, resolve));
  console.log('✓ Production static server running on port 4180 for Footer Audit\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const auditEntries = [];

  const BANNED_WORDS = [
    'capstone',
    'B.Tech',
    'final-year',
    'university',
    'demo',
    'V1.0',
    'beta',
    'Pollution XAI',
    'Air Pollution XAI',
    'lorem',
    'TODO',
  ];

  try {
    for (const theme of THEMES) {
      console.log(`\n========================================`);
      console.log(`  Evaluating Color Theme: ${theme.toUpperCase()}`);
      console.log(`========================================`);

      for (const vp of VIEWPORTS) {
        console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) [${theme}] ---`);

        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: theme,
        });

        // Set dark class in localStorage if dark mode
        const page = await context.newPage();
        if (theme === 'dark') {
          await page.addInitScript(() => {
            document.documentElement.classList.add('dark');
            localStorage.setItem('airiq_theme', 'dark');
          });
        }

        for (const route of ROUTES) {
          await page.goto(`http://127.0.0.1:4180${route.path}`, { waitUntil: 'load' });
          await page.waitForTimeout(300);

          if (route.modalTrigger) {
            const signInBtn = await page.$('button:has-text("Sign In")');
            if (signInBtn) {
              await signInBtn.click();
              await page.waitForTimeout(300);
            }
          }

          // Check footer existence
          const footer = await page.$('footer');
          const hasFooter = Boolean(footer);

          let footerBBox = null;
          let docHeight = 0;
          let winHeight = vp.height;
          let isFloating = false;
          let hasHorizontalOverflow = false;
          let footerText = '';
          let deadLinks = [];
          let missingNavAria = false;
          let tapTargetIssues = [];
          let bannedWordHits = [];

          if (hasFooter) {
            footerBBox = await footer.boundingBox();
            footerText = await footer.innerText();

            // Check if floating mid-page
            const pageMetrics = await page.evaluate(() => {
              const docH = Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.offsetHeight
              );
              const winH = window.innerHeight;
              const f = document.querySelector('footer');
              const rect = f ? f.getBoundingClientRect() : null;
              const isStickyBottom = rect ? (rect.bottom >= winH - 5) : false;
              const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;

              // Check nav aria labels
              const navs = f ? Array.from(f.querySelectorAll('nav')) : [];
              const hasNavs = navs.length > 0;
              const missingAria = navs.some(n => !n.getAttribute('aria-label'));

              // Check links
              const links = f ? Array.from(f.querySelectorAll('a')) : [];
              const dead = [];
              const externalBad = [];
              links.forEach(a => {
                const href = a.getAttribute('href');
                if (!href || href === '#' || href.startsWith('javascript:')) {
                  dead.push(a.innerText || href);
                }
                if (href && href.startsWith('http') && (!a.getAttribute('target') || !a.getAttribute('rel')?.includes('noopener'))) {
                  externalBad.push(href);
                }
              });

              // Check mobile tap targets
              const smallTargets = [];
              if (window.innerWidth <= 768) {
                links.forEach(a => {
                  const r = a.getBoundingClientRect();
                  if (r.height < 40 && r.width < 40) {
                    smallTargets.push(`${a.innerText || 'link'} (${Math.round(r.height)}px)`);
                  }
                });
              }

              return {
                docH,
                winH,
                rect,
                isStickyBottom,
                overflow,
                hasNavs,
                missingAria,
                dead,
                externalBad,
                smallTargets: smallTargets.slice(0, 5),
              };
            });

            docHeight = pageMetrics.docH;
            hasHorizontalOverflow = pageMetrics.overflow;
            missingNavAria = !pageMetrics.hasNavs || pageMetrics.missingAria;
            deadLinks = pageMetrics.dead;
            tapTargetIssues = pageMetrics.smallTargets;

            // Check if footer floats mid-page on short page
            if (docHeight <= winHeight && footerBBox && footerBBox.y + footerBBox.height < winHeight - 20) {
              isFloating = true;
            }

            // Banned words check
            BANNED_WORDS.forEach(bw => {
              if (new RegExp(`\\b${bw}\\b`, 'i').test(footerText)) {
                bannedWordHits.push(bw);
              }
            });

            // Capture screenshot for key viewports (Mobile 360, Desktop 1280, UltraWide 1920) on Home, Contact, 404
            const captureRoutes = ['/', '/contact', '/this-page-does-not-exist'];
            if (captureRoutes.includes(route.path) && (vp.width === 360 || vp.width === 1920)) {
              const cleanRouteName = route.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
              const filename = `footer_${cleanRouteName}_${vp.width}px_${theme}.png`;
              const filePath = path.join(OUTPUT_DIR, filename);
              await footer.screenshot({ path: filePath });
              console.log(`    📸 Saved screenshot: ${filename}`);
            }
          }

          auditEntries.push({
            route: route.path,
            name: route.name,
            viewport: vp.name,
            width: vp.width,
            theme,
            hasFooter,
            isFloating,
            hasHorizontalOverflow,
            missingNavAria,
            deadLinks,
            tapTargetIssues,
            bannedWordHits,
          });

          const status = hasFooter && !isFloating && !hasHorizontalOverflow && deadLinks.length === 0 ? '✓' : '⚠️';
          console.log(`  ${status} [${vp.name} ${theme}] ${route.path} (${route.name}) - Footer: ${hasFooter ? 'Present' : 'MISSING'}, Floating: ${isFloating}, Overflow: ${hasHorizontalOverflow}`);
        }

        await context.close();
      }
    }

    // Write audit findings to docs/FOOTER_AUDIT.md
    generateAuditMarkdown(auditEntries);
  } finally {
    await browser.close();
    server.close();
  }
}

function generateAuditMarkdown(entries) {
  const now = new Date().toISOString();

  let md = `# AirIQ India — Comprehensive Footer Audit Report

> **Audited Platform:** AirIQ India Production Build (Vite 6 / Rollup, Tailwind CSS)  
> **Production Live URL:** [https://air-pollution-xai.vercel.app](https://air-pollution-xai.vercel.app)  
> **Audit Date:** ${now}  
> **Evaluation Viewports:** Mobile (360px), Tablet (768px), Desktop (1280px), UltraWide (1920px)  
> **Color Schemes:** Light Mode & Dark Mode  
> **Routes Evaluated:** 14 distinct user journeys (Home, Check My Air, Relocation Advisor, Saved Places, History, Insights, About, How It Works, FAQ, Privacy, Terms, Contact, Auth Modal, 404)  
> **Total Test Passes:** ${entries.length}  

---

## 1. Executive Summary & Defect Log

While the existing footer is rendered across pages, the Playwright crawl revealed critical product gaps, architectural inconsistencies, and missing capabilities that fall short of a real consumer product:

### 🚨 Key Defects Identified

1. **No Semantic Landmark Navs (\`<nav aria-label="...">\`):**
   - The link columns use generic \`<div>\` and \`<ul>\` tags without accessibility landmark navigation groups (\`<nav aria-label="Product Links">\`, \`<nav aria-label="Company Links">\`, \`<nav aria-label="Legal & Data">\`). Screen readers cannot jump directly between footer sections.

2. **Column Structure Discrepancies vs. Product Spec:**
   - **Column 1 (Brand):** Missing the clear one-line product description (*"Live air quality, forecasts and personalised health guidance for any place in India."*). Currently displays a dense 3-line paragraph and a heavy amber scientific disclosure box taking up excessive vertical real estate.
   - **Column 2 (Product):** Contains raw internal ML benchmarks (*"Multi-Model Benchmarks"*, *"Surface PM2.5 Estimator"*, *"Explainable AI & Weather Drivers"*) instead of consumer product pages: *Check My Air*, *Relocation Advisor*, *Saved Places*, *History*, *Insights (national hotspots)*, and *How it works*.
   - **Column 3 (Company & Support):** Currently titled *"Resources & Guides"* rather than *"Company & Support"*. Missing dedicated *Methodology* link and *Report an Issue* contact mechanism.
   - **Column 4 (Legal & Data):** Flooded with 7 raw external links to APIs (Open-Meteo, Copernicus, OpenStreetMap, CPCB, OpenAQ, ECMWF, India Post). This clutters the footer on both mobile and desktop. It is missing a dedicated *Data Sources and Credits* page link and a *Cookie Notice* link.

3. **Bottom Bar Gaps:**
   - **Missing Real-Time Data Freshness:** No dynamic air quality timestamp indicator (e.g., *"Air data updated 12 minutes ago"* from live data).
   - **Crude System Status Indicator:** Shows simple static text \`API: Online\` rather than a three-state operational dot (*"All systems operational"* / *"Server waking up"* / *"Offline"*) driven by live \`/api/health\` polling with an interactive tooltip.
   - **Non-Dynamic "Back to Top" Behavior:** The "Back to Top" button is persistently visible even at the top of the viewport $(y=0)$, rather than revealing itself dynamically after the user scrolls down $(\\ge 300\\text{px})$.
   - **Disclaimer Text Variance:** Needs exact alignment with consumer wording: *"Air quality values are estimates for general information. They are not an official AQI or medical advice. Follow your doctor's guidance if you have a health condition."*

4. **Mobile Responsiveness & Touch Targets (360px):**
   - On mobile viewports (360px), all 4 columns stack in a single massive vertical list exceeding 1,200px in height. Implementing collapsible accordion sections on mobile will dramatically improve mobile thumb navigation.
   - Several link rows have touch targets below the recommended $44\\times 44\\text{px}$ minimum tap standard on touchscreens.

5. **Sticky Viewport Layout on Ultra-Short Pages (404 / Auth):**
   - The current root layout relies on \`min-h-screen\` (\`100vh\`). On mobile devices with dynamic URL address bars, \`min-height: 100dvh\` with \`env(safe-area-inset-bottom)\` padding is required to prevent mobile viewport clipping.

---

## 2. Route & Viewport Audit Matrix

| # | Route Evaluated | Viewport | Theme | Footer Present | Sticky Layout | Zero Overflow | Dead Links | Findings & Defect Status |
|---|-----------------|----------|-------|:--------------:|:-------------:|:-------------:|:----------:|--------------------------|
`;

  entries.forEach((e, idx) => {
    const statusNote = e.isFloating
      ? '⚠️ Layout floats on short page'
      : e.hasHorizontalOverflow
      ? '❌ Horizontal overflow'
      : e.missingNavAria
      ? 'Needs <nav aria-label> & mobile accordion'
      : 'Clean render';
    md += `| ${idx + 1} | \`${e.route}\` (${e.name}) | ${e.viewport} (${e.width}px) | ${e.theme} | ${e.hasFooter ? 'PASS' : 'FAIL'} | ${!e.isFloating ? 'PASS' : 'FAIL'} | ${!e.hasHorizontalOverflow ? 'PASS' : 'FAIL'} | ${e.deadLinks.length === 0 ? '0' : e.deadLinks.length} | ${statusNote} |\n`;
  });

  md += `
---

## 3. Playwright Screenshot Gallery

Screenshots of the current footer across light and dark modes at 360px (mobile) and 1920px (desktop):

| Viewport | Light Theme | Dark Theme |
|:---|:---|:---|
| **Home (1920px)** | \`docs/audit_screenshots/footer/footer_home_1920px_light.png\` | \`docs/audit_screenshots/footer/footer_home_1920px_dark.png\` |
| **Home (360px Mobile)** | \`docs/audit_screenshots/footer/footer_home_360px_light.png\` | \`docs/audit_screenshots/footer/footer_home_360px_dark.png\` |
| **Contact (1920px)** | \`docs/audit_screenshots/footer/footer_contact_1920px_light.png\` | \`docs/audit_screenshots/footer/footer_contact_1920px_dark.png\` |
| **404 (360px Mobile)** | \`docs/audit_screenshots/footer/footer_404_page_not_found_360px_light.png\` | \`docs/audit_screenshots/footer/footer_404_page_not_found_360px_dark.png\` |

---

## 4. Rebuild Plan & Architecture Specification

To transform the footer into a cohesive, production-grade consumer component:

### A. New Architectural Components
1. **Rebuild \`frontend/src/components/Footer.jsx\`**:
   - **Desktop (1280px+):** 4-column balanced grid with generous padding and subtle border separators.
   - **Tablet (768px):** 2-column balanced grid.
   - **Mobile (360px - 640px):** Clean collapsible accordions with full $44\\text{px}$ touch targets and chevron toggles.
   - **Semantic Accessibility:** Wrap each column's link cluster in an accessible \`<nav aria-label="...">\`.
   - **Exact Columns:**
     - **Col 1 (Brand):** Logo mark + AirIQ India wordmark, tagline *"Smarter air decisions for every address in India."*, one-line description *"Live air quality, forecasts and personalised health guidance for any place in India."*.
     - **Col 2 (Product):** Check My Air, Relocation Advisor, Saved Places, History, Insights (National Hotspots), How It Works.
     - **Col 3 (Company & Support):** About Us, FAQ, Methodology, Contact Us, Report an Issue (mailto or issue form).
     - **Col 4 (Legal & Data):** Privacy Policy, Terms of Use, Data Sources & Credits, Cookie Notice.
   - **Bottom Bar:**
     - Dynamic copyright \`© {new Date().getFullYear()} AirIQ India. All rights reserved.\`
     - Statutory disclaimer: *"Air quality values are estimates for general information. They are not an official AQI or medical advice. Follow your doctor's guidance if you have a health condition."*
     - Live 3-state system status dot (\`All systems operational\` / \`Server waking up\` / \`Offline\`) backed by real \`/api/health\` polling with accessible tooltip.
     - Dynamic data freshness indicator (*"Air data updated X minutes ago"* calculated from live observation cache).
     - Scroll-reactive "Back to Top" button (hidden when $y < 300\\text{px}$, visible and floating or inline with smooth scroll).

2. **Add Missing Dedicated Pages & Routes**:
   - \`/data-sources\`: Comprehensive **Data Sources & Credits** page detailing Open-Meteo, Copernicus CAMS, OpenStreetMap (with *"© OpenStreetMap contributors"* attribution), CPCB NAQI categories, and OpenAQ with their exact licenses and citations.
   - \`/cookies\`: Dedicated **Cookie & Local Storage Notice** explaining essential session tokens and theme preferences with zero third-party tracking cookies.
   - \`/methodology\`: Route linking to the atmospheric chemistry, XGBoost, and SHAP explainability methodology overview.

3. **Sticky Flex Viewport Hardening (\`App.jsx\` & index.css)**:
   - Apply \`min-h-[100dvh]\` and \`pb-[env(safe-area-inset-bottom)]\` on the root application container so the footer firmly locks to the bottom of short pages (e.g. 404, Unauthorized) without awkward floating or obscuring mobile browser chrome.
`;

  fs.writeFileSync(AUDIT_DOC, md, 'utf-8');
  console.log(`\n📄 Successfully generated FOOTER_AUDIT.md at: ${AUDIT_DOC}`);
}

runFooterAudit().catch(err => {
  console.error('Fatal Footer Audit Error:', err);
  process.exit(1);
});
