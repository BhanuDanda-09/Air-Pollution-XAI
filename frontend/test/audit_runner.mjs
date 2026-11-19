import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'https://air-pollution-xai.vercel.app';
const SCREENSHOT_DIR = path.resolve('../docs/audit_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'live-assessment', path: '/live-assessment' },
  { name: 'livability', path: '/livability' },
  { name: 'saved-places', path: '/saved-places' },
  { name: 'history', path: '/history' },
  { name: 'dashboard', path: '/dashboard' },
  { name: 'prediction', path: '/prediction' },
  { name: 'comparison', path: '/comparison' },
  { name: 'explainability', path: '/explainability' },
  { name: 'about', path: '/about' },
  { name: '404', path: '/non-existent-route-for-audit-test' },
];

const VIEWPORTS = [
  { name: '360px', width: 360, height: 780 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1280px', width: 1280, height: 800 },
  { name: '1920px', width: 1920, height: 1080 },
];

const SCHEMES = ['light', 'dark'];

async function runAudit() {
  console.log(`Starting automated audit against ${BASE_URL}...`);
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const auditReport = {
    testedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    routesAudited: ROUTES.length,
    viewportsTested: VIEWPORTS.length,
    schemesTested: SCHEMES.length,
    findings: [],
    spaReloadResults: [],
    manifestResult: null,
    offlineResult: null,
  };

  // 1. Audit Routes across Viewports and Color Schemes
  for (const vp of VIEWPORTS) {
    for (const scheme of SCHEMES) {
      console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) | Scheme: ${scheme} ---`);

      for (const route of ROUTES) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: scheme,
        });

        const page = await context.newPage();
        const consoleMessages = [];
        const networkErrors = [];

        page.on('console', (msg) => {
          if (msg.type() === 'error' || msg.type() === 'warning') {
            consoleMessages.push({ type: msg.type(), text: msg.text() });
          }
        });

        page.on('response', (res) => {
          if (res.status() >= 400 && !res.url().includes('non-existent-route')) {
            networkErrors.push({ url: res.url(), status: res.status() });
          }
        });

        const targetUrl = `${BASE_URL}${route.path}`;
        let loadStatus = 200;
        try {
          const res = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
          loadStatus = res ? res.status() : 0;
        } catch (err) {
          console.warn(`Navigation warning for ${targetUrl}: ${err.message}`);
        }

        // Wait brief moment for animations / charts / fonts
        await page.waitForTimeout(800);

        // Screenshot filename
        const screenshotFileName = `${route.name}_${vp.name}_${scheme}.png`;
        const screenshotFilePath = path.join(SCREENSHOT_DIR, screenshotFileName);
        try {
          await page.screenshot({ path: screenshotFilePath, fullPage: false });
        } catch (err) {
          console.error(`Screenshot failed for ${screenshotFileName}:`, err);
        }

        // Detailed DOM inspection for defects
        const pageMetrics = await page.evaluate((vpWidth) => {
          const docWidth = document.documentElement.scrollWidth;
          const bodyWidth = document.body ? document.body.scrollWidth : 0;
          const winWidth = window.innerWidth;
          const maxScroll = Math.max(docWidth, bodyWidth);
          const hasHorizontalOverflow = maxScroll > winWidth + 1;

          let overflowingElements = [];
          if (hasHorizontalOverflow) {
            const allElements = document.querySelectorAll('*');
            for (const el of allElements) {
              const rect = el.getBoundingClientRect();
              if (rect.right > winWidth + 1) {
                overflowingElements.push({
                  tag: el.tagName,
                  id: el.id,
                  className: el.className ? String(el.className).slice(0, 80) : '',
                  right: Math.round(rect.right),
                  width: Math.round(rect.width),
                });
              }
            }
          }

          // Navbar inspection
          const navLinks = Array.from(document.querySelectorAll('header nav a')).map((a) => {
            return {
              text: a.innerText.trim(),
              height: a.offsetHeight,
              width: a.offsetWidth,
              isMultiLine: a.offsetHeight > 34,
            };
          });

          const logoEl = document.querySelector('header a[href="/"]');
          const logoWrapped = logoEl ? logoEl.offsetHeight > 48 : false;

          // Check broken images
          const brokenImages = Array.from(document.querySelectorAll('img'))
            .filter((img) => !img.complete || img.naturalWidth === 0)
            .map((img) => img.src || img.getAttribute('src'));

          // Check header overflow
          const header = document.querySelector('header');
          const headerOverflow = header ? header.scrollWidth > winWidth : false;

          // Check dark mode background support
          const bodyBg = window.getComputedStyle(document.body).backgroundColor;

          return {
            hasHorizontalOverflow,
            maxScroll,
            winWidth,
            overflowingElements: overflowingElements.slice(0, 6),
            navLinks,
            logoWrapped,
            brokenImages,
            headerOverflow,
            bodyBg,
          };
        }, vp.width);

        const finding = {
          route: route.name,
          path: route.path,
          viewport: vp.name,
          scheme,
          loadStatus,
          screenshot: screenshotFileName,
          horizontalOverflow: pageMetrics.hasHorizontalOverflow,
          maxScroll: pageMetrics.maxScroll,
          winWidth: pageMetrics.winWidth,
          overflowingElements: pageMetrics.overflowingElements,
          navLinksWrapped: pageMetrics.navLinks.filter((l) => l.isMultiLine),
          logoWrapped: pageMetrics.logoWrapped,
          brokenImages: pageMetrics.brokenImages,
          headerOverflow: pageMetrics.headerOverflow,
          consoleMessages,
          networkErrors,
        };

        auditReport.findings.push(finding);

        if (pageMetrics.hasHorizontalOverflow) {
          console.log(`  [OVERFLOW] ${route.name} (${vp.name}, ${scheme}): maxScroll=${pageMetrics.maxScroll} > winWidth=${pageMetrics.winWidth}`);
        }
        if (finding.navLinksWrapped.length > 0) {
          console.log(`  [NAV WRAP] ${route.name} (${vp.name}): wrapped links: ${finding.navLinksWrapped.map((l) => l.text).join(', ')}`);
        }

        await context.close();
      }
    }
  }

  // 2. Direct Loading and Refreshing Audit (SPA Rewrites)
  console.log('\n--- Testing Direct Deep-link and Browser Reload (SPA Rewrites) ---');
  for (const route of ROUTES) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const targetUrl = `${BASE_URL}${route.path}`;

    try {
      const directRes = await page.goto(targetUrl, { waitUntil: 'load', timeout: 20000 });
      const directStatus = directRes ? directRes.status() : 0;

      const reloadRes = await page.reload({ waitUntil: 'load', timeout: 20000 });
      const reloadStatus = reloadRes ? reloadRes.status() : 0;

      const is404Vercel = await page.evaluate(() => {
        const text = document.body ? document.body.innerText : '';
        return text.includes('404: NOT_FOUND') || text.includes('DEPLOYMENT_NOT_FOUND');
      });

      const result = {
        route: route.name,
        path: route.path,
        directStatus,
        reloadStatus,
        isVercel404: is404Vercel,
      };

      auditReport.spaReloadResults.push(result);
      console.log(`  ${route.path}: Direct=${directStatus}, Reload=${reloadStatus}, Vercel404=${is404Vercel}`);
    } catch (err) {
      console.warn(`  ${route.path} reload error: ${err.message}`);
      auditReport.spaReloadResults.push({
        route: route.name,
        path: route.path,
        error: err.message,
      });
    }
    await context.close();
  }

  // 3. Test Auth Modal (Sign In / Sign Up)
  console.log('\n--- Testing Auth Modal Interactive Flow ---');
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    // Open Auth Modal
    const signInBtn = await page.$('button:has-text("Sign In")');
    if (signInBtn) {
      await signInBtn.click();
      await page.waitForTimeout(600);

      const modalScreenshot = path.join(SCREENSHOT_DIR, 'auth_modal_1280px.png');
      await page.screenshot({ path: modalScreenshot });

      // Check form fields
      const hasEmail = (await page.$('input[type="email"]')) !== null;
      const hasPassword = (await page.$('input[type="password"]')) !== null;
      const hasSubmit = (await page.$('button[type="submit"]')) !== null;

      auditReport.authModal = {
        hasEmail,
        hasPassword,
        hasSubmit,
        screenshot: 'auth_modal_1280px.png',
      };
      console.log(`  Auth Modal opened: EmailInput=${hasEmail}, PasswordInput=${hasPassword}, SubmitBtn=${hasSubmit}`);
    } else {
      console.log('  Sign In button not found on Home page');
    }
    await context.close();
  }

  // 4. Test Manifest & PWA
  console.log('\n--- Testing Manifest and PWA Assets ---');
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      const manifestRes = await page.goto(`${BASE_URL}/manifest.json`);
      const manifestStatus = manifestRes ? manifestRes.status() : 0;
      let manifestJson = null;
      if (manifestStatus === 200) {
        manifestJson = await manifestRes.json();
      }
      auditReport.manifestResult = {
        status: manifestStatus,
        manifest: manifestJson,
      };
      console.log(`  /manifest.json Status: ${manifestStatus}`);
    } catch (err) {
      console.warn(`  Manifest fetch error: ${err.message}`);
      auditReport.manifestResult = { error: err.message };
    }
    await context.close();
  }

  // 5. Test Offline Behavior with Service Worker
  console.log('\n--- Testing Offline Capabilities ---');
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      await context.setOffline(true);
      let offlineLoadStatus = 0;
      try {
        const offRes = await page.goto(`${BASE_URL}/`, { timeout: 8000 });
        offlineLoadStatus = offRes ? offRes.status() : 0;
      } catch (e) {
        offlineLoadStatus = 'Failed: ' + e.message;
      }

      const offlineScreenshot = path.join(SCREENSHOT_DIR, 'offline_home.png');
      await page.screenshot({ path: offlineScreenshot });

      auditReport.offlineResult = {
        offlineLoadStatus,
        screenshot: 'offline_home.png',
      };
      console.log(`  Offline load status: ${offlineLoadStatus}`);
    } catch (err) {
      console.warn(`  Offline test error: ${err.message}`);
      auditReport.offlineResult = { error: err.message };
    }
    await context.close();
  }

  await browser.close();

  // Save raw audit data
  fs.writeFileSync('../docs/audit_results.json', JSON.stringify(auditReport, null, 2));
  console.log('\nAudit complete! Raw findings written to docs/audit_results.json');
}

runAudit().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
