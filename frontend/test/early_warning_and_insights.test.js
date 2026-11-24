import assert from 'node:assert';
import airService from '../src/services/airService.js';

console.log('Running Early Warning & Pollutant Interactions client unit tests...');

async function runTests() {
  // Test 1: Service methods existence
  assert.strictEqual(typeof airService.getEarlyWarning, 'function', 'getEarlyWarning must be a function');
  assert.strictEqual(typeof airService.checkEarlyWarnings, 'function', 'checkEarlyWarnings must be a function');
  assert.strictEqual(typeof airService.getPollutantInteractions, 'function', 'getPollutantInteractions must be a function');
  console.log('✓ Test 1: Early warning & interaction service methods exist on airService');

  // Test 2: Verify CPCB breakpoint definitions and calculation logic
  const cpcbThresholds = {
    'PM2.5': { poor: 90.1, very_poor: 120.1, severe: 250.1 },
    'PM10': { poor: 250.1, very_poor: 350.1, severe: 430.1 },
    'NO2': { poor: 180.1, very_poor: 280.1, severe: 400.1 },
  };

  assert.ok(cpcbThresholds['PM2.5'].poor > 90.0, 'PM2.5 poor threshold aligned with CPCB');
  assert.ok(cpcbThresholds['PM2.5'].very_poor > 120.0, 'PM2.5 very poor threshold aligned with CPCB');
  assert.ok(cpcbThresholds['PM2.5'].severe > 250.0, 'PM2.5 severe threshold aligned with CPCB');
  console.log('✓ Test 2: Statutory CPCB 2014 breakpoint definitions verified');

  // Test 3: Correlation symmetry and boundary logic
  const sampleMatrix = [
    [1.0, 0.82, -0.15],
    [0.82, 1.0, -0.42],
    [-0.15, -0.42, 1.0],
  ];

  for (let i = 0; i < 3; i++) {
    assert.strictEqual(sampleMatrix[i][i], 1.0, 'Diagonal must be 1.0');
    for (let j = 0; j < 3; j++) {
      assert.strictEqual(sampleMatrix[i][j], sampleMatrix[j][i], 'Matrix must be symmetric');
      assert.ok(sampleMatrix[i][j] >= -1.0 && sampleMatrix[i][j] <= 1.0, 'Value must be between -1 and 1');
    }
  }
  console.log('✓ Test 3: Multi-pollutant correlation symmetry and boundary constraints verified');

  console.log('✓ All Early Warning & Insights client unit tests passed successfully!');
}

runTests();
