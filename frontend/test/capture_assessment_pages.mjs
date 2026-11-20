import { chromium } from 'playwright';
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 4175;
const SCREENSHOT_DIR = path.resolve('docs/audit_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function serveStatic(dir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  const server = http.createServer((req, res) => {
    let filePath = path.join(dir, req.url.split('?')[0]);
    if (filePath.endsWith(path.sep) || !path.extname(filePath)) {
      filePath = path.join(dir, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        fs.readFile(path.join(dir, 'index.html'), (err2, fallback) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(fallback, 'utf-8');
          }
        });
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function run() {
  const server = await serveStatic(path.resolve('frontend/dist'), PORT);
  console.log(`Server running on port ${PORT}`);

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const targets = [
    {
      url: `http://127.0.0.1:${PORT}/live-assessment`,
      name: 'verified_live_assessment_360px.png',
      width: 360,
      height: 800,
      dark: false,
    },
    {
      url: `http://127.0.0.1:${PORT}/live-assessment`,
      name: 'verified_live_assessment_1920px.png',
      width: 1920,
      height: 1080,
      dark: false,
    },
    {
      url: `http://127.0.0.1:${PORT}/livability`,
      name: 'verified_livability_360px.png',
      width: 360,
      height: 800,
      dark: false,
    },
    {
      url: `http://127.0.0.1:${PORT}/livability`,
      name: 'verified_livability_1920px.png',
      width: 1920,
      height: 1080,
      dark: false,
    },
    {
      url: `http://127.0.0.1:${PORT}/livability`,
      name: 'verified_livability_dark_1920px.png',
      width: 1920,
      height: 1080,
      dark: true,
    },
  ];

  for (const t of targets) {
    const page = await browser.newPage({
      viewport: { width: t.width, height: t.height },
      colorScheme: t.dark ? 'dark' : 'light',
    });

    if (t.dark) {
      await page.addInitScript(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      });
    }

    await page.goto(t.url, { waitUntil: 'load', timeout: 15000 });
    // wait for mock or initial render
    await page.waitForTimeout(1500);

    const outPath = path.join(SCREENSHOT_DIR, t.name);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Saved screenshot: ${t.name}`);
    await page.close();
  }

  await browser.close();
  server.close();
  console.log('Batch 3 screenshot verification complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
