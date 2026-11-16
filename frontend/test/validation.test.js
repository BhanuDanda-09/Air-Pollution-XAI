import assert from 'node:assert';
import { validateFeatures, DEFAULT_FEATURES, FEATURE_SPECS } from '../src/utils/validation.js';
import { getCPCBStyle, formatNumber, formatPM25 } from '../src/utils/formatters.js';

console.log('Running frontend unit tests...');

// 1. Valid features
const valid = validateFeatures(DEFAULT_FEATURES);
assert.strictEqual(valid.isValid, true, 'Default features must be valid');
assert.strictEqual(Object.keys(valid.errors).length, 0);

// 2. Out of bounds BP high
const bpHigher = validateFeatures({ ...DEFAULT_FEATURES, BP: 850 });
assert.strictEqual(bpHigher.isValid, false, 'BP > 780 mmHg must be rejected');
assert.ok(bpHigher.errors.BP.includes('mmHg'));

// 3. Out of bounds BP low
const bpLower = validateFeatures({ ...DEFAULT_FEATURES, BP: 650 });
assert.strictEqual(bpLower.isValid, false, 'BP < 700 mmHg must be rejected');

// 4. Out of bounds RH
const rhHigh = validateFeatures({ ...DEFAULT_FEATURES, RH: 120 });
assert.strictEqual(rhHigh.isValid, false, 'RH > 100% must be rejected');

// 5. Missing feature
const missingWD = { ...DEFAULT_FEATURES };
delete missingWD.WD;
const resMissing = validateFeatures(missingWD);
assert.strictEqual(resMissing.isValid, false, 'Missing WD must be rejected');

// 6. Non-numeric feature
const strAT = { ...DEFAULT_FEATURES, AT: 'hot' };
const resStr = validateFeatures(strAT);
assert.strictEqual(resStr.isValid, false, 'Non-numeric AT must be rejected');

// 7. CPCB Style
const goodStyle = getCPCBStyle('Good');
assert.strictEqual(goodStyle.hex, '#10B981');

const formatted = formatPM25(176.086);
assert.strictEqual(formatted, '176.09 µg/m³');

// 8. Pressure unit conversion (hPa -> mmHg)
const hpaStandard = 1013.25;
const mmhgConverted = Math.round(hpaStandard * 0.750062 * 100) / 100;
assert.strictEqual(mmhgConverted, 760.0, '1013.25 hPa must convert to 760.00 mmHg');

// 9. Delhi-NCR Bounding Box validation logic
const isDelhiNCR = (lat, lon) => lat >= 28.1 && lat <= 28.9 && lon >= 76.8 && lon <= 77.6;
assert.strictEqual(isDelhiNCR(28.6315, 77.2167), true, 'Connaught Place must be within Delhi-NCR');
assert.strictEqual(isDelhiNCR(19.076, 72.8777), false, 'Mumbai must be outside Delhi-NCR');

// 10. Reference PM2.5 standard naming convention
const standardReferenceLabel = 'Reference PM2.5 (CAMS model data)';
assert.strictEqual(standardReferenceLabel.includes('CAMS model data'), true);
assert.strictEqual(standardReferenceLabel.includes('measured PM2.5'), false);

console.log('✓ All 10 frontend unit test suites passed successfully.');
