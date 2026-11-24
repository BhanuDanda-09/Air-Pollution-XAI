import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Activity,
  Info,
  CheckCircle2,
} from 'lucide-react';

export default function EarlyWarningBanner({ earlyWarning }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedPollutant, setSelectedPollutant] = useState('pm25');

  if (!earlyWarning) return null;

  const {
    banner = {},
    hourly_series = [],
    reference_label = 'Regional estimate (CAMS)',
    horizon_hours = 72,
  } = earlyWarning;

  const {
    has_warning,
    severity_level = 'Normal',
    trigger_pollutant,
    formatted_start,
    duration_hours = 0,
    peak_concentration,
    title,
    message,
    advisory,
  } = banner;

  const getSeverityStyle = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'severe':
        return {
          bannerBg: 'bg-rose-900/90 dark:bg-rose-950/90 text-white border-rose-500 shadow-rose-900/20',
          badgeBg: 'bg-rose-500 text-white',
          iconColor: 'text-rose-200',
          accentBorder: 'border-rose-400',
        };
      case 'very poor':
        return {
          bannerBg: 'bg-orange-900/90 dark:bg-orange-950/90 text-white border-orange-500 shadow-orange-900/20',
          badgeBg: 'bg-orange-500 text-white',
          iconColor: 'text-orange-200',
          accentBorder: 'border-orange-400',
        };
      case 'poor':
        return {
          bannerBg: 'bg-amber-900/90 dark:bg-amber-950/90 text-white border-amber-500 shadow-amber-900/20',
          badgeBg: 'bg-amber-500 text-white',
          iconColor: 'text-amber-200',
          accentBorder: 'border-amber-400',
        };
      default:
        return {
          bannerBg: 'bg-emerald-900/80 dark:bg-emerald-950/80 text-white border-emerald-500 shadow-emerald-900/20',
          badgeBg: 'bg-emerald-500 text-white',
          iconColor: 'text-emerald-200',
          accentBorder: 'border-emerald-400',
        };
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'good':
        return 'bg-emerald-500 text-white';
      case 'satisfactory':
        return 'bg-lime-500 text-white';
      case 'moderate':
        return 'bg-amber-500 text-white';
      case 'poor':
        return 'bg-orange-500 text-white';
      case 'very poor':
        return 'bg-rose-600 text-white';
      case 'severe':
        return 'bg-purple-700 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  const style = getSeverityStyle(severity_level);

  // Filter series to max 48-72 hours
  const displaySeries = hourly_series.slice(0, Math.min(horizon_hours, 72));

  return (
    <div className="space-y-3" role="region" aria-label="Air Quality Early Warning System">
      {/* 1. Early Warning Alert Banner */}
      {has_warning ? (
        <div
          className={`rounded-2xl p-5 sm:p-6 border-2 shadow-lg transition-all ${style.bannerBg}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-white/10 shrink-0">
                <AlertTriangle className={`w-7 h-7 ${style.iconColor}`} />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${style.badgeBg}`}
                  >
                    Warning: {severity_level} Band
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white">
                    {reference_label}
                  </span>
                  {trigger_pollutant && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/15 text-white/90">
                      Trigger: {trigger_pollutant}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black tracking-tight">{title}</h3>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-3xl">
                  {message}
                </p>
              </div>
            </div>

            {/* Quick Metrics Pill */}
            <div className="flex sm:flex-col gap-2 shrink-0 bg-black/20 p-3 rounded-xl border border-white/10 text-xs">
              {formatted_start && (
                <div className="flex items-center gap-1.5 text-white/90">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Starts: <strong>{formatted_start}</strong></span>
                </div>
              )}
              {duration_hours > 0 && (
                <div className="flex items-center gap-1.5 text-white/90">
                  <Calendar className="w-3.5 h-3.5 text-sky-300" />
                  <span>Duration: <strong>~{duration_hours} hrs</strong></span>
                </div>
              )}
              {peak_concentration != null && (
                <div className="flex items-center gap-1.5 text-white/90">
                  <Flame className="w-3.5 h-3.5 text-rose-300" />
                  <span>Peak: <strong>{peak_concentration} µg/m³</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Action / Advisory footer */}
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white/80">
            <span className="italic">
              {advisory || 'Advisory notice: Recommendations follow official CAQM / CPCB protocols.'}
            </span>
            <button
              type="button"
              onClick={() => setShowTimeline(!showTimeline)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{showTimeline ? 'Hide 72h Timeline' : 'View 72h Forecast Chart'}</span>
              {showTimeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white">
                Early Warning Status: Moderate / Normal Baseline
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                No Poor, Very Poor, or Severe episodes are forecast in the next 24–72 hours.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              {reference_label}
            </span>
            <button
              type="button"
              onClick={() => setShowTimeline(!showTimeline)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
            >
              <Activity className="w-3 h-3 text-blue-600" />
              <span>{showTimeline ? 'Hide Timeline' : '72h Forecast Chart'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. 24–72 Hour Regional Estimate (CAMS) Timeline Chart */}
      {showTimeline && displaySeries.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  24–72 Hour Hourly Forecast Timeline
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                  {reference_label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Atmospheric chemistry forecast from Copernicus Atmosphere Monitoring Service (CAMS)
              </p>
            </div>

            {/* Pollutant selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { id: 'pm25', label: 'PM2.5' },
                { id: 'pm10', label: 'PM10' },
                { id: 'no2', label: 'NO2' },
                { id: 'o3', label: 'O3' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPollutant(p.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    selectedPollutant === p.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* CPCB Threshold Reference Legend */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
            <span className="font-bold uppercase tracking-wider text-slate-400">CPCB Bands:</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">Good (0-30)</span>
            <span className="px-1.5 py-0.5 rounded bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300 font-semibold">Satisfactory (31-60)</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold">Moderate (61-90)</span>
            <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-semibold">Poor (91-120)</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold">Very Poor (121-250)</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-semibold">Severe (&gt;250)</span>
          </div>

          {/* Scrollable Hourly Bar/Timeline View */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[650px] flex items-end gap-1.5 h-36 pt-4 border-b border-slate-200 dark:border-slate-800">
              {displaySeries.map((item, idx) => {
                const val = item[selectedPollutant] ?? item.pm25 ?? 0;
                // Calculate height percentage up to 300 µg/m³
                const maxScale = selectedPollutant === 'pm10' ? 450 : 250;
                const heightPct = Math.min(100, Math.max(12, (val / maxScale) * 100));
                const timeLabel = item.time?.includes('T')
                  ? item.time.split('T')[1]?.slice(0, 5)
                  : `${idx}h`;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="hidden group-hover:block absolute -top-12 z-20 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-md whitespace-nowrap pointer-events-none">
                      <div className="font-bold">{item.time?.replace('T', ' ')}</div>
                      <div>{val} µg/m³ ({item.category})</div>
                    </div>

                    <span className="text-[9px] font-mono text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {Math.round(val)}
                    </span>

                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${getCategoryColor(
                        item.category
                      )} ${item.is_warning ? 'ring-2 ring-rose-400' : ''}`}
                    />

                    <span className="text-[9px] text-slate-400 mt-1 font-mono">
                      {idx % 4 === 0 ? timeLabel : '·'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Horizontal scale: Next 72 hours (hourly intervals)</span>
            <span className="font-semibold">{reference_label}</span>
          </div>
        </div>
      )}
    </div>
  );
}
