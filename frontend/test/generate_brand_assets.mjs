import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

async function generateBrandAssets() {
  console.log('🎨 Generating AirIQ India brand assets via Playwright...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    // 1. Generate 512x512 PWA Icon
    const pwa512Page = await browser.newPage({ viewport: { width: 512, height: 512 } });
    await pwa512Page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              width: 512px; height: 512px;
              background: linear-gradient(135deg, #0b132b 0%, #1c2541 100%);
              display: flex; align-items: center; justify-content: center;
              border-radius: 115px; overflow: hidden;
              position: relative;
            }
            .border-ring {
              position: absolute; inset: 12px; border-radius: 105px;
              border: 5px solid rgba(14, 165, 233, 0.35);
            }
            svg { width: 340px; height: 340px; }
          </style>
        </head>
        <body>
          <div class="border-ring"></div>
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="pwaDial" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#06B6D4"/>
                <stop offset="50%" stop-color="#0284C7"/>
                <stop offset="100%" stop-color="#10B981"/>
              </linearGradient>
              <linearGradient id="pwaWind" x1="0" y1="50" x2="100" y2="50" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#38BDF8"/>
                <stop offset="100%" stop-color="#34D399"/>
              </linearGradient>
            </defs>
            <path d="M18 68 A 38 38 0 1 1 82 68" stroke="url(#pwaDial)" stroke-width="8" stroke-linecap="round" fill="none"/>
            <path d="M12 50 C 25 40, 42 62, 58 50 C 70 41, 80 44, 90 47" stroke="url(#pwaWind)" stroke-width="6" stroke-linecap="round" fill="none"/>
            <path d="M50 20 C 41.5 20, 35 26.5, 35 35 C 35 46, 50 64, 50 64 C 50 64, 65 46, 65 35 C 65 26.5, 58.5 20, 50 20 Z" fill="#0EA5E9"/>
            <circle cx="50" cy="35" r="7" fill="#FFFFFF"/>
            <circle cx="50" cy="35" r="3.5" fill="#10B981"/>
          </svg>
        </body>
      </html>
    `);
    const pwa512Path = path.join(publicDir, 'pwa-512x512.png');
    await pwa512Page.screenshot({ path: pwa512Path });
    console.log(`  ✓ Created: ${pwa512Path} (512x512)`);

    // 2. Generate 192x192 PWA Icon
    const pwa192Page = await browser.newPage({ viewport: { width: 192, height: 192 } });
    await pwa192Page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              width: 192px; height: 192px;
              background: linear-gradient(135deg, #0b132b 0%, #1c2541 100%);
              display: flex; align-items: center; justify-content: center;
              border-radius: 44px; overflow: hidden;
              position: relative;
            }
            .border-ring {
              position: absolute; inset: 5px; border-radius: 40px;
              border: 2px solid rgba(14, 165, 233, 0.4);
            }
            svg { width: 130px; height: 130px; }
          </style>
        </head>
        <body>
          <div class="border-ring"></div>
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="pwaDial" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#06B6D4"/>
                <stop offset="50%" stop-color="#0284C7"/>
                <stop offset="100%" stop-color="#10B981"/>
              </linearGradient>
              <linearGradient id="pwaWind" x1="0" y1="50" x2="100" y2="50" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#38BDF8"/>
                <stop offset="100%" stop-color="#34D399"/>
              </linearGradient>
            </defs>
            <path d="M18 68 A 38 38 0 1 1 82 68" stroke="url(#pwaDial)" stroke-width="8" stroke-linecap="round" fill="none"/>
            <path d="M12 50 C 25 40, 42 62, 58 50 C 70 41, 80 44, 90 47" stroke="url(#pwaWind)" stroke-width="6" stroke-linecap="round" fill="none"/>
            <path d="M50 20 C 41.5 20, 35 26.5, 35 35 C 35 46, 50 64, 50 64 C 50 64, 65 46, 65 35 C 65 26.5, 58.5 20, 50 20 Z" fill="#0EA5E9"/>
            <circle cx="50" cy="35" r="7" fill="#FFFFFF"/>
            <circle cx="50" cy="35" r="3.5" fill="#10B981"/>
          </svg>
        </body>
      </html>
    `);
    const pwa192Path = path.join(publicDir, 'pwa-192x192.png');
    await pwa192Page.screenshot({ path: pwa192Path });
    console.log(`  ✓ Created: ${pwa192Path} (192x192)`);

    // 3. Generate Apple Touch Icon (180x180)
    const applePage = await browser.newPage({ viewport: { width: 180, height: 180 } });
    await applePage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              width: 180px; height: 180px;
              background: linear-gradient(135deg, #0b132b 0%, #1c2541 100%);
              display: flex; align-items: center; justify-content: center;
              border-radius: 40px; overflow: hidden;
            }
            svg { width: 120px; height: 120px; }
          </style>
        </head>
        <body>
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="appleDial" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#06B6D4"/>
                <stop offset="50%" stop-color="#0284C7"/>
                <stop offset="100%" stop-color="#10B981"/>
              </linearGradient>
              <linearGradient id="appleWind" x1="0" y1="50" x2="100" y2="50" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#38BDF8"/>
                <stop offset="100%" stop-color="#34D399"/>
              </linearGradient>
            </defs>
            <path d="M18 68 A 38 38 0 1 1 82 68" stroke="url(#appleDial)" stroke-width="8" stroke-linecap="round" fill="none"/>
            <path d="M12 50 C 25 40, 42 62, 58 50 C 70 41, 80 44, 90 47" stroke="url(#appleWind)" stroke-width="6" stroke-linecap="round" fill="none"/>
            <path d="M50 20 C 41.5 20, 35 26.5, 35 35 C 35 46, 50 64, 50 64 C 50 64, 65 46, 65 35 C 65 26.5, 58.5 20, 50 20 Z" fill="#0EA5E9"/>
            <circle cx="50" cy="35" r="7" fill="#FFFFFF"/>
            <circle cx="50" cy="35" r="3.5" fill="#10B981"/>
          </svg>
        </body>
      </html>
    `);
    const applePath = path.join(publicDir, 'apple-touch-icon.png');
    await applePage.screenshot({ path: applePath });
    console.log(`  ✓ Created: ${applePath} (180x180)`);

    // 4. Generate Open Graph Social Preview Card (1200x630)
    const ogPage = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await ogPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              width: 1200px; height: 630px;
              background: #0B1120;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #FFFFFF;
              display: flex; flex-direction: column; justify-content: space-between;
              padding: 70px 80px;
              position: relative;
              overflow: hidden;
            }
            .bg-glow-1 {
              position: absolute; top: -100px; right: -80px; width: 600px; height: 600px;
              background: radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, rgba(14, 165, 233, 0) 70%);
              pointer-events: none;
            }
            .bg-glow-2 {
              position: absolute; bottom: -120px; left: 200px; width: 700px; height: 500px;
              background: radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, rgba(16, 185, 129, 0) 70%);
              pointer-events: none;
            }
            .header {
              display: flex; align-items: center; justify-content: space-between;
              z-index: 2;
            }
            .brand-badge {
              display: inline-flex; align-items: center; gap: 10px;
              background: rgba(255, 255, 255, 0.07);
              border: 1px solid rgba(255, 255, 255, 0.15);
              padding: 8px 18px; border-radius: 999px;
              font-size: 14px; font-weight: 600; color: #38BDF8;
              letter-spacing: 0.05em; text-transform: uppercase;
            }
            .pulse-dot {
              width: 9px; height: 9px; border-radius: 50%; background: #10B981;
              box-shadow: 0 0 10px #10B981;
            }
            .coverage-pill {
              font-size: 14px; font-weight: 600; color: #94A3B8;
              background: rgba(15, 23, 42, 0.6);
              padding: 8px 18px; border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .main {
              z-index: 2; margin-top: 20px;
            }
            .logo-row {
              display: flex; align-items: center; gap: 24px; margin-bottom: 24px;
            }
            .logo-icon {
              width: 90px; height: 90px; border-radius: 24px;
              background: linear-gradient(135deg, #0284C7 0%, #10B981 100%);
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 20px 40px -10px rgba(2, 132, 199, 0.5);
            }
            .logo-icon svg { width: 56px; height: 56px; }
            .title {
              font-size: 72px; font-weight: 900; letter-spacing: -0.04em; line-height: 1;
            }
            .title-iq {
              color: #38BDF8;
            }
            .title-india {
              color: #34D399; margin-left: 8px;
            }
            .tagline {
              font-size: 32px; font-weight: 700; color: #E2E8F0;
              margin-bottom: 16px; letter-spacing: -0.02em;
            }
            .description {
              font-size: 20px; color: #94A3B8; max-width: 860px; line-height: 1.5;
            }
            .footer {
              z-index: 2; display: flex; align-items: flex-end; justify-content: space-between;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              padding-top: 24px;
            }
            .cpcb-scale {
              display: flex; flex-direction: column; gap: 8px;
            }
            .cpcb-label {
              font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em;
            }
            .scale-bars {
              display: flex; gap: 6px;
            }
            .bar {
              height: 8px; border-radius: 4px; display: flex; align-items: center;
            }
            .features-list {
              display: flex; gap: 24px; font-size: 14px; color: #CBD5E1; font-weight: 600;
            }
            .feat-item {
              display: flex; align-items: center; gap: 8px;
            }
            .feat-dot { width: 6px; height: 6px; border-radius: 50%; background: #38BDF8; }
          </style>
        </head>
        <body>
          <div class="bg-glow-1"></div>
          <div class="bg-glow-2"></div>

          <div class="header">
            <div class="brand-badge">
              <span class="pulse-dot"></span>
              All-India Atmospheric Intelligence
            </div>
            <div class="coverage-pill">
              36 States & UTs • 788 Districts • 19,000+ PIN Codes
            </div>
          </div>

          <div class="main">
            <div class="logo-row">
              <div class="logo-icon">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 68 A 38 38 0 1 1 82 68" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" fill="none"/>
                  <path d="M12 50 C 25 40, 42 62, 58 50 C 70 41, 80 44, 90 47" stroke="#38BDF8" stroke-width="6" stroke-linecap="round" fill="none"/>
                  <path d="M50 20 C 41.5 20, 35 26.5, 35 35 C 35 46, 50 64, 50 64 C 50 64, 65 46, 65 35 C 65 26.5, 58.5 20, 50 20 Z" fill="#FFFFFF"/>
                  <circle cx="50" cy="35" r="5" fill="#0284C7"/>
                </svg>
              </div>
              <div class="title">
                Air<span class="title-iq">IQ</span><span class="title-india">India</span>
              </div>
            </div>

            <div class="tagline">
              Smarter air decisions for every address in India.
            </div>
            <div class="description">
              Real-time PM2.5 forecasts, satellite gridded village estimates, explainable weather drivers, and health-first relocation guidance.
            </div>
          </div>

          <div class="footer">
            <div class="cpcb-scale">
              <div class="cpcb-label">CPCB Health Standard Index</div>
              <div class="scale-bars">
                <div class="bar" style="width: 50px; background: #10B981;"></div>
                <div class="bar" style="width: 50px; background: #84CC16;"></div>
                <div class="bar" style="width: 50px; background: #EAB308;"></div>
                <div class="bar" style="width: 50px; background: #F97316;"></div>
                <div class="bar" style="width: 50px; background: #8B5CF6;"></div>
                <div class="bar" style="width: 50px; background: #DC2626;"></div>
              </div>
            </div>
            <div class="features-list">
              <div class="feat-item"><span class="feat-dot"></span> Street & Village Level</div>
              <div class="feat-item"><span class="feat-dot"></span> Asthma Exposure Multipliers</div>
              <div class="feat-item"><span class="feat-dot"></span> Open Data & Free Access</div>
            </div>
          </div>
        </body>
      </html>
    `);
    const ogPath = path.join(publicDir, 'og-image.png');
    await ogPage.screenshot({ path: ogPath });
    console.log(`  ✓ Created: ${ogPath} (1200x630)`);

    console.log('✅ All AirIQ India brand assets generated successfully!');
  } finally {
    await browser.close();
  }
}

generateBrandAssets().catch((err) => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
