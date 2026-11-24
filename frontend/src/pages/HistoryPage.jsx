import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  MapPin,
  Calendar,
  Clock,
  ArrowUpRight,
  RotateCw,
  Sparkles,
  AlertCircle,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Printer,
  FileSpreadsheet,
  Trash2,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import PageSkeleton from '../components/PageSkeleton';
import ColdStartNotice from '../components/ColdStartNotice';
import ErrorMessage from '../components/ErrorMessage';

const VERDICT_STYLES = {
  'Good to go': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  'Take precautions': {
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    icon: AlertTriangle,
  },
  'Avoid outdoor activity': {
    bg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
    icon: AlertTriangle,
  },
  'Not recommended': {
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
    icon: XCircle,
  },
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete confirmation modals
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getHistory(50);
      setHistory(data);
    } catch (err) {
      setError(err?.message || 'Failed to retrieve assessment history.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const recheckLocation = (entry) => {
    navigate(
      `/live-assessment?lat=${entry.latitude}&lon=${entry.longitude}&name=${encodeURIComponent(
        entry.place_name || 'Historical Location'
      )}`
    );
  };

  const confirmDeleteRecord = async () => {
    if (!recordToDelete) return;
    setDeleteLoading(true);
    try {
      await userService.deleteHistoryEntry(recordToDelete.id);
      setHistory((prev) => prev.filter((r) => r.id !== recordToDelete.id));
      setRecordToDelete(null);
    } catch (err) {
      setError(err?.message || 'Failed to remove history record.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const confirmClearAll = async () => {
    setDeleteLoading(true);
    try {
      await userService.clearHistory();
      setHistory([]);
      setShowClearConfirm(false);
    } catch (err) {
      setError(err?.message || 'Failed to clear history.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const exportToCSV = () => {
    if (history.length === 0) return;
    const headers = [
      'Timestamp',
      'Place Name',
      'Latitude',
      'Longitude',
      'Regional estimate PM2.5 (ug/m3)',
      'Model Estimate PM2.5 (ug/m3)',
      'Livability Score',
      'Verdict',
    ];
    const rows = history.map((e) => [
      `"${e.timestamp || ''}"`,
      `"${(e.place_name || '').replace(/"/g, '""')}"`,
      e.latitude,
      e.longitude,
      e.pm25_reference != null ? e.pm25_reference : '',
      e.pm25_model != null ? e.pm25_model : '',
      e.score != null ? e.score : '',
      `"${e.verdict || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `air_pollution_exposure_history_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredHistory = history.filter((entry) => {
    const q = searchQuery.toLowerCase();
    return (
      (entry.place_name && entry.place_name.toLowerCase().includes(q)) ||
      (entry.verdict && entry.verdict.toLowerCase().includes(q))
    );
  });

  // Calculate Exposure Trend Chart Data (Chronological oldest to newest, up to 15 points)
  const chartPoints = [...history]
    .filter((h) => h.pm25_reference != null)
    .reverse()
    .slice(-15);

  const maxPM25 = chartPoints.length > 0 ? Math.max(...chartPoints.map((p) => p.pm25_reference), 120) : 150;
  const avgPM25 =
    chartPoints.length > 0
      ? (chartPoints.reduce((acc, p) => acc + p.pm25_reference, 0) / chartPoints.length).toFixed(1)
      : 0;

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden text-center p-8 md:p-12">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <History className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            Exposure & Assessment History
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
            Keep track of every air quality assessment you run across the Delhi-NCR region. Monitor cumulative exposure and observe trends over days and weeks.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto my-8 text-left">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
              <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm mb-1">
                Exposure Timeline
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Every location query is archived with exact timestamp and regional estimate PM2.5.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
              <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm mb-1">
                Comparative Verdicts
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review past livability scores and health profile sensitivity shifts.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
              <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm mb-1">
                Instant Re-Checks
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compare past pollution readings directly with current live atmospheric model data.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => openAuthModal('register')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all"
            >
              Sign In or Register
            </button>
            <button
              onClick={() => navigate('/live-assessment')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all"
            >
              Run Live Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
              Assessment History
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {history.length} records
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Chronological audit of air quality and livability assessments performed for your account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {history.length > 0 && (
            <>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800 transition-colors"
                title="Download exposure history as CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                title="Print Medical Consultation Summary"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Report</span>
              </button>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800 transition-colors"
                title="Clear all assessment history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </>
          )}

          <button
            onClick={loadHistory}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <ColdStartNotice isLoading={loading} />

      {error && (
        <ErrorMessage
          title="History Notice"
          message={error}
          onRetry={loadHistory}
        />
      )}

      {/* Exposure Trend Chart Card */}
      {!loading && chartPoints.length > 1 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Personal PM2.5 Exposure Trend
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Progression across your last {chartPoints.length} assessments
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Mean Exposure: <strong className="text-navy-900 dark:text-white font-mono">{avgPM25} µg/m³</strong>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                CPCB Standard: 60 µg/m³
              </span>
            </div>
          </div>

          {/* SVG Trend Polyline Visualization */}
          <div className="pt-2">
            <svg
              viewBox="0 0 600 160"
              className="w-full h-36 overflow-visible"
              aria-label="Exposure trend chart"
            >
              {/* Background Reference Grid Line at 60 (Moderate standard) */}
              {(() => {
                const yStandard = 140 - (60 / maxPM25) * 120;
                return (
                  <g>
                    <line
                      x1="0"
                      y1={yStandard}
                      x2="600"
                      y2={yStandard}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      strokeWidth="1.5"
                      opacity="0.6"
                    />
                    <text x="590" y={yStandard - 4} textAnchor="end" fontSize="10" fill="#f59e0b" fontWeight="600">
                      Standard: 60 µg/m³
                    </text>
                  </g>
                );
              })()}

              {/* Data Points and Connecting Line */}
              {(() => {
                const step = 600 / (chartPoints.length - 1 || 1);
                const coords = chartPoints.map((pt, idx) => ({
                  x: Math.round(idx * step),
                  y: Math.round(140 - ((pt.pm25_reference || 0) / maxPM25) * 120),
                  val: pt.pm25_reference,
                  place: pt.place_name || 'Location',
                  verdict: pt.verdict,
                }));

                const pointsStr = coords.map((c) => `${c.x},${c.y}`).join(' ');
                const areaStr = `${coords[0].x},150 ${pointsStr} ${coords[coords.length - 1].x},150`;

                return (
                  <g>
                    <defs>
                      <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Shaded Area */}
                    <polygon points={areaStr} fill="url(#trendGradient)" />
                    {/* Connecting Stroke Line */}
                    <polyline
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={pointsStr}
                    />
                    {/* Dots with labels */}
                    {coords.map((c, i) => (
                      <g key={i} className="group">
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r="4"
                          className="fill-white dark:fill-slate-900 stroke-blue-600 stroke-[2.5px] hover:r-6 transition-all"
                        />
                        <text
                          x={c.x}
                          y={c.y - 8}
                          textAnchor="middle"
                          fontSize="9"
                          className="font-bold fill-slate-700 dark:fill-slate-300"
                        >
                          {Math.round(c.val)}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })()}
            </svg>
            <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 pt-2 px-1 border-t border-slate-100 dark:border-slate-800">
              <span>Oldest ({chartPoints[0] ? formatDate(chartPoints[0].timestamp).split(',')[0] : ''})</span>
              <span>Timeline (Left: Past → Right: Recent)</span>
              <span>Latest ({chartPoints[chartPoints.length - 1] ? formatDate(chartPoints[chartPoints.length - 1].timestamp).split(',')[0] : ''})</span>
            </div>
          </div>
        </div>
      )}

      {/* Search / Filter Input */}
      {history.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search past assessments by place name or verdict..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            aria-label="Filter assessment history"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* History Table */}
      {loading ? (
        <PageSkeleton variant="table" />
      ) : history.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No assessment history recorded</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Run your first live air quality or livability assessment and your results will be archived here automatically.
          </p>
          <button
            onClick={() => navigate('/live-assessment')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Start Assessment
          </button>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No history records matched "<strong>{searchQuery}</strong>".
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">PM2.5 Ref</th>
                  <th className="py-3.5 px-4">Verdict</th>
                  <th className="py-3.5 px-4">Livability</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredHistory.map((entry) => {
                  const style = VERDICT_STYLES[entry.verdict] || {
                    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
                    dot: 'bg-slate-400',
                    icon: CheckCircle2,
                  };
                  const StatusIcon = style.icon;

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDate(entry.timestamp)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {entry.place_name || 'Delhi-NCR Coordinate'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {entry.latitude?.toFixed(4)}°N, {entry.longitude?.toFixed(4)}°E
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {entry.pm25_reference != null ? (
                          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {Math.round(entry.pm25_reference)}{' '}
                            <span className="text-[10px] text-slate-400 font-normal">µg/m³</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">N/A</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{entry.verdict || 'Assessed'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {entry.score != null ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {entry.score}
                            </span>
                            <span className="text-[10px] text-slate-400">/ 100</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => recheckLocation(entry)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs transition-colors"
                            title="Re-run assessment for these coordinates"
                            aria-label={`Recheck ${entry.place_name || 'location'}`}
                          >
                            <span>Recheck</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setRecordToDelete(entry)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                            title="Delete this record"
                            aria-label="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Single Entry Confirmation Modal */}
      {recordToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm record removal"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete history record?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Remove assessment for <strong>"{recordToDelete.place_name || 'Location'}"</strong> on {formatDate(recordToDelete.timestamp)}? This cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteRecord}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All History Confirmation Modal */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm clear all history"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Clear entire assessment history?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Are you sure you want to delete all <strong>{history.length}</strong> past air quality assessment records? This action cannot be reversed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                Keep Records
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {deleteLoading ? 'Clearing...' : 'Clear All History'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
