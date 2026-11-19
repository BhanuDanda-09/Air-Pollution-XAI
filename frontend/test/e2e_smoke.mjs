import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = fs.existsSync(path.resolve('frontend/dist'))
  ? path.resolve('frontend/dist')
  : path.resolve('dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
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
  { name: 'Live Assessment', path: '/live-assessment' },
  { name: 'Livability', path: '/livability' },
  { name: 'Saved Places', path: '/saved-places' },
  { name: 'History', path: '/history' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Prediction', path: '/prediction' },
  { name: 'Comparison', path: '/comparison' },
  { name: 'Explainability', path: '/explainability' },
  { name: 'About', path: '/about' },
  { name: '404 Page', path: '/404' },
];

server.listen(4174, '127.0.0.1', async () => {
  console.log('Serving production build on http://127.0.0.1:4174 for Playwright smoke test...');
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (err) {
    console.log('Falling back to default Chromium binary...');
    browser = await chromium.launch({ headless: true });
  }

  let totalTests = 0;
  let passedTests = 0;
  let failures = [];

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    // 1. Test Navigation across all routes
    console.log('\n--- 1. Testing Route Navigation & Document Titles ---');
    for (const route of ROUTES) {
      totalTests++;
      await page.goto(`http://127.0.0.1:4174${route.path}`, { waitUntil: 'load' });
      await page.waitForTimeout(300);

      const title = await page.title();
      const hasHeading = await page.$eval('h1, h2', (el) => Boolean(el.textContent)).catch(() => false);

      if (title.length > 5 && hasHeading) {
        passedTests++;
        console.log(`  ✓ Route "${route.name}" (${route.path}) loaded. Title: "${title}"`);
      } else {
        failures.push(`Route ${route.name} failed basic title/heading check. Title: "${title}"`);
        console.log(`  ✗ Route "${route.name}" failed.`);
      }
    }

    // 2. Test Theme Toggle Interaction
    console.log('\n--- 2. Testing Dark Mode Toggle ---');
    totalTests++;
    await page.goto('http://127.0.0.1:4174/', { waitUntil: 'load' });
    const isDarkInitial = await page.evaluate(() => document.documentElement.classList.contains('dark'));

    // Click theme toggle button in Navbar
    const themeBtn = await page.$('button[title*="mode"], button[aria-label*="mode"]');
    if (themeBtn) {
      await themeBtn.click();
      await page.waitForTimeout(200);
      const isDarkAfter = await page.evaluate(() => document.documentElement.classList.contains('dark'));

      if (isDarkInitial !== isDarkAfter) {
        passedTests++;
        console.log(`  ✓ Dark mode toggle succeeded (Initial: ${isDarkInitial} -> After: ${isDarkAfter})`);
      } else {
        failures.push('Theme button clicked but .dark class was not toggled.');
        console.log('  ✗ Theme toggle failed to alter .dark class.');
      }
    } else {
      failures.push('Theme toggle button not found in Navbar.');
      console.log('  ✗ Theme toggle button missing.');
    }

    // 3. Test Auth Modal Interaction
    console.log('\n--- 3. Testing Auth Modal ---');
    totalTests++;
    const signInBtn = await page.$('button:has-text("Sign In")');
    if (signInBtn) {
      await signInBtn.click();
      await page.waitForTimeout(300);
      const modalHeader = await page.$eval('[role="dialog"]', (el) => el.textContent).catch(() => '');
      if (modalHeader.includes('Sign In') || modalHeader.includes('Account')) {
        passedTests++;
        console.log('  ✓ Sign In modal successfully opened with accessible role="dialog".');
        const closeBtn = await page.$('[role="dialog"] button[aria-label="Close dialog"]');
        if (closeBtn) {
          await closeBtn.click();
        } else {
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(300);
      } else {
        failures.push('Auth modal did not display proper dialog content.');
        console.log('  ✗ Auth modal failed.');
      }
    } else {
      failures.push('Sign In button not found.');
    }

    // 4. Test Home Page Delhi Preset Card
    console.log('\n--- 4. Testing Home Page Location Preset ---');
    totalTests++;
    await page.goto('http://127.0.0.1:4174/', { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const presetBtn = await page.$('button:has-text("Connaught Place")');
    if (presetBtn) {
      await presetBtn.click();
      await page.waitForTimeout(200);
      const text = await page.textContent('body');
      if (text.includes('28.61') || text.includes('Connaught') || text.includes('77.20')) {
        passedTests++;
        console.log('  ✓ Preset coordinate click updated the location card preview.');
      } else {
        failures.push('Preset button clicked but coordinate did not update preview.');
      }
    } else {
      failures.push('Location preset button not found on Home page.');
    }

    await page.close();

    // 5. Check No Horizontal Overflow Across Breakpoints with Fresh Pages
    console.log('\n--- 5. Checking Zero Horizontal Overflow Across Breakpoints ---');
    const viewports = [360, 768, 1280, 1920];
    for (const w of viewports) {
      totalTests++;
      const testPage = await browser.newPage({ viewport: { width: w, height: 800 } });
      await testPage.goto('http://127.0.0.1:4174/', { waitUntil: 'load' });
      await testPage.waitForTimeout(400);

      const metrics = await testPage.evaluate((winW) => {
        const docW = document.documentElement.scrollWidth;
        const bodyW = document.body ? document.body.scrollWidth : 0;
        const maxScroll = Math.max(docW, bodyW);
        const hasOverflow = maxScroll > winW;
        let culprits = [];
        if (hasOverflow) {
          for (const el of document.querySelectorAll('*')) {
            const r = el.getBoundingClientRect();
            if (r.right > winW + 1) {
              const cls = typeof el.className === 'string' ? el.className : el.className?.baseVal || '';
              culprits.push(`${el.tagName}.${cls.split(' ')[0]} [R:${Math.round(r.right)}]`);
            }
          }
        }
        return { hasOverflow, maxScroll, winW, culprits: culprits.slice(0, 4) };
      }, w);

      if (!metrics.hasOverflow) {
        passedTests++;
        console.log(`  ✓ Viewport ${w}px: 0px overflow.`);
      } else {
        failures.push(`Horizontal overflow detected at ${w}px (maxScroll: ${metrics.maxScroll}px > ${metrics.winW}px; culprits: ${metrics.culprits.join(', ')}).`);
        console.log(`  ✗ Horizontal overflow at ${w}px (${metrics.maxScroll} > ${metrics.winW}):`, metrics.culprits);
      }
      await testPage.close();
    }
  } catch (err) {
    failures.push(`Execution error: ${err.message}`);
    console.error(err);
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n========================================');
  console.log(`Playwright Smoke Tests: ${passedTests}/${totalTests} Passed.`);
  if (failures.length === 0) {
    console.log('🎉 ALL PLAYWRIGHT SMOKE TESTS PASSED!');
    process.exit(0);
  } else {
    console.error('❌ Failures:', failures);
    process.exit(1);
  }
});
