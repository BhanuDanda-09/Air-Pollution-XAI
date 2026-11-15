import React from 'react';
import usePrediction from '../hooks/usePrediction';
import PredictionForm from '../components/PredictionForm';
import ModelComparison from '../components/ModelComparison';
import ErrorMessage from '../components/ErrorMessage';
import { GitCompare, Trophy, BarChart2, ShieldAlert } from 'lucide-react';

export default function ModelComparisonPage() {
  const {
    features,
    comparisonResult,
    loading,
    error,
    validationErrors,
    handleFeatureChange,
    resetFeatures,
    compare,
  } = usePrediction();

  return (
    <div className="space-y-8 py-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 mb-2">
          <GitCompare className="w-3.5 h-3.5" />
          <span>Multi-Model Evaluation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-800 tracking-tight">
          Compare Machine Learning Models
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
          Simultaneously evaluate Random Forest, tuned XGBoost, and Deep Learning (MLP) on identical meteorological conditions alongside held-out generalization benchmarks.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorMessage
          title="Comparison Notice"
          message={error}
          onRetry={() => compare()}
        />
      )}

      {/* Input Parameters Form (reuses PredictionForm without model dropdown) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-navy-800">1. Set Environmental Scenario</h3>
            <p className="text-xs text-slate-500">Inputs will be fed simultaneously into all 3 models.</p>
          </div>
          <button
            type="button"
            onClick={resetFeatures}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
          >
            Reset
          </button>
        </div>

        <PredictionForm
          features={features}
          onFeatureChange={handleFeatureChange}
          onReset={resetFeatures}
          selectedModel="all"
          onModelChange={() => {}}
          onSubmit={() => compare()}
          loading={loading}
          errors={validationErrors}
        />
      </div>

      {/* Output Comparison Results */}
      {comparisonResult && (
        <section id="comparison-result">
          <ModelComparison comparisonData={comparisonResult} />
        </section>
      )}
    </div>
  );
}
