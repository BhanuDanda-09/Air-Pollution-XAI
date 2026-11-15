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
    default: 55.0,
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
    default: 350.0,
    description: 'Incident solar irradiance (0–1500 W/m²)',
  },
  BP: {
    name: 'Barometric Pressure',
    unit: 'mmHg',
    min: 700.0,
    max: 780.0,
    step: 0.1,
    default: 745.0,
    description: 'Atmospheric pressure in mmHg (verified dataset unit; 700–780 mmHg)',
  },
  AT: {
    name: 'Air Temperature',
    unit: '°C',
    min: -20.0,
    max: 60.0,
    step: 0.1,
    default: 28.0,
    description: 'Dry-bulb ambient air temperature (-20°C to 60°C)',
  },
};

export const DEFAULT_FEATURES = {
  RH: 55.0,
  WD: 180.0,
  SR: 350.0,
  BP: 745.0,
  AT: 28.0,
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
