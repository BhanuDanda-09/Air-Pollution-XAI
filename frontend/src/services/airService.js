/**
 * All-India Multi-Pollutant, Geocoding, Climatology, and Relocation API Service.
 */

import api from './api';

const unwrap = (res) => (res && res.data !== undefined ? res.data : res);

export const airService = {
  /**
   * Fetch 45-city nationwide catalog.
   */
  async getCities(query = '', limit = 45) {
    const params = {};
    if (query) params.q = query;
    if (limit) params.limit = limit;
    const response = await api.get('/api/cities', { params });
    return unwrap(response);
  },

  /**
   * Geocode Indian location via Nominatim / local catalog.
   */
  async geocode(query) {
    const response = await api.get('/api/geocode', { params: { q: query } });
    return unwrap(response);
  },

  /**
   * Fetch current multi-pollutant observations and CPCB AQI sub-indices.
   */
  async getCurrentAir({ lat, lon, city }) {
    const params = {};
    if (city) params.city = city;
    if (lat != null && lon != null) {
      params.lat = lat;
      params.lon = lon;
    }
    const response = await api.get('/api/air/current', { params });
    return unwrap(response);
  },

  /**
   * Generate multi-pollutant forecast with 95% uncertainty error bands.
   */
  async getForecast({ lat, lon, horizon_hours = 24 }) {
    const response = await api.post('/api/air/forecast', {
      lat,
      lon,
      horizon_hours,
    });
    return unwrap(response);
  },

  /**
   * Fetch recent hourly multi-pollutant history for trend charting.
   */
  async getHistory({ lat, lon, days = 7 }) {
    const response = await api.get('/api/air/history', {
      params: { lat, lon, days },
    });
    return unwrap(response);
  },

  /**
   * Fetch monthly and seasonal climatology norms and inversion metrics.
   */
  async getClimatology({ city, lat, lon }) {
    const params = {};
    if (city) params.city = city;
    if (lat != null && lon != null) {
      params.lat = lat;
      params.lon = lon;
    }
    const response = await api.get('/api/air/climatology', { params });
    return unwrap(response);
  },

  /**
   * Fetch national hotspot exposure rankings and regional summaries.
   */
  async getHotspots({ region, tier, limit = 45 } = {}) {
    const params = { limit };
    if (region) params.region = region;
    if (tier) params.tier = tier;
    const response = await api.get('/api/hotspots', { params });
    return unwrap(response);
  },

  /**
   * Compare origin place with candidate destinations using the Health Risk Engine.
   */
  async compareRelocation({ origin, destinations, profile }) {
    const response = await api.post('/api/relocation/compare', {
      origin,
      destinations,
      profile,
    });
    return unwrap(response);
  },

  /**
   * Fetch SHAP multi-pollutant explanations or global attributions.
   */
  async getExplain({ pollutant } = {}) {
    const params = {};
    if (pollutant) params.pollutant = pollutant;
    const response = await api.get('/api/explain', { params });
    return unwrap(response);
  },

  /**
   * DPDP Act 2023: Export complete user personal and health data bundle.
   */
  async exportUserData() {
    const response = await api.get('/api/user/export-data');
    return unwrap(response);
  },

  /**
   * DPDP Act 2023: Permanently erase user account and all health telemetry.
   */
  async deleteUserAccount() {
    const response = await api.post('/api/user/delete-account');
    return unwrap(response);
  },
};

export default airService;
