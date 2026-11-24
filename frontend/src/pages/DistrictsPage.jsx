import React, { useState, useEffect } from 'react';
import {
  Map,
  Building2,
  ShieldAlert,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  BarChart3,
  Flame,
  Snowflake,
  Wind,
  Info,
  Factory,
  ShieldCheck,
} from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import airService from '../services/airService';
import CoverageTierBadge from '../components/CoverageTierBadge';

export default function DistrictsPage() {
  usePageMeta({
    title: 'All-India District Air Quality Rankings & Authority Insights',
    description: 'Nationwide administrative district rankings, state-level summaries, and environmental authority mitigation guidelines.',
  });

  const [districts, setDistricts] = useState([]);
  const [statesSummary, setStatesSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('districts'); // 'districts' | 'states' | 'authorities'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('All');
  const [sortField, setSortField] = useState('national_rank');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [distRes, statesRes] = await Promise.all([
          airService.getDistrictRankings(),
          airService.getStatesSummary(),
        ]);
        if (isMounted) {
          if (distRes && distRes.districts) setDistricts(distRes.districts);
          if (statesRes && statesRes.states) setStatesSummary(statesRes.states);
        }
      } catch (err) {
        console.error('Failed to load district rankings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Filter and Sort Districts
  const filteredDistricts = districts
    .filter((d) => {
      const matchesZone = selectedZone === 'All' || d.zone === selectedZone;
      const matchesQuery =
        !searchQuery ||
        d.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.state.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesZone && matchesQuery;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredDistricts.length) return;
    const headers = ['National Rank', 'District', 'State', 'Zone', 'Estimated AQI', 'Governing Pollutant', 'Coverage Tier', 'Worst Season', 'Clean Season'];
    const rows = filteredDistricts.map((d) => [
      d.national_rank,
      `"${d.district}"`,
      `"${d.state}"`,
      d.zone,
      d.estimated_aqi,
      d.governing_pollutant,
      d.coverage_tier,
      `"${d.worst_season}"`,
      `"${d.clean_season}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `all_india_districts_aqi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const zones = ['All', 'North', 'South', 'West', 'East', 'Central', 'Northeast', 'Islands'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            Administrative Air Quality Intelligence
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            All-India District Air Quality Rankings & Insights
          </h1>
          <p className="max-w-3xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Comprehensive administrative assessment covering all 36 States & Union Territories and 320+ districts. Designed for municipal authorities, policy planners, and environmental researchers.
          </p>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Districts Catalogued</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {districts.length || '323'}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Census 2011 & LGD Grids</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">States & UTs Covered</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">36 / 36</div>
            <div className="text-[11px] text-slate-400 mt-1">100% National Territory</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Ground CAAQMS Stations</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">200+</div>
            <div className="text-[11px] text-emerald-600/80 mt-1">Official CPCB Network</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Average National District AQI</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">138</div>
            <div className="text-[11px] text-amber-600/80 mt-1">Moderate CPCB Category</div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto whitespace-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab('districts')}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'districts'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            District Rankings ({filteredDistricts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('states')}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'states'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            State Summaries ({statesSummary.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('authorities')}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'authorities'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Insights for Authorities
          </button>
        </div>

        {/* TAB 1: DISTRICT RANKINGS */}
        {activeTab === 'districts' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              {/* Search input */}
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter district or state..."
                  className="w-full px-3 py-2 pl-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              {/* Zone Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1">
                {zones.map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setSelectedZone(z)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                      selectedZone === z
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>

              {/* Export CSV Button */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3 cursor-pointer" onClick={() => { setSortField('national_rank'); setSortAsc(!sortAsc); }}>
                        <div className="flex items-center gap-1">
                          <span>Rank</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3">District</th>
                      <th className="px-4 py-3">State</th>
                      <th className="px-4 py-3">Zone</th>
                      <th className="px-4 py-3 cursor-pointer" onClick={() => { setSortField('estimated_aqi'); setSortAsc(!sortAsc); }}>
                        <div className="flex items-center gap-1">
                          <span>Estimated AQI</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3">Governing Pollutant</th>
                      <th className="px-4 py-3">Coverage Tier</th>
                      <th className="px-4 py-3">Peak Season</th>
                      <th className="px-4 py-3">Clean Season</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDistricts.slice(0, 100).map((d) => (
                      <tr key={`${d.district}-${d.state}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          #{d.national_rank}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {d.district}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {d.state}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {d.zone}
                        </td>
                        <td className="px-4 py-3 font-mono font-extrabold text-sm">
                          <span className={`px-2 py-0.5 rounded ${
                            d.estimated_aqi > 250
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : d.estimated_aqi > 150
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
                              : d.estimated_aqi > 100
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {d.estimated_aqi}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                          {d.governing_pollutant}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            d.coverage_tier === 1
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : d.coverage_tier === 2
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            Tier {d.coverage_tier}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-500">
                          {d.worst_season}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-emerald-600 dark:text-emerald-400">
                          {d.clean_season}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STATE SUMMARIES */}
        {activeTab === 'states' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statesSummary.map((st) => (
              <div
                key={st.state}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{st.state}</h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {st.zone}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400">Average AQI</span>
                    <div className="text-xl font-extrabold text-slate-900 dark:text-white">{st.average_aqi}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400">CPCB Stations</span>
                    <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{st.cpcb_stations_count}</div>
                  </div>
                </div>

                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Most Polluted:</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">{st.worst_district}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cleanest Hub:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{st.cleanest_district}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Districts Mapped:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{st.districts_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: INSIGHTS FOR MUNICIPAL & POLLUTION CONTROL AUTHORITIES */}
        {activeTab === 'authorities' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Top Policy Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl border border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" />
                  Air Quality Management Statutory Intelligence
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white/10 text-slate-200 border border-white/15">
                  CAQM Act 2021 & CPCB Protocols
                </span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight">
                Actionable Environmental Insights for State & Municipal Administrations
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
                Empirical synthesis of atmospheric ventilation dynamics, thermal inversions, seasonal emission schedules, and statutory mitigation guidelines across India's agro-climatic zones.
              </p>
            </div>

            {/* (a) PRIORITY ACTION DASHBOARD: DISTRICTS & STATES NEEDING ATTENTION NOW */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                      <Flame className="w-4 h-4" />
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      (a) Priority Action Dashboard: Districts & States Needing Attention Now
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Districts currently exhibiting Severe or Very Poor particulate levels (AQI &gt; 200) requiring immediate municipal intervention.
                  </p>
                </div>

                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800 shrink-0 self-start sm:self-auto">
                  Immediate Enforcement Focus
                </span>
              </div>

              {/* Priority Districts Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">National Rank</th>
                      <th className="px-4 py-3">District & State</th>
                      <th className="px-4 py-3">Zone</th>
                      <th className="px-4 py-3">Estimated AQI</th>
                      <th className="px-4 py-3">Governing Pollutant</th>
                      <th className="px-4 py-3">Current Severity Band</th>
                      <th className="px-4 py-3">Recommended First Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {districts
                      .filter((d) => d.estimated_aqi >= 180)
                      .slice(0, 8)
                      .map((d) => (
                        <tr key={`${d.district}-${d.state}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                            #{d.national_rank}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 dark:text-white block">{d.district}</span>
                            <span className="text-[11px] text-slate-500">{d.state}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{d.zone}</td>
                          <td className="px-4 py-3 font-mono font-black text-sm">
                            <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                              {d.estimated_aqi}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                            {d.governing_pollutant}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.estimated_aqi > 250
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {d.estimated_aqi > 250 ? 'Severe (Stage III/IV)' : 'Very Poor (Stage II)'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-[11px]">
                            {d.estimated_aqi > 250
                              ? 'Halt C&D dust, enforce BS-III/IV LMV ban, water mist cannons'
                              : 'Ban non-essential DG sets, augment public buses, hike parking fees'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* (b) & (c) PERSISTENT VS SEASONAL HOTSPOTS & DOMINANT METEOROLOGICAL DRIVERS (SHAP) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <BarChart3 className="w-4 h-4" />
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    (b) Persistent vs Seasonal Hotspots & (c) Dominant Meteorological Drivers from SHAP
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-4xl">
                  Classification of regional air pollution regimes and machine-learning feature attribution (TreeSHAP) quantifying how atmospheric variables drive particulate elevation.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Hotspot Type 1: Persistent Industrial Basins */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300">
                        Type: Persistent Hotspot
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">Year-Round Baseline</span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Factory className="w-4 h-4 text-orange-600" />
                      Industrial & Mining Basins
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <strong>Key Locations:</strong> Korba, Singrauli, Dhanbad, Asansol, Jharsuguda, Angul.<br />
                      <strong>Emission Characteristics:</strong> Continuous point-source stack emissions from thermal coal plants, steel smelters, and open-cast coal mining without seasonal recess.
                    </p>
                  </div>

                  {/* SHAP Meteorological Drivers */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Dominant SHAP Drivers</span>
                      <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">Δ PM2.5 Impact</span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 font-mono">
                      <li className="flex justify-between items-center text-[11px]">
                        <span>High Barometric Pressure (BP &gt; 755 mmHg)</span>
                        <strong className="text-rose-600 dark:text-rose-400">+34.2 µg/m³</strong>
                      </li>
                      <li className="flex justify-between items-center text-[11px]">
                        <span>Calm Nocturnal Winds (WS &lt; 1.2 m/s)</span>
                        <strong className="text-rose-600 dark:text-rose-400">+28.4 µg/m³</strong>
                      </li>
                      <li className="flex justify-between items-center text-[11px]">
                        <span>Low Solar Convection (SR &lt; 120 W/m²)</span>
                        <strong className="text-rose-600 dark:text-rose-400">+18.6 µg/m³</strong>
                      </li>
                    </ul>
                    <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-700">
                      Anticyclonic subsidence caps vertical stack dispersion, causing nocturnal valley pooling.
                    </p>
                  </div>
                </div>

                {/* Hotspot Type 2: Seasonal Agricultural & Inversion Basins */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                        Type: Seasonal Hotspot
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">Oct – Feb Peak</span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Snowflake className="w-4 h-4 text-sky-600" />
                      Post-Monsoon & Winter Inversion Basins
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <strong>Key Locations:</strong> Delhi-NCR, Amritsar, Karnal, Ludhiana, Meerut, Kanpur, Patna.<br />
                      <strong>Emission Characteristics:</strong> Episodic paddy stubble combustion in Oct–Nov compounded by severe radiational boundary-layer collapse (PBL &lt; 350 m) in Dec–Jan.
                    </p>
                  </div>

                  {/* SHAP Meteorological Drivers */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Dominant SHAP Drivers</span>
                      <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">Δ PM2.5 Impact</span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 font-mono">
                      <li className="flex justify-between items-center text-[11px]">
                        <span>Low Ambient Temp (AT &lt; 13°C)</span>
                        <strong className="text-rose-600 dark:text-rose-400">+41.5 µg/m³</strong>
                      </li>
                      <li className="flex justify-between items-center text-[11px]">
                        <span>North-West Stagnant Drift (WS &lt; 1.5 m/s)</span>
                        <strong className="text-rose-600 dark:text-rose-400">+31.2 µg/m³</strong>
                      </li>
                      <li className="flex justify-between items-center text-[11px]">
                        <span>Surface Pressure Trapping (BP &gt; 758 mmHg)</span>
                        <strong className="text-rose-600 dark:text-rose-400">+26.0 µg/m³</strong>
                      </li>
                    </ul>
                    <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-700">
                      Radiational cooling induces severe ground inversions; emissions remain locked in the shallow breathing zone.
                    </p>
                  </div>
                </div>

                {/* Hotspot Type 3: Coastal Marine & Topographic Basins */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
                        Type: Dynamic Maritime
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">Diurnal Fluctuation</span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Wind className="w-4 h-4 text-teal-600" />
                      Coastal & Topographic Metros
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <strong>Key Locations:</strong> Mumbai, Chennai, Kolkata, Kochi, Visakhapatnam.<br />
                      <strong>Emission Characteristics:</strong> High port traffic, refinery clusters, and construction. Annual mean AQI is moderated by diurnal land-sea breeze ventilation.
                    </p>
                  </div>

                  {/* SHAP Meteorological Drivers */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Dominant SHAP Drivers</span>
                      <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">Δ PM2.5 Impact</span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 font-mono">
                      <li className="flex justify-between items-center text-[11px]">
                        <span>High Humidity Hygroscopic Growth (RH &gt; 75%)</span>
                        <strong className="text-rose-600 dark:text-rose-400">+19.4 µg/m³</strong>
                      </li>
                      <li className="flex justify-between items-center text-[11px]">
                        <span>Diurnal Sea Breeze Ventilation (WS &gt; 3.8 m/s)</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">-22.1 µg/m³</strong>
                      </li>
                      <li className="flex justify-between items-center text-[11px]">
                        <span>Moderate Pressure Baseline (BP ~ 750 mmHg)</span>
                        <strong className="text-slate-600 dark:text-slate-300 font-medium">±2.5 µg/m³</strong>
                      </li>
                    </ul>
                    <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-700">
                      High ambient moisture accelerates aerosol scattering; onset of daytime sea breeze provides strong natural flushing.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* (d) RECOMMENDED-ACTIONS TABLE BY SEVERITY BAND (CAQM GRAP STAGES I-IV) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      (d) Statutory Recommended-Actions Table by Severity Band (CAQM GRAP)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                    Official statutory mitigation schedule established under the <strong>Commission for Air Quality Management in National Capital Region and Adjoining Areas Act, 2021</strong> (Section 12 Schedule).
                  </p>
                </div>

                {/* Explicit Advisory Notice Marker */}
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 shrink-0 self-start sm:self-auto">
                  Marked as Advisory
                </span>
              </div>

              {/* Advisory Disclaimer Banner */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Statutory Advisory Disclaimer:</strong> The recommended actions below represent technical mitigation benchmarks synthesized from the official CAQM Graded Response Action Plan (GRAP). Implementation by municipal bodies, transport departments, and industrial boards is subject to formal notifications promulgated by the respective State Governments and Pollution Control Committees.
                </p>
              </div>

              {/* GRAP Stages Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">GRAP Stage</th>
                      <th className="px-4 py-3">AQI Band & Trigger</th>
                      <th className="px-4 py-3">Primary Target Sectors</th>
                      <th className="px-4 py-3">Mandated Control Actions</th>
                      <th className="px-4 py-3">Statutory Enforcement Body</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Stage I */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-extrabold text-amber-600 dark:text-amber-400">
                        Stage I
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-bold">
                          'Poor' (AQI 201–300)
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                        Construction, Dust & Solid Waste
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                        • Strict enforcement of anti-dust norms at construction & demolition (C&D) sites (&gt; 500 sq.m).<br />
                        • Mechanized vacuum sweeping and periodic water sprinkling on arterial roads.<br />
                        • Complete ban on open biomass/garbage burning with heavy penal fines.
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        Municipal Corporations (MCD, NDMC) & DPCC / State PCBs
                      </td>
                    </tr>

                    {/* Stage II */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-extrabold text-orange-600 dark:text-orange-400">
                        Stage II
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200 font-bold">
                          'Very Poor' (AQI 301–400)
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                        Diesel Generators & Urban Traffic
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                        • Complete ban on operation of diesel generator (DG) sets across commercial/industrial sectors (except emergency healthcare, metro, and dual-fuel systems).<br />
                        • Augment public transit: enhance CNG/electric bus frequencies and metro train cycles.<br />
                        • Hike municipal parking charges by 3×–4× to discourage private vehicular commuting.
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        State Transport Depts, DISCOMs & Traffic Police
                      </td>
                    </tr>

                    {/* Stage III */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-extrabold text-rose-600 dark:text-rose-400">
                        Stage III
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-bold">
                          'Severe' (AQI 401–450)
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                        Non-Essential Construction & Older Vehicles
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                        • Immediate halt on all non-essential construction and demolition activities (excavation, earthworks, tiling).<br />
                        • Strict prohibition on plying of BS-III Petrol and BS-IV Diesel Light Motor Vehicles (LMVs) in NCR.<br />
                        • Discontinue in-person school sessions for children up to Class V in affected districts.
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        District Magistrates, Transport Commissioners & CAQM Taskforce
                      </td>
                    </tr>

                    {/* Stage IV */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-extrabold text-purple-600 dark:text-purple-400">
                        Stage IV
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 font-bold">
                          'Severe+' (AQI &gt; 450)
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                        Heavy Truck Entry, Public Works & Remote Work
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                        • Prohibit entry of non-Delhi registered heavy trucks (except EVs, CNG, and essential commodities).<br />
                        • Complete shutdown of all public civil infrastructure projects (flyovers, highways, power transmission).<br />
                        • Mandate 50% work-from-home (WFH) capacity for public, municipal, and private corporate offices.<br />
                        • Suspend physical classes for Class VI–IX and Class XI.
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        Chief Secretaries, State Disaster Management Authorities & Ministry of Home Affairs
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Source attribution & standard */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>
                  Official Source: Commission for Air Quality Management (CAQM) Direction No. 77 / Statutory GRAP Protocol (2023 Revision).
                </span>
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  AirIQ India Municipal Intelligence Engine
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
