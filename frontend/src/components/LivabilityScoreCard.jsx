import React, { useState } from 'react';
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
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Activity,
  Fan,
  Shield,
  Heart,
  Sparkles,
} from 'lucide-react';

export default function LivabilityScoreCard({ livabilityData }) {
  const [showExplanation, setShowExplanation] = useState(false);

  if (!livabilityData) return null;

  const {
    score,
    raw_score,
    verdict,
    tier,
    color,
    confidence,
    confidence_reason,
    summary,
    reasons = [],
    tailored_advice = {},
    explain_verdict = {},
    health_profile_applied = {},
    score_components,
    primary_driver,
    secondary_ml_context,
    best_time_today,
    seven_day_forecast,
    medical_disclaimer,
  } = livabilityData;

  const isOffline = score === null;

  const getConfidenceBadge = (conf) => {
    switch (conf?.toLowerCase()) {
      case 'high':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          icon: ShieldCheck,
          text: 'High Confidence (Validated Region)',
        };
      case 'moderate':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          icon: ShieldAlert,
          text: 'Moderate Confidence (CAMS Reference)',
        };
      default:
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
          icon: AlertTriangle,
          text: 'Low Confidence (Reference Offline)',
        };
    }
  };

  const getVerdictStyle = (vLabel) => {
    const labelLower = (vLabel || '').toLowerCase();
    if (labelLower.includes('good to go')) {
      return {
        bgBadge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
        cardBg: 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60',
        accentColor: '#10B981',
      };
    }
    if (labelLower.includes('take precautions')) {
      return {
        bgBadge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800',
        cardBg: 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60',
        accentColor: '#F59E0B',
      };
    }
    if (labelLower.includes('avoid outdoor')) {
      return {
        bgBadge: 'bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-800',
        cardBg: 'bg-orange-50/40 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/60',
        accentColor: '#F97316',
      };
    }
    if (labelLower.includes('not recommended')) {
      return {
        bgBadge: 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800',
        cardBg: 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60',
        accentColor: '#EF4444',
      };
    }
    return {
      bgBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
      cardBg: 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800',
      accentColor: color || '#64748B',
    };
  };

  const getTrendIcon = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'improving':
        return <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'worsening':
        return <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getCPCBBadge = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'good':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'satisfactory':
        return 'bg-lime-100 dark:bg-lime-950/60 text-lime-800 dark:text-lime-300 border-lime-300 dark:border-lime-800';
      case 'moderate':
        return 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800';
      case 'poor':
        return 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800';
      case 'very poor':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'severe':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  const confBadge = getConfidenceBadge(confidence);
  const ConfIcon = confBadge.icon;
  const currentVerdict = verdict || tier || 'Unverified';
  const vStyle = getVerdictStyle(currentVerdict);

  return (
    <div className="space-y-6" role="region" aria-live="polite" aria-label="Livability score and outdoor recommendations">
      {/* 1. Master Score & Verdict Hero Banner */}
      <div className={`rounded-2xl p-6 sm:p-8 border shadow-sm relative overflow-hidden bg-white dark:bg-slate-900 ${vStyle.cardBg}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-5">
            {/* Circular / Rounded Gauge Badge */}
            <div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex flex-col items-center justify-center shadow-md text-white font-extrabold shrink-0"
              style={{ backgroundColor: color || vStyle.accentColor }}
            >
              {isOffline ? (
                <span className="text-xl tracking-tight text-white/90">N/A</span>
              ) : (
                <>
                  <span className="text-4xl sm:text-5xl tracking-tighter leading-none">{score}</span>
                  <span className="text-[11px] font-semibold opacity-90 mt-1 uppercase tracking-wider">
                    Score / 100
                  </span>
                </>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${vStyle.bgBadge}`}>
                  {currentVerdict}
                </span>

                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${confBadge.bg}`}>
                  <ConfIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{confBadge.text}</span>
                </span>

                {health_profile_applied?.total_shift > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                    <Heart className="w-3 h-3 text-rose-500" />
                    -{health_profile_applied.total_shift} pts health profile shift
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentVerdict}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl">
                {summary || 'Real-time air pollution livability synthesis.'}
              </p>
            </div>
          </div>

          {/* Primary Reference Driver Card */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs md:max-w-xs text-xs">
            <span className="text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
              Primary Verdict Driver
            </span>
            <p className="font-bold text-slate-800 dark:text-slate-100">
              {primary_driver?.source || 'Reference PM2.5 (CAMS model data)'}
            </p>
            {primary_driver?.current_pm25 != null ? (
              <p className="text-slate-600 dark:text-slate-300 mt-0.5 font-mono">
                Current: <strong className="text-slate-900 dark:text-white">{primary_driver.current_pm25} µg/m³</strong>
              </p>
            ) : (
              <p className="text-rose-600 dark:text-rose-400 mt-0.5 italic">Temporarily unavailable from CAMS API</p>
            )}
          </div>
        </div>

        {/* Confidence note */}
        <div className="py-3 px-4 mt-4 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-400 dark:text-slate-400 shrink-0 mt-0.5" />
          <span>{confidence_reason}</span>
        </div>

        {/* Plain Language Reasons */}
        {reasons.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Decision Factors (Plain Language)
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 2. Tailored Protective Actions Grid (4 Cards) */}
      {tailored_advice && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Tailored Protective Health Advice
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Targeted, actionable steps based on current and forecasted exposure
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              4 Action Steps
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* A: N95 Mask */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-2.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  N95 / Respirator
                </h4>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                  {tailored_advice.n95_mask || 'Follow standard precaution.'}
                </p>
              </div>
            </div>

            {/* B: Indoor Exercise */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-2.5">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Cardio & Exercise
                </h4>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                  {tailored_advice.indoor_exercise || 'Adjust physical activity based on comfort.'}
                </p>
              </div>
            </div>

            {/* C: Windows & Ventilation */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-2.5">
                  <Home className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Windows & Ventilation
                </h4>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                  {tailored_advice.windows || 'Manage ambient air ingress.'}
                </p>
              </div>
            </div>

            {/* D: Air Purifier */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-2.5">
                  <Fan className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  HEPA Air Purifier
                </h4>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                  {tailored_advice.purifier || 'Maintain filtered indoor air.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Temporal Planning: Best Time to Go Out Today & 7-Day Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card A: Best Time to Go Out Today */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm">
                <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Best Time to Go Out Today</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                Hourly Forecast
              </span>
            </div>

            {best_time_today ? (
              <div className="space-y-3 mt-2">
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/60 to-blue-50/60 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Optimal Window</span>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                      Around {best_time_today.hour}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Estimated Lowest PM2.5</span>
                    <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-0.5">
                      {best_time_today.pm25} <span className="text-xs font-semibold">µg/m³</span>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {best_time_today.guidance ||
                    `Plan essential errands, outdoor walking, and commuting during this minimum-exposure window.`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-3">
                Hourly forecast data is temporarily unavailable to establish today's best window.
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
            Source: CAMS hourly Copernicus reanalysis & solar dispersion dynamics
          </div>
        </div>

        {/* Card B: 7-Day Exposure Trend */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>7-Day Exposure Trend</span>
              </div>

              {seven_day_forecast?.trend && (
                <div className="flex items-center gap-1.5 text-xs font-bold capitalize bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                  {getTrendIcon(seven_day_forecast.trend)}
                  <span className="text-slate-800 dark:text-slate-200">{seven_day_forecast.trend} Trend</span>
                </div>
              )}
            </div>

            {seven_day_forecast?.days && seven_day_forecast.days.length > 0 ? (
              <div className="space-y-2 mt-2">
                {/* Horizontal scroll container with min-w-[420px] prevents 768px/360px overflow */}
                <div className="overflow-x-auto pb-1">
                  <div className="min-w-[420px] grid grid-cols-7 gap-1 sm:gap-2">
                    {seven_day_forecast.days.slice(0, 7).map((d, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-center flex flex-col justify-between"
                      >
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {d.date ? d.date.slice(5) : `Day ${idx + 1}`}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white my-1">
                          {Math.round(d.mean_pm25)}
                        </span>
                        <span className={`text-[9px] font-bold px-1 py-0.5 rounded border truncate ${getCPCBBadge(d.cpcb_category)}`}>
                          {d.cpcb_category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Values represent 24-hr daily mean PM2.5 (µg/m³). Long-range exposure trajectory supports relocation & residency decisions.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-3">
                7-day regional Copernicus forecast trend is temporarily unavailable.
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
            Source: Copernicus Atmosphere Monitoring Service 168-hr ECMWF forecast
          </div>
        </div>
      </div>

      {/* 4. Interactive "Explain This Verdict" Panel (Connects Inputs to Reasons) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full p-5 text-left flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/70 hover:bg-slate-100/70 dark:hover:bg-slate-800/90 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                Explain This Verdict (How was this score calculated?)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click to inspect transparent formula weights, input contributions, and ML role
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0">
            <span>{showExplanation ? 'Hide Details' : 'View Full Formula'}</span>
            {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showExplanation && (
          <div className="p-6 space-y-5 border-t border-slate-200/80 dark:border-slate-800 animate-fadeIn">
            {/* Formula Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
              <span className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Scoring Formula: 60% Reference CAMS + 25% 24h Forecast + 15% Dispersion Index
              </span>
              <span className="font-mono text-[11px] bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-700 font-semibold">
                Raw: {raw_score ?? score} pts → Effective: {score} pts
              </span>
            </div>

            {/* Component Contributions Grid */}
            {score_components && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-200">1. Current CAMS Ambient</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">60%</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white">
                    {score_components.reference_current?.value_pm25 != null
                      ? `${score_components.reference_current.value_pm25} µg/m³`
                      : '—'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Points: +<strong>{score_components.reference_current?.contribution || 0}</strong> / 60
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-200">2. 24-hr Forecast Trend</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">25%</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white">
                    {score_components.reference_forecast_24h?.value_pm25 != null
                      ? `${score_components.reference_forecast_24h.value_pm25} µg/m³`
                      : '—'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Points: +<strong>{score_components.reference_forecast_24h?.contribution || 0}</strong> / 25
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-200">3. Atmospheric Dispersion</span>
                    <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">15%</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white">
                    {score_components.meteorological_ventilation?.subscore || 0}{' '}
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Index</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Points: +<strong>{score_components.meteorological_ventilation?.contribution || 0}</strong> / 15
                  </p>
                </div>
              </div>
            )}

            {/* Plain English Input Breakdown */}
            <div className="space-y-2.5 text-xs">
              {explain_verdict.primary_driver && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                  <strong className="text-slate-800 dark:text-slate-200">Primary Driver (CAMS): </strong>
                  <span className="text-slate-600 dark:text-slate-300">{explain_verdict.primary_driver}</span>
                </div>
              )}

              {explain_verdict.forecast_influence && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                  <strong className="text-slate-800 dark:text-slate-200">Forecast Influence: </strong>
                  <span className="text-slate-600 dark:text-slate-300">{explain_verdict.forecast_influence}</span>
                </div>
              )}

              {explain_verdict.meteorological_context && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                  <strong className="text-slate-800 dark:text-slate-200">Dispersion & Ventilation: </strong>
                  <span className="text-slate-600 dark:text-slate-300">{explain_verdict.meteorological_context}</span>
                </div>
              )}

              {explain_verdict.health_profile_tightening && (
                <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80">
                  <strong className="text-amber-900 dark:text-amber-200">Health Profile Adjustment: </strong>
                  <span className="text-amber-800 dark:text-amber-300">{explain_verdict.health_profile_tightening}</span>
                </div>
              )}

              {explain_verdict.secondary_ml_role && (
                <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/70">
                  <strong className="text-blue-900 dark:text-blue-200">Secondary ML Model Role: </strong>
                  <span className="text-blue-800 dark:text-blue-300">{explain_verdict.secondary_ml_role}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Secondary ML Context Box (Strict Scientific Distinction) */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shrink-0 mt-0.5">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Secondary Meteorological ML Context (XGBoost)
              </h4>
              <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                Secondary Context Only
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              {secondary_ml_context?.scientific_limitation ||
                secondary_ml_context?.note ||
                'Trained strictly on historical Delhi winter monitoring data (AT 11-23°C). Provided for meteorological feature attribution (SHAP), not as the primary verdict driver.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Model Estimate: </span>
                <strong className="text-slate-900 dark:text-white font-mono">
                  {secondary_ml_context?.estimated_pm25 != null
                    ? `${secondary_ml_context.estimated_pm25} µg/m³`
                    : 'N/A'}
                </strong>
              </div>

              {secondary_ml_context?.delta_to_reference != null && (
                <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Delta to CAMS: </span>
                  <strong
                    className={`font-mono ${
                      secondary_ml_context.delta_to_reference > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : secondary_ml_context.delta_to_reference < 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {secondary_ml_context.delta_to_reference > 0 ? '+' : ''}
                    {secondary_ml_context.delta_to_reference} µg/m³
                  </strong>
                </div>
              )}

              <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Model Band: </span>
                <strong className="text-slate-900 dark:text-white">
                  {secondary_ml_context?.cpcb_category || 'N/A'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Medical Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-800 dark:text-white">Medical Disclaimer: </strong>
          {medical_disclaimer ||
            'This assessment is informational only and does not constitute medical advice, clinical diagnosis, or treatment. Consult a licensed physician for clinical respiratory or cardiovascular health management.'}
        </p>
      </div>
    </div>
  );
}
