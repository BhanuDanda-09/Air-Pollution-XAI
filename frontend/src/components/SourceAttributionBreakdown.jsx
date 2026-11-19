import React, { useState } from 'react';
import {
  Factory,
  Flame,
  Car,
  Layers,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  PieChart,
} from 'lucide-react';

const SECTOR_ICONS = {
  vehicles: Car,
  biomass: Flame,
  secondary_aerosols: Sparkles,
  industrial: Factory,
  dust: Layers,
};

export default function SourceAttributionBreakdown({ attributionData }) {
  if (!attributionData || !attributionData.sectors) return null;

  const {
    primary_source,
    primary_percentage,
    secondary_source,
    secondary_percentage,
    sectors,
    narrative_summary,
    scientific_methodology,
  } = attributionData;

  const [expandedSector, setExpandedSector] = useState(sectors[0]?.id || null);

  const toggleSector = (id) => {
    setExpandedSector(expandedSector === id ? null : id);
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Source Attribution</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              IIT-Kanpur / TERI Airshed Proxy
            </span>
          </div>
          <h3 className="text-xl font-bold text-navy-800 mt-1 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            <span>Emission Source Apportionment</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Heuristic breakdown of regional pollution origin sectors based on surface wind vectors, temperature, and moisture.
          </p>
        </div>

        {/* Primary Driver Pill */}
        <div className="sm:text-right shrink-0">
          <span className="text-xs text-slate-500">Leading Source:</span>
          <div className="text-sm font-extrabold text-rose-600">
            {primary_source} ({primary_percentage}%)
          </div>
        </div>
      </div>

      {/* Multi-color Segmented Distribution Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
          <span>Estimated Source Sector Distribution</span>
          <span className="text-slate-400 font-normal">Total: 100%</span>
        </div>
        <div className="h-4 w-full rounded-full overflow-hidden flex shadow-inner bg-slate-100">
          {sectors.map((s) => (
            <div
              key={s.id}
              style={{
                width: `${s.percentage}%`,
                backgroundColor: s.color,
              }}
              className="h-full transition-all duration-500 hover:opacity-85 cursor-pointer"
              title={`${s.name}: ${s.percentage}%`}
              onClick={() => toggleSector(s.id)}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-slate-600">
          {sectors.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleSector(s.id)}
              className={`inline-flex items-center gap-1.5 transition-colors ${
                expandedSector === s.id ? 'font-bold text-slate-900' : 'hover:text-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span>{s.name}</span>
              <span className="font-semibold text-slate-700">({s.percentage}%)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Narrative Synthesis Card */}
      {narrative_summary && (
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-950 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-blue-900">Meteorological Trajectory Synthesis:</span>
            <p className="leading-relaxed text-blue-900/90">{narrative_summary}</p>
          </div>
        </div>
      )}

      {/* Interactive Sector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {sectors.map((sector) => {
          const Icon = SECTOR_ICONS[sector.id] || Layers;
          const isExpanded = expandedSector === sector.id;

          const levelBadgeClass =
            sector.contribution_level === 'High'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : sector.contribution_level === 'Moderate'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-50 text-slate-600 border-slate-200';

          return (
            <div
              key={sector.id}
              onClick={() => toggleSector(sector.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isExpanded
                  ? 'border-blue-400 bg-blue-50/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: sector.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {sector.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-black text-slate-800">{sector.percentage}%</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${levelBadgeClass}`}>
                        {sector.contribution_level} Impact
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                  aria-label="Toggle details"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Driving Factors Details */}
              {isExpanded && sector.driving_factors && sector.driving_factors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5 animate-fadeIn">
                  <span className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                    Meteorological Driving Mechanisms:
                  </span>
                  <ul className="space-y-1 pl-1">
                    {sector.driving_factors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px] leading-relaxed">
                        <span className="text-blue-500 font-bold mt-0.5">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scientific Methodology Footer */}
      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2.5">
        <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-700">Methodology & Source Attribution Distinction:</strong>{' '}
          {scientific_methodology}
        </p>
      </div>
    </div>
  );
}
