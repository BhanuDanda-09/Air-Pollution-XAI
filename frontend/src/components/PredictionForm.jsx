import React from 'react';
import { FEATURE_SPECS } from '../utils/validation';
import { Sliders, RotateCcw, Play, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function PredictionForm({
  features,
  onFeatureChange,
  onReset,
  selectedModel,
  onModelChange,
  onSubmit,
  loading,
  errors = {},
  availableModels = [],
}) {
  const presets = [
    {
      label: 'Winter Stagnation (High PM2.5)',
      data: { RH: 82.0, WD: 115.0, SR: 140.0, BP: 752.0, AT: 11.5 },
    },
    {
      label: 'Typical Monsoon (Clean Air)',
      data: { RH: 70.0, WD: 240.0, SR: 480.0, BP: 738.0, AT: 31.0 },
    },
    {
      label: 'Standard Delhi Baseline',
      data: { RH: 55.0, WD: 180.0, SR: 350.0, BP: 745.0, AT: 28.0 },
    },
  ];

  const applyPreset = (presetData) => {
    Object.entries(presetData).forEach(([key, val]) => {
      onFeatureChange(key, val);
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="bg-white rounded-2xl p-4 sm:p-8 border border-slate-200 shadow-sm space-y-6 overflow-hidden"
    >
      {/* Header & Model Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-navy-800 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <span>Meteorological Parameters</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Provide surface ambient measurements to estimate PM2.5 concentration.
          </p>
        </div>

        {/* Model dropdown or Multi-model mode badge */}
        {selectedModel === 'all' ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
            <span>Evaluating All 3 Models</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <label htmlFor="model-select" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              Model:
            </label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={loading}
              className="w-full sm:w-auto max-w-full sm:max-w-xs text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-50 truncate"
            >
              <option value="xgboost">XGBoost (Top Performer: R²=0.7455)</option>
              <option value="random_forest">Random Forest (R²=0.7269)</option>
              <option value="mlp">MLP Neural Net (R²=0.5408)</option>
            </select>
          </div>
        )}
      </div>

      {/* Quick Scenario Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400">Presets:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => applyPreset(p.data)}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors border border-slate-200"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 5 Input Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.entries(FEATURE_SPECS).map(([key, spec]) => {
          const val = features[key];
          const hasError = !!errors[key];
          const isBP = key === 'BP';

          return (
            <div
              key={key}
              className={`p-4 rounded-xl border transition-all ${
                hasError
                  ? 'bg-rose-50/50 border-rose-300'
                  : isBP
                  ? 'bg-blue-50/20 border-blue-200/70 hover:border-blue-300'
                  : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={`input-${key}`} className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>{spec.name}</span>
                  <span className="text-slate-400">({key})</span>
                </label>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isBP ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {spec.unit}
                </span>
              </div>

              <div className="relative mt-2">
                <input
                  id={`input-${key}`}
                  type="number"
                  step={spec.step}
                  min={spec.min}
                  max={spec.max}
                  value={val}
                  onChange={(e) => onFeatureChange(key, e.target.value)}
                  disabled={loading}
                  className={`w-full text-base font-semibold px-3 py-2 rounded-lg border bg-white text-slate-900 focus:outline-hidden focus:ring-2 disabled:opacity-50 transition-all ${
                    hasError
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
              </div>

              {/* Slider for intuitive control */}
              <input
                type="range"
                min={spec.min}
                max={spec.max}
                step={spec.step}
                value={val || spec.min}
                onChange={(e) => onFeatureChange(key, e.target.value)}
                disabled={loading}
                className="w-full mt-2.5 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
              />

              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                <span>Min: {spec.min}</span>
                <span>Max: {spec.max}</span>
              </div>

              {isBP && (
                <p className="mt-1.5 text-[10px] text-blue-700/80 leading-tight">
                  Strictly <strong>mmHg</strong> (Delhi surface elevation). Do not input hPa.
                </p>
              )}

              {hasError && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors[key]}</p>}
            </div>
          );
        })}
      </div>

      {/* Buttons & Validation Feedback */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onReset}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-navy-800 hover:from-blue-700 hover:to-navy-900 rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{selectedModel === 'all' ? 'Comparing Models...' : 'Running Inference...'}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{selectedModel === 'all' ? 'Compare All Models' : 'Predict PM2.5'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
