import React, { useState, useEffect } from 'react';
import {
  Flame,
  Search,
  Filter,
  MapPin,
  TrendingUp,
  ShieldAlert,
  Info,
  Layers,
  Activity,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import airService from '../services/airService';

const REGIONS = ['All', 'North', 'South', 'West', 'East', 'Central', 'Northeast'];
const TIERS = [
  'All',
  'Severe Persistent Basin',
  'Winter Episodic Hotspot',
  'Industrial / Transit Corridor',
  'Coastal Marine Dispersion',
  'Highland / Clean Sanctuary',
];

export default function HotspotsPage() {
  usePageMeta({
    title: 'National Hotspots | AirIQ India',
    description: 'All-India 45-city exposure percentiles, seasonal inversion ratios, and regional vulnerability tiers.',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ national_rankings: [], regional_summaries: {} });

  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedTier, setSelectedTier] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    async function fetchHotspots() {
      setLoading(true);
      setError(null);
      try {
        const res = await airService.getHotspots({ limit: 45 });
        if (res.success || res.rankings) {
          setData({
            national_rankings: res.rankings || [],
            regional_summaries: res.regional_summaries || {},
            metadata: res.metadata || {},
          });
        }
      } catch (err) {
        console.error('Failed to load hotspots', err);
        setError('Failed to load nationwide hotspot analysis.');
      } finally {
        setLoading(false);
      }
    }
    fetchHotspots();
  }, []);

  const filteredCities = (data.national_rankings || []).filter((city) => {
    const matchesRegion = selectedRegion === 'All' || city.region === selectedRegion;
    const matchesTier = selectedTier === 'All' || city.cluster_tier?.includes(selectedTier);
    const matchesSearch =
      !searchFilter ||
      city.city_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      city.state?.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesRegion && matchesTier && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-semibold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            National Exposure Intelligence
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            All-India Pollution Hotspots & City Rankings
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Rigorous statistical ranking across 45 Indian monitoring hubs based on annualized PM2.5, peak percentile exposure (P90 & P99), and seasonal inversion severity.
          </p>
        </div>

        {/* Regional Summary Metrics Grid */}
        {Object.keys(data.regional_summaries || {}).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(data.regional_summaries).map(([reg, summary]) => (
              <div
                key={reg}
                onClick={() => setSelectedRegion(selectedRegion === reg ? 'All' : reg)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedRegion === reg
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{reg} India</div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {summary.mean_pm25_region} <span className="text-xs text-slate-400 font-normal">µg/m³</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {summary.total_cities} cities monitored
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search city or state..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Region Filter Buttons */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              <span className="text-xs text-slate-400 self-center mr-1 hidden sm:inline">Region:</span>
              {REGIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(r)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                    selectedRegion === r
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Tier Pills Filter */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 self-center mr-1">Vulnerability Tier:</span>
            {TIERS.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTier(t)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  selectedTier === t
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Cities Table / Grid */}
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-sm text-slate-500">Loading All-India Hotspot Rankings...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">Rank</th>
                    <th className="py-3 px-4">City / State</th>
                    <th className="py-3 px-3">Region</th>
                    <th className="py-3 px-3">Vulnerability Tier</th>
                    <th className="py-3 px-3 text-right">Mean PM2.5</th>
                    <th className="py-3 px-3 text-right">P90 (Peak)</th>
                    <th className="py-3 px-3 text-right">P99 (Extreme)</th>
                    <th className="py-3 px-3 text-right">Winter Ratio</th>
                    <th className="py-3 px-3 text-right">Representative AQI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCities.map((city) => (
                    <tr
                      key={city.city_id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-extrabold text-slate-400">
                        #{city.national_hotspot_rank}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{city.city_name}</div>
                        <div className="text-[11px] text-slate-400">{city.state}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {city.region}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            city.cluster_tier?.includes('Severe')
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                              : city.cluster_tier?.includes('Winter')
                              ? 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300'
                              : city.cluster_tier?.includes('Industrial')
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                              : city.cluster_tier?.includes('Highland') || city.cluster_tier?.includes('Sanctuary')
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                              : 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300'
                          }`}
                        >
                          {city.cluster_tier}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-800 dark:text-slate-200">
                        {city.mean_pm25} µg/m³
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                        {city.p90_pm25} µg/m³
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                        {city.p99_pm25} µg/m³
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                        {city.seasonal_winter_summer_ratio}×
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-extrabold px-2 py-0.5 rounded ${
                            city.representative_cpcb_aqi > 250
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : city.representative_cpcb_aqi > 150
                              ? 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {city.representative_cpcb_aqi}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Methodology Notes */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
          <div className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600" />
            <span>Traffic Data & Clustering Methodology (For Viva Defense)</span>
          </div>
          <p>
            <strong>Traffic Density Limitation:</strong> Real-time vehicular traffic density lacks a free, open-access national API across India. Urban vehicular emission exposure is represented through municipality tier classifications (Metro vs Industrial vs Highland) and diurnal rush-hour harmonic features. Commercial traffic API integration (TomTom / Google) is documented under Future Scope.
          </p>
          <p>
            <strong>Percentile Thresholds:</strong> $P_{90}$ represents the concentration exceeded on only 10% of days (episodic winter spikes), while $P_{99}$ isolates emergency pollution events.
          </p>
        </div>

      </div>
    </div>
  );
}
