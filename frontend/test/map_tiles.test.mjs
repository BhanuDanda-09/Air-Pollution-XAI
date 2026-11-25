import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = fs.existsSync(path.resolve('frontend/dist'))
  ? path.resolve('frontend/dist')
  : path.resolve('dist');

const VERCEL_JSON_PATH = fs.existsSync(path.resolve('frontend/vercel.json'))
  ? path.resolve('frontend/vercel.json')
  : path.resolve('../vercel.json');

const SCREENSHOT_DIR = fs.existsSync(path.resolve('docs/screenshots/verification'))
  ? path.resolve('docs/screenshots/verification')
  : path.resolve('../docs/screenshots/verification');

const ARTIFACT_DIR = 'C:/Users/danda/.gemini/antigravity/brain/e6aeef7a-b97e-4e09-8f73-d64879f5d5d5';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Read headers from vercel.json to test actual production security policy
const vercelConfig = JSON.parse(fs.readFileSync(VERCEL_JSON_PATH, 'utf8'));
const defaultHeaders = {};
const rootRule = vercelConfig.headers.find(h => h.source === '/(.*)');
if (rootRule && rootRule.headers) {
  for (const hdr of rootRule.headers) {
    defaultHeaders[hdr.key] = hdr.value;
  }
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// Old service worker from commit 4fae08f (had the cross-origin intercept bug and legacy cache name)
const OLD_SW_CODE = `
// Commit 4fae08f legacy service worker
const CACHE_NAME = 'airiq-india-v2';
const STATIC_PRECACHE = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_PRECACHE)));
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Old bug: intercepted cross-origin and called fetch inside SW
  if (url.href.includes('openstreetmap.org')) {
    event.respondWith(fetch(event.request));
  }
});
`;

// Static build server with production Vercel headers
const staticServer = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  if (reqPath === '/old-sw.js') {
    res.writeHead(200, {
      'Content-Type': 'application/javascript',
      ...defaultHeaders,
    });
    res.end(OLD_SW_CODE);
    return;
  }

  let filePath = path.join(DIST_DIR, reqPath === '/' ? 'index.html' : reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  const headers = {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    ...defaultHeaders,
  };

  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
});

// Mock backend server for live assessment API calls
const mockApiServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  if (req.url.includes('/api/health')) {
    res.end(JSON.stringify({ status: 'ok' }));
  } else if (req.url.includes('/api/geo/states')) {
    res.end(JSON.stringify({ status: 'success', states: ['Delhi', 'Maharashtra'] }));
  } else if (req.url.includes('/api/location/assess')) {
    res.end(JSON.stringify({
      status: 'success',
      data: {
        location: { name: 'Connaught Place', latitude: 28.6139, longitude: 77.2090, in_delhi_ncr: true },
        predicted_pm25: 157.7,
        cpcb_category: 'Very Poor',
        weather: { temperature: 18, relative_humidity: 60, wind_direction: 180, surface_pressure_mmhg: 738, solar_radiation: 150 },
        reference_air_quality: { reference_pm25: 144.2, label: 'Regional estimate (CAMS)' }
      }
    }));
  } else {
    res.end(JSON.stringify({ status: 'success' }));
  }
});

async function main() {
  await new Promise(r => staticServer.listen(4182, '127.0.0.1', r));
  await new Promise(r => mockApiServer.listen(5000, '127.0.0.1', r));
  console.log('Static server running on http://127.0.0.1:4182 with production CSP & headers');
  console.log('Mock API server running on http://127.0.0.1:5000');

  let browser;
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  try {
    browser = await chromium.launch({ ...launchOptions, channel: 'chrome' });
  } catch (e1) {
    try {
      browser = await chromium.launch({ ...launchOptions, channel: 'msedge' });
    } catch (e2) {
      browser = await chromium.launch(launchOptions);
    }
  }

  try {
    // =========================================================================
    // SCENARIO 1: Production Build with Service Worker Active (serviceWorkers: 'allow')
    // =========================================================================
    console.log('\n--- SCENARIO 1: Testing production build with Service Worker enabled ---');
    const context1 = await browser.newContext({
      serviceWorkers: 'allow',
      viewport: { width: 1440, height: 900 },
    });
    const page1 = await context1.newPage();

    const cspViolations1 = [];
    const swFetchErrors1 = [];
    const osmTileResponses1 = [];

    page1.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Content Security Policy') || text.includes('violates the following Content Security Policy')) {
        cspViolations1.push(text);
      }
      if (text.includes('Refused to connect') || text.includes('FetchEvent') || text.includes('ServiceWorker fetch error')) {
        swFetchErrors1.push(text);
      }
    });

    page1.on('response', (response) => {
      const url = response.url();
      if (url.includes('tile.openstreetmap.org')) {
        osmTileResponses1.push({
          url,
          status: response.status(),
        });
      }
    });

    console.log('1. Loading http://127.0.0.1:4182/live-assessment to install service worker...');
    await page1.goto('http://127.0.0.1:4182/live-assessment', { waitUntil: 'networkidle' });

    // Wait for service worker to register and be ready
    await page1.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
      }
    });

    console.log('2. Reloading page so Service Worker controls the client...');
    await page1.reload({ waitUntil: 'networkidle' });

    // Verify service worker is controlling the page
    const isControlled = await page1.evaluate(() => navigator.serviceWorker.controller !== null);
    console.log(`Service Worker is controlling page: ${isControlled}`);

    // Wait for tile rendering
    await page1.waitForTimeout(3000);

    const successfulTiles1 = osmTileResponses1.filter(r => r.status === 200);
    console.log(`OSM Tile Requests: ${osmTileResponses1.length}`);
    console.log(`Successful HTTP 200 Tiles: ${successfulTiles1.length}`);
    console.log(`CSP Violations: ${cspViolations1.length}`);
    console.log(`SW Fetch Errors: ${swFetchErrors1.length}`);

    // Assertions for Scenario 1
    if (successfulTiles1.length < 1) {
      throw new Error(`Expected at least 1 OSM tile to load with HTTP 200, got ${successfulTiles1.length}`);
    }
    if (cspViolations1.length > 0) {
      throw new Error(`Expected 0 CSP violations, got ${cspViolations1.length}: ${JSON.stringify(cspViolations1)}`);
    }
    if (swFetchErrors1.length > 0) {
      throw new Error(`Expected 0 SW fetch errors, got ${swFetchErrors1.length}: ${JSON.stringify(swFetchErrors1)}`);
    }

    // Assert error overlay is NOT visible
    const errorOverlay = page1.locator('text=Interactive map tiles could not be loaded');
    const overlayVisible = await errorOverlay.isVisible();
    if (overlayVisible) {
      throw new Error('Error overlay is visible on a working map');
    }

    // Assert OpenStreetMap attribution is visible
    const attribution = page1.locator('.leaflet-control-attribution');
    const attrText = await attribution.innerText();
    console.log(`Attribution text: "${attrText.trim()}"`);
    if (!attrText.includes('OpenStreetMap')) {
      throw new Error(`Attribution missing OpenStreetMap text: ${attrText}`);
    }

    // Save screenshot
    const pathAfterFix = path.join(SCREENSHOT_DIR, 'map_after_fix.png');
    await page1.screenshot({ path: pathAfterFix });
    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.copyFileSync(pathAfterFix, path.join(ARTIFACT_DIR, 'map_after_fix.png'));
    }
    console.log(`✓ Saved after-fix screenshot to: ${pathAfterFix}`);
    console.log('✓ SCENARIO 1 PASSED: Production build with active Service Worker renders tiles cleanly!');
    await context1.close();

    // =========================================================================
    // SCENARIO 2: Upgrade Migration from OLD Service Worker (commit 4fae08f)
    // =========================================================================
    console.log('\n--- SCENARIO 2: Testing upgrade migration from OLD Service Worker ---');
    const context2 = await browser.newContext({
      serviceWorkers: 'allow',
      viewport: { width: 1440, height: 900 },
    });
    const page2 = await context2.newPage();

    await page2.goto('http://127.0.0.1:4182/live-assessment', { waitUntil: 'networkidle' });

    // Step 2a: Register OLD service worker from commit 4fae08f
    console.log('1. Installing OLD service worker (airiq-india-v2)...');
    await page2.evaluate(async () => {
      const reg = await navigator.serviceWorker.register('/old-sw.js');
      await navigator.serviceWorker.ready;
      // Pre-fill old cache to simulate old deployment
      const cache = await caches.open('airiq-india-v2');
      await cache.put('/old-marker.txt', new Response('old-cache-marker'));
    });

    const oldCaches = await page2.evaluate(async () => caches.keys());
    console.log('Caches before update:', oldCaches);
    if (!oldCaches.includes('airiq-india-v2')) {
      throw new Error("Old cache 'airiq-india-v2' was not established for upgrade test");
    }

    // Step 2b: Update to the new production service worker (/sw.js)
    console.log('2. Updating to NEW service worker (/sw.js)...');
    await page2.evaluate(async () => {
      await navigator.serviceWorker.register('/sw.js');
    });

    // Wait and reload so new service worker activates and claims
    await page2.waitForTimeout(1000);
    await page2.reload({ waitUntil: 'networkidle' });
    await page2.waitForTimeout(2000);

    const newCaches = await page2.evaluate(async () => caches.keys());
    console.log('Caches after update:', newCaches);

    // Assert that the old cache is purged by activate handler
    if (newCaches.includes('airiq-india-v2')) {
      throw new Error("Legacy cache 'airiq-india-v2' was NOT deleted by new service worker");
    }

    // Assert that the new versioned cache is active
    const hasNewCache = newCaches.some(c => c.startsWith('airiq-static-v2.2.0'));
    if (!hasNewCache) {
      throw new Error(`New versioned cache airiq-static-v2.2.0 not found in: ${JSON.stringify(newCaches)}`);
    }

    console.log('✓ Legacy cache successfully purged and new cache established!');
    console.log('✓ SCENARIO 2 PASSED: Old service worker is replaced seamlessly after update!');
    await context2.close();

    // =========================================================================
    // SCENARIO 3: Live Deployment Verification (LIVE_URL)
    // =========================================================================
    const liveUrl = process.env.LIVE_URL || 'https://air-pollution-xai.vercel.app/live-assessment';
    console.log(`\n--- SCENARIO 3: Checking Live URL (${liveUrl}) ---`);
    const context3 = await browser.newContext({
      serviceWorkers: 'allow',
      viewport: { width: 1440, height: 900 },
    });
    const page3 = await context3.newPage();

    const liveCspViolations = [];
    const liveTileResponses = [];

    page3.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Content Security Policy') || text.includes('violates the following Content Security Policy')) {
        liveCspViolations.push(text);
      }
    });

    page3.on('response', (response) => {
      const url = response.url();
      if (url.includes('tile.openstreetmap.org')) {
        liveTileResponses.push({
          url,
          status: response.status(),
        });
      }
    });

    try {
      console.log(`Navigating to ${liveUrl}...`);
      await page3.goto(liveUrl, { waitUntil: 'networkidle', timeout: 15000 });
      await page3.waitForTimeout(3000);

      const pathLive = path.join(SCREENSHOT_DIR, 'live_site_map.png');
      await page3.screenshot({ path: pathLive });
      if (fs.existsSync(ARTIFACT_DIR)) {
        fs.copyFileSync(pathLive, path.join(ARTIFACT_DIR, 'live_site_map.png'));
      }
      console.log(`✓ Saved live site screenshot to: ${pathLive}`);
      console.log(`Live site tile requests: ${liveTileResponses.length}`);
      console.log(`Live site successful HTTP 200 tiles: ${liveTileResponses.filter(r => r.status === 200).length}`);
      console.log(`Live site CSP violations: ${liveCspViolations.length}`);
    } catch (liveErr) {
      console.warn('Note on Live URL inspection:', liveErr.message);
    } finally {
      await context3.close();
    }

    console.log('\n🎉 ALL PLAYWRIGHT MAP TILES AND SERVICE WORKER TESTS COMPLETED SUCCESSFULLY!');
  } finally {
    await browser.close();
    staticServer.close();
    mockApiServer.close();
  }
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
