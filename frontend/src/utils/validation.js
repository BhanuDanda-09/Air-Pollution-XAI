/**
 * Meteorological Feature Bounds and Validation Rules
 * Must match the Flask backend configuration strictly.
 * Note: BP is strictly calibrated in mmHg (not hPa).
 */
export const FEATURE_SPECS = {
  RH: {
    name: 'Relative Humidity',
    unit: '%',
    min: 0.0,
    max: 100.0,
    step: 0.1,
    default: 60.0,
    description: 'Atmospheric moisture saturation ratio (0–100%)',
  },
  WD: {
    name: 'Wind Direction',
    unit: 'degrees',
    min: 0.0,
    max: 360.0,
    step: 1.0,
    default: 180.0,
    description: 'Compass angle of surface wind origin (0°–360°)',
  },
  SR: {
    name: 'Solar Radiation',
    unit: 'W/m²',
    min: 0.0,
    max: 1500.0,
    step: 1.0,
    default: 150.0,
    description: 'Incident solar irradiance (0–1500 W/m²)',
  },
  BP: {
    name: 'Barometric Pressure',
    unit: 'mmHg',
    min: 700.0,
    max: 780.0,
    step: 0.1,
    default: 738.0,
    description: 'Atmospheric pressure in mmHg (verified dataset unit; 700–780 mmHg)',
  },
  AT: {
    name: 'Air Temperature',
    unit: '°C',
    min: -20.0,
    max: 60.0,
    step: 0.1,
    default: 18.0,
    description: 'Dry-bulb ambient air temperature (-20°C to 60°C)',
  },
};

/**
 * Empirical training ranges from the clean Delhi dataset (2,027 hourly samples).
 * In-range inputs receive reliable interpolation; out-of-range inputs warn of extrapolation.
 */
export const TRAINING_RANGES = {
  RH: { min: 36.0, max: 95.0, unit: '%' },
  WD: { min: 7.0, max: 332.0, unit: '°' },
  SR: { min: 2.0, max: 334.0, unit: 'W/m²' },
  BP: { min: 726.0, max: 749.0, unit: 'mmHg' },
  AT: { min: 11.0, max: 23.0, unit: '°C' },
};

/**
 * Valid in-range defaults strictly inside empirical training bounds:
 * RH: 60.0% (range 36–95), WD: 180.0° (range 7–332), SR: 150.0 W/m² (range 2–334),
 * BP: 738.0 mmHg (range 726–749), AT: 18.0°C (range 11–23).
 */
export const DEFAULT_FEATURES = {
  RH: 60.0,
  WD: 180.0,
  SR: 150.0,
  BP: 738.0,
  AT: 18.0,
};

/**
 * Validate input features against physical limits
 * @param {Record<string, number|string>} features
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateFeatures(features) {
  const errors = {};

  Object.entries(FEATURE_SPECS).forEach(([key, spec]) => {
    const rawVal = features[key];

    if (rawVal === undefined || rawVal === null || rawVal === '') {
      errors[key] = `${spec.name} is required.`;
      return;
    }

    const numVal = Number(rawVal);
    if (isNaN(numVal)) {
      errors[key] = `${spec.name} must be a valid number.`;
      return;
    }

    if (numVal < spec.min || numVal > spec.max) {
      errors[key] = `${spec.name} must be between ${spec.min} and ${spec.max} ${spec.unit}.`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Check whether inputs fall inside the empirical training bounds of the model.
 * @param {Record<string, number|string>} features
 * @returns {{ hasOutOfRange: boolean, warnings: Record<string, string> }}
 */
export function checkTrainingRanges(features) {
  const warnings = {};

  Object.entries(TRAINING_RANGES).forEach(([key, range]) => {
    const rawVal = features[key];
    if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
      const numVal = Number(rawVal);
      if (!isNaN(numVal)) {
        if (numVal < range.min || numVal > range.max) {
          warnings[key] = `${FEATURE_SPECS[key]?.name || key} (${numVal} ${range.unit}) is outside training range [${range.min}–${range.max} ${range.unit}].`;
        }
      }
    }
  });

  return {
    hasOutOfRange: Object.keys(warnings).length > 0,
    warnings,
  };
}
