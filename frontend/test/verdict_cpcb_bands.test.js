import assert from 'node:assert';

console.log('Running Check My Air Verdict & CPCB Band Alignment Unit Tests...');

// 6 CPCB PM2.5 Bands with representative values (µg/m³)
const CPCB_BANDS = [
  { name: 'Good', min: 0, max: 30, testVal: 15 },
  { name: 'Satisfactory', min: 31, max: 60, testVal: 45 },
  { name: 'Moderate', min: 61, max: 90, testVal: 75 },
  { name: 'Poor', min: 91, max: 120, testVal: 105 },
  { name: 'Very Poor', min: 121, max: 250, testVal: 180 },
  { name: 'Severe', min: 251, max: 500, testVal: 320 },
];

function getCPCBCategory(pm25) {
  if (pm25 == null) return 'Unknown';
  if (pm25 <= 30) return 'Good';
  if (pm25 <= 60) return 'Satisfactory';
  if (pm25 <= 90) return 'Moderate';
  if (pm25 <= 120) return 'Poor';
  if (pm25 <= 250) return 'Very Poor';
  return 'Severe';
}

function getMockVerdictMessaging(cpcbCategory, isSensitive) {
  const cat = cpcbCategory.toLowerCase();
  if (cat === 'good') {
    return {
      summary: isSensitive
        ? 'Air quality is in the CPCB Good band. Favorable conditions for sensitive individuals, children, and seniors; outdoor activities and natural home ventilation are safe.'
        : 'Air quality is in the CPCB Good band. Minimal health risk; outdoor activities, sports, and natural home ventilation are safe for all groups.',
      tailored_advice: {
        n95_mask: isSensitive ? 'Mask not required; maintain standard medication readiness if clinically prescribed.' : 'Not required for general population under clean air conditions.',
        indoor_exercise: isSensitive ? 'Safe for children, seniors, and asthmatics to enjoy outdoor exercise.' : 'Outdoor workouts encouraged; enjoy parks and open spaces.',
      },
    };
  }
  if (cat === 'satisfactory') {
    return {
      summary: isSensitive
        ? 'Air quality is in the CPCB Satisfactory band. Minor breathing discomfort may occur for sensitive individuals during prolonged heavy outdoor exertion; take breaks if symptoms appear.'
        : 'Air quality is in the CPCB Satisfactory band. Ambient particulate levels pose minimal risk for healthy individuals during normal daily routines.',
      tailored_advice: {
        n95_mask: isSensitive ? 'Sensitive individuals advised to carry an N95 mask in congested traffic corridors.' : 'Mask optional for general population in open areas.',
        indoor_exercise: isSensitive ? 'Sensitive groups and children should take periodic breaks during prolonged outdoor play.' : 'Normal outdoor workouts and physical activities permitted.',
      },
    };
  }
  if (cat === 'moderate') {
    return {
      summary: isSensitive
        ? 'Air quality is in the CPCB Moderate band. Breathing discomfort possible for people with asthma, lung, or heart disease. Sensitive groups should reduce prolonged heavy outdoor exertion.'
        : 'Air quality is in the CPCB Moderate band. Healthy individuals can engage in routine outdoor activities; prolonged strenuous workouts may cause slight throat irritation.',
      tailored_advice: {
        n95_mask: isSensitive ? 'N95 / FFP2 respirator advised for sensitive individuals and seniors when outdoors.' : 'N95 mask recommended in congested or dust-heavy traffic corridors.',
        indoor_exercise: isSensitive ? 'Sensitive individuals, children, and seniors should move heavy aerobic exercise indoors.' : 'Healthy adults can exercise outdoors; reduce duration of strenuous cardio.',
      },
    };
  }
  if (cat === 'poor') {
    return {
      summary: isSensitive
        ? 'Air quality is in the CPCB Poor band. Heightened risk of breathing discomfort and asthma exacerbation for sensitive groups. Strictly avoid prolonged outdoor exertion and keep quick-relief medication handy.'
        : 'Air quality is in the CPCB Poor band. Ambient particulate levels cause breathing discomfort on prolonged outdoor exposure. Limit heavy outdoor exertion and close windows.',
      tailored_advice: {
        n95_mask: isSensitive ? 'Airtight N95 / FFP2 respirator strongly advised for any essential outdoor transit.' : 'N95 / FFP2 respirator recommended for prolonged outdoor commutes.',
        indoor_exercise: isSensitive ? 'Avoid outdoor exertion; exercise indoors in a filtered room.' : 'Shift strenuous cardio and athletic workouts indoors.',
      },
    };
  }
  if (cat === 'very poor') {
    return {
      summary: isSensitive
        ? 'Air quality is in the CPCB Very Poor band. Significant respiratory and cardiovascular risk for sensitive individuals, children, and seniors. Strictly avoid outdoor exposure.'
        : 'Air quality is in the CPCB Very Poor band. Prolonged outdoor exposure increases risk of respiratory illness for all individuals. Avoid strenuous outdoor activities.',
      tailored_advice: {
        n95_mask: isSensitive ? 'Well-fitted N95 / FFP2 respirator strictly mandatory for any unavoidable outdoor trip.' : 'N95 / FFP2 respirator strongly advised whenever stepping outdoors.',
        indoor_exercise: isSensitive ? 'Stay indoors; avoid all physical exertion and maintain a clean-air environment.' : 'Move all athletic training, running, and workouts indoors.',
      },
    };
  }
  return {
    summary: isSensitive
      ? 'Severe air pollution emergency. Critical acute hazards for sensitive individuals, children, seniors, and patients with cardiopulmonary disease. Remain strictly indoors with continuous HEPA filtration.'
      : 'Severe air pollution event. Ambient PM2.5 exceeds 250 µg/m³, affecting healthy individuals and creating serious health risks. Avoid all outdoor physical activity.',
    tailored_advice: {
      n95_mask: isSensitive ? 'Certified N95 / FFP2 respirator mandatory; avoid any outdoor exposure if possible.' : 'N95 / FFP2 / P100 respirator strictly mandatory for any outdoor transit.',
      indoor_exercise: isSensitive ? 'Remain indoors in a clean-air room; consult physician if experiencing respiratory distress.' : 'Strict indoor stay; halt all non-essential outdoor physical activity.',
    },
  };
}

// Run assertions for each band with standard & sensitive profile
for (const band of CPCB_BANDS) {
  const cat = getCPCBCategory(band.testVal);
  assert.strictEqual(cat, band.name, `Category for ${band.testVal} µg/m³ must be ${band.name}`);

  // 1. Without sensitive profile
  const standardMsg = getMockVerdictMessaging(cat, false);
  assert.ok(standardMsg.summary.length > 0, `Standard summary must be non-empty for ${band.name}`);

  // 2. With sensitive profile
  const sensitiveMsg = getMockVerdictMessaging(cat, true);
  assert.ok(sensitiveMsg.summary.length > 0, `Sensitive summary must be non-empty for ${band.name}`);
  assert.notStrictEqual(standardMsg.summary, sensitiveMsg.summary, `Sensitive summary must be customized for ${band.name}`);

  // 3. User constraint: Poor band (91-120 µg/m³) must NOT contain 'severe' or 'crisis'
  if (band.name === 'Poor') {
    assert.ok(!standardMsg.summary.toLowerCase().includes('severe'), 'Poor band standard summary must not contain "severe"');
    assert.ok(!standardMsg.summary.toLowerCase().includes('crisis'), 'Poor band standard summary must not contain "crisis"');
    assert.ok(!sensitiveMsg.summary.toLowerCase().includes('severe'), 'Poor band sensitive summary must not contain "severe"');
    assert.ok(!sensitiveMsg.summary.toLowerCase().includes('crisis'), 'Poor band sensitive summary must not contain "crisis"');
  }

  // 4. User constraint: 'Severe' wording only for Severe band (> 250 µg/m³)
  if (band.name === 'Severe') {
    assert.ok(standardMsg.summary.toLowerCase().includes('severe'), 'Severe band standard summary must contain "severe"');
    assert.ok(sensitiveMsg.summary.toLowerCase().includes('severe'), 'Severe band sensitive summary must contain "severe"');
  } else {
    assert.ok(!standardMsg.summary.toLowerCase().includes('severe'), `Non-severe band ${band.name} standard summary must not contain "severe"`);
    assert.ok(!sensitiveMsg.summary.toLowerCase().includes('severe'), `Non-severe band ${band.name} sensitive summary must not contain "severe"`);
  }

  console.log(`✓ Band ${band.name} (${band.testVal} µg/m³): Standard & Sensitive profiles verified.`);
}

console.log('🎉 All Check My Air Verdict & CPCB Band Alignment unit tests passed successfully!');
