import { useState, useCallback } from 'react';
import predictionService from '../services/predictionService';
import { DEFAULT_FEATURES, validateFeatures } from '../utils/validation';

export function usePrediction() {
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [model, setModel] = useState('xgboost');
  const [result, setResult] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [explanationResult, setExplanationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const handleFeatureChange = (key, value) => {
    setFeatures((prev) => ({
      ...prev,
      [key]: value === '' ? '' : Number(value),
    }));
    // Clear validation error on change
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const resetFeatures = () => {
    setFeatures(DEFAULT_FEATURES);
    setValidationErrors({});
    setError(null);
  };

  const predict = useCallback(
    async (customModel = model, customFeatures = features) => {
      const val = validateFeatures(customFeatures);
      if (!val.isValid) {
        setValidationErrors(val.errors);
        setError('Please fix the highlighted invalid inputs before submitting.');
        return null;
      }

      setLoading(true);
      setError(null);
      setValidationErrors({});
      try {
        const res = await predictionService.predictPM25(customModel, customFeatures);
        setResult(res);
        return res;
      } catch (err) {
        setError(err.message);
        setResult(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [model, features]
  );

  const compare = useCallback(
    async (customFeatures = features) => {
      const val = validateFeatures(customFeatures);
      if (!val.isValid) {
        setValidationErrors(val.errors);
        setError('Please fix the highlighted invalid inputs before submitting.');
        return null;
      }

      setLoading(true);
      setError(null);
      setValidationErrors({});
      try {
        const res = await predictionService.compareModels(customFeatures);
        setComparisonResult(res);
        return res;
      } catch (err) {
        setError(err.message);
        setComparisonResult(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [features]
  );

  const explain = useCallback(
    async (customModel = model, customFeatures = features) => {
      const val = validateFeatures(customFeatures);
      if (!val.isValid) {
        setValidationErrors(val.errors);
        setError('Please fix the highlighted invalid inputs before submitting.');
        return null;
      }

      setLoading(true);
      setError(null);
      setValidationErrors({});
      try {
        const res = await predictionService.explainPrediction(customModel, customFeatures);
        setExplanationResult(res);
        return res;
      } catch (err) {
        setError(err.message);
        setExplanationResult(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [model, features]
  );

  return {
    features,
    setFeatures,
    model,
    setModel,
    result,
    comparisonResult,
    explanationResult,
    loading,
    error,
    validationErrors,
    handleFeatureChange,
    resetFeatures,
    predict,
    compare,
    explain,
    clearError: () => setError(null),
  };
}

export default usePrediction;
