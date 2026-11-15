import React from 'react';
import usePrediction from '../hooks/usePrediction';
import PredictionForm from '../components/PredictionForm';
import SHAPExplanation from '../components/SHAPExplanation';
import ErrorMessage from '../components/ErrorMessage';
import { Sparkles, HelpCircle, ShieldAlert, Cpu } from 'lucide-react';

export default function Explainability() {
  const {
    features,
    model,
    setModel,
    explanationResult,
    loading,
    error,
    validationErrors,
    handleFeatureChange,
    resetFeatures,
    explain,
  } = usePrediction();

  return (
    <div className="space-y-8 py-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Explainable AI Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-800 tracking-tight">
          Understand Your Prediction
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
          Inspect how individual meteorological features drive your PM2.5 prediction using Shapley Additive Explanations (SHAP) across Tree and Neural Network models.
        </p>
      </div>

      {/* Educational Guide Card */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-navy-800 flex items-center gap-1.5 text-sm">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>How to Interpret SHAP Feature Attributions</span>
        </h4>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <li className="p-3 bg-white rounded-xl border border-slate-200">
            <strong className="text-slate-800">1. Base Value:</strong> The model's expected average output under its training background distribution.
          </li>
          <li className="p-3 bg-white rounded-xl border border-slate-200">
            <strong className="text-rose-600">2. Positive SHAP (+):</strong> Factors that push the predicted PM2.5 higher relative to the baseline (e.g. low wind speed or thermal inversion).
          </li>
          <li className="p-3 bg-white rounded-xl border border-slate-200">
            <strong className="text-teal-600">3. Negative SHAP (−):</strong> Factors that push the predicted PM2.5 lower relative to the baseline (e.g. atmospheric ventilation or precipitation wash).
          </li>
        </ul>
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorMessage
          title="Explanation Notice"
          message={error}
          onRetry={() => explain()}
        />
      )}

      {/* Input Parameters Form */}
      <PredictionForm
        features={features}
        onFeatureChange={handleFeatureChange}
        onReset={resetFeatures}
        selectedModel={model}
        onModelChange={setModel}
        onSubmit={() => explain()}
        loading={loading}
        errors={validationErrors}
      />

      {/* SHAP Explanation Output */}
      {explanationResult && (
        <section id="explanation-result">
          <SHAPExplanation explanationData={explanationResult} />
        </section>
      )}
    </div>
  );
}
