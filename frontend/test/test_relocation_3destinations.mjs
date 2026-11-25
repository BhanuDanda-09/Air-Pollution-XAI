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

// 1. Static Asset Server (Port 4180)
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

// 2. Mock API Server (Port 5005)
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

  if (url === '/api/relocation/compare' && method === 'POST') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      origin: {
        name: 'Delhi',
        district: 'New Delhi',
        state: 'Delhi',
        lat: 28.6139,
        lon: 77.2090,
        current_aqi: 265,
        cpcb_category: 'Severe',
        cpcb_color: '#DC2626',
        governing_pollutant: 'PM2.5',
        personal_risk: {
          score: 84,
          tier: 'Severe Health Hazard',
          badge_color: '#DC2626',
        },
        coverage: {
          tier_label: 'Ground Station Monitored (Tier 1)',
          confidence_level: 'High',
        },
      },
      candidates: [
        {
          destination: { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
          current_aqi: 45,
          cpcb_category: 'Good',
          cpcb_color: '#16A34A',
          governing_pollutant: 'O3',
          personal_risk: { score: 32, tier: 'Moderate Exposure Risk', badge_color: '#F59E0B' },
          suitability: 'Suitable with precautions',
          suitability_color: '#F59E0B',
          display_verdict: 'Suitable with precautions',
          verdict: 'Suitable with precautions',
          verdict_color: '#F59E0B',
          numeric_reasons: [
            'Annual PM2.5 mean is 24.1 µg/m³ (meets your limit of 25 µg/m³)',
            'Ground-level ozone is the governing pollutant (48.0 µg/m³); midday solar peaks require timing precautions',
            'Relocating shifts your personal exposure index from 84/100 to 32/100 (-52 points)',
          ],
          place_precautions: [
            {
              id: 'bengaluru_o3_timing',
              category: 'Every day',
              trigger: 'Governing pollutant in Bengaluru is Ozone (48.0 µg/m³)',
              text: 'Governing pollutant in Bengaluru is ground-level ozone (48.0 µg/m³). Avoid vigorous outdoor cardio and sports between 12:00 PM and 5:00 PM when solar radiation peaks; schedule workouts during optimal window around 10:00 AM – 12:00 PM.',
              priority: 'High',
              source: 'CPCB Health Advisory & WHO Air Quality Guidelines (General advisory)',
            },
            {
              id: 'bengaluru_seasonal_clean',
              category: 'Seasonal (April)',
              trigger: 'Low seasonal inversion (1.35×) in Bengaluru',
              text: 'Bengaluru experiences steady year-round ventilation with minimal winter stagnation (1.35×). Cleanest ambient air occurs in April (20.3 µg/m³).',
              priority: 'Low',
              source: 'City Climatology Records (General advisory)',
            },
            {
              id: 'bengaluru_aqi_threshold',
              category: 'When AQI exceeds 100 at this place',
              trigger: 'Personal health vulnerability threshold for Bengaluru',
              text: 'When AQI in Bengaluru crosses 100 (Moderate), activate True HEPA bedroom filtration, close external windows during inversion hours, and wear an airtight N95 respirator during outdoor transit.',
              priority: 'High',
              source: 'CPCB Health Advisory Protocol (General advisory)',
            },
            {
              id: 'bengaluru_weather_cold_elevation',
              category: 'Weather-related',
              trigger: 'Elevation 910 m and ambient temperature 22.0°C in Bengaluru',
              text: 'Elevation of 910 m and cool morning air (22.0°C) can trigger bronchospasm in reactive airways. Warm up indoors for 10 minutes and cover nose and mouth with a loose scarf or mask to pre-warm inhaled air.',
              priority: 'Medium',
              source: 'American Thoracic Society Clinical Exercise Guidance (General advisory)',
            },
            {
              id: 'bengaluru_move_precautions',
              category: 'If you move here',
              trigger: 'Seasonal particulate surge in Bengaluru requires localized management',
              text: 'Relocating to Bengaluru improves baseline exposure, but requires seasonal precautions between January and adjacent winter months when PM2.5 averages 27.4 µg/m³. Ensure bedrooms are equipped with certified True HEPA filtration before winter.',
              priority: 'Medium',
              source: 'Health-based Relocation Assessment (General advisory)',
            },
          ],
          best_time_today: {
            window: '10:00 AM – 12:00 PM',
            hour: '11:00',
            pm25: 32.0,
            o3: 48.0,
            guidance: 'Optimal outdoor activity window in Bengaluru during morning dispersion hours before midday ozone photochemical build-up.',
          },
          best_month_to_move: {
            month: 4,
            month_name: 'April',
            mean_pm25: 20.3,
            worst_month_name: 'January',
            worst_mean_pm25: 27.4,
            annual_mean_pm25: 24.1,
            monthly_pm25: [
              { month: 1, month_name: 'Jan', mean_pm25: 27.4 },
              { month: 2, month_name: 'Feb', mean_pm25: 25.1 },
              { month: 3, month_name: 'Mar', mean_pm25: 22.8 },
              { month: 4, month_name: 'Apr', mean_pm25: 20.3 },
              { month: 5, month_name: 'May', mean_pm25: 21.5 },
              { month: 6, month_name: 'Jun', mean_pm25: 22.0 },
              { month: 7, month_name: 'Jul', mean_pm25: 23.4 },
              { month: 8, month_name: 'Aug', mean_pm25: 24.0 },
              { month: 9, month_name: 'Sep', mean_pm25: 22.5 },
              { month: 10, month_name: 'Oct', mean_pm25: 25.0 },
              { month: 11, month_name: 'Nov', mean_pm25: 26.8 },
              { month: 12, month_name: 'Dec', mean_pm25: 27.0 },
            ],
          },
          exposure_diff_points: 52,
          aqi_reduction_pct: 83.0,
          explanation_narrative: 'Relocating from Delhi to Bengaluru lowers personal exposure index by 52 points (from 84/100 to 32/100, AQI 265 → 45). For your respiratory profile, escaping heavy chronic aerosol exposure helps lower airway hyper-responsiveness.',
          climatology: {
            winter_inversion_factor: 1.35,
          },
          coverage: {
            tier_label: 'Ground Station Monitored (Tier 1)',
            confidence_level: 'High',
          },
        },
        {
          destination: { name: 'Kochi', lat: 9.9312, lon: 76.2673 },
          current_aqi: 28,
          cpcb_category: 'Good',
          cpcb_color: '#16A34A',
          governing_pollutant: 'PM2.5',
          personal_risk: { score: 20, tier: 'Low Exposure Risk', badge_color: '#10B981' },
          suitability: 'Suitable',
          suitability_color: '#10B981',
          display_verdict: 'Suitable',
          verdict: 'Suitable',
          verdict_color: '#10B981',
          numeric_reasons: [
            'Annual PM2.5 mean is 16.2 µg/m³ (well within your limit of 25 µg/m³)',
            'Minimal winter stagnation factor (1.15×) ensures year-round clean air baseline',
            'Relocating shifts your personal exposure index from 84/100 to 20/100 (-64 points)',
          ],
          place_precautions: [
            {
              id: 'kochi_daily_timing',
              category: 'Every day',
              trigger: 'Governing pollutant in Kochi is PM2.5 (current PM2.5: 18.0 µg/m³)',
              text: 'Optimal outdoor exercise window today in Kochi is around 06:00 AM – 09:00 AM, when fresh marine ventilation provides pristine breathable air.',
              priority: 'Low',
              source: 'CPCB Diurnal Exposure Recommendations (General advisory)',
            },
            {
              id: 'kochi_weather_humidity',
              category: 'Weather-related',
              trigger: 'High ambient relative humidity (78%) in Kochi',
              text: 'High ambient humidity (78%) in Kochi promotes indoor mould spore propagation and dust mites. For asthma and allergy profiles, maintain indoor relative humidity below 50–55% using dehumidification.',
              priority: 'High',
              source: 'GINA Global Strategy for Asthma Management (General advisory)',
            },
            {
              id: 'kochi_move_suitable',
              category: 'If you move here',
              trigger: 'Kochi meets your annual health exposure baseline',
              text: 'Kochi offers a favorable annual air baseline (16.2 µg/m³ vs your 25 µg/m³ limit). Long-term maintenance requires monitoring AQI only during peak winter months (January), with standard natural home ventilation during daytime.',
              priority: 'Low',
              source: 'Health-based Relocation Assessment (General advisory)',
            },
          ],
          best_time_today: {
            window: '06:00 AM – 09:00 AM',
            hour: '07:00',
            pm25: 18.0,
            o3: 20.0,
            guidance: 'Favorable coastal atmospheric dispersion provides clean air during morning hours.',
          },
          best_month_to_move: {
            month: 7,
            month_name: 'July',
            mean_pm25: 12.0,
            worst_month_name: 'January',
            worst_mean_pm25: 22.0,
            annual_mean_pm25: 16.2,
            monthly_pm25: [
              { month: 1, month_name: 'Jan', mean_pm25: 22.0 },
              { month: 2, month_name: 'Feb', mean_pm25: 20.0 },
              { month: 3, month_name: 'Mar', mean_pm25: 18.0 },
              { month: 4, month_name: 'Apr', mean_pm25: 16.0 },
              { month: 5, month_name: 'May', mean_pm25: 14.0 },
              { month: 6, month_name: 'Jun', mean_pm25: 13.0 },
              { month: 7, month_name: 'Jul', mean_pm25: 12.0 },
              { month: 8, month_name: 'Aug', mean_pm25: 13.5 },
              { month: 9, month_name: 'Sep', mean_pm25: 14.2 },
              { month: 10, month_name: 'Oct', mean_pm25: 16.5 },
              { month: 11, month_name: 'Nov', mean_pm25: 18.0 },
              { month: 12, month_name: 'Dec', mean_pm25: 21.0 },
            ],
          },
          exposure_diff_points: 64,
          aqi_reduction_pct: 89.4,
          explanation_narrative: 'Relocating from Delhi to Kochi substantially lowers personal exposure index by 64 points (from 84/100 to 20/100, AQI 265 → 28). Baseline environmental exposure remains consistently favorable.',
          climatology: {
            winter_inversion_factor: 1.15,
          },
          coverage: {
            tier_label: 'Ground Station Monitored (Tier 1)',
            confidence_level: 'High',
          },
        },
        {
          destination: { name: 'Agra', lat: 27.1767, lon: 78.0081 },
          current_aqi: 235,
          cpcb_category: 'Very Poor',
          cpcb_color: '#EF4444',
          governing_pollutant: 'PM2.5',
          personal_risk: { score: 78, tier: 'Severe Health Hazard', badge_color: '#EF4444' },
          suitability: 'Not recommended',
          suitability_color: '#EF4444',
          display_verdict: 'Not recommended',
          verdict: 'Not recommended',
          verdict_color: '#EF4444',
          numeric_reasons: [
            'Annual PM2.5 mean is 78.4 µg/m³ (greatly exceeds your limit of 25 µg/m³)',
            'Severe winter inversion factor of 2.65× causes prolonged winter air trapping',
            'Minimal exposure shift (84/100 to 78/100, -6 points only); high health hazard remains',
          ],
          place_precautions: [
            {
              id: 'agra_seasonal_inversion',
              category: 'Seasonal (January & Winter)',
              trigger: 'Winter inversion factor is 2.65× in Agra (peak month: January)',
              text: 'Thermal inversion factor reaches 2.65× during January with PM2.5 averaging 112.0 µg/m³. Avoid early-morning outdoor exertion (6:00–9:00 AM) during winter when cold nocturnal air traps ground pollutants; move aerobic exercise to afternoon hours.',
              priority: 'High',
              source: 'IMD Stagnation & CPCB Winter Advisory Protocols (General advisory)',
            },
            {
              id: 'agra_aqi_threshold',
              category: 'When AQI exceeds 100 at this place',
              trigger: 'Personal health vulnerability threshold for Agra',
              text: 'When AQI in Agra crosses 100 (Moderate), activate True HEPA bedroom filtration, close external windows during inversion hours, and wear an airtight N95 respirator during outdoor transit.',
              priority: 'High',
              source: 'CPCB Health Advisory Protocol (General advisory)',
            },
            {
              id: 'agra_move_not_recommended',
              category: 'If you move here',
              trigger: 'Agra fails annual health exposure threshold',
              text: 'Agra does not offer a significant clean-air benefit (annual PM2.5 78.4 µg/m³ vs your limit 25 µg/m³). Relocation is not recommended for individuals with respiratory conditions.',
              priority: 'High',
              source: 'Health-based Relocation Assessment (General advisory)',
            },
          ],
          best_time_today: {
            window: '01:00 PM – 03:00 PM',
            hour: '14:00',
            pm25: 145.0,
            o3: 42.0,
            guidance: 'Mid-afternoon solar heating provides partial vertical dispersion before nocturnal surface inversion traps pollutants.',
          },
          best_month_to_move: {
            month: 7,
            month_name: 'July',
            mean_pm25: 38.0,
            worst_month_name: 'January',
            worst_mean_pm25: 112.0,
            annual_mean_pm25: 78.4,
            monthly_pm25: [
              { month: 1, month_name: 'Jan', mean_pm25: 112.0 },
              { month: 2, month_name: 'Feb', mean_pm25: 95.0 },
              { month: 3, month_name: 'Mar', mean_pm25: 78.0 },
              { month: 4, month_name: 'Apr', mean_pm25: 65.0 },
              { month: 5, month_name: 'May', mean_pm25: 60.0 },
              { month: 6, month_name: 'Jun', mean_pm25: 52.0 },
              { month: 7, month_name: 'Jul', mean_pm25: 38.0 },
              { month: 8, month_name: 'Aug', mean_pm25: 41.0 },
              { month: 9, month_name: 'Sep', mean_pm25: 48.0 },
              { month: 10, month_name: 'Oct', mean_pm25: 82.0 },
              { month: 11, month_name: 'Nov', mean_pm25: 105.0 },
              { month: 12, month_name: 'Dec', mean_pm25: 110.0 },
            ],
          },
          exposure_diff_points: 6,
          aqi_reduction_pct: 11.3,
          explanation_narrative: 'Relocating from Delhi to Agra only reduces personal exposure index by 6 points (from 84/100 to 78/100, AQI 265 → 235). High particulate burden in this destination maintains elevated airway inflammation.',
          climatology: {
            winter_inversion_factor: 2.65,
          },
          coverage: {
            tier_label: 'Ground Station Monitored (Tier 1)',
            confidence_level: 'High',
          },
        },
      ],
    }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

async function run() {
  await new Promise((res) => staticServer.listen(4180, res));
  await new Promise((res) => apiServer.listen(5005, res));
  console.log('Static server on :4180, mock API on :5005');

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

  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();

  // Intercept any API requests to /api/relocation/compare or /api/... and forward to :5005
  await page.route('**/api/relocation/compare', async (route) => {
    const postData = route.request().postData();
    const resp = await fetch('http://127.0.0.1:5005/api/relocation/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: postData,
    });
    const json = await resp.json();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(json),
    });
  });

  try {
    console.log('Navigating to Relocation Advisor page...');
    await page.goto('http://127.0.0.1:4180/relocation', { waitUntil: 'networkidle' });

    // Step 1: Click '+ Bengaluru' if not already added, ensure 3 destinations
    // Presets on page include Bengaluru, Pune by default. Let's add Kochi.
    const addKochi = page.locator('button:has-text("+ Kochi")');
    if (await addKochi.count() > 0) {
      await addKochi.click();
      console.log('Added Kochi destination');
    }

    // Click 'Continue to Health Profile'
    await page.click('button:has-text("Continue to Health Profile")');
    await page.waitForTimeout(500);

    // Step 2: Ensure Asthma is selected, click 'Continue to Household & Consent'
    await page.click('button:has-text("Continue to Household & Consent")');
    await page.waitForTimeout(500);

    // Step 3: Consent checkbox is checked by default. Click 'Generate Relocation Decision Report'
    console.log('Generating report...');
    await page.click('button:has-text("Generate Relocation Decision Report")');

    // Wait for Report grid to appear
    await page.waitForSelector('text=Health-based Relocation Assessment', { timeout: 10000 });
    console.log('✓ Decision report rendered successfully');

    // Assert Suitability Badges
    const suitableBadge = page.locator('text=Suitable').first();
    const suitablePrecautionsBadge = page.locator('text=Suitable with precautions').first();
    const notRecommendedBadge = page.locator('text=Not recommended').first();

    if (await suitableBadge.count() === 0) throw new Error('Suitable badge missing');
    if (await suitablePrecautionsBadge.count() === 0) throw new Error('Suitable with precautions badge missing');
    if (await notRecommendedBadge.count() === 0) throw new Error('Not recommended badge missing');
    console.log('✓ All 3 suitability badges verified');

    // Assert Distinct Precaution Sets & No Generic Template Repetition
    const ozonePrecaution = page.locator('text=ground-level ozone');
    const humidityPrecaution = page.locator('text=mould spore propagation');
    const inversionPrecaution = page.locator('text=Thermal inversion factor');

    if (await ozonePrecaution.count() === 0) throw new Error('Bengaluru Ozone precaution missing');
    if (await humidityPrecaution.count() === 0) throw new Error('Kochi humidity mould precaution missing');
    if (await inversionPrecaution.count() === 0) throw new Error('Agra winter inversion precaution missing');
    console.log('✓ Distinct, non-templated place precautions verified across all 3 destinations');

    // Assert Best Time to Go Out Today
    const bestTimeHeading = page.locator('text=Best Time to Go Out Today');
    const bestTimeCount = await bestTimeHeading.count();
    if (bestTimeCount < 3) throw new Error(`Expected at least 3 Best Time blocks, got ${bestTimeCount}`);
    console.log('✓ Dynamic Best Time to Go Out Today verified across cards');

    // Assert 12-Month Climatology Mini Chart
    const chartHeading = page.locator('text=12-Month PM2.5 Climatology');
    const chartCount = await chartHeading.count();
    if (chartCount < 3) throw new Error(`Expected at least 3 Climatology charts, got ${chartCount}`);
    console.log('✓ 12-Month Climatology mini bar charts verified across cards');

    // Assert Legal Disclaimer
    const legalNotice = page.locator('text=Advisory only, not medical advice. Follow your doctor\'s asthma/health action plan.');
    if (await legalNotice.count() === 0) throw new Error('Statutory health disclaimer missing');
    console.log('✓ Statutory advisory & medical disclaimer verified');

    // Capture Verification Screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, 'relocation_destinations_after_fix.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    fs.copyFileSync(screenshotPath, path.join(ARTIFACT_DIR, 'relocation_destinations_after_fix.png'));
    console.log(`✓ Saved screenshot to ${screenshotPath}`);

    console.log('🎉 ALL PLAYWRIGHT 3-DESTINATION ASSERTIONS PASSED!');
  } finally {
    await browser.close();
    staticServer.close();
    apiServer.close();
  }
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
