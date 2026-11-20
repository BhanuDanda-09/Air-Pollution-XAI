import React from 'react';
import { ShieldCheck, Cpu, AlertTriangle, MapPin, Info } from 'lucide-react';

/**
 * CoverageTierBadge: Transparent 3-Tier Precision & Confidence Indicator.
 *
 * Tier 1: Station-validated (CPCB ground station <= 25 km)
 * Tier 2: Model-derived (district centroid or regional transferability <= 50 km)
 * Tier 3: Gridded regional estimate (CAMS ~11 km regional reanalysis cell)
 */
export default function CoverageTierBadge({ coverage, showDetails = true, className = '' }) {
  if (!coverage || !coverage.in_coverage) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ${className}`}>
        <MapPin className="w-3.5 h-3.5 text-slate-400" />
        Outside Target Area
      </span>
    );
  }

  const tierNum = coverage.tier_number || (coverage.tier === 'tier_1' ? 1 : coverage.tier === 'tier_2' ? 2 : 3);
  const confScore = coverage.confidence_score != null ? coverage.confidence_score : 50;
  const confLevel = coverage.confidence_level || (confScore >= 70 ? 'High' : confScore >= 50 ? 'Medium' : 'Low');

  // Styling per tier
  const tierConfigs = {
    1: {
      label: 'Station-Validated',
      tag: 'Tier 1',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      barBg: 'bg-emerald-500',
      icon: ShieldCheck,
      desc: 'Ground CAAQMS Station <= 25 km',
    },
    2: {
      label: 'Model-Derived',
      tag: 'Tier 2',
      bg: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
      barBg: 'bg-sky-500',
      icon: Cpu,
      desc: 'District Centroid / Regional ML Model',
    },
    3: {
      label: 'Gridded Regional Estimate',
      tag: 'Tier 3',
      bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      barBg: 'bg-amber-500',
      icon: AlertTriangle,
      desc: 'CAMS ~11 km Grid Cell (Regional Estimate)',
    },
  };

  const config = tierConfigs[tierNum] || tierConfigs[3];
  const Icon = config.icon;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold border ${config.bg}`}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{config.tag}: {config.label}</span>
        <span className="opacity-40">|</span>
        <span className="font-mono">{confScore}% {confLevel} Confidence</span>
      </div>

      {showDetails && (
        <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
          {coverage.nearest_station && coverage.nearest_station.distance_km != null && (
            <p className="flex items-center gap-1.5">
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span>
                Nearest Ground Station: <strong className="text-slate-800 dark:text-slate-200">{coverage.nearest_station.name}</strong> ({coverage.nearest_station.distance_km} km away)
              </span>
            </p>
          )}

          {tierNum === 3 && (
            <p className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/20 p-2 rounded border border-amber-200/60 dark:border-amber-800/40 mt-1">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>Regional Estimate Notice:</strong> No monitoring station nearby; this is a regional atmospheric estimate (~11 km grid), not a direct ground measurement.
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
