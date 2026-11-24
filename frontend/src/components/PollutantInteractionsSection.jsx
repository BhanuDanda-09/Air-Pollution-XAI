import React, { useState, useEffect } from 'react';
import {
  Flame,
  Layers,
  Sun,
  Factory,
  Car,
  Activity,
  Info,
  RefreshCw,
  GitCommit,
  Network,
} from 'lucide-react';
import airService from '../services/airService';

const ICON_MAP = {
  Flame: Flame,
  Layers: Layers,
  Sun: Sun,
  Factory: Factory,
  Car: Car,
};

export default function PollutantInteractionsSection({ latitude, longitude }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredPair, setHoveredPair] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchInteractions() {
      if (!latitude || !longitude) return;
      setLoading(true);
      setError(null);
      try {
        const res = await airService.getPollutantInteractions({ lat: latitude, lon: longitude, days: 7 });
        if (isMounted) {
          setData(res);
        }
      } catch (err) {
        console.warn('Failed to load pollutant interactions:', err);
        if (isMounted) setError('Unable to load pollutant interactions.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchInteractions();
    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3 text-xs text-slate-500">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
        <span>Computing 7-day multi-pollutant Pearson correlations...</span>
      </div>
    );
  }

  if (error || !data) return null;

  const {
    pollutants = ['PM2.5', 'PM10', 'NO2', 'SO2', 'CO', 'O3'],
    matrix = [],
    readings = [],
    reference_source = 'Open-Meteo European CAMS Atmospheric Reanalysis',
  } = data;

  const getHeatmapColor = (r) => {
    if (r === 1.0) return 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold';
    if (r >= 0.7) return 'bg-rose-500 text-white font-bold';
    if (r >= 0.4) return 'bg-orange-500 text-white font-semibold';
    if (r >= 0.15) return 'bg-amber-400 text-slate-900 font-medium';
    if (r > -0.15) return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
    if (r > -0.4) return 'bg-sky-400 text-slate-900 font-medium';
    return 'bg-blue-600 text-white font-bold';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              <Network className="w-4 h-4" />
            </span>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Pollutant Interactions & Atmospheric Coupling
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            7-day empirical Pearson correlation matrix across all 6 criteria pollutants. Correlated patterns uncover underlying source mechanisms (e.g. combustion co-emission or photochemical titration).
          </p>
        </div>

        <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 self-start sm:self-auto">
          7-Day Rolling History
        </span>
      </div>

      {/* Main Grid: Heatmap + Plain Language Readings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Heatmap Section (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>Pearson Correlation Matrix (r)</span>
            <span className="text-[10px] text-slate-400 font-mono">-1.00 to +1.00</span>
          </div>

          <div className="overflow-x-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <table className="w-full text-center text-xs font-mono">
              <thead>
                <tr>
                  <th className="p-1 text-[11px] text-slate-400"></th>
                  {pollutants.map((p) => (
                    <th key={p} className="p-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={pollutants[i]}>
                    <td className="p-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 text-left">
                      {pollutants[i]}
                    </td>
                    {row.map((val, j) => {
                      const p1 = pollutants[i];
                      const p2 = pollutants[j];
                      const isHighlighted =
                        hoveredPair &&
                        ((hoveredPair[0] === p1 && hoveredPair[1] === p2) ||
                          (hoveredPair[0] === p2 && hoveredPair[1] === p1));

                      return (
                        <td
                          key={p2}
                          className="p-1"
                          onMouseEnter={() => setHoveredPair([p1, p2])}
                          onMouseLeave={() => setHoveredPair(null)}
                        >
                          <div
                            className={`p-1 rounded text-[11px] transition-transform ${getHeatmapColor(
                              val
                            )} ${isHighlighted ? 'ring-2 ring-blue-500 scale-105 shadow-xs' : ''}`}
                          >
                            {val > 0 && val !== 1 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Color Scale Legend */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span className="text-blue-600 dark:text-blue-400 font-bold">Inverse (-1.0)</span>
            <span>Uncorrelated (0.0)</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">Coupled (+1.0)</span>
          </div>
        </div>

        {/* Plain Language Readings Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Plain-Language Chemical & Meteorological Readings
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {readings.map((r, idx) => {
              const IconComp = ICON_MAP[r.icon] || Activity;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredPair(r.pollutants)}
                  onMouseLeave={() => setHoveredPair(null)}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-default"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: r.color }}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {r.pollutants.join(' & ')}
                      </span>
                    </div>

                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                      style={{
                        backgroundColor: `${r.color}20`,
                        color: r.color,
                      }}
                    >
                      r = {r.correlation > 0 ? `+${r.correlation.toFixed(2)}` : r.correlation.toFixed(2)}
                    </span>
                  </div>

                  <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {r.title}
                  </h5>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {r.reading}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer attribution */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>Reference Data: {reference_source}</span>
        <span className="italic">Scientific interpretation conforms to CPCB multi-criteria air quality dynamics</span>
      </div>
    </div>
  );
}
