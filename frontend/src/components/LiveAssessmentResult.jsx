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

  const getCPCBBadgeColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'good':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'satisfactory':
        return 'bg-lime-100 text-lime-800 border-lime-300';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'poor':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'very poor':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'severe':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 mt-6 animate-fadeIn">
      {/* 1. Regional Validity Banner (Scientific Honesty) */}
      {!isDelhiNCR && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-amber-900">
                Outside Validated Region (Delhi-NCR) — Geographic Extrapolation
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
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
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 shadow-xs">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-blue-900">
                Live Weather Values Outside Empirical Training Baseline (No Clamping)
              </h4>
              <p className="text-xs text-blue-700 mt-0.5 mb-2">
                The model processes genuine, unconstrained live physics. The following variables lie outside the historical Delhi winter monitoring range:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-blue-800">
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
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 opacity-60" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Local AI Estimate
              </span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {model_prediction?.model_name || 'Tuned XGBoost'}
              </span>
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {model_prediction?.pm25 != null ? model_prediction.pm25.toFixed(1) : '—'}
                </span>
                <span className="text-sm font-semibold text-slate-500">µg/m³</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">PM2.5 Surface Concentration</p>
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">CPCB Category:</span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getCPCBBadgeColor(
                model_prediction?.cpcb_category?.category
              )}`}
            >
              {model_prediction?.cpcb_category?.category || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Card B: Reference PM2.5 (CAMS model data) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-0 opacity-60" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Regional Reference
              </span>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 truncate max-w-[150px]">
                {reference_air_quality?.reference_label || 'Reference PM2.5 (CAMS model data)'}
              </span>
            </div>
            <div className="my-3">
              {reference_air_quality?.reference_pm25 != null ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                      {reference_air_quality.reference_pm25.toFixed(1)}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">µg/m³</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {reference_air_quality?.reference_source || 'Copernicus Atmospheric Service'}
                  </p>
                </>
              ) : (
                <div className="py-2 text-slate-500">
                  <p className="text-sm font-semibold text-slate-600">Reference Offline</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {reference_air_quality?.error || 'Reference service unavailable for this location.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Air Quality Index:</span>
            <span>
              {reference_air_quality?.us_aqi ? (
                <span className="font-semibold text-slate-700">US AQI: {reference_air_quality.us_aqi}</span>
              ) : (
                <span className="italic">N/A</span>
              )}
            </span>
          </div>
        </div>

        {/* Card C: Discrepancy / Delta */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Model vs Reference Discrepancy
              </span>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                Δ Comparison
              </span>
            </div>

            {model_vs_reference_comparison ? (
              <div className="my-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-3xl font-black ${
                      model_vs_reference_comparison.delta > 0
                        ? 'text-rose-600'
                        : model_vs_reference_comparison.delta < 0
                        ? 'text-emerald-600'
                        : 'text-slate-700'
                    }`}
                  >
                    {model_vs_reference_comparison.delta > 0 ? '+' : ''}
                    {model_vs_reference_comparison.delta.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">µg/m³</span>
                  {model_vs_reference_comparison.delta > 0 ? (
                    <TrendingUp className="w-5 h-5 text-rose-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Model is {Math.abs(model_vs_reference_comparison.delta).toFixed(1)} µg/m³{' '}
                  {model_vs_reference_comparison.delta_direction} than CAMS regional data.
                </p>
              </div>
            ) : (
              <div className="my-3 py-2 text-slate-400 text-xs italic">
                Comparison unavailable when reference data is offline.
              </div>
            )}
          </div>

          <div className="relative z-10 pt-3 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 leading-tight">
              Honest validation: Model is purely surface meteorological; CAMS incorporates satellite AOD.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Live Meteorological Features Used by Model */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CloudSun className="w-4 h-4 text-amber-500" />
              Live Meteorological Inputs (Open-Meteo)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Physical parameters observed in real-time and converted for model input schema
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            Pressure conversion: 1 hPa = 0.750062 mmHg
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* RH */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500">Relative Humidity</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {meteorological_inputs?.features?.RH != null
                ? `${meteorological_inputs.features.RH}%`
                : '—'}
            </p>
            <span className="text-[10px] text-slate-400">Baseline: 36 - 95%</span>
          </div>

          {/* WD */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500">Wind Direction</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {meteorological_inputs?.features?.WD != null
                ? `${meteorological_inputs.features.WD}°`
                : '—'}
            </p>
            <span className="text-[10px] text-slate-400">Baseline: 7 - 332°</span>
          </div>

          {/* SR */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500">Solar Radiation</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {meteorological_inputs?.features?.SR != null
                ? `${meteorological_inputs.features.SR} W/m²`
                : '—'}
            </p>
            <span className="text-[10px] text-slate-400">Baseline: 2 - 334 W/m²</span>
          </div>

          {/* BP */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500">Barometric Pressure</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {meteorological_inputs?.features?.BP != null
                ? `${meteorological_inputs.features.BP} mmHg`
                : '—'}
            </p>
            <span className="text-[10px] text-slate-400">Baseline: 726 - 749 mmHg</span>
          </div>

          {/* AT */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500">Air Temperature</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {meteorological_inputs?.features?.AT != null
                ? `${meteorological_inputs.features.AT} °C`
                : '—'}
            </p>
            <span className="text-[10px] text-slate-400">Baseline: 11 - 23 °C</span>
          </div>
        </div>
      </div>

      {/* 5. Meteorological SHAP Feature Attributions */}
      {shap_attributions?.attributions && shap_attributions.attributions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-600" />
                Local Meteorological Feature Attributions (SHAP)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact contribution of each surface meteorological variable toward this specific prediction
              </p>
            </div>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
              Base Value: {shap_attributions?.base_value?.toFixed(1) || '0.0'} µg/m³
            </span>
          </div>

          {/* Disclaimer regarding meteorological attribution vs chemical apportionment */}
          <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
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
                <div key={attr.feature} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-800">
                      {attr.feature_name} ({attr.feature}):{' '}
                      <span className="font-mono text-slate-600">
                        {attr.feature_value != null ? Number(attr.feature_value).toFixed(1) : '—'}
                      </span>
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        isPositive ? 'text-rose-600' : 'text-blue-600'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {val.toFixed(2)} µg/m³
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
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
                  <p className="text-[10px] text-slate-500 mt-1">
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
