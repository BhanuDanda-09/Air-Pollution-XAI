import React from 'react';
import usePrediction from '../hooks/usePrediction';
import PredictionForm from '../components/PredictionForm';
import SHAPExplanation from '../components/SHAPExplanation';
import SourceAttributionBreakdown from '../components/SourceAttributionBreakdown';
import ErrorMessage from '../components/ErrorMessage';
import ColdStartNotice from '../components/ColdStartNotice';
import PageSkeleton from '../components/PageSkeleton';
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
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Explainable AI Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
          Understand Your Prediction
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Inspect how individual weather conditions influence particulate levels using model attribution and factor sensitivity breakdowns.
        </p>
      </div>

      {/* Educational Guide Card */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
        <h4 className="font-bold text-navy-900 dark:text-white flex items-center gap-1.5 text-sm">
          <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>How to Interpret Factor Attributions</span>
        </h4>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <li className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <strong className="text-slate-800 dark:text-slate-200">1. Base Value:</strong> The model's expected average output under its training background distribution.
          </li>
          <li className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <strong className="text-rose-600 dark:text-rose-400">2. Rising Factors (+):</strong> Factors that push particulate levels higher relative to the average (e.g. calm wind stagnation or thermal inversion).
          </li>
          <li className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <strong className="text-teal-600 dark:text-teal-400">3. Clearing Factors (−):</strong> Factors that push particulate levels lower relative to the average (e.g. high boundary layer ventilation or rain scavenging).
          </li>
        </ul>
      </div>

      {/* Cold Start Notice (Render 5s Delay Indicator) */}
      <ColdStartNotice isLoading={loading} />

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

      {/* Output SHAP Explanation & Source Attribution or Loading Skeleton */}
      {loading && !explanationResult ? (
        <PageSkeleton variant="card" />
      ) : (
        explanationResult && (
          <section id="explanation-result" className="space-y-6">
            <SHAPExplanation explanationData={explanationResult} />
            {explanationResult.source_attribution && (
              <SourceAttributionBreakdown attributionData={explanationResult.source_attribution} />
            )}
          </section>
        )
      )}
    </div>
  );
}
