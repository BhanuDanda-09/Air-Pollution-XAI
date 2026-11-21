import React from 'react';
import useModels from '../hooks/useModels';
import StatCard from '../components/StatCard';
import PerformanceChart from '../components/PerformanceChart';
import PageSkeleton from '../components/PageSkeleton';
import ColdStartNotice from '../components/ColdStartNotice';
import ErrorMessage from '../components/ErrorMessage';
import {
  Trophy,
  Activity,
  Layers,
  BarChart3,
  Server,
  AlertTriangle,
} from 'lucide-react';

export default function Dashboard() {
  const { modelsData, healthData, loading, error, availableModels, blockedModels, refetch } =
    useModels();

  const xgbModel = modelsData?.models?.find((m) => m.key === 'xgboost');

  return (
    <div className="space-y-8 py-6">
      {/* Top Title & Health Status Header - Always displayed for strong UX */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            System & Model Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time telemetry, held-out test benchmarks, and meteorological specifications.
          </p>
        </div>

        {/* Backend Status Pill */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              healthData?.status === 'healthy'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>
              {healthData?.status === 'healthy' ? 'Real-Time Air Service Connected' : 'API Degraded / Offline'}
            </span>
          </div>
        </div>
      </div>

      <ColdStartNotice isLoading={loading} />

      {loading ? (
        <PageSkeleton variant="dashboard" />
      ) : error && !modelsData ? (
        <div className="max-w-4xl mx-auto py-8">
          <ErrorMessage
            title="Backend Connection Failed"
            message={error}
            onRetry={refetch}
            details="Ensure the Flask backend is running on http://127.0.0.1:5000 (or as configured in VITE_API_URL)."
          />
        </div>
      ) : (
        <>
          {/* A. 4 Key Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Top Performing Model"
          value={xgbModel?.display_name?.split(' ')[0] || 'Forecast Engine'}
          unit="(Tuned)"
          subtitle="Selected on held-out test set"
          icon={Trophy}
          color="blue"
          badge="Winner"
        />

        <StatCard
          title="Best Test R² Score"
          value={xgbModel?.test_metrics?.r2 ? xgbModel.test_metrics.r2.toFixed(4) : '0.7455'}
          unit=""
          subtitle="Generalization score (406 samples)"
          icon={Activity}
          color="teal"
          badge="Top Score"
        />

        <StatCard
          title="Best Test RMSE"
          value={xgbModel?.test_metrics?.rmse ? xgbModel.test_metrics.rmse.toFixed(2) : '36.74'}
          unit="µg/m³"
          subtitle="Root Mean Squared Error"
          icon={BarChart3}
          color="amber"
          badge="Lower is better"
        />

        <StatCard
          title="Trained Models"
          value={availableModels.length}
          unit="/ 5"
          subtitle="2 models blocked pending timestamps"
          icon={Layers}
          color="purple"
          badge="3 Active"
        />
      </div>

      {/* B. Model Performance Benchmark Comparison Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Held-Out Test Benchmark Comparison
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluated on identical 406 untouched test observations (sub-train fitted pipelines).
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 self-start sm:self-auto">
            Test Split: 406 Samples
          </span>
        </div>

        <PerformanceChart models={modelsData?.models || []} />
      </div>

      {/* C. Model Status Grid (Available vs Blocked) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Models */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Active Inference Models</span>
            </h3>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              {availableModels.length} Deployed
            </span>
          </div>

          <div className="space-y-3">
            {availableModels.map((m) => (
              <div
                key={m.key}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{m.display_name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                    {m.paradigm}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{m.description}</p>
                {m.test_metrics && (
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-700 dark:text-slate-300 pt-1">
                    <span>
                      R²: <strong>{m.test_metrics.r2.toFixed(4)}</strong>
                    </span>
                    <span>
                      RMSE: <strong>{m.test_metrics.rmse.toFixed(2)}</strong>
                    </span>
                    <span>
                      MAE: <strong>{m.test_metrics.mae.toFixed(2)}</strong>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Blocked Models (Scientific Integrity) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Blocked Models (Scientific Constraint)</span>
            </h3>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
              {blockedModels.length} Blocked
            </span>
          </div>

          <div className="space-y-3">
            {blockedModels.map((m) => (
              <div
                key={m.key}
                className="p-3.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{m.display_name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                    Temporal Block
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                  {m.blocking_reason || m.description}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong>Integrity Rule:</strong> Sequence architectures (LSTM, Transformer) require strictly ordered, continuous timestamps. Since the dataset does not have verified timestamps, synthetic sequencing is prohibited to avoid false temporal correlation.
          </div>
        </div>
      </div>

      {/* D. Input Features & Bounds Specification */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider">
          Verified Input Feature Specifications
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {modelsData?.input_features &&
            Object.entries(modelsData.input_features).map(([key, item]) => {
              const isBP = key === 'BP';
              return (
                <div
                  key={key}
                  className={`p-4 rounded-xl border ${
                    isBP
                      ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold">{key}</span>
                  </div>
                  <div className="mt-1">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        isBP
                          ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {item.unit}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Range: [{item.min}, {item.max}]
                  </div>
                  {isBP && (
                    <div className="mt-2 text-[10px] text-blue-700 dark:text-blue-300 font-semibold leading-tight">
                      * Calibrated in mmHg (not hPa).
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
