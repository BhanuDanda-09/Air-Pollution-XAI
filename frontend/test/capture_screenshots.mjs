import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const SCREENSHOT_DIR = path.resolve(__dirname, '../../docs/screenshots/verification');
const ARTIFACT_DIR = 'C:/Users/danda/.gemini/antigravity/brain/e6aeef7a-b97e-4e09-8f73-d64879f5d5d5';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
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

// 1. Static Asset Server (Port 4176)
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

// 2. Mock API Server (Port 5000)
const apiServer = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const method = req.method;

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
    res.end(JSON.stringify({ status: 'healthy', models_loaded: true, version: '2.1.0' }));
    return;
  }

  if (url === '/api/air/districts') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: {
        districts: [
          { national_rank: 1, district: 'North West Delhi', state: 'Delhi', zone: 'North', estimated_aqi: 265, governing_pollutant: 'PM2.5', cpcb_category: 'Severe' },
          { national_rank: 2, district: 'Singrauli', state: 'Madhya Pradesh', zone: 'Central', estimated_aqi: 242, governing_pollutant: 'PM10', cpcb_category: 'Very Poor' },
          { national_rank: 3, district: 'Korba', state: 'Chhattisgarh', zone: 'Central', estimated_aqi: 238, governing_pollutant: 'PM2.5', cpcb_category: 'Very Poor' },
          { national_rank: 4, district: 'Ghaziabad', state: 'Uttar Pradesh', zone: 'North', estimated_aqi: 235, governing_pollutant: 'PM2.5', cpcb_category: 'Very Poor' },
          { national_rank: 5, district: 'Faridabad', state: 'Haryana', zone: 'North', estimated_aqi: 228, governing_pollutant: 'PM2.5', cpcb_category: 'Very Poor' },
          { national_rank: 6, district: 'Dhanbad', state: 'Jharkhand', zone: 'East', estimated_aqi: 215, governing_pollutant: 'PM10', cpcb_category: 'Very Poor' },
          { national_rank: 7, district: 'Gurugram', state: 'Haryana', zone: 'North', estimated_aqi: 210, governing_pollutant: 'PM2.5', cpcb_category: 'Very Poor' },
          { national_rank: 8, district: 'Patna', state: 'Bihar', zone: 'East', estimated_aqi: 205, governing_pollutant: 'PM2.5', cpcb_category: 'Very Poor' },
        ],
        states: [
          { state: 'Delhi', average_aqi: 238, max_aqi: 265, primary_concern: 'Thermal Inversion' },
          { state: 'Haryana', average_aqi: 212, max_aqi: 228, primary_concern: 'Agricultural Stubble' },
          { state: 'Uttar Pradesh', average_aqi: 204, max_aqi: 235, primary_concern: 'Vehicular & Industrial' },
        ]
      }
    }));
    return;
  }

  if (url === '/api/air/states') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: {
        states: [
          { state: 'Delhi', average_aqi: 238, max_aqi: 265, primary_concern: 'Thermal Inversion' },
          { state: 'Haryana', average_aqi: 212, max_aqi: 228, primary_concern: 'Agricultural Stubble' },
          { state: 'Uttar Pradesh', average_aqi: 204, max_aqi: 235, primary_concern: 'Vehicular & Industrial' },
        ]
      }
    }));
    return;
  }

  if (url === '/api/location/assess') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: {
        location: {
          name: 'Delhi-NCR Airshed',
          is_delhi_ncr: true,
          latitude: 28.6139,
          longitude: 77.2090,
          validity: 'valid_training_region'
        },
        model_prediction: {
          pm25: 157.7,
          model_key: 'xgboost',
          cpcb_category: 'Severe',
          cpcb_color: '#DC2626'
        },
        reference_air_quality: {
          reference_pm25: 144.5,
          reference_label: 'Regional estimate (CAMS)',
          reference_source: 'Copernicus Atmosphere Monitoring Service (CAMS via Open-Meteo)',
          us_aqi: 198,
          status: 'available'
        },
        model_vs_reference_comparison: {
          delta: 13.2,
          delta_direction: 'higher',
          reference_label: 'Regional estimate (CAMS)'
        },
        early_warning: {
          success: true,
          reference_label: 'Regional estimate (CAMS)',
          banner: {
            has_warning: true,
            severity_level: 'Very Poor',
            trigger_pollutant: 'PM2.5',
            expected_start_time: '2026-11-25T02:00:00+05:30',
            formatted_start: '2026-11-25 at 02:00',
            duration_hours: 14,
            peak_concentration: 182.4,
            title: 'Early Air Quality Warning: Very Poor Conditions Forecast',
            message: 'Warning: PM2.5 is forecast to enter the Very Poor band starting around 02:00 (2026-11-25) with an estimated duration of 14 hours. Vulnerable individuals should avoid strenuous outdoor exertion and secure indoor air environments.',
            advisory: 'Advisory alert derived from CAMS atmospheric forecast modeling. Actions recommended under CAQM / CPCB protocols.'
          },
          hourly_series: [
            { time: '00:00', pm25: 85.0, pm10: 160.0, category: 'Moderate', is_warning: false, trigger: 'PM2.5' },
            { time: '02:00', pm25: 128.0, pm10: 240.0, category: 'Very Poor', is_warning: true, trigger: 'PM2.5' },
            { time: '04:00', pm25: 165.0, pm10: 310.0, category: 'Very Poor', is_warning: true, trigger: 'PM2.5' },
            { time: '06:00', pm25: 182.4, pm10: 340.0, category: 'Very Poor', is_warning: true, trigger: 'PM2.5' },
            { time: '08:00', pm25: 175.0, pm10: 320.0, category: 'Very Poor', is_warning: true, trigger: 'PM2.5' },
            { time: '12:00', pm25: 135.0, pm10: 250.0, category: 'Very Poor', is_warning: true, trigger: 'PM2.5' },
            { time: '16:00', pm25: 98.0, pm10: 190.0, category: 'Poor', is_warning: true, trigger: 'PM2.5' },
            { time: '20:00', pm25: 82.0, pm10: 155.0, category: 'Moderate', is_warning: false, trigger: 'PM2.5' },
          ]
        }
      }
    }));
    return;
  }

  if (url === '/api/air/interactions') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: {
        pollutants: ['PM2.5', 'PM10', 'NO2', 'SO2', 'CO', 'O3'],
        matrix: [
          [1.00, 0.88, 0.65, 0.42, 0.79, -0.38],
          [0.88, 1.00, 0.58, 0.39, 0.68, -0.31],
          [0.65, 0.58, 1.00, 0.51, 0.72, -0.52],
          [0.42, 0.39, 0.51, 1.00, 0.44, -0.18],
          [0.79, 0.68, 0.72, 0.44, 1.00, -0.44],
          [-0.38, -0.31, -0.52, -0.18, -0.44, 1.00]
        ],
        correlation_matrix: [
          [1.00, 0.88, 0.65, 0.42, 0.79, -0.38],
          [0.88, 1.00, 0.58, 0.39, 0.68, -0.31],
          [0.65, 0.58, 1.00, 0.51, 0.72, -0.52],
          [0.42, 0.39, 0.51, 1.00, 0.44, -0.18],
          [0.79, 0.68, 0.72, 0.44, 1.00, -0.44],
          [-0.38, -0.31, -0.52, -0.18, -0.44, 1.00]
        ],
        readings: [
          {
            title: 'Primary Combustion Source Coupling',
            pollutants: ['PM2.5', 'CO'],
            correlation: 0.79,
            relationship: 'Strong Positive',
            icon: 'Flame',
            color: '#EF4444',
            reading: 'PM2.5 and Carbon Monoxide (CO) show a strong positive correlation (r = +0.79). Incomplete fossil fuel and solid biomass burning co-emits both particulates and carbon monoxide.'
          },
          {
            title: 'Co-Elevation of Inhalable & Fine Fractions',
            pollutants: ['PM2.5', 'PM10'],
            correlation: 0.88,
            relationship: 'Very Strong Positive',
            icon: 'Layers',
            color: '#EF4444',
            reading: 'Fine particles (PM2.5) and coarse dust (PM10) track closely (r = +0.88). Atmospheric trapping under winter inversions concentrates all aerosol diameters concurrently.'
          },
          {
            title: 'Photochemical Titration & Depletion',
            pollutants: ['O3', 'NO2'],
            correlation: -0.52,
            relationship: 'Negative / Anti-correlated',
            icon: 'Sun',
            color: '#06B6D4',
            reading: 'Ozone (O3) and Nitrogen Dioxide (NO2) exhibit an inverse diurnal correlation (r = -0.52), illustrating photochemical titration (NO + O3 -> NO2 + O2).'
          },
          {
            title: 'Urban Vehicular Exhaust Signature',
            pollutants: ['NO2', 'CO'],
            correlation: 0.72,
            relationship: 'Strong Vehicle Alignment',
            icon: 'Car',
            color: '#EC4899',
            reading: 'NO2 and CO demonstrate a synchronized pattern (r = +0.72), peaking sharply during morning and evening rush hours as unambiguous traffic tracers.'
          }
        ],
        is_real_telemetry: true,
        sample_hours: 168
      }
    }));
    return;
  }

  if (url === '/api/air/relocation') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      origin: {
        name: 'Delhi',
        district: 'New Delhi',
        state: 'Delhi',
        current_aqi: 245,
        cpcb_category: 'Very Poor',
        governing_pollutant: 'PM2.5',
        personal_risk: { score: 78, level: 'High Risk', tailored_precautions: [] },
        coverage: { tier_label: 'Tier 1 Station-Validated', confidence_score: 95 }
      },
      candidates: []
    }));
    return;
  }

  res.writeHead(200);
  res.end(JSON.stringify({ status: 'success' }));
});

async function main() {
  await new Promise((resolve) => staticServer.listen(4176, '127.0.0.1', resolve));
  await new Promise((resolve) => apiServer.listen(5000, '127.0.0.1', resolve));

  console.log('Static server running on http://127.0.0.1:4176');
  console.log('Mock API server running on http://127.0.0.1:5000');

  let browser;
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
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
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Insights for Authorities Tab
    console.log('Capturing: Insights for Authorities tab...');
    await page.goto('http://127.0.0.1:4176/districts', { waitUntil: 'networkidle' });
    // Click on Authorities tab
    const authTabBtn = page.locator('button:has-text("Insights for Authorities")');
    if (await authTabBtn.count() > 0) {
      await authTabBtn.click();
      await page.waitForTimeout(1000);
    }
    const pathAuth = path.join(SCREENSHOT_DIR, 'districts_authorities.png');
    await page.screenshot({ path: pathAuth, fullPage: false });
    fs.copyFileSync(pathAuth, path.join(ARTIFACT_DIR, 'districts_authorities.png'));
    console.log('✓ Saved districts_authorities.png');

    // 2. Early Warning Banner
    console.log('Capturing: Early Warning Banner...');
    await page.goto('http://127.0.0.1:4176/live-assessment?lat=28.6139&lon=77.2090', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const pathEw = path.join(SCREENSHOT_DIR, 'early_warning_banner.png');
    await page.screenshot({ path: pathEw, fullPage: false });
    fs.copyFileSync(pathEw, path.join(ARTIFACT_DIR, 'early_warning_banner.png'));
    console.log('✓ Saved early_warning_banner.png');

    // 3. Pollutant Interactions Heatmap
    console.log('Capturing: Pollutant Interactions Heatmap...');
    const interactionHeading = page.locator('text=Pollutant Interactions & Atmospheric Coupling');
    if (await interactionHeading.count() > 0) {
      await interactionHeading.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
    } else {
      await page.evaluate(() => window.scrollBy(0, 1200));
      await page.waitForTimeout(1000);
    }
    const pathInteractions = path.join(SCREENSHOT_DIR, 'pollutant_interactions.png');
    await page.screenshot({ path: pathInteractions, fullPage: false });
    fs.copyFileSync(pathInteractions, path.join(ARTIFACT_DIR, 'pollutant_interactions.png'));
    console.log('✓ Saved pollutant_interactions.png');

    // 4. Prediction Page (In-Range Defaults)
    console.log('Capturing: Prediction Page with in-range defaults...');
    await page.goto('http://127.0.0.1:4176/prediction', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const pathPrediction = path.join(SCREENSHOT_DIR, 'prediction_page.png');
    await page.screenshot({ path: pathPrediction, fullPage: false });
    fs.copyFileSync(pathPrediction, path.join(ARTIFACT_DIR, 'prediction_page.png'));
    console.log('✓ Saved prediction_page.png');

    // 5. Relocation Advisor Origin Card
    console.log('Capturing: Relocation Advisor Origin Card...');
    await page.goto('http://127.0.0.1:4176/relocation', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const pathReloc = path.join(SCREENSHOT_DIR, 'relocation_origin_card.png');
    await page.screenshot({ path: pathReloc, fullPage: false });
    fs.copyFileSync(pathReloc, path.join(ARTIFACT_DIR, 'relocation_origin_card.png'));
    console.log('✓ Saved relocation_origin_card.png');

    console.log('🎉 All 5 verification screenshots successfully captured!');
  } finally {
    await browser.close();
    staticServer.close();
    apiServer.close();
  }
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
