import React from 'react';
import { FEATURE_SPECS, TRAINING_RANGES, checkTrainingRanges } from '../utils/validation';
import { Sliders, RotateCcw, Play, AlertTriangle } from 'lucide-react';

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
      label: 'Winter Stagnation (In-Range)',
      data: { RH: 85.0, WD: 290.0, SR: 20.0, BP: 746.0, AT: 12.0 },
    },
    {
      label: 'Autumn Afternoon (In-Range)',
      data: { RH: 50.0, WD: 200.0, SR: 220.0, BP: 736.0, AT: 20.0 },
    },
    {
      label: 'Delhi Baseline (In-Range)',
      data: { RH: 60.0, WD: 180.0, SR: 150.0, BP: 738.0, AT: 18.0 },
    },
  ];

  const rangeCheck = checkTrainingRanges(features);

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
      className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 overflow-hidden"
    >
      {/* Header & Model Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-navy-800 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Meteorological Parameters</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Provide surface ambient measurements to estimate PM2.5 concentration.
          </p>
        </div>

        {/* Model dropdown or Multi-model mode badge */}
        {selectedModel === 'all' ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold">
            <span>Evaluating All 3 Models</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <label htmlFor="model-select" className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
              Model:
            </label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={loading}
              className="w-full sm:w-auto max-w-full sm:max-w-xs text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-50 truncate"
            >
              <option value="xgboost">Gradient Boosted Trees (Top Accuracy: R²=0.7455)</option>
              <option value="random_forest">Decision Forest Ensemble (R²=0.7269)</option>
              <option value="mlp">Deep Neural Network (R²=0.5408)</option>
            </select>
          </div>
        )}
      </div>

      {/* Quick Scenario Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Presets:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => applyPreset(p.data)}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-700 dark:hover:text-blue-300 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Out of Training Range Warning Banner */}
      {rangeCheck.hasOutOfRange && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Out-of-Training-Range Warning:</span>
            <p className="leading-relaxed">
              One or more parameters exceed the empirical training domain (SR ≤ 334 W/m², AT 11–23°C, BP 726–749 mmHg). The model will infer via algorithmic extrapolation, which carries higher uncertainty than interpolation inside the training bounds.
            </p>
          </div>
        </div>
      )}

      {/* 5 Input Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.entries(FEATURE_SPECS).map(([key, spec]) => {
          const val = features[key];
          const hasError = !!errors[key];
          const isBP = key === 'BP';
          const range = TRAINING_RANGES[key];
          const isOutOfRange = range && val !== undefined && val !== null && val !== '' && (Number(val) < range.min || Number(val) > range.max);

          return (
            <div
              key={key}
              className={`p-4 rounded-xl border transition-all ${
                hasError
                  ? 'bg-rose-50/50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                  : isOutOfRange
                  ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                  : isBP
                  ? 'bg-blue-50/20 dark:bg-blue-950/30 border-blue-200/70 dark:border-blue-800/70 hover:border-blue-300'
                  : 'bg-slate-50/60 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={`input-${key}`} className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>{spec.name}</span>
                  <span className="text-slate-400 dark:text-slate-500">({key})</span>
                </label>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isBP ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
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
                  className={`w-full text-base font-semibold px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 disabled:opacity-50 transition-all ${
                    hasError
                      ? 'border-rose-400 focus:ring-rose-400'
                      : isOutOfRange
                      ? 'border-amber-400 focus:ring-amber-400'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
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
                className="w-full mt-2.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
              />

              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                <span>Training: {range ? `${range.min}–${range.max} ${range.unit}` : ''}</span>
                <span>Limits: {spec.min}–{spec.max}</span>
              </div>

              {isBP && (
                <p className="mt-1.5 text-[10px] text-blue-700/80 dark:text-blue-300/80 leading-tight">
                  Strictly <strong>mmHg</strong> (Delhi surface elevation). Do not input hPa.
                </p>
              )}

              {isOutOfRange && !hasError && (
                <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Outside empirical training range [{range.min}–{range.max} {range.unit}]
                </p>
              )}

              {hasError && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">{errors[key]}</p>}
            </div>
          );
        })}
      </div>

      {/* Buttons & Validation Feedback */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onReset}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-navy-800 hover:from-blue-700 hover:to-navy-900 rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
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
