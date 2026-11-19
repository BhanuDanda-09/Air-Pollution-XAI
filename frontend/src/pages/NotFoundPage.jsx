import React from 'react';
import { Link } from 'react-router-dom';
import { Wind, Home, MapPin, Compass, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 shadow-sm">
        <Wind className="w-10 h-10 animate-pulse" />
      </div>

      <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 uppercase tracking-widest mb-3">
        404 — Page Not Found
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white tracking-tight mb-3">
        Lost in the smog?
      </h1>

      <p className="max-w-md text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
        The page or diagnostic coordinate you are looking for does not exist or has been relocated. Return to safety with the quick links below.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Return to Home</span>
        </Link>
        <Link
          to="/live-assessment"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-sm transition-all"
        >
          <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Live Assessment</span>
        </Link>
        <Link
          to="/livability"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-sm transition-all"
        >
          <Compass className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Livability Index</span>
        </Link>
      </div>
    </div>
  );
}
