import React from 'react';
import SourceAttributionBreakdown from './SourceAttributionBreakdown';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  TrendingDown,
  CloudSun,
  Gauge,
  HelpCircle,
  ShieldAlert,
  XCircle,
} from 'lucide-react';

export default function LiveAssessmentResult({ assessmentData }) {
  if (!assessmentData) return null;

  const {
    location,
    model_prediction,
    reference_air_quality,
    model_vs_reference_comparison,
    meteorological_inputs,
    shap_attributions,
    scientific_disclaimers,
  } = assessmentData;

  const isDelhiNCR = location?.is_delhi_ncr;
  const hasOutOfRange = meteorological_inputs?.has_out_of_training_range_inputs;
  const outOfRangeWarnings = meteorological_inputs?.input_out_of_training_range_warnings || [];

  const getCPCBBadge = (category) => {
    switch (category?.toLowerCase()) {
      case 'good':
        return {
          classes: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          Icon: CheckCircle2,
        };
      case 'satisfactory':
        return {
          classes: 'bg-lime-100 dark:bg-lime-950/60 text-lime-800 dark:text-lime-300 border-lime-300 dark:border-lime-800',
          Icon: CheckCircle2,
        };
      case 'moderate':
        return {
          classes: 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800',
          Icon: AlertTriangle,
        };
      case 'poor':
        return {
          classes: 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800',
          Icon: AlertTriangle,
        };
      case 'very poor':
        return {
          classes: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
          Icon: ShieldAlert,
        };
      case 'severe':
        return {
          classes: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800',
          Icon: XCircle,
        };
      default:
        return {
          classes: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
          Icon: Info,
        };
    }
  };

  const cpcbInfo = getCPCBBadge(model_prediction?.cpcb_category?.category);
  const CPCBIcons = cpcbInfo.Icon;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Live Air Quality Assessment Results"
      className="space-y-6 mt-6 animate-fadeIn"
    >
      {/* 1. Regional Validity Banner (Scientific Honesty) */}
      {!isDelhiNCR && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-200 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-amber-950 dark:text-amber-100">
                Outside Validated Region (Delhi-NCR) — Geographic Extrapolation
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-1 leading-relaxed">
                {location?.validity_warning ||
                  scientific_disclaimers?.regional_limitation ||
                  'This model was trained exclusively on Delhi meteorological monitoring data. Predictions outside Delhi-NCR represent an unvalidated geographic extrapolation.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Out-of-Training-Range Warnings (No Silent Clamping) */}
      {hasOutOfRange && (
        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 shadow-xs">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-blue-950 dark:text-blue-100">
                Live Weather Values Outside Empirical Training Baseline (No Clamping)
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5 mb-2">
                The model processes genuine, unconstrained live physics. The following variables lie outside the historical Delhi winter monitoring range:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-blue-800 dark:text-blue-300">
                {outOfRangeWarnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 3. Core Metric Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card A: XGBoost Model Estimate */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-950/40 rounded-bl-full -z-0 opacity-60" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Local AI Estimate
              </span>
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                {model_prediction?.model_name || 'Tuned XGBoost'}
              </span>
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-navy-900 dark:text-white tracking-tight">
                  {model_prediction?.pm25 != null ? model_prediction.pm25.toFixed(1) : '—'}
                </span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">µg/m³</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">PM2.5 Surface Concentration</p>
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">CPCB Category:</span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cpcbInfo.classes}`}
            >
              <CPCBIcons className="w-3.5 h-3.5" />
              <span>{model_prediction?.cpcb_category?.category || 'Unknown'}</span>
            </span>
          </div>
        </div>

        {/* Card B: Reference PM2.5 (CAMS model data) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-950/40 rounded-bl-full -z-0 opacity-60" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Regional Reference
              </span>
              <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 truncate max-w-[150px]">
                {reference_air_quality?.reference_label || 'Reference PM2.5 (CAMS model data)'}
              </span>
            </div>
            <div className="my-3">
              {reference_air_quality?.reference_pm25 != null ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-navy-900 dark:text-white tracking-tight">
                      {reference_air_quality.reference_pm25.toFixed(1)}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">µg/m³</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {reference_air_quality?.reference_source || 'Copernicus Atmospheric Service'}
                  </p>
                </>
              ) : (
                <div className="py-2 text-slate-500 dark:text-slate-400">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Reference Offline</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {reference_air_quality?.error || 'Reference service unavailable for this location.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Air Quality Index:</span>
            <span>
              {reference_air_quality?.us_aqi ? (
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  US AQI: {reference_air_quality.us_aqi}
                </span>
              ) : (
                <span className="italic">N/A</span>
              )}
            </span>
          </div>
        </div>

        {/* Card C: Discrepancy / Delta */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Model vs Reference Discrepancy
              </span>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                Δ Comparison
              </span>
            </div>

            {model_vs_reference_comparison ? (
              <div className="my-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-3xl font-black ${
                      model_vs_reference_comparison.delta > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : model_vs_reference_comparison.delta < 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {model_vs_reference_comparison.delta > 0 ? '+' : ''}
                    {model_vs_reference_comparison.delta.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">µg/m³</span>
                  {model_vs_reference_comparison.delta > 0 ? (
                    <TrendingUp className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Model is {Math.abs(model_vs_reference_comparison.delta).toFixed(1)} µg/m³{' '}
                  {model_vs_reference_comparison.delta_direction} than CAMS regional data.
                </p>
              </div>
            ) : (
              <div className="my-3 py-2 text-slate-500 dark:text-slate-400 text-xs italic">
                Comparison unavailable when reference data is offline.
              </div>
            )}
          </div>

          <div className="relative z-10 pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              Honest validation: Model is purely surface meteorological; CAMS incorporates satellite AOD.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Live Meteorological Features Used by Model */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CloudSun className="w-4 h-4 text-amber-500" />
              Live Meteorological Inputs (Open-Meteo)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Physical parameters observed in real-time and converted for model input schema
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            Pressure conversion: 1 hPa = 0.750062 mmHg
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* RH */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Relative Humidity</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {meteorological_inputs?.features?.RH != null
                ? `${meteorological_inputs.features.RH}%`
                : '—'}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Baseline: 36 - 95%</span>
          </div>

          {/* WD */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Wind Direction</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {meteorological_inputs?.features?.WD != null
                ? `${meteorological_inputs.features.WD}°`
                : '—'}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Baseline: 7 - 332°</span>
          </div>

          {/* SR */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Solar Radiation</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {meteorological_inputs?.features?.SR != null
                ? `${meteorological_inputs.features.SR} W/m²`
                : '—'}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Baseline: 2 - 334 W/m²</span>
          </div>

          {/* BP */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Barometric Pressure</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {meteorological_inputs?.features?.BP != null
                ? `${meteorological_inputs.features.BP} mmHg`
                : '—'}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Baseline: 726 - 749 mmHg</span>
          </div>

          {/* AT */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Air Temperature</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {meteorological_inputs?.features?.AT != null
                ? `${meteorological_inputs.features.AT} °C`
                : '—'}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Baseline: 11 - 23 °C</span>
          </div>
        </div>
      </div>

      {/* 5. Meteorological SHAP Feature Attributions */}
      {shap_attributions?.attributions && shap_attributions.attributions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Local Meteorological Feature Attributions (SHAP)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Exact contribution of each surface meteorological variable toward this specific prediction
              </p>
            </div>
            <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto">
              Base Value: {shap_attributions?.base_value?.toFixed(1) || '0.0'} µg/m³
            </span>
          </div>

          {/* Disclaimer regarding meteorological attribution vs chemical apportionment */}
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong>Scientific Framing:</strong> {shap_attributions?.attribution_focus ||
                'Meteorological Feature Attribution (Weather impact on model, NOT chemical source emissions).'}{' '}
              {scientific_disclaimers?.attribution_distinction}
            </span>
          </div>

          <div className="space-y-3">
            {shap_attributions.attributions.map((attr) => {
              const val = attr.shap_value || 0;
              const isPositive = val > 0;
              return (
                <div
                  key={attr.feature}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {attr.feature_name} ({attr.feature}):{' '}
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        {attr.feature_value != null ? Number(attr.feature_value).toFixed(1) : '—'}
                      </span>
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        isPositive ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {val.toFixed(2)} µg/m³
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex">
                    {!isPositive ? (
                      <div
                        className="bg-blue-500 h-full ml-auto rounded-full"
                        style={{ width: `${Math.min(100, Math.abs(val) * 2)}%` }}
                      />
                    ) : (
                      <div
                        className="bg-rose-500 h-full mr-auto rounded-full"
                        style={{ width: `${Math.min(100, Math.abs(val) * 2)}%` }}
                      />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    {isPositive
                      ? `Elevated the predicted PM2.5 by ${val.toFixed(2)} µg/m³ relative to the historical mean.`
                      : `Reduced the predicted PM2.5 by ${Math.abs(val).toFixed(2)} µg/m³ relative to the historical mean.`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Emission Source Apportionment Breakdown */}
      {assessmentData?.source_attribution && (
        <SourceAttributionBreakdown attributionData={assessmentData.source_attribution} />
      )}
    </div>
  );
}
