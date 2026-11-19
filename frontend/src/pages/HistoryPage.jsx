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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';

const VERDICT_STYLES = {
  'Good to go': {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  'Take precautions': {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    icon: AlertTriangle,
  },
  'Avoid outdoor activity': {
    bg: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    icon: AlertTriangle,
  },
  'Not recommended': {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
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
      const data = await userService.getHistory(30);
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

  const exportToCSV = () => {
    if (history.length === 0) return;
    const headers = [
      'Timestamp',
      'Place Name',
      'Latitude',
      'Longitude',
      'Reference PM2.5 (ug/m3)',
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

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-center p-8 md:p-12">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <History className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Exposure & Assessment History
          </h1>
          <p className="mt-3 text-slate-600 max-w-lg mx-auto text-sm leading-relaxed">
            Keep track of every air quality assessment you run across the Delhi-NCR region. Monitor cumulative exposure and observe trends over days and weeks.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto my-8 text-left">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-semibold text-slate-900 text-xs sm:text-sm mb-1">Exposure Timeline</div>
              <p className="text-xs text-slate-500">Every location query is archived with exact timestamp and reference PM2.5.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-semibold text-slate-900 text-xs sm:text-sm mb-1">Comparative Verdicts</div>
              <p className="text-xs text-slate-500">Review past livability scores and health profile sensitivity shifts.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-semibold text-slate-900 text-xs sm:text-sm mb-1">Instant Re-Checks</div>
              <p className="text-xs text-slate-500">Compare past pollution readings directly with current live satellite data.</p>
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
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
            >
              Run Live Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">Assessment History</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {history.length} records
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Chronological audit of air quality and livability assessments performed for your account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {history.length > 0 && (
            <>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors"
                title="Download exposure history as CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                title="Print Medical Consultation Summary"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Report</span>
              </button>
            </>
          )}

          <button
            onClick={loadHistory}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs">Loading history entries...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No assessment history recorded</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Run your first live air quality or livability assessment and your results will be logged here automatically.
          </p>
          <button
            onClick={() => navigate('/live-assessment')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Start Assessment
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">PM2.5 Ref</th>
                  <th className="py-3 px-4">Verdict</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {history.map((entry) => {
                  const style = VERDICT_STYLES[entry.verdict] || {
                    bg: 'bg-slate-100 text-slate-700 border-slate-200',
                    dot: 'bg-slate-400',
                  };
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(entry.timestamp)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {entry.place_name || `${entry.latitude.toFixed(3)}°, ${entry.longitude.toFixed(3)}°`}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {entry.latitude.toFixed(4)}°N, {entry.longitude.toFixed(4)}°E
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {entry.pm25_reference != null ? (
                          <span className="font-bold text-slate-800">
                            {Math.round(entry.pm25_reference)}{' '}
                            <span className="text-[10px] font-normal text-slate-400">µg/m³</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${style.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          <span>{entry.verdict}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {entry.score != null ? (
                          <span className="font-extrabold text-navy-900">{entry.score}/100</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => recheckLocation(entry)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                        >
                          <span>Re-check</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
