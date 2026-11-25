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

// Static build server with production Vercel headers
const staticServer = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
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
  console.log('Static server running on http://127.0.0.1:4182 with production CSP');
  console.log('Mock API server running on http://127.0.0.1:5000');

  let browser;
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  try {
    browser = await chromium.launch({ ...launchOptions, channel: 'chrome' });
  } catch (e) {
    browser = await chromium.launch(launchOptions);
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const cspViolations = [];
  const osmTileResponses = [];

  page.on('console', (msg) => {
    const text = msg.text();
    console.log(`[Browser Console ${msg.type()}] ${text}`);
    if (text.includes('Content Security Policy') || text.includes('violates the following Content Security Policy')) {
      cspViolations.push(text);
    }
  });

  page.on('pageerror', (err) => {
    console.error('[Browser PageError]', err);
  });

  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('tile.openstreetmap.org')) {
      osmTileResponses.push({
        url,
        status: response.status(),
      });
    }
  });

  console.log('Navigating to http://127.0.0.1:4182/live-assessment...');
  await page.goto('http://127.0.0.1:4182/live-assessment', { waitUntil: 'networkidle' });

  // Map is open by default (or click button if closed)
  const mapElement = page.locator('.leaflet-container');
  await mapElement.waitFor({ state: 'visible', timeout: 5000 });

  console.log('Waiting for tile rendering...');
  await page.waitForTimeout(3000);

  // Check tile responses
  const successfulTiles = osmTileResponses.filter(r => r.status === 200);
  console.log(`OSM Tile Requests: ${osmTileResponses.length}`);
  console.log(`Successful HTTP 200 Tiles: ${successfulTiles.length}`);
  console.log(`CSP Violations: ${cspViolations.length}`);

  // Assertions
  if (successfulTiles.length < 1) {
    throw new Error(`Expected at least 1 OSM tile to load with HTTP 200, got ${successfulTiles.length}`);
  }

  if (cspViolations.length > 0) {
    throw new Error(`Expected 0 CSP violations, got ${cspViolations.length}: ${JSON.stringify(cspViolations)}`);
  }

  // Check attribution
  const attribution = page.locator('.leaflet-control-attribution');
  const attrText = await attribution.innerText();
  console.log(`Attribution text verified: "${attrText.trim()}"`);
  if (!attrText.includes('OpenStreetMap')) {
    throw new Error(`Attribution missing OpenStreetMap contributors text: ${attrText}`);
  }

  // Capture after fix screenshot
  const projectRoot = fs.existsSync(path.resolve('docs')) ? path.resolve('.') : path.resolve('..');
  const screenshotPath = path.resolve(projectRoot, 'docs/screenshots/verification/map_after_fix.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`✓ Saved after-fix screenshot to: ${screenshotPath}`);

  console.log('🎉 PLAYWRIGHT MAP TILES TEST PASSED: Tiles loaded with HTTP 200, 0 CSP violations, attribution verified!');

  await browser.close();
  staticServer.close();
  mockApiServer.close();
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
