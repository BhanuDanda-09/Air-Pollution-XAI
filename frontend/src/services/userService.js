import api from './api.js';

export const userService = {
  /**
   * Fetch authenticated user's persistent health profile.
   */
  async getProfile() {
    const res = await api.get('/api/user/profile');
    return res?.health_profile || null;
  },

  /**
   * Update authenticated user's persistent health profile.
   */
  async updateProfile(profileData) {
    const res = await api.put('/api/user/profile', profileData);
    return res?.health_profile || null;
  },

  /**
   * Fetch user's saved locations.
   */
  async getSavedLocations() {
    const res = await api.get('/api/user/locations');
    return res?.locations || [];
  },

  /**
   * Save a new bookmarked location.
   */
  async addSavedLocation({ label, name, latitude, longitude }) {
    const res = await api.post('/api/user/locations', {
      label,
      name,
      latitude,
      longitude,
    });
    return res?.location;
  },

  /**
   * Remove a saved location by ID.
   */
  async deleteSavedLocation(locationId) {
    const res = await api.delete(`/api/user/locations/${locationId}`);
    return res?.deleted_id;
  },

  /**
   * Fetch historical assessments for the user.
   */
  async getHistory(limit = 20) {
    const res = await api.get(`/api/user/history?limit=${limit}`);
    return res?.history || [];
  },

  /**
   * Log an assessment event to history.
   */
  async recordHistory(assessmentData) {
    try {
      const res = await api.post('/api/user/history', assessmentData);
      return res?.history_entry;
    } catch (err) {
      // Non-blocking: guest or offline session
      console.warn('Failed to record assessment history:', err?.message);
      return null;
    }
  },
};

export default userService;
