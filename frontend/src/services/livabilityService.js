import api from './api';

/**
 * Service to evaluate real-world livability and exposure scores.
 */
export const livabilityService = {
  /**
   * Assess livability & exposure verdict for geographic coordinates.
   * @param {number} lat - Latitude (-90 to 90)
   * @param {number} lon - Longitude (-180 to 180)
   * @returns {Promise<Object>} Livability assessment payload
   */
  async assessLivability(lat, lon) {
    return api.post('/api/location/livability', {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
    });
  },
};

export default livabilityService;
