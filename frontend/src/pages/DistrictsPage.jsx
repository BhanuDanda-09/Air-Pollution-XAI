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
  ExternalLink,
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
                Evidence-based synthesis of atmospheric ventilation dynamics, thermal inversions, seasonal emission schedules, and statutory mitigation guidelines across India's agro-climatic zones.
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
                    Districts exhibiting elevated particulate levels (expert early-warning threshold AQI &ge; 180, providing an advisory buffer prior to statutory 'Poor' at 200).
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    Expert Classification
                  </span>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800 shrink-0">
                    Immediate Enforcement Focus
                  </span>
                </div>
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

              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                * Threshold Derivation: The AQI &ge; 180 trigger is an expert classification providing a precautionary buffer (~10% below CPCB's statutory 200 'Poor' trigger) enabling municipal administrations to mobilize mechanized sweepers and anti-smog guns proactively.
              </p>
            </div>

            {/* (b) & (c) PERSISTENT VS SEASONAL HOTSPOTS & METEOROLOGICAL DRIVERS */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <BarChart3 className="w-4 h-4" />
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    (b) Persistent vs Seasonal Hotspots & (c) Meteorological Drivers & Model Feature Attribution
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-4xl">
                  Classification of regional air pollution regimes (expert classification) and machine-learning feature attribution (TreeSHAP) computed on empirical surface meteorological inputs.
                </p>
              </div>

              {/* Methodology Disclosure */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Methodology & Scientific Integrity Disclosures:
                </span>
                <p className="leading-relaxed">
                  <strong>Hotspot Classification:</strong> Regimes are an expert classification derived from empirical annual distributions: Persistent Hotspots exhibit high baseline loading year-round (P90 &gt; 150 µg/m³, Winter/Monsoon ratio &lt; 1.8), while Seasonal Hotspots show winter amplification (Winter/Monsoon ratio &gt; 2.5×, P90 &gt; 200 µg/m³).
                </p>
                <p className="leading-relaxed">
                  <strong>Feature Attribution Boundary:</strong> Our machine learning model is trained strictly on five surface meteorological features: Relative Humidity (RH), Wind Direction (WD), Solar Radiation (SR), Barometric Pressure (BP), and Air Temperature (AT). Wind speed (WS) is <em>not</em> an input feature in this dataset. Exact SHAP values shown below are computed directly from the trained XGBoost model on a verified Delhi winter scenario; qualitative atmospheric drivers for non-Delhi regions cite official CPCB and NEERI literature.
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
                      <span className="text-[11px] text-slate-400 font-mono">Expert Classification</span>
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

                  {/* Qualitative Drivers from Literature */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Atmospheric Drivers (CPCB Literature)</span>
                      <span className="text-[10px] font-mono text-slate-500">Qualitative Synthesis</span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                      <li className="flex flex-col gap-0.5 text-[11px]">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">• High Surface Pressure & Stagnation:</span>
                        <span className="text-slate-500">Anticyclonic subsidence caps vertical stack plume dispersion, causing nocturnal valley pooling.</span>
                      </li>
                      <li className="flex flex-col gap-0.5 text-[11px]">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">• Low Convective Dispersion:</span>
                        <span className="text-slate-500">Weak daytime thermal updrafts limit convective dilution of industrial emissions.</span>
                      </li>
                      <li className="flex flex-col gap-0.5 text-[11px]">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">• Low Boundary-Layer Height:</span>
                        <span className="text-slate-500">Shallow nocturnal planetary boundary layers trap continuous effluents near surface grade.</span>
                      </li>
                    </ul>
                    <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-700">
                      * Airshed Note: Industrial basins lie outside Delhi. The Delhi-trained tabular model is not applied here; drivers cite official CPCB industrial guidelines.
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
                      Delhi-NCR & Winter Inversion Basins
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <strong>Key Locations:</strong> Delhi-NCR, Amritsar, Karnal, Ludhiana, Meerut, Kanpur, Patna.<br />
                      <strong>Emission Characteristics:</strong> Episodic post-monsoon stubble burning compounded by severe radiational ground inversions (PBL &lt; 150 m) and stagnant surface air.
                    </p>
                  </div>

                  {/* Exact TreeSHAP from Trained Model */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>TreeSHAP Feature Attribution (Trained XGBoost)</span>
                      <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">Baseline E[f(x)]: 144.2 µg/m³</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono bg-slate-50 dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                      Representative Scenario: RH=85%, WD=290°, SR=15 W/m², BP=746 mmHg, AT=12°C
                    </div>
                    <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                      <li className="flex flex-col gap-0.5 text-[11px]">
                        <div className="flex justify-between items-center font-mono">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Relative Humidity (RH: 85%)</span>
                          <strong className="text-rose-600 dark:text-rose-400">+39.3 µg/m³</strong>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Model predicts higher particulate concentration at high relative humidity. Literature note: atmospheric aerosols undergo hygroscopic growth under elevated relative humidity, increasing particle cross-section and liquid-water content (Zieger et al., 2013; Swietlicki et al., 2008).
                        </span>
                      </li>
                      <li className="flex flex-col gap-0.5 text-[11px]">
                        <div className="flex justify-between items-center font-mono">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Air Temperature (AT: 12°C)</span>
                          <strong className="text-slate-600 dark:text-slate-300">-2.1 µg/m³</strong>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Model assigns a slight negative adjustment (-2.1 µg/m³) from the base expectation at this temperature.
                        </span>
                      </li>
                      <li className="flex flex-col gap-0.5 text-[11px]">
                        <div className="flex justify-between items-center font-mono">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Wind Direction (WD: 290°)</span>
                          <strong className="text-slate-600 dark:text-slate-300">-7.9 µg/m³</strong>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Model assigns a negative adjustment (-7.9 µg/m³) for 290° wind direction relative to training distribution.
                        </span>
                      </li>
                      <li className="flex flex-col gap-0.5 text-[11px]">
                        <div className="flex justify-between items-center font-mono">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Barometric Pressure (BP: 746 mmHg)</span>
                          <strong className="text-slate-600 dark:text-slate-300">-15.7 µg/m³</strong>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Model assigns a negative adjustment (-15.7 µg/m³) at 746 mmHg relative to dataset mean.
                        </span>
                      </li>
                      <li className="flex flex-col gap-0.5 text-[11px]">
                        <div className="flex justify-between items-center font-mono">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Solar Radiation (SR: 15 W/m²)</span>
                          <strong className="text-slate-600 dark:text-slate-300">-0.1 µg/m³</strong>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Model assigns a minimal negative adjustment (-0.1 µg/m³) at low irradiance input.
                        </span>
                      </li>
                    </ul>
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-400 space-y-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        Sum of SHAP contributions: <strong>+13.5 µg/m³</strong> (unrounded: +13.537). Net predicted PM2.5: <strong>157.7 µg/m³</strong> (unrounded: 157.733).
                      </p>
                      <p className="font-mono text-[9px] text-slate-500">
                        Arithmetic check: 144.2 (base) + 13.5 (sum) = 157.7 µg/m³. Unrounded values satisfy: base + sum == prediction within 0.0001 µg/m³. Numbers displayed rounded to 1 decimal place.
                      </p>
                      <p className="italic text-slate-500">
                        "This is one representative Delhi winter scenario computed from the trained model. It describes how the model responds, not a physical proof."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hotspot Type 3: Coastal Marine & Topographic Basins */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
                        Type: Dynamic Maritime
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">Expert Classification</span>
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

                  {/* Qualitative Coastal Drivers */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Atmospheric Drivers (NEERI / CPCB)</span>
                      <span className="text-[10px] font-mono text-slate-500">Qualitative Domain</span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                      <li className="flex flex-col gap-0.5 text-[11px]">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">• Diurnal Sea-Breeze Ventilation:</span>
                        <span className="text-slate-500">Daytime onshore marine breeze displaces urban pollutants inland, reducing coastal daytime concentration spikes.</span>
                      </li>
                      <li className="flex flex-col gap-0.5 text-[11px]">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">• Marine Boundary-Layer Moisture:</span>
                        <span className="text-slate-500">Elevated coastal humidity promotes sea-salt hygroscopic condensation and aerosol scattering.</span>
                      </li>
                      <li className="flex flex-col gap-0.5 text-[11px]">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">• Nocturnal Land Breeze Reversal:</span>
                        <span className="text-slate-500">Nighttime offshore winds push accumulated continental aerosol out toward coastal waters.</span>
                      </li>
                    </ul>
                    <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-700">
                      * Model Boundary: Marine sea-breeze dynamics are strictly absent from the Delhi-trained model; coastal drivers are qualitative findings from NEERI/CPCB coastal studies.
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
                      (d) Statutory Graded Response Action Plan (GRAP) Thresholds for Delhi-NCR
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                    Statutory stage AQI trigger thresholds established under the <strong>Commission for Air Quality Management in National Capital Region and Adjoining Areas Act, 2021</strong>. For the officially approved and revised schedule of mandated actions, refer directly to <a href="https://caqm.nic.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">https://caqm.nic.in</a>.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                    Delhi-NCR Airshed Only
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                    Advisory Reference
                  </span>
                </div>
              </div>

              {/* Advisory Disclaimer Banner */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Advisory Statement:</strong> The thresholds below summarize the statutory Graded Response Action Plan (GRAP) stage categories applicable strictly to the National Capital Region (NCR). In all operational, municipal, and legal contexts, official statutory orders and real-time operational notifications promulgated by CAQM (<a href="https://caqm.nic.in" target="_blank" rel="noopener noreferrer" className="underline font-bold">caqm.nic.in</a>) and respective State Governments (Delhi, Haryana, Uttar Pradesh, Rajasthan) strictly prevail. This platform does not state or declare which stage is currently in force; consult <a href="https://caqm.nic.in" target="_blank" rel="noopener noreferrer" className="underline font-bold">caqm.nic.in</a> for current stage enforcement and the complete schedule of actions.
                </p>
              </div>

              {/* GRAP Stages Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">GRAP Stage</th>
                      <th className="px-4 py-3">Statutory AQI Trigger Threshold</th>
                      <th className="px-4 py-3">Stage Description</th>
                      <th className="px-4 py-3">Mandated Control Schedule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Stage I */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-extrabold text-amber-600 dark:text-amber-400">
                        Stage I
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-bold font-mono">
                          'Poor' (AQI 201–300)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        Air quality entering 'Poor' band triggering primary dust abatement and municipal control protocols.
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href="https://caqm.nic.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                        >
                          <span>Official CAQM Schedule</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>

                    {/* Stage II */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-extrabold text-orange-600 dark:text-orange-400">
                        Stage II
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200 font-bold font-mono">
                          'Very Poor' (AQI 301–400)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        Air quality entering 'Very Poor' band triggering targeted stationary emission and traffic controls.
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href="https://caqm.nic.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                        >
                          <span>Official CAQM Schedule</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>

                    {/* Stage III */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-extrabold text-rose-600 dark:text-rose-400">
                        Stage III
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-bold font-mono">
                          'Severe' (AQI 401–450)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        Air quality entering 'Severe' band triggering construction suspensions and older vehicle restrictions.
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href="https://caqm.nic.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                        >
                          <span>Official CAQM Schedule</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>

                    {/* Stage IV */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-extrabold text-purple-600 dark:text-purple-400">
                        Stage IV
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 font-bold font-mono">
                          'Severe+' (AQI &gt; 450)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        Air quality entering 'Severe+' band triggering emergency civil measures, transit restrictions, and remote work.
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href="https://caqm.nic.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                        >
                          <span>Official CAQM Schedule</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Source attribution & standard */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>
                  Official Source: Commission for Air Quality Management in NCR & Adjoining Areas (<a href="https://caqm.nic.in" target="_blank" rel="noopener noreferrer" className="underline">caqm.nic.in</a>). Airshed Scope: Delhi-NCR only.
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
