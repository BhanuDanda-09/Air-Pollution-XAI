import api from './api';

/**
 * Service methods connecting to Flask REST API endpoints
 */
export const predictionService = {
  /**
   * Check backend health and model availability flags
   * GET /api/health
   */
  async getHealth() {
    return api.get('/api/health');
  },

  /**
   * Retrieve model metadata, benchmark metrics, and input feature specifications
   * GET /api/models
   */
  async getModels() {
    return api.get('/api/models');
  },

  /**
   * Generate PM2.5 prediction and indicative CPCB category for a single model
   * POST /api/predict
   */
  async predictPM25(model, features) {
    return api.post('/api/predict', { model, features });
  },

  /**
   * Run all three available models (Random Forest, XGBoost, MLP) on identical inputs
   * POST /api/compare
   */
  async compareModels(features) {
    return api.post('/api/compare', { features });
  },

  /**
   * Compute local SHAP feature attributions
   * POST /api/explain
   */
  async explainPrediction(model, features) {
    return api.post('/api/explain', { model, features });
  },
};

export default predictionService;
