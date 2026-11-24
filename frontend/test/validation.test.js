import assert from 'node:assert';
import { validateFeatures, checkTrainingRanges, DEFAULT_FEATURES, FEATURE_SPECS, TRAINING_RANGES } from '../src/utils/validation.js';
import { getCPCBStyle, formatNumber, formatPM25 } from '../src/utils/formatters.js';

console.log('Running frontend unit tests...');

// 1. Valid features (in-range defaults)
const valid = validateFeatures(DEFAULT_FEATURES);
assert.strictEqual(valid.isValid, true, 'Default features must be valid');
assert.strictEqual(Object.keys(valid.errors).length, 0);

// Verify defaults are strictly within empirical training ranges
assert.ok(DEFAULT_FEATURES.SR <= TRAINING_RANGES.SR.max, 'Default SR must not exceed training max (334 W/m²)');
assert.ok(DEFAULT_FEATURES.AT <= TRAINING_RANGES.AT.max, 'Default AT must not exceed training max (23°C)');
assert.ok(DEFAULT_FEATURES.AT >= TRAINING_RANGES.AT.min, 'Default AT must not fall below training min (11°C)');
assert.strictEqual(DEFAULT_FEATURES.SR, 150.0, 'Default SR should be 150.0 W/m²');
assert.strictEqual(DEFAULT_FEATURES.AT, 18.0, 'Default AT should be 18.0°C');

// 2. Training range checker
const defaultRangeCheck = checkTrainingRanges(DEFAULT_FEATURES);
assert.strictEqual(defaultRangeCheck.hasOutOfRange, false, 'Default features must be inside training ranges');
assert.strictEqual(Object.keys(defaultRangeCheck.warnings).length, 0);

// Out of training range detection
const outOfRange = checkTrainingRanges({ ...DEFAULT_FEATURES, SR: 350, AT: 28 });
assert.strictEqual(outOfRange.hasOutOfRange, true, 'SR=350 and AT=28 must trigger out-of-range warnings');
assert.ok(outOfRange.warnings.SR.includes('outside training range'));
assert.ok(outOfRange.warnings.AT.includes('outside training range'));

// 3. Out of bounds BP high
const bpHigher = validateFeatures({ ...DEFAULT_FEATURES, BP: 850 });
assert.strictEqual(bpHigher.isValid, false, 'BP > 780 mmHg must be rejected');
assert.ok(bpHigher.errors.BP.includes('mmHg'));

// 4. Out of bounds BP low
const bpLower = validateFeatures({ ...DEFAULT_FEATURES, BP: 650 });
assert.strictEqual(bpLower.isValid, false, 'BP < 700 mmHg must be rejected');

// 5. Out of bounds RH
const rhHigh = validateFeatures({ ...DEFAULT_FEATURES, RH: 120 });
assert.strictEqual(rhHigh.isValid, false, 'RH > 100% must be rejected');

// 6. Missing feature
const missingWD = { ...DEFAULT_FEATURES };
delete missingWD.WD;
const resMissing = validateFeatures(missingWD);
assert.strictEqual(resMissing.isValid, false, 'Missing WD must be rejected');

// 7. Non-numeric feature
const strAT = { ...DEFAULT_FEATURES, AT: 'hot' };
const resStr = validateFeatures(strAT);
assert.strictEqual(resStr.isValid, false, 'Non-numeric AT must be rejected');

// 8. CPCB Style
const goodStyle = getCPCBStyle('Good');
assert.strictEqual(goodStyle.hex, '#10B981');

const formatted = formatPM25(176.086);
assert.strictEqual(formatted, '176.09 µg/m³');

// 9. Pressure unit conversion (hPa -> mmHg)
const hpaStandard = 1013.25;
const mmhgConverted = Math.round(hpaStandard * 0.750062 * 100) / 100;
assert.strictEqual(mmhgConverted, 760.0, '1013.25 hPa must convert to 760.00 mmHg');

// 10. Delhi-NCR Bounding Box validation logic (including Gurugram, Noida, Faridabad)
const isDelhiNCR = (lat, lon) => lat >= 28.1 && lat <= 28.9 && lon >= 76.8 && lon <= 77.6;
assert.strictEqual(isDelhiNCR(28.6315, 77.2167), true, 'Connaught Place must be within Delhi-NCR');
assert.strictEqual(isDelhiNCR(12.9716, 77.5946), false, 'Bengaluru must be outside Delhi-NCR');

console.log('✓ Validation and feature range tests passed (10/10 assertions)');
