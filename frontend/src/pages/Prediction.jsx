import React from 'react';
import usePrediction from '../hooks/usePrediction';
import PredictionForm from '../components/PredictionForm';
import PredictionResult from '../components/PredictionResult';
import ErrorMessage from '../components/ErrorMessage';
import { Activity, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Prediction() {
  const {
    features,
    model,
    setModel,
    result,
    loading,
    error,
    validationErrors,
    handleFeatureChange,
    resetFeatures,
    predict,
    clearError,
  } = usePrediction();

  return (
    <div className="space-y-8 py-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
          <Activity className="w-3.5 h-3.5" />
          <span>Real-Time Inference</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-800 tracking-tight">
          Predict PM2.5 Concentration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
          Enter surface meteorological observations to estimate ambient fine particulate matter (PM2.5) and classify it into an indicative CPCB health band.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorMessage
          title="Inference Notice"
          message={error}
          onRetry={() => predict()}
        />
      )}

      {/* Prediction Input Form */}
      <PredictionForm
        features={features}
        onFeatureChange={handleFeatureChange}
        onReset={resetFeatures}
        selectedModel={model}
        onModelChange={setModel}
        onSubmit={() => predict()}
        loading={loading}
        errors={validationErrors}
      />

      {/* Prediction Output Section */}
      {result && (
        <section id="result-section">
          <PredictionResult
            result={result}
            features={features}
            selectedModel={model}
          />
        </section>
      )}
    </div>
  );
}
