import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, Cookie, FileText } from 'lucide-react';
import usePageMeta from '../hooks/usePageMeta';

export default function CookieNoticePage() {
  usePageMeta('/cookies');

  return (
    <div className="space-y-10 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <Cookie className="w-3.5 h-3.5" />
          <span>Zero Surveillance Privacy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Cookie & Local Storage Notice
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
          AirIQ India respects your digital autonomy. We do not use third-party tracking cookies, behavioral ad trackers, or surveillance pixels.
        </p>
      </div>

      {/* Main Content */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>1. Our Zero Tracking Policy</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Unlike many commercial weather websites that harvest location histories to sell to advertising networks, AirIQ India is engineered strictly for public environmental safety. We do not sell your search queries, coordinate lookups, or health sensitivities to any third party.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>2. Essential Local Storage Keys</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            We only use standard browser <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono">localStorage</code> to remember your interface preferences on your own device:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                <tr>
                  <th className="p-3">Key Name</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Lifespan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                <tr>
                  <td className="p-3 font-mono font-medium text-slate-800 dark:text-slate-200">airiq_theme</td>
                  <td className="p-3">Stores your light or dark display preference</td>
                  <td className="p-3">Persistent until cleared</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-medium text-slate-800 dark:text-slate-200">airiq_auth_token</td>
                  <td className="p-3">Maintains your authenticated session if you create an account</td>
                  <td className="p-3">Session expiry (1 hour)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-medium text-slate-800 dark:text-slate-200">airiq_saved_places</td>
                  <td className="p-3">Local cache of your bookmarked locations (kept on device)</td>
                  <td className="p-3">Persistent until cleared</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>3. How to Clear Stored Data</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            You can clear all local storage at any time by clearing your browser site data or using our one-click deletion feature on the <a href="/privacy" className="text-cyan-600 dark:text-cyan-400 underline font-medium">Privacy Settings</a> page.
          </p>
        </section>
      </div>
    </div>
  );
}
