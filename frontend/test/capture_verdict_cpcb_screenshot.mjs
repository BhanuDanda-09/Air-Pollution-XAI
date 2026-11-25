import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const PORT = 4190;
const API_PORT = 5000;

// Resolve directories
const projectRoot = fs.existsSync(path.resolve('frontend/dist')) ? path.resolve('.') : path.resolve('..');
const distDir = path.resolve(projectRoot, 'frontend/dist');
const screenshotDir = path.resolve(projectRoot, 'docs/screenshots/verification');

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// Start static server
const staticServer = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(distDir, reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  fs.createReadStream(filePath).pipe(res);
});

// Mode switch for API server to return Before vs After verdict payload
let currentMode = 'after'; // 'before' or 'after'

const mockApiServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url.startsWith('/api/location/assess')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let parsed = {};
      try { parsed = JSON.parse(body); } catch (_) {}
      const isSensitive = parsed.health_profile?.asthma || parsed.health_profile?.has_respiratory_condition;

      // PM2.5 = 105 µg/m³ (CPCB Poor Band: 91 - 120 µg/m³)
      const pm25 = 105.0;

      let summaryText;
      let tailoredAdvice;

      if (currentMode === 'before') {
        // Old bugged message that called Poor PM2.5 "Severe air pollution crisis"
        summaryText = "Severe air pollution crisis. Outdoor exposure carries severe health consequences. Unfavorable for residence without continuous high-grade filtration.";
        tailoredAdvice = {
          n95_mask: "N95/P100 respirator strictly mandatory for any outdoor transit.",
          indoor_exercise: "Strict indoor confinement. No strenuous physical exertion.",
          windows: "Seal window gaps; do not ventilate with unpurified ambient air.",
          purifier: "High-capacity HEPA purifiers running continuously; monitor indoor PM2.5.",
        };
      } else {
        // CPCB-aligned wording: No "Severe", no "crisis", tailored to health profile
        if (isSensitive) {
          summaryText = "Air quality is in the CPCB Poor band. Heightened risk of breathing discomfort and asthma exacerbation for sensitive groups. Strictly avoid prolonged outdoor exertion and keep quick-relief medication handy.";
          tailoredAdvice = {
            n95_mask: "Airtight N95 / FFP2 respirator strongly advised for any essential outdoor transit.",
            indoor_exercise: "Avoid outdoor exertion; exercise indoors in a filtered room.",
            windows: "Keep windows firmly closed continuously; seal noticeable draft gaps.",
            purifier: "Operate HEPA air purifiers continuously on medium/high speed in living and sleeping areas.",
          };
        } else {
          summaryText = "Air quality is in the CPCB Poor band. Ambient particulate levels cause breathing discomfort on prolonged outdoor exposure. Limit heavy outdoor exertion and close windows.";
          tailoredAdvice = {
            n95_mask: "N95 / FFP2 respirator recommended for prolonged outdoor commutes.",
            indoor_exercise: "Shift strenuous cardio and athletic workouts indoors.",
            windows: "Keep windows and doors closed to block ambient dust ingress.",
            purifier: "Operate HEPA air purifiers in home and office spaces.",
          };
        }
      }

      const payload = {
        success: true,
        coverage: { tier: 'Tier 1 - Validated Region', status: 'Active' },
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          timestamp: '2026-11-25T07:00:00Z',
          is_delhi_ncr: true,
          validity: 'valid',
        },
        livability: {
          score: isSensitive ? 21 : 31,
          raw_score: 31,
          verdict: isSensitive ? 'Not recommended' : 'Avoid outdoor activity',
          tier: isSensitive ? 'Not recommended' : 'Avoid outdoor activity',
          color: isSensitive ? '#EF4444' : '#F97316',
          cpcb_category: 'Poor',
          summary: summaryText,
          confidence: 'high',
          confidence_reason: 'High confidence: CAMS regional reference data and surface meteorological model operating in validated domain.',
          reasons: [
            `Current Reference PM2.5 is ${pm25} µg/m³ (Regional estimate (CAMS), CPCB band: Poor).`,
            '24-Hour Forecast indicates a stable trend (mean: 105 µg/m³).',
            'Atmospheric dispersion index is 22/100 based on live solar radiation and relative humidity.',
          ],
          tailored_advice: tailoredAdvice,
          persona_guidance: {
            general: {
              tag: 'Unfavorable',
              action: 'Limit prolonged outdoor exertion; consider indoor gym workouts and keep home windows closed.',
              details: 'Elevated particulate accumulation increases respiratory strain on prolonged exposure. Limit outdoor exertion.',
            },
            sensitive: {
              tag: 'High Caution',
              action: 'Avoid prolonged outdoor recreation; carry quick-relief inhalers and wear an N95 respirator.',
              details: 'Elevated risk of cough, throat irritation, and asthma exacerbation during poor air quality.',
            },
            outdoor: {
              tag: 'Not Recommended',
              action: 'Relocate strenuous athletic training indoors; outdoor workers should wear N95 respirators.',
              details: 'Prolonged heavy ventilation during outdoor workouts increases particulate dosage. Shift athletic training indoors.',
            },
          },
          primary_driver: {
            source: 'Regional estimate (CAMS)',
            current_pm25: pm25,
            unit: 'µg/m³',
          },
          citizen_precautions: {
            health_tags: isSensitive ? ['Respiratory Vulnerability', 'Senior Citizen (65+ yrs)'] : ['Standard Healthy Adult'],
            precautions: [
              {
                category: 'Respiratory Barrier & Masking',
                title: 'Certified N95 / FFP2 Respirator Mandate',
                recommendation: 'Wear an airtight, certified N95 or FFP2 respirator with an adjustable metal nose clip whenever outdoors.',
                urgency: 'High',
                faq_anchor: 'protection-masks',
              },
              {
                category: 'Indoor Clean Air Sanctuary',
                title: 'Seal Windows & Run True HEPA (H13) Filtration',
                recommendation: 'Close external windows during calm morning and evening inversion hours. Run a True HEPA purifier.',
                urgency: 'High',
                faq_anchor: 'protection-masks',
              },
            ],
            faq_link: '/faq',
          },
        },
        model_prediction: {
          model_key: 'xgboost',
          model_name: 'Tuned XGBoost',
          pm25: 110.2,
          unit: 'µg/m³',
          cpcb_category: { category: 'Poor' },
        },
        meteorological_inputs: {
          features: { RH: 65, WD: 190, SR: 120, BP: 746, AT: 17 },
          has_out_of_training_range_inputs: false,
          input_out_of_training_range_warnings: [],
        },
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

async function run() {
  await new Promise(r => staticServer.listen(PORT, r));
  await new Promise(r => mockApiServer.listen(API_PORT, r));
  console.log(`Static server running on http://127.0.0.1:${PORT}`);
  console.log(`Mock API server running on http://127.0.0.1:${API_PORT}`);

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
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // 1. Capture BEFORE Screenshot (showing old "Severe air pollution crisis" for PM2.5 = 105 Poor)
  currentMode = 'before';
  console.log('Capturing BEFORE fix screenshot (Poor PM2.5 with old severe crisis message)...');
  await page.goto(`http://127.0.0.1:${PORT}/live-assessment`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Locate the LivabilityScoreCard hero banner
  const verdictCard = page.locator('div[role="region"][aria-label="Livability score and outdoor recommendations"]');
  await verdictCard.waitFor({ state: 'visible', timeout: 5000 });

  const beforeScreenshotPath = path.resolve(screenshotDir, 'verdict_before_cpcb_fix.png');
  await verdictCard.screenshot({ path: beforeScreenshotPath });
  console.log(`✓ Saved BEFORE screenshot to: ${beforeScreenshotPath}`);

  // 2. Capture AFTER Screenshot (showing CPCB-aligned Poor band message)
  currentMode = 'after';
  console.log('Capturing AFTER fix screenshot (CPCB-aligned Poor band message without severe wording)...');
  await page.goto(`http://127.0.0.1:${PORT}/live-assessment`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await verdictCard.waitFor({ state: 'visible', timeout: 5000 });

  const afterScreenshotPath = path.resolve(screenshotDir, 'verdict_after_cpcb_fix.png');
  await verdictCard.screenshot({ path: afterScreenshotPath });
  console.log(`✓ Saved AFTER screenshot to: ${afterScreenshotPath}`);

  await browser.close();
  staticServer.close();
  mockApiServer.close();
  console.log('🎉 Screenshots successfully generated!');
}

run().catch(err => {
  console.error('Failed capturing screenshots:', err);
  process.exit(1);
});
