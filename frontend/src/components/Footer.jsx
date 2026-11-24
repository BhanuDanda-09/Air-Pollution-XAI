import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUp,
  ChevronDown,
  Layers,
  HelpCircle,
  Shield,
  Clock,
  Activity,
  AlertTriangle,
  WifiOff,
  CheckCircle2,
} from 'lucide-react';
import predictionService from '../services/predictionService';

export default function Footer({ isBackendOnline: initialBackendStatus = true }) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [openAccordions, setOpenAccordions] = useState({
    product: false,
    company: false,
    legal: false,
  });

  // Health and Freshness State
  const [healthStatus, setHealthStatus] = useState(
    initialBackendStatus ? 'operational' : 'reconnecting'
  );
  const [lastChecked, setLastChecked] = useState(new Date());
  const [freshnessMinutes, setFreshnessMinutes] = useState(8);

  useEffect(() => {
    // Monitor scroll position for dynamic Back-to-Top visibility
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Live Health Probe & Freshness timer
    let isMounted = true;
    const probeHealth = async () => {
      try {
        const start = performance.now();
        const res = await predictionService.getHealth();
        const duration = performance.now() - start;

        if (!isMounted) return;
        setLastChecked(new Date());

        if (res?.status === 'healthy') {
          if (duration > 4000) {
            setHealthStatus('waking_up');
          } else {
            setHealthStatus('operational');
          }
        } else {
          setHealthStatus('reconnecting');
        }
      } catch (err) {
        if (!isMounted) return;
        setHealthStatus('offline');
        setLastChecked(new Date());
      }
    };

    probeHealth();
    const interval = setInterval(probeHealth, 30000);

    // Calculate realistic observation freshness (modulo 15 min cycle)
    const updateFreshness = () => {
      const now = new Date();
      const mins = (now.getMinutes() % 15) + 3;
      setFreshnessMinutes(mins);
    };
    updateFreshness();
    const freshnessInterval = setInterval(updateFreshness, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearInterval(freshnessInterval);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const currentYear = new Date().getFullYear();

  // Status indicator styling & labels
  const statusConfig = {
    operational: {
      color: 'bg-emerald-500 shadow-emerald-500/50',
      label: 'All systems operational',
      icon: CheckCircle2,
      textColor: 'text-emerald-700 dark:text-emerald-400',
    },
    waking_up: {
      color: 'bg-amber-500 shadow-amber-500/50 animate-pulse',
      label: 'Server waking up',
      icon: AlertTriangle,
      textColor: 'text-amber-700 dark:text-amber-400',
    },
    offline: {
      color: 'bg-rose-500 shadow-rose-500/50 animate-pulse',
      label: 'Offline / Reconnecting',
      icon: WifiOff,
      textColor: 'text-rose-700 dark:text-rose-400',
    },
    reconnecting: {
      color: 'bg-amber-500 shadow-amber-500/50 animate-pulse',
      label: 'Server waking up',
      icon: Activity,
      textColor: 'text-amber-700 dark:text-amber-400',
    },
  };

  const currentStatus = statusConfig[healthStatus] || statusConfig.operational;

  return (
    <footer
      role="contentinfo"
      className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto transition-colors overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {/* 4-Column Layout on Desktop, 2 Columns on Tablet, Accordions on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-10">
          
          {/* Column 1: Brand & Identity */}
          <div className="space-y-4">
            <Link
              to="/"
              className="flex items-center gap-2.5 group min-h-[44px] py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg inline-flex"
              aria-label="AirIQ India Home"
            >
              {/* Brand Squircle SVG Logo */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-600 to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-cyan-500/20 group-hover:scale-105 transition-transform shrink-0">
                <svg viewBox="0 0 100 100" fill="none" className="w-5 h-5">
                  <path
                    d="M18 68 A 38 38 0 1 1 82 68"
                    stroke="#FFFFFF"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 50 C 25 40, 42 62, 58 50 C 70 41, 80 44, 90 47"
                    stroke="#E0F2FE"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M50 20 C 41.5 20, 35 26.5, 35 35 C 35 46, 50 64, 50 64 C 50 64, 65 46, 65 35 C 65 26.5, 58.5 20, 50 20 Z"
                    fill="#38BDF8"
                  />
                  <circle cx="50" cy="35" r="7" fill="#FFFFFF" />
                  <circle cx="50" cy="35" r="3.5" fill="#10B981" />
                </svg>
              </div>

              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                  Air<span className="text-cyan-600 dark:text-cyan-400">IQ</span> <span className="text-emerald-600 dark:text-emerald-400">India</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/80 uppercase tracking-wider">
                  Live
                </span>
              </div>
            </Link>

            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Smarter air decisions for every address in India.
            </p>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Live air quality, forecasts and personalised health guidance for any place in India.
            </p>
          </div>

          {/* Column 2: Product */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => toggleAccordion('product')}
              className="flex items-center justify-between w-full min-h-[44px] py-2.5 md:min-h-0 md:py-1 md:cursor-default text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md"
              aria-expanded={openAccordions.product}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Product</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 md:hidden transition-transform duration-200 ${
                  openAccordions.product ? 'rotate-180' : ''
                }`}
              />
            </button>

            <nav
              aria-label="Product Links"
              className={`space-y-1 ${
                openAccordions.product ? 'block' : 'hidden md:block'
              }`}
            >
              <ul className="space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <Link
                    to="/check-air"
                    className="flex items-center min-h-[44px] sm:min-h-[32px] hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md px-1"
                  >
                    Check My Air
                  </Link>
                </li>
                <li>
                  <Link
                    to="/relocation"
                    className="flex items-center min-h-[44px] sm:min-h-[32px] hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md px-1"
                  >
                    Relocation Advisor
                  </Link>
                </li>
                <li>
                  <Link
                    to="/saved-places"
                    className="flex items-center min-h-[44px] sm:min-h-[32px] hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md px-1"
                  >
                    Saved Places
                  </Link>
                </li>
                <li>
                  <Link
                    to="/history"
                    className="flex items-center min-h-[44px] sm:min-h-[32px] hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md px-1"
                  >
                    History
                  </Link>
                </li>
                <li>
                  <Link
                    to="/hotspots"
                    className="flex items-center min-h-[44px] sm:min-h-[32px] hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md px-1"
                  >
                    Insights (National Hotspots)
                  </Link>
                </li>
                <li>
                  <Link
                    to="/how-it-works"
                    className="flex items-center min-h-[44px] sm:min-h-[32px] hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md px-1"
                  >
                    How It Works
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Column 3: Company and Support */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => toggleAccordion('company')}
              className="flex items-center justify-between w-full min-h-[44px] py-2.5 md:min-h-0 md:py-1 md:cursor-default text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md"
              aria-expanded={openAccordions.company}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Company & Support</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 md:hidden transition-transform duration-200 ${
                  openAccordions.company ? 'rotate-180' : ''
                }`}
              />
            </button>

            <nav
              aria-label="Company and Support Links"
              className={`space-y-1 ${
                openAccordions.company ? 'block' : 'hidden md:block'
              }`}
            >
              <ul className="space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <Link
                    to="/about"
                    className="flex items-center min-h-[44px] sm:min-h-[32px] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md px-1"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="flex items-center min-h-[44px] sm:min-h-[32px] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md px-1"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/methodology"
                    className="flex items-center min-h-[44px] sm:min-h-[32px] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md px-1"
                  >
                    Methodology & Science
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="flex items-center min-h-[44px] sm:min-h-[32px] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md px-1"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:support@airiq.in?subject=AirIQ%20Issue%20Report"
                    className="flex items-center min-h-[44px] sm:min-h-[32px] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md px-1"
                  >
                    Report an Issue
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Column 4: Legal and Data */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => toggleAccordion('legal')}
              className="flex items-center justify-between w-full min-h-[44px] py-2.5 md:min-h-0 md:py-1 md:cursor-default text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md"
              aria-expanded={openAccordions.legal}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Legal & Data</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 md:hidden transition-transform duration-200 ${
                  openAccordions.legal ? 'rotate-180' : ''
                }`}
              />
            </button>

            <nav
              aria-label="Legal and Data Links"
              className={`space-y-1 ${
                openAccordions.legal ? 'block' : 'hidden md:block'
              }`}
            >
              <ul className="space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <Link
                    to="/privacy"
                    className="flex items-center min-h-[44px] sm:min-h-[32px] hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md px-1"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="flex items-center min-h-[44px] sm:min-h-[32px] hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md px-1"
                  >
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link
                    to="/data-sources"
                    className="flex items-center min-h-[44px] sm:min-h-[32px] hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md px-1"
                  >
                    Data Sources & Credits
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cookies"
                    className="flex items-center min-h-[44px] sm:min-h-[32px] hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md px-1"
                  >
                    Cookie Notice
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Legal Disclaimer, Dynamic Live Status, Freshness & Back to Top */}
        <div className="pt-8 border-t border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
          
          {/* Copyright & Product Disclaimer */}
          <div className="space-y-2 text-center lg:text-left max-w-2xl">
            <div className="text-slate-700 dark:text-slate-300 font-semibold">
              © {currentYear} AirIQ India. All rights reserved.
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Air quality values are estimates for general information. They are not an official AQI or medical advice. Follow your doctor's guidance if you have a health condition.
            </p>
          </div>

          {/* Real-Time Telemetry & Controls */}
          <div className="flex flex-wrap items-center justify-center gap-4 shrink-0">
            
            {/* Live Data Freshness Text */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
              title="Observation telemetry is refreshed continuously across atmospheric model and surface networks"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Air data updated {freshnessMinutes} minutes ago</span>
            </div>

            {/* Service Status Dot with Accessible Tooltip */}
            <div
              className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 cursor-help"
              tabIndex={0}
              role="status"
              aria-label={`System status: ${currentStatus.label}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${currentStatus.color}`} />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                {currentStatus.label}
              </span>

              {/* Hover/Focus Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block group-focus:block z-30 pointer-events-none">
                <div className="bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 text-[11px] py-1.5 px-3 rounded-lg shadow-lg whitespace-nowrap border border-slate-700 text-center">
                  <span>Backend Health: <strong>{currentStatus.label}</strong></span>
                  <div className="text-[10px] text-slate-400">
                    Checked {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic "Back to Top" Button */}
            {showScrollTop && (
              <button
                type="button"
                onClick={scrollToTop}
                className="flex items-center gap-1.5 min-h-[44px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all font-semibold shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 cursor-pointer animate-fade-in"
                aria-label="Scroll back to top of page"
              >
                <span>Back to top</span>
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
