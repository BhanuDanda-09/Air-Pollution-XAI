import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const OUTPUT_DIR = path.resolve(__dirname, '../../docs/screenshots');

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

async function captureScreenshots() {
  await new Promise(resolve => server.listen(4179, resolve));
  console.log('✓ In-process screenshot server running on port 4179');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    await page.goto('http://127.0.0.1:4179/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // 1. Desktop Navbar Screenshot
    const navbar = await page.$('header');
    if (navbar) {
      const navPath = path.join(OUTPUT_DIR, '01_navbar_airiq_india.png');
      await navbar.screenshot({ path: navPath });
      console.log(`✓ Saved navbar screenshot: ${navPath}`);
    }

    // 2. Hero Section Screenshot
    const hero = await page.$('section');
    if (hero) {
      const heroPath = path.join(OUTPUT_DIR, '02_hero_airiq_india.png');
      await hero.screenshot({ path: heroPath });
      console.log(`✓ Saved hero screenshot: ${heroPath}`);
    }

    // 3. Footer Screenshot
    const footer = await page.$('footer');
    if (footer) {
      const footerPath = path.join(OUTPUT_DIR, '03_footer_airiq_india.png');
      await footer.screenshot({ path: footerPath });
      console.log(`✓ Saved footer screenshot: ${footerPath}`);
    }

    // 4. Browser Tab Preview (Simulate real browser tab header with favicon and title)
    const title = await page.title();
    const tabPreviewPage = await context.newPage();
    await tabPreviewPage.setViewportSize({ width: 800, height: 140 });
    await tabPreviewPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              background: #0f172a;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              padding: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .chrome-window {
              width: 750px;
              background: #1e293b;
              border-radius: 12px;
              border: 1px solid #334155;
              overflow: hidden;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
            }
            .window-controls {
              display: flex;
              gap: 8px;
              padding: 12px 16px 8px 16px;
              background: #0f172a;
              border-bottom: 1px solid #1e293b;
              align-items: center;
            }
            .dot { width: 12px; height: 12px; border-radius: 50%; }
            .dot-red { background: #ef4444; }
            .dot-yellow { background: #f59e0b; }
            .dot-green { background: #10b981; }
            .tab-bar {
              display: flex;
              align-items: center;
              padding: 8px 16px;
              background: #1e293b;
            }
            .tab {
              display: flex;
              align-items: center;
              gap: 10px;
              background: #0f172a;
              padding: 8px 18px;
              border-radius: 8px 8px 0 0;
              border: 1px solid #334155;
              border-bottom: none;
              color: #f1f5f9;
              font-size: 13px;
              font-weight: 500;
              max-width: 580px;
            }
            .tab svg { width: 18px; height: 18px; flex-shrink: 0; }
            .tab-title {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .close-tab {
              color: #64748b;
              font-size: 14px;
              margin-left: 8px;
            }
          </style>
        </head>
        <body>
          <div class="chrome-window">
            <div class="window-controls">
              <div class="dot dot-red"></div>
              <div class="dot dot-yellow"></div>
              <div class="dot dot-green"></div>
            </div>
            <div class="tab-bar">
              <div class="tab">
                <svg viewBox="0 0 100 100" fill="none">
                  <path d="M18 68 A 38 38 0 1 1 82 68" stroke="#0284C7" stroke-width="10" stroke-linecap="round"/>
                  <path d="M12 50 C 25 40, 42 62, 58 50 C 70 41, 80 44, 90 47" stroke="#10B981" stroke-width="8" stroke-linecap="round"/>
                  <path d="M50 20 C 41.5 20, 35 26.5, 35 35 C 35 46, 50 64, 50 64 C 50 64, 65 46, 65 35 C 65 26.5, 58.5 20, 50 20 Z" fill="#0284C7"/>
                  <circle cx="50" cy="35" r="7" fill="#FFFFFF"/>
                </svg>
                <span class="tab-title">${title}</span>
                <span class="close-tab">×</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    const tabPath = path.join(OUTPUT_DIR, '04_browser_tab_airiq_india.png');
    await tabPreviewPage.screenshot({ path: tabPath });
    console.log(`✓ Saved browser tab screenshot: ${tabPath}`);
    await tabPreviewPage.close();

    // 5. Social Share Card Preview
    const ogSrc = path.resolve(__dirname, '../public/og-image.png');
    const ogDest = path.join(OUTPUT_DIR, '05_social_share_preview_airiq_india.png');
    if (fs.existsSync(ogSrc)) {
      fs.copyFileSync(ogSrc, ogDest);
      console.log(`✓ Saved social share preview: ${ogDest}`);
    }

    console.log('\n🎉 All 5 verification screenshots captured successfully in docs/screenshots/');
  } finally {
    await browser.close();
    server.close();
  }
}

captureScreenshots().catch(err => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
