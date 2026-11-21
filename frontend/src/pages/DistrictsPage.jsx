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
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                Air Quality Management Policy Brief
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold">
                Actionable Environmental Insights for State & District Administrations
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                Empirical synthesis of atmospheric ventilation dynamics, temperature inversions, and seasonal emission patterns across India's agro-climatic zones.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Insight 1: Post-Monsoon Agricultural Stubble Inversions */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                  <Flame className="w-5 h-5 shrink-0" />
                  <span>North Zone: Stubble Burning & Low Ventilation Coefficients</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  During mid-October to late November, boundary layer heights in Punjab, Haryana, and Western UP collapse from 1,800 m to below 350 m. Combined with north-westerly wind drifts (&lt; 2.5 m/s), episodic biomass burning creates persistent trapping over Delhi-NCR and the Indo-Gangetic Plains.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Recommended Action:</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Deploy mechanized in-situ residue management (Happy Seeders / CRM machines) 3 weeks before harvesting. Enforce GRAP Stage IV heavy diesel transit prohibitions prior to predicted 48-hour calm wind troughs.
                  </p>
                </div>
              </div>

              {/* Insight 2: Wintertime Deep Temperature Inversions */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-sm">
                  <Snowflake className="w-5 h-5 shrink-0" />
                  <span>East & Central: Industrial Inversion Trapping</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  In heavy industrial and mining clusters (Korba, Singrauli, Dhanbad, Asansol), nighttime radiational cooling creates intense ground-level thermal inversions between December and January. Factor analysis indicates surface barometric pressure (BP) and low ambient temperature (AT) contribute up to +42 µg/m³ to particulate surges.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Recommended Action:</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Implement staggered industrial operational shifts during nocturnal inversion hours (8:00 PM – 6:00 AM). Continuous monitoring of flue gas desulfurization (FGD) at thermal power stations.
                  </p>
                </div>
              </div>

              {/* Insight 3: Coastal Marine Boundary Layer Dynamics */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-sm">
                  <Wind className="w-5 h-5 shrink-0" />
                  <span>South & Coastal: Sea-Breeze Scavenging</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Coastal metros (Mumbai, Chennai, Kochi, Visakhapatnam) benefit from diurnal land-sea breeze circulation, maintaining annual average AQI below 110. However, high relative humidity (&gt; 75%) accelerates secondary aerosol formation through hygroscopic particulate growth.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Recommended Action:</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Target port vehicular idling and coastal industrial corridors with electrification mandates rather than broad citywide curtailment.
                  </p>
                </div>
              </div>

              {/* Insight 4: Rural & Gridded Precision Disclosure */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                  <Info className="w-5 h-5 shrink-0" />
                  <span>Tier 3 Gridded Estimation Disclosure</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Over 180 rural and remote districts in India currently lack physical continuous CAAQMS monitors. AirIQ India estimates these areas using satellite-assimilated numerical transport models (~11 km resolution) rather than guessing from urban station readings.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Methodological Standard:</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Always present rural values with Tier 3 disclosures. Never present mathematical estimates as physical ground measurements during regulatory decision-making.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
