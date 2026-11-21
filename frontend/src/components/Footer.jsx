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
              className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg inline-flex"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                  Air<span className="text-cyan-600 dark:text-cyan-400">IQ</span> <span className="text-emerald-600 dark:text-emerald-400">India</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/80 uppercase tracking-wider">
                  Live
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              All-India multi-pollutant environmental intelligence, satellite atmospheric reanalysis, CPCB ground-truth validation, and health-personalised relocation guidance across Indian cities and rural districts.
            </p>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-snug space-y-1">
                <p>
                  <strong>Scientific Disclosure:</strong> Indicative diagnostic estimates. Not certified regulatory monitor measurements or official statutory CAAQMS AQI.
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  Air quality for villages and small areas is a gridded model estimate, not a measurement.
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Product Links */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Decision Tools</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link
                  to="/relocation"
                  className="hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-blue-600 dark:text-blue-400 transition-colors inline-block"
                >
                  Relocation Advisor (From vs To)
                </Link>
              </li>
              <li>
                <Link
                  to="/hotspots"
                  className="hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-blue-600 dark:text-blue-400 transition-colors inline-block"
                >
                  National Hotspot Rankings
                </Link>
              </li>
              <li>
                <Link
                  to="/live-assessment"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-block"
                >
                  Check My Air (6 Pollutants)
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
                  to="/privacy"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-block"
                >
                  Privacy & DPDP Act 2023
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
                  Explainable AI & Weather Drivers
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources & Guides */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Resources & Guides</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link
                  to="/how-it-works"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-block"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-block"
                >
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-block"
                >
                  About Our Mission
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-block"
                >
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-block"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-block"
                >
                  Privacy Policy (DPDP Act)
                </Link>
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
              <li>
                <a
                  href="https://openaq.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  <span>OpenAQ Data Platform</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </a>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-tight mt-0.5">
                  Open community repository for global regulatory station telemetry.
                </p>
              </li>
              <li>
                <a
                  href="https://www.ecmwf.int/en/forecasts/dataset/ecmwf-reanalysis-v5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  <span>ECMWF ERA5 Reanalysis</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </a>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-tight mt-0.5">
                  Global hourly climate reanalysis for planetary boundary layer physics.
                </p>
              </li>
              <li>
                <a
                  href="https://data.gov.in/resource/all-india-pincode-directory"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  <span>India Post & data.gov.in</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </a>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-tight mt-0.5">
                  Official 6-digit PIN directory and administrative delivery zone boundaries.
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Tagline & API Status */}
        <div className="pt-8 border-t border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-slate-700 dark:text-slate-300 font-semibold">
              <span>© {new Date().getFullYear()} AirIQ India</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>Smarter air decisions for every address in India.</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-500">
              Air quality estimates are for general information and are not an official AQI or medical advice. If you have a health condition, follow your doctor's guidance.
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
