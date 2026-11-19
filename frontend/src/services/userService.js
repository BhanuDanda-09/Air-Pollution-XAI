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
   * Update a saved location (rename / label change).
   */
  async updateSavedLocation(locationId, { name, label }) {
    const res = await api.put(`/api/user/locations/${locationId}`, { name, label });
    return res?.location;
  },

  /**
   * Fetch historical assessments for the user.
   */
  async getHistory(limit = 20) {
    const res = await api.get(`/api/user/history?limit=${limit}`);
    return res?.history || [];
  },

  /**
   * Delete a single history record.
   */
  async deleteHistoryEntry(historyId) {
    const res = await api.delete(`/api/user/history/${historyId}`);
    return res?.deleted_id;
  },

  /**
   * Clear all history records for the user.
   */
  async clearHistory() {
    const res = await api.delete('/api/user/history');
    return res?.deleted_count;
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

  /**
   * Retrieve active alert threshold and live threshold violations across saved places.
   */
  async getAlerts() {
    const res = await api.get('/api/user/alerts');
    return res;
  },

  /**
   * Update user alert preferences (pm25_threshold, is_email_enabled).
   */
  async updateAlerts(preferences) {
    const res = await api.put('/api/user/alerts', preferences);
    return res?.preference;
  },
};

export default userService;
