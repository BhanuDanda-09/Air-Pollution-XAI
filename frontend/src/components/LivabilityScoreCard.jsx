import React from 'react';
import {
  Compass,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Wind,
  Home,
  Navigation,
  Info,
} from 'lucide-react';

export default function LivabilityScoreCard({ livabilityData }) {
  if (!livabilityData) return null;

  const {
    score,
    tier,
    cpcb_match,
    color,
    confidence,
    confidence_reason,
    verdicts,
    score_components,
    primary_driver,
    secondary_ml_context,
  } = livabilityData;

  const isOffline = score === null;

  const getConfidenceBadge = (conf) => {
    switch (conf?.toLowerCase()) {
      case 'high':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: ShieldCheck,
          text: 'High Confidence',
        };
      case 'moderate':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: ShieldAlert,
          text: 'Moderate Confidence (Extrapolation)',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: AlertTriangle,
          text: 'Low Confidence / Reference Offline',
        };
    }
  };

  const confBadge = getConfidenceBadge(confidence);
  const ConfIcon = confBadge.icon;

  return (
    <div className="space-y-6">
      {/* 1. Master Score & Dual Verdict Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            {/* Circular Gauge / Score Badge */}
            <div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex flex-col items-center justify-center shadow-md text-white font-extrabold shrink-0 transition-transform"
              style={{ backgroundColor: color || '#64748B' }}
            >
              {isOffline ? (
                <span className="text-xl tracking-tight text-white/90">N/A</span>
              ) : (
                <>
                  <span className="text-4xl sm:text-5xl tracking-tighter leading-none">
                    {score}
                  </span>
                  <span className="text-[11px] font-semibold opacity-90 mt-1 uppercase tracking-wider">
                    Score / 100
                  </span>
                </>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold border"
                  style={{
                    backgroundColor: `${color}15`,
                    borderColor: `${color}60`,
                    color: color,
                  }}
                >
                  {tier || 'Unverified'}
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${confBadge.bg}`}
                >
                  <ConfIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{confBadge.text}</span>
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isOffline ? 'Reference Data Offline' : `${tier} Exposure Profile`}
              </h2>
              {cpcb_match && (
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  CPCB Equivalent: <span className="font-semibold text-slate-700">{cpcb_match}</span>
                </p>
              )}
            </div>
          </div>

          {/* Metric Reference Indicator */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 md:max-w-xs text-xs">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] block mb-1">
              Primary Verdict Driver
            </span>
            <p className="font-bold text-slate-800">
              {primary_driver?.source || 'Reference PM2.5 (CAMS model data)'}
            </p>
            {primary_driver?.current_pm25 != null ? (
              <p className="text-slate-600 mt-0.5 font-mono">
                Current: <strong className="text-slate-900">{primary_driver.current_pm25} µg/m³</strong>
              </p>
            ) : (
              <p className="text-rose-600 mt-0.5 italic">Temporarily unavailable from external API</p>
            )}
          </div>
        </div>

        {/* Confidence Explanation Note */}
        <div className="py-3 px-4 mt-4 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs text-slate-600 leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>{confidence_reason}</span>
        </div>

        {/* 2. Dual Decision Cards: Should I Go? & Should I Live Here? */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Card A: Short-term / Travel */}
          <div className="p-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50/80 to-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 mb-2 font-bold text-sm">
                <Navigation className="w-4 h-4" />
                <span>Should I visit / exercise here today?</span>
              </div>
              <p className="text-sm text-slate-700 font-medium leading-relaxed">
                {verdicts?.should_i_go || 'Awaiting live assessment...'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Timeframe: 24-48 Hours</span>
              <span className="font-semibold text-slate-600">Acute Exposure</span>
            </div>
          </div>

          {/* Card B: Long-term / Relocation */}
          <div className="p-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50/80 to-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-700 mb-2 font-bold text-sm">
                <Home className="w-4 h-4" />
                <span>Should I live / relocate here?</span>
              </div>
              <p className="text-sm text-slate-700 font-medium leading-relaxed">
                {verdicts?.should_i_live || 'Awaiting live assessment...'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Timeframe: Multi-Year Residency</span>
              <span className="font-semibold text-slate-600">Chronic Exposure</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mathematical Score Breakdown & Weight Transparency */}
      {score_components && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                Scoring Engine Component Breakdown
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Weighted multi-factor synthesis anchoring decision verdicts on reference data
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              Formula: 60% Current CAMS + 25% Forecast + 15% Ventilation
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Component 1: Current Reference CAMS */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700">1. Current Ambient CAMS</span>
                  <span className="font-semibold text-blue-600 font-mono">60% Weight</span>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {score_components.reference_current?.value_pm25 != null
                    ? `${score_components.reference_current.value_pm25} µg/m³`
                    : '—'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Subscore: <strong>{score_components.reference_current?.subscore || 0}</strong> / 100
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-mono">
                Points Contribution: +{score_components.reference_current?.contribution || 0} pts
              </div>
            </div>

            {/* Component 2: 24h Forecast Trend */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700">2. 24-hr Forecast Trend</span>
                  <span className="font-semibold text-indigo-600 font-mono">25% Weight</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {score_components.reference_forecast_24h?.value_pm25 != null
                      ? `${score_components.reference_forecast_24h.value_pm25} µg/m³`
                      : '—'}
                  </span>
                  <span className="text-xs font-semibold uppercase text-slate-500">
                    ({score_components.reference_forecast_24h?.trend || 'stable'})
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Subscore: <strong>{score_components.reference_forecast_24h?.subscore || 0}</strong> / 100
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-mono">
                Points Contribution: +{score_components.reference_forecast_24h?.contribution || 0} pts
              </div>
            </div>

            {/* Component 3: Surface Dispersion Potential */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700">3. Atmospheric Ventilation</span>
                  <span className="font-semibold text-teal-600 font-mono">15% Weight</span>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {score_components.meteorological_ventilation?.subscore || 0}{' '}
                  <span className="text-xs font-semibold text-slate-500">Index</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Computed from live solar radiation and relative humidity
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-mono">
                Points Contribution: +{score_components.meteorological_ventilation?.contribution || 0} pts
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Secondary ML Context Box (Strict Scientific Distinction) */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0 mt-0.5">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="font-bold text-sm text-slate-900">
                Secondary Meteorological ML Estimate (XGBoost)
              </h4>
              <span className="text-[11px] font-semibold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-200">
                Secondary Context Only
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              {secondary_ml_context?.scientific_limitation ||
                'Trained strictly on historical Delhi winter monitoring data (AT 11-23°C). Provided for meteorological feature attribution (SHAP), not as the primary verdict driver.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-slate-500 font-medium">Model Estimate: </span>
                <strong className="text-slate-900 font-mono">
                  {secondary_ml_context?.estimated_pm25 != null
                    ? `${secondary_ml_context.estimated_pm25} µg/m³`
                    : 'N/A'}
                </strong>
              </div>

              {secondary_ml_context?.delta_to_reference != null && (
                <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 font-medium">Delta to CAMS: </span>
                  <strong
                    className={`font-mono ${
                      secondary_ml_context.delta_to_reference > 0
                        ? 'text-rose-600'
                        : secondary_ml_context.delta_to_reference < 0
                        ? 'text-emerald-600'
                        : 'text-slate-700'
                    }`}
                  >
                    {secondary_ml_context.delta_to_reference > 0 ? '+' : ''}
                    {secondary_ml_context.delta_to_reference} µg/m³
                  </strong>
                </div>
              )}

              <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-slate-500 font-medium">Model Band: </span>
                <strong className="text-slate-900">
                  {secondary_ml_context?.cpcb_category || 'N/A'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
