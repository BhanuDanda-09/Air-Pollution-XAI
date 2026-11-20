import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wind,
  Github,
  ExternalLink,
  ShieldAlert,
  ArrowUp,
  Database,
  BookOpen,
  Layers,
  Activity,
} from 'lucide-react';

export default function Footer({ isBackendOnline = true }) {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <footer
      role="contentinfo"
      className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {/* 4-Column Layout on Desktop, Stacking on Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-10">
          
          {/* Column 1: Brand + One-Line Mission + CPCB Disclaimer Summary */}
          <div className="space-y-4">
            <Link
              to="/"
              className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg inline-flex"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Wind className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                  Pollution <span className="text-blue-600 dark:text-blue-400">XAI</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/80 uppercase tracking-wider">
                  v1.0
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Explainable AI-based residential air quality intelligence, CAMS satellite reference benchmarking, and meteorological PM2.5 prediction for Delhi-NCR.
            </p>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-snug">
                <strong>CPCB Disclaimer:</strong> Indicative diagnostic estimates. Not certified regulatory monitor measurements or official National AQI.
              </p>
            </div>
          </div>

          {/* Column 2: Product Links */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Product Capabilities</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link
                  to="/live-assessment"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-block"
                >
                  Live Air Assessment
                </Link>
              </li>
              <li>
                <Link
                  to="/livability"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-block"
                >
                  Residential Livability Index
                </Link>
              </li>
              <li>
                <Link
                  to="/saved-places"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-block"
                >
                  Saved Places & Alerts
                </Link>
              </li>
              <li>
                <Link
                  to="/history"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-block"
                >
                  Exposure History & Trends
                </Link>
              </li>
              <li>
                <Link
                  to="/prediction"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-block"
                >
                  Surface PM2.5 Estimator
                </Link>
              </li>
              <li>
                <Link
                  to="/comparison"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-block"
                >
                  Multi-Model Benchmarks
                </Link>
              </li>
              <li>
                <Link
                  to="/explainability"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-block"
                >
                  SHAP Explainable AI (XAI)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Project Links */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Project & Research</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link
                  to="/about"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-block"
                >
                  About the Capstone Project
                </Link>
              </li>
              <li>
                <Link
                  to="/about#methodology"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-block"
                >
                  Methodology & Feature Pipeline
                </Link>
              </li>
              <li>
                <Link
                  to="/about#limitations"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-block"
                >
                  Model Limitations & Bounds
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/BhanuDanda-09/Air-Pollution-XAI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://air-pollution-xai.onrender.com/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Backend REST API Service</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Data Sources & Citations */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Data Sources & Attribution</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <a
                  href="https://open-meteo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  <span>Open-Meteo API</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </a>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-tight mt-0.5">
                  Live surface temperature, wind speed, inversion & humidity telemetry.
                </p>
              </li>
              <li>
                <a
                  href="https://atmosphere.copernicus.eu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  <span>Copernicus CAMS</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </a>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-tight mt-0.5">
                  European Atmosphere Monitoring Service near-real-time atmospheric chemistry model.
                </p>
              </li>
              <li>
                <a
                  href="https://www.openstreetmap.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  <span>OpenStreetMap & Nominatim</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </a>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-tight mt-0.5">
                  Geospatial reverse geocoding and cartographic map tiles.
                </p>
              </li>
              <li>
                <a
                  href="https://cpcb.nic.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  <span>CPCB Air Standards</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </a>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-tight mt-0.5">
                  National Air Quality Index (NAQI) concentration breakpoints (Good to Severe).
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Capstone Metadata, Team Attribution, Status Dot & Back to Top */}
        <div className="pt-8 border-t border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-slate-700 dark:text-slate-300 font-semibold">
              <span>Final-Year B.Tech Capstone Project (2026)</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>Computer Science & Engineering</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>Bhanu Danda & Project Team</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-500">
              Informational only - not medical advice or an official regulatory AQI measurement.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Backend Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300">
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-rose-500 animate-pulse'
                }`}
              />
              <span>API: {isBackendOnline ? 'Online' : 'Reconnecting'}</span>
            </div>

            {/* Back to Top Button */}
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors font-medium focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Scroll back to top of page"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
