import React, { useState, useEffect } from 'react';
import { Shield, Server, Database, RefreshCw, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { isDemoModeEnabled } from '../services/demoAuth';

export default function AdminPage() {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/admin/metrics');
      setMetrics(data.data || data);
    } catch (err) {
      if (isDemoModeEnabled()) {
        // Fallback for demo presentation if backend offline
        setMetrics({
          models: {
            random_forest: { status: 'loaded', is_best: false },
            xgboost: { status: 'loaded', is_best: true },
            mlp: { status: 'loaded', is_best: false },
          },
          cache_stats: {
            weather_cache_entries: 4,
            weather_cache_max: 256,
            aq_cache_entries: 4,
            aq_cache_max: 256,
          },
          system_health: {
            environment: 'active',
            api_tier: 'Render Free Tier (512MB RAM ceiling)',
            worker_concurrency: '1 worker, 4 threads (gunicorn)',
          },
        });
      } else {
        setError(err.message || 'Failed to load admin metrics');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleClearCache = async () => {
    try {
      await api.post('/api/admin/cache/clear');
      setMessage('Cache cleared successfully');
      fetchMetrics();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to clear cache');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 rounded-full">
              Admin Portal
            </span>
            <span className="text-xs text-slate-500 font-medium">RBAC Role: Administrator</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">System Diagnostics & Control</h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time server telemetry, active model states, and in-memory cache controls.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClearCache}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear API Caches
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider mb-2">
              <Server className="w-4 h-4" />
              <span>Inference Models</span>
            </div>
            <ul className="space-y-2 mt-3 text-xs">
              <li className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                <span className="font-semibold text-slate-700">Tuned XGBoost (Primary)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Online</span>
              </li>
              <li className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                <span className="font-semibold text-slate-700">Random Forest</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Online</span>
              </li>
              <li className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                <span className="font-semibold text-slate-700">Keras 3 MLP</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Online</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider mb-2">
              <Database className="w-4 h-4" />
              <span>In-Memory Cache (TTL 600s)</span>
            </div>
            <div className="space-y-3 mt-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50">
                <div className="text-slate-500 font-medium">Weather Cache</div>
                <div className="text-base font-extrabold text-slate-800 mt-0.5">
                  {metrics.cache_stats?.weather_cache_entries || 0} / {metrics.cache_stats?.weather_cache_max || 256}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50">
                <div className="text-slate-500 font-medium">Air Quality CAMS Cache</div>
                <div className="text-base font-extrabold text-slate-800 mt-0.5">
                  {metrics.cache_stats?.aq_cache_entries || 0} / {metrics.cache_stats?.aq_cache_max || 256}
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider mb-2">
              <Shield className="w-4 h-4" />
              <span>Production Guardrails</span>
            </div>
            <div className="space-y-2 mt-3 text-xs text-slate-600">
              <div className="p-2.5 rounded-lg bg-slate-50">
                <span className="font-semibold block text-slate-800">Render Free-Tier Budget</span>
                <span>Strict 512 MB memory boundary. No heavy runtimes.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50">
                <span className="font-semibold block text-slate-800">Rate Limiter</span>
                <span>30 requests/min per reverse-proxy IP.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
