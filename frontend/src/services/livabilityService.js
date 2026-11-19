import api from './api.js';

/**
 * Service to evaluate real-world livability and exposure scores.
 */
export const livabilityService = {
  /**
   * Assess livability & exposure verdict for geographic coordinates.
   * @param {number} lat - Latitude (-90 to 90)
   * @param {number} lon - Longitude (-180 to 180)
   * @param {Object} [healthProfile] - Optional health risk factors (age group, asthma, etc.)
   * @returns {Promise<Object>} Livability assessment payload
   */
  async assessLivability(lat, lon, healthProfile = null) {
    const payload = {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
    };
    if (healthProfile) {
      payload.health_profile = healthProfile;
    }
    return api.post('/api/location/livability', payload);
  },

  /**
   * Compare livability and air quality between two locations side-by-side.
   * @param {Object} locationA - { lat, lon, name }
   * @param {Object} locationB - { lat, lon, name }
   * @param {Object} [healthProfile] - Optional health profile
   * @returns {Promise<Object>} Head-to-head comparison payload
   */
  async compareLivability(locationA, locationB, healthProfile = null) {
    const payload = {
      location_a: locationA,
      location_b: locationB,
    };
    if (healthProfile) {
      payload.health_profile = healthProfile;
    }
    return api.post('/api/location/compare-livability', payload);
  },
};

export default livabilityService;
