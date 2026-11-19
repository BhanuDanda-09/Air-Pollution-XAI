import api from './api.js';

const TOKEN_KEY = 'auth_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'user';

export const authService = {
  /**
   * Register a new user account.
   */
  async register(email, password, name = '') {
    const response = await api.post('/api/auth/register', {
      email,
      password,
      name,
    });
    if (response?.access_token) {
      this.setSession(response.user, response.access_token, response.refresh_token);
    }
    return response;
  },

  /**
   * Authenticate with email and password.
   */
  async login(email, password) {
    const response = await api.post('/api/auth/login', {
      email,
      password,
    });
    if (response?.access_token) {
      this.setSession(response.user, response.access_token, response.refresh_token);
    }
    return response;
  },

  /**
   * Exchange refresh token for fresh access token.
   */
  async refresh() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await api.post('/api/auth/refresh', {
      refresh_token: refreshToken,
    });
    if (response?.access_token) {
      localStorage.setItem(TOKEN_KEY, response.access_token);
    }
    return response;
  },

  /**
   * Fetch current authenticated user's profile and settings.
   */
  async getMe() {
    return await api.get('/api/auth/me');
  },

  /**
   * Store active session in localStorage.
   */
  setSession(user, accessToken, refreshToken) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Clear active user session.
   */
  clearSession() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Get current auth token.
   */
  getToken() {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get stored refresh token.
   */
  getRefreshToken() {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return localStorage.getItem(REFRESH_KEY);
  },

  /**
   * Get cached user object.
   */
  getStoredUser() {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * Check if a real user is currently authenticated.
   */
  isAuthenticated() {
    return Boolean(this.getToken() && !localStorage.getItem('demo_role'));
  },
};

export default authService;
