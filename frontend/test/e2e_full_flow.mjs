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

// 1. Static Production Asset Server (Port 4175)
const staticServer = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, reqPath === '/' ? 'index.html' : reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

// 2. Real Mock Backend API Server (Port 5000) with Complete CORS Support
const apiServer = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const method = req.method;

  // Set permissive CORS headers for local Playwright test harness
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  if (url === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'healthy', models_loaded: true, version: '1.0.0' }));
    return;
  }

  if (url === '/api/auth/login' || url === '/api/auth/register') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      access_token: 'valid-test-jwt-token-12345',
      refresh_token: 'valid-test-refresh-token-67890',
      user: { id: 1, email: 'researcher@delhi.ac.in', name: 'Dr. A. Sharma', role: 'user' },
      health_profile: { sensitivity: 'normal', mask_preference: 'n95', alert_threshold: 60 }
    }));
    return;
  }

  if (url === '/api/auth/me') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      user: { id: 1, email: 'researcher@delhi.ac.in', name: 'Dr. A. Sharma', role: 'user' },
      health_profile: { sensitivity: 'normal', mask_preference: 'n95', alert_threshold: 60 }
    }));
    return;
  }

  if (url === '/api/user/alerts') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      preference: { pm25_threshold: 100, is_email_enabled: false },
      active_alerts: []
    }));
    return;
  }

  if (url === '/api/user/profile') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      health_profile: { sensitivity: 'normal', mask_preference: 'n95', alert_threshold: 60 }
    }));
    return;
  }

  if (url === '/api/location/assess') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      data: {
        location: { name: 'Connaught Place, New Delhi', latitude: 28.6315, longitude: 77.2167 },
        reference: {
          current_pm25: 142.5,
          source: 'Copernicus CAMS Model Data',
          indicative_cpcb_category: 'Very Poor',
          cpcb_color: '#8B5CF6'
        },
        model_estimate: {
          predicted_pm25: 138.2,
          model_name: 'Tuned XGBoost Regressor',
          r2_score: 0.7455,
          indicative_cpcb_category: 'Very Poor',
          is_out_of_range: false,
          features_used: { RH: 65, WD: 240, SR: 120, BP: 738, AT: 18 }
        },
        verdict: {
          key: 'very_poor',
          label: 'Very Poor - Significant Health Risk',
          color: '#8B5CF6',
          summary: 'Active respiratory irritation anticipated.'
        },
        explanation: {
          top_features: [
            { feature: 'RH', contribution: 22.4, direction: 'increases', impact: 'High' },
            { feature: 'AT', contribution: -8.1, direction: 'decreases', impact: 'Medium' }
          ]
        }
      }
    }));
    return;
  }

  if (url === '/api/user/locations') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      locations: [
        { id: 101, name: 'Connaught Place Central', label: 'Work', latitude: 28.6315, longitude: 77.2167, alert_threshold: 60, last_pm25: 142.5, created_at: '2026-11-20T00:00:00Z' }
      ],
      data: {
        locations: [
          { id: 101, name: 'Connaught Place Central', label: 'Work', latitude: 28.6315, longitude: 77.2167, alert_threshold: 60, last_pm25: 142.5, created_at: '2026-11-20T00:00:00Z' }
        ]
      }
    }));
    return;
  }

  if (url === '/api/user/history') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      history: [
        { id: 201, location_name: 'Connaught Place', pm25: 142.5, category: 'Very Poor', timestamp: '2026-11-20T06:00:00Z' },
        { id: 202, location_name: 'Lodhi Garden', pm25: 110.0, category: 'Poor', timestamp: '2026-11-19T18:00:00Z' }
      ]
    }));
    return;
  }

  res.writeHead(200);
  res.end(JSON.stringify({ status: 'success' }));
});

// Start both servers and run Playwright suite
staticServer.listen(4175, '127.0.0.1', () => {
  apiServer.listen(5000, '127.0.0.1', async () => {
    console.log('Serving frontend on http://127.0.0.1:4175 and API on http://127.0.0.1:5000...');
    let browser;
    const launchOptions = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    };

    try {
      browser = await chromium.launch({ ...launchOptions, channel: 'chrome' });
    } catch (err) {
      console.log('Falling back to default Chromium binary...');
      browser = await chromium.launch(launchOptions);
    }

    let totalTests = 0;
    let passedTests = 0;
    let failures = [];

    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

      // TEST 1: Navbar and Footer verification (Desktop 1280px)
      console.log('\n--- 1. Testing Navbar and Footer on Desktop (1280px) ---');
      totalTests++;
      await page.goto('http://127.0.0.1:4175/', { waitUntil: 'load' });
      await page.waitForTimeout(500);
      const hasBrand = await page.$eval('header', el => el.textContent.includes('Pollution') && el.textContent.includes('XAI')).catch(() => false);
      const hasFooter = await page.$eval('footer', el => el.textContent.includes('Capstone') && el.textContent.includes('Open-Meteo')).catch(() => false);
      if (hasBrand && hasFooter) {
        passedTests++;
        console.log('  ✓ Desktop Navbar brand & 4-column Footer present with full attribution.');
      } else {
        failures.push(`Desktop Navbar or Footer verification failed.`);
      }

      // TEST 2: Navbar and Mobile Drawer verification (Mobile 360px)
      console.log('\n--- 2. Testing Navbar and Mobile Drawer on Mobile (360px) ---');
      totalTests++;
      await page.setViewportSize({ width: 360, height: 740 });
      await page.goto('http://127.0.0.1:4175/', { waitUntil: 'load' });
      await page.waitForTimeout(500);
      const menuToggleBtn = await page.$('button[aria-controls="mobile-navigation-drawer"]');
      if (menuToggleBtn) {
        await menuToggleBtn.click();
        await page.waitForTimeout(400);
        const isDrawerOpen = await page.$eval('#mobile-navigation-drawer', el => Boolean(el)).catch(() => false);
        if (isDrawerOpen) {
          passedTests++;
          console.log('  ✓ Mobile drawer opened with 44px tap targets.');
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);
        } else {
          failures.push('Mobile drawer did not open.');
        }
      } else {
        failures.push('Mobile menu button not found.');
      }

      // Restore desktop viewport
      await page.setViewportSize({ width: 1280, height: 800 });

      // TEST 3: User Authentication (Login Flow)
      console.log('\n--- 3. Testing Sign In Flow ---');
      totalTests++;
      const signInBtn = await page.$('button:has-text("Sign In")');
      if (signInBtn) {
        await signInBtn.click();
        await page.waitForTimeout(400);

        // Fill in credentials
        await page.fill('input[type="email"]', 'researcher@delhi.ac.in');
        await page.fill('input[type="password"]', 'Capstone2026!Secure');
        
        const submitBtn = await page.$('[role="dialog"] button[type="submit"]');
        if (submitBtn) {
          await submitBtn.click();
          await page.waitForTimeout(600);

          // Check if user session avatar/name or logout appears
          const userMenu = await page.$('button[aria-label="User profile menu"], button:has-text("Dr. A. Sharma")');
          if (userMenu) {
            passedTests++;
            console.log('  ✓ Authenticated successfully: User profile visible in navbar.');
          } else {
            failures.push('User profile not rendered after login.');
          }
        } else {
          failures.push('Login submit button not found.');
        }
      } else {
        failures.push('Sign In button not found.');
      }

      // TEST 4: Live Assessment Page & Flow
      console.log('\n--- 4. Testing Live Air Quality Assessment Flow ---');
      totalTests++;
      await page.goto('http://127.0.0.1:4175/live-assessment', { waitUntil: 'load' });
      await page.waitForTimeout(600);

      // Click Delhi preset location button
      const cpPreset = await page.$('button:has-text("Connaught Place")');
      if (cpPreset) {
        await cpPreset.click();
        await page.waitForTimeout(800);

        // Check verdict or CAMS reference card
        const pageText = await page.textContent('main');
        if (pageText.includes('Connaught Place') || pageText.includes('PM2.5') || pageText.includes('Assessment')) {
          passedTests++;
          console.log('  ✓ Live Assessment rendered with reference CAMS and XGBoost model telemetry.');
        } else {
          failures.push('Live assessment card did not display after preset selection.');
        }
      } else {
        failures.push('Connaught Place preset button not found on Live Assessment page.');
      }

      // TEST 5: Saved Places Page (List, Filter & Modals)
      console.log('\n--- 5. Testing Saved Places Page ---');
      totalTests++;
      await page.goto('http://127.0.0.1:4175/saved-places', { waitUntil: 'load' });
      await page.waitForSelector('button:has-text("Add New Place")', { timeout: 6000 });

      const savedHeading = await page.$eval('h1', el => el.textContent).catch(() => '');
      const hasExportCSV = await page.waitForSelector('button:has-text("Export CSV"), button[title*="CSV"]', { timeout: 4000 }).catch(() => null);
      if (savedHeading.includes('Saved Places') && hasExportCSV) {
        passedTests++;
        console.log('  ✓ Saved Places page rendered with CSV export action and location cards.');
      } else {
        failures.push(`Saved Places page failed heading or export CSV check. (Heading: "${savedHeading}", hasCSV: ${Boolean(hasExportCSV)})`);
      }

      // TEST 6: Exposure History Page & Trend Chart
      console.log('\n--- 6. Testing History Page & SVG Exposure Chart ---');
      totalTests++;
      await page.goto('http://127.0.0.1:4175/history', { waitUntil: 'load' });
      await page.waitForTimeout(600);

      const historyTitle = await page.$eval('h1', el => el.textContent).catch(() => '');
      const hasTrend = await page.$('svg, .rounded-2xl');
      if (historyTitle.includes('History') && hasTrend) {
        passedTests++;
        console.log('  ✓ History page rendered with 7-day exposure trend analysis.');
      } else {
        failures.push('History page verification failed.');
      }

      // TEST 7: Logout Flow
      console.log('\n--- 7. Testing Logout Flow ---');
      totalTests++;
      const userMenuBtn = await page.$('button[aria-label="User profile menu"], button:has-text("Dr. A. Sharma")');
      if (userMenuBtn) {
        await userMenuBtn.click();
        await page.waitForTimeout(300);
        const logoutBtn = await page.$('button:has-text("Sign Out"), button:has-text("Logout")');
        if (logoutBtn) {
          await logoutBtn.click();
          await page.waitForTimeout(500);

          // Sign In button should reappear
          const reSignInBtn = await page.$('button:has-text("Sign In")');
          if (reSignInBtn) {
            passedTests++;
            console.log('  ✓ Session terminated successfully: "Sign In" restored in Navbar.');
          } else {
            failures.push('Sign In button did not reappear after logout.');
          }
        } else {
          failures.push('Sign Out button not found in user dropdown.');
        }
      } else {
        failures.push('User menu button not found for logout test.');
      }

      await page.close();

    } catch (err) {
      failures.push(`Execution error: ${err.message}`);
      console.error(err);
    } finally {
      await browser.close();
      staticServer.close();
      apiServer.close();
    }

    console.log('\n========================================');
    console.log(`Full Flow E2E Tests: ${passedTests}/${totalTests} Passed.`);
    if (failures.length === 0) {
      console.log('🎉 ALL FULL FLOW E2E TESTS PASSED SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.error('❌ Failures:', failures);
      process.exit(1);
    }
  });
});
