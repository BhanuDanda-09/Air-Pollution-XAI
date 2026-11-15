import { useState, useEffect, useCallback } from 'react';
import predictionService from '../services/predictionService';

export function useModels() {
  const [modelsData, setModelsData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, modelsRes] = await Promise.all([
        predictionService.getHealth().catch((err) => ({ _error: err })),
        predictionService.getModels().catch((err) => ({ _error: err })),
      ]);

      if (healthRes._error && modelsRes._error) {
        throw new Error(healthRes._error.message || 'Failed connecting to backend API');
      }

      setHealthData(healthRes._error ? null : healthRes);
      setModelsData(modelsRes._error ? null : modelsRes);
    } catch (err) {
      setError(err.message || 'Failed to fetch model catalogue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const availableModels = modelsData?.models?.filter((m) => m.available) || [];
  const blockedModels = modelsData?.models?.filter((m) => !m.available) || [];
  const bestModelKey = modelsData?.best_model || 'xgboost';
  const bestModel = modelsData?.models?.find((m) => m.key === bestModelKey);

  return {
    modelsData,
    healthData,
    loading,
    error,
    availableModels,
    blockedModels,
    bestModel,
    refetch: fetchData,
  };
}

export default useModels;
