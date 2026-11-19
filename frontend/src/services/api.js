import axios from 'axios';

// Centralized API configuration using Vite environment variables with production fallback
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.PROD
    ? 'https://air-pollution-xai.onrender.com'
    : 'http://127.0.0.1:5000');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Authorization header if token exists
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error extraction and auth management
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 401 Unauthorized handling: distinct logic for real vs. demo sessions
    if (error.response?.status === 401 && typeof window !== 'undefined' && window.localStorage) {
      const isDemoSession = Boolean(localStorage.getItem('demo_role'));
      if (!isDemoSession) {
        // Real session: log out user and clear real credentials
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.dispatchEvent(
          new CustomEvent('auth:logout', { detail: { reason: 'session_expired' } })
        );
      } else {
        // Demo session: do not wipe real user session, notify demo handler
        window.dispatchEvent(
          new CustomEvent('auth:demo-401', { detail: { error: error.response?.data } })
        );
      }
    }

    let customMessage = 'An unexpected network error occurred. Please check backend connectivity.';
    let errorCode = 'NETWORK_ERROR';
    let errorDetails = null;

    if (error.response) {
      // Backend responded with an error status (4xx, 5xx)
      const data = error.response.data;
      if (data && data.error) {
        customMessage = data.error.message || customMessage;
        errorCode = data.error.code || 'API_ERROR';
        errorDetails = data.error.details || null;
      } else if (data && data.message) {
        customMessage = data.message;
      } else {
        customMessage = `Server returned status ${error.response.status}`;
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      // Request exceeded timeout threshold
      customMessage = `Request timed out after 45 seconds while waiting for ${API_BASE_URL}. The server may be processing complex multi-model inference or waking from idle. Please try again.`;
      errorCode = 'REQUEST_TIMEOUT';
    } else if (error.request) {
      // Request made but no response received (Backend down or CORS issue)
      customMessage = `Unable to connect to backend server at ${API_BASE_URL}. Ensure the Flask server is running and accessible.`;
      errorCode = 'SERVER_UNREACHABLE';
    } else {
      customMessage = error.message;
    }

    const enhancedError = new Error(customMessage);
    enhancedError.code = errorCode;
    enhancedError.details = errorDetails;
    enhancedError.status = error.response?.status;

    return Promise.reject(enhancedError);
  }
);

export default api;
export { API_BASE_URL };
