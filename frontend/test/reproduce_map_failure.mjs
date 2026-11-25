import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve('frontend/dist');

// Read headers from vercel.json to simulate Vercel production environment accurately
const vercelConfig = JSON.parse(fs.readFileSync(path.resolve('vercel.json'), 'utf8'));
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

const server = http.createServer((req, res) => {
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

async function reproduce() {
  await new Promise((resolve) => server.listen(4180, '127.0.0.1', resolve));
  console.log('Production simulation server running on http://127.0.0.1:4180 with Vercel CSP headers...');

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

  const consoleErrors = [];
  const cspViolations = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(text);
      if (text.includes('Content Security Policy') || text.includes('violates the following Content Security Policy')) {
        cspViolations.push(text);
      }
    }
  });

  page.on('requestfailed', (req) => {
    failedRequests.push({
      url: req.url(),
      failure: req.failure()?.errorText,
    });
  });

  console.log('Navigating to /live-assessment...');
  await page.goto('http://127.0.0.1:4180/live-assessment', { waitUntil: 'networkidle' });

  // Ensure map is visible (click Show Map if needed)
  const showMapBtn = page.locator('button:has-text("Show Map")');
  if (await showMapBtn.count() > 0) {
    await showMapBtn.click();
  }

  // Wait 7 seconds for CDN attempts to fail
  console.log('Waiting for map load/fail state...');
  await page.waitForTimeout(8000);

  // Check for the error message
  const errorBanner = page.locator('text=Interactive map tiles could not be loaded');
  const isErrorVisible = (await errorBanner.count()) > 0;

  console.log('--- REPRODUCTION RESULTS ---');
  console.log(`Error Banner Visible: ${isErrorVisible}`);
  console.log(`CSP Violations Detected: ${cspViolations.length}`);
  cspViolations.forEach((v, i) => console.log(`  [CSP Violation ${i + 1}] ${v}`));
  console.log(`Console Errors: ${consoleErrors.length}`);
  consoleErrors.forEach((e, i) => console.log(`  [Console Error ${i + 1}] ${e}`));
  console.log(`Failed Requests: ${failedRequests.length}`);
  failedRequests.forEach((r, i) => console.log(`  [Failed Request ${i + 1}] ${r.url} (${r.failure})`));

  // Capture screenshot of failure
  const projectRoot = fs.existsSync(path.resolve('docs')) ? path.resolve('.') : path.resolve('..');
  const screenshotPath = path.resolve(projectRoot, 'docs/screenshots/verification/map_before_failure.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved failure screenshot to: ${screenshotPath}`);

  await browser.close();
  server.close();
}

reproduce().catch((err) => {
  console.error('Reproduction failed with error:', err);
  process.exit(1);
});
