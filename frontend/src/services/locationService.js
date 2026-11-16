import api from './api';
import axios from 'axios';

/**
 * Service to interact with the backend location assessment API
 * and free-tier Open-Meteo Geocoding.
 */
export const locationService = {
  /**
   * Assess air quality for given geographic coordinates.
   * @param {number} lat - Latitude (-90 to 90)
   * @param {number} lon - Longitude (-180 to 180)
   * @returns {Promise<Object>} Assessment payload from backend
   */
  async assessLocation(lat, lon) {
    return api.post('/api/location/assess', {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
    });
  },

  /**
   * Search for locations by name using Open-Meteo Geocoding API (free tier, no key required).
   * @param {string} query - Location name (e.g., 'Connaught Place', 'Delhi', 'Gurgaon')
   * @returns {Promise<Array>} List of matched places with name, country, lat, lon
   */
  async searchGeocoding(query) {
    if (!query || query.trim().length < 2) {
      return [];
    }
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query.trim()
      )}&count=6&language=en&format=json`;
      const response = await axios.get(url, { timeout: 8000 });
      if (response.data && Array.isArray(response.data.results)) {
        return response.data.results.map((item) => ({
          id: item.id,
          name: item.name,
          admin1: item.admin1 || '',
          country: item.country || '',
          latitude: item.latitude,
          longitude: item.longitude,
          displayName: [item.name, item.admin1, item.country].filter(Boolean).join(', '),
        }));
      }
      return [];
    } catch (err) {
      console.warn('Geocoding search failed:', err.message);
      return [];
    }
  },
};

export default locationService;
