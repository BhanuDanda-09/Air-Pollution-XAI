import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Wind,
  Compass,
  MapPin,
  Bookmark,
  BarChart3,
  Activity,
  GitCompare,
  Sparkles,
  History,
  Info,
  ChevronDown,
  Shield,
  HardHat,
  Bell,
  BellRing,
  CheckCircle2,
  Download,
  LogIn,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { hasRoleAccess } from '../services/demoAuth';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import userService from '../services/userService';

export default function Navbar({ isBackendOnline }) {
  const location = useLocation();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [insightsDropdownOpen, setInsightsDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [alertsData, setAlertsData] = useState({ active_alerts: [], preference: { pm25_threshold: 100 } });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const insightsRef = useRef(null);
  const moreRef = useRef(null);
  const userRef = useRef(null);
  const alertsRef = useRef(null);
  const drawerRef = useRef(null);

  // 1. Scroll listener for sticky header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. PWA beforeinstallprompt handler
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  // 3. Close menus on route change & unlock body scroll
  useEffect(() => {
    setMobileMenuOpen(false);
    setInsightsDropdownOpen(false);
    setMoreDropdownOpen(false);
    setUserDropdownOpen(false);
    setAlertsDropdownOpen(false);
  }, [location.pathname]);

  // 4. Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // 5. Handle escape key to close menus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setInsightsDropdownOpen(false);
        setMoreDropdownOpen(false);
        setUserDropdownOpen(false);
        setAlertsDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 6. Focus trap inside mobile drawer
  useEffect(() => {
    if (!mobileMenuOpen || !drawerRef.current) return;
    const focusableElements = drawerRef.current.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      const firstEl = focusableElements[0];
      const lastEl = focusableElements[focusableElements.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [mobileMenuOpen]);

  // 7. Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (insightsRef.current && !insightsRef.current.contains(e.target)) {
        setInsightsDropdownOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(e.target)) {
        setAlertsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 8. Fetch alerts for authenticated user
  useEffect(() => {
    if (isAuthenticated) {
      userService
        .getAlerts()
        .then((res) => {
          if (res) {
            setAlertsData({
              active_alerts: res.active_alerts || [],
              preference: res.preference || { pm25_threshold: 100 },
            });
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Navigation Links Specification
  // Primary (3 items)
  const primaryLinks = [
    { to: '/', label: 'Home', icon: Wind },
    { to: '/live-assessment', label: 'Live Assessment', icon: MapPin },
    { to: '/saved-places', label: 'Saved Places', icon: Bookmark },
  ];

  // Insights dropdown (5 items)
  const insightLinks = [
    { to: '/livability', label: 'Livability Verdict', icon: Compass, desc: 'Residential suitability & profile scoring' },
    { to: '/dashboard', label: 'Model Dashboard', icon: BarChart3, desc: 'System telemetry & prediction activity' },
    { to: '/prediction', label: 'PM2.5 Prediction', icon: Activity, desc: 'Surface meteorology ML estimator' },
    { to: '/comparison', label: 'Model Benchmarking', icon: GitCompare, desc: 'XGBoost, RF, MLP accuracy metrics' },
    { to: '/explainability', label: 'XAI & SHAP', icon: Sparkles, desc: 'Local attributions & feature contributions' },
  ];

  // More dropdown (2 utilities + role portals)
  const moreLinks = [
    { to: '/history', label: 'Exposure History', icon: History, desc: 'Past personal assessment timeline' },
    { to: '/about', label: 'About & Methodology', icon: Info, desc: 'Research design, data sources & limits' },
  ];

  const isInsightsActive = [
    '/livability',
    '/dashboard',
    '/prediction',
    '/comparison',
    '/explainability',
  ].includes(location.pathname);

  const isMoreActive = ['/history', '/about', '/worker', '/admin'].includes(location.pathname);

  const canAccessWorker = hasRoleAccess('worker');
  const canAccessAdmin = hasRoleAccess('admin');

  // Keyboard navigation for dropdowns
  const handleDropdownKeyDown = (e, setOpen, isOpen) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(!isOpen);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 overflow-x-clip ${
        isScrolled
          ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border-b border-slate-200/90 dark:border-slate-800'
          : 'bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-800/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-1 sm:gap-4">
          
          {/* Brand Logo & Title on One Line */}
          <Link
            to="/"
            className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg pr-0.5"
          >
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Wind className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0">
              <span className="font-extrabold text-sm sm:text-base lg:text-lg text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                Pollution <span className="text-blue-600 dark:text-blue-400">XAI</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/80 uppercase tracking-wider shrink-0">
                v1.0
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (Primary Links + Insights Dropdown + More Dropdown) */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-1.5 text-xs">
            {primaryLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </NavLink>
              );
            })}

            {/* Insights Dropdown */}
            <div className="relative" ref={insightsRef}>
              <button
                type="button"
                onClick={() => {
                  setInsightsDropdownOpen(!insightsDropdownOpen);
                  setMoreDropdownOpen(false);
                }}
                onKeyDown={(e) => handleDropdownKeyDown(e, setInsightsDropdownOpen, insightsDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isInsightsActive
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-expanded={insightsDropdownOpen}
                aria-haspopup="true"
              >
                <span>Insights</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${insightsDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {insightsDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  role="menu"
                >
                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                    Analytics & Explainable AI
                  </div>
                  {insightLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setInsightsDropdownOpen(false)}
                        className={({ isActive }) =>
                          `flex items-start gap-2.5 px-3.5 py-2.5 text-xs transition-colors focus-visible:bg-slate-100 dark:focus-visible:bg-slate-800 ${
                            isActive
                              ? 'bg-blue-50/90 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                          }`
                        }
                        role="menuitem"
                      >
                        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-100">{link.label}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{link.desc}</div>
                        </div>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>

            {/* More Dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => {
                  setMoreDropdownOpen(!moreDropdownOpen);
                  setInsightsDropdownOpen(false);
                }}
                onKeyDown={(e) => handleDropdownKeyDown(e, setMoreDropdownOpen, moreDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isMoreActive
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-expanded={moreDropdownOpen}
                aria-haspopup="true"
              >
                <span>More</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${moreDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {moreDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  role="menu"
                >
                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                    Project Documentation & History
                  </div>
                  {moreLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setMoreDropdownOpen(false)}
                        className={({ isActive }) =>
                          `flex items-start gap-2.5 px-3.5 py-2.5 text-xs transition-colors focus-visible:bg-slate-100 dark:focus-visible:bg-slate-800 ${
                            isActive
                              ? 'bg-blue-50/90 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                          }`
                        }
                        role="menuitem"
                      >
                        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-100">{link.label}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{link.desc}</div>
                        </div>
                      </NavLink>
                    );
                  })}

                  {(canAccessWorker || canAccessAdmin) && (
                    <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                      <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Restricted Portals
                      </div>
                      {canAccessWorker && (
                        <NavLink
                          to="/worker"
                          onClick={() => setMoreDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          role="menuitem"
                        >
                          <HardHat className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Worker Portal</span>
                        </NavLink>
                      )}
                      {canAccessAdmin && (
                        <NavLink
                          to="/admin"
                          onClick={() => setMoreDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                          role="menuitem"
                        >
                          <Shield className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>Admin Portal</span>
                        </NavLink>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* Right Section: Compact Status Dot, Theme Toggle, Alerts, Auth Menu, Mobile Trigger */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* Status Dot with Tooltip (No clipped text, 0px horizontal overflow) */}
            <div className="relative group flex items-center p-0.5 sm:p-1 cursor-default" tabIndex="0" aria-label={`Backend API is ${isBackendOnline ? 'online' : 'connecting'}`}>
              <span
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all shrink-0 ${
                  isBackendOnline
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                    : 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                }`}
              />
              <div
                role="tooltip"
                className="absolute right-0 top-full mt-2 hidden group-hover:flex group-focus:flex items-center px-2 py-1 text-[11px] font-medium text-white bg-slate-900 dark:bg-slate-800 rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none border border-slate-700/50"
              >
                {isBackendOnline ? 'API Operational (Online)' : 'Connecting to Backend API...'}
              </div>
            </div>

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
              )}
            </button>

            {/* Alert Notification Bell (For Authenticated Users) */}
            {isAuthenticated && (
              <div className="relative" ref={alertsRef}>
                <button
                  type="button"
                  onClick={() => setAlertsDropdownOpen(!alertsDropdownOpen)}
                  className="relative p-1 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                  title="Air Quality Threshold Alerts"
                  aria-label="View air quality alerts"
                  aria-expanded={alertsDropdownOpen}
                >
                  {alertsData.active_alerts.length > 0 ? (
                    <BellRing className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                  ) : (
                    <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  )}
                  {alertsData.active_alerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                      {alertsData.active_alerts.length}
                    </span>
                  )}
                </button>

                {alertsDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">Active Air Alerts</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Limit: {alertsData.preference.pm25_threshold} µg/m³
                      </span>
                    </div>

                    <div className="py-2 max-h-60 overflow-y-auto space-y-2">
                      {alertsData.active_alerts.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-500 dark:text-slate-400">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                          All saved locations are below your threshold.
                        </div>
                      ) : (
                        alertsData.active_alerts.map((alert) => (
                          <div
                            key={alert.location_id}
                            className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-amber-900 dark:text-amber-200">{alert.name}</span>
                              <span className="font-bold text-rose-600 dark:text-rose-400">
                                {alert.current_pm25} µg/m³
                              </span>
                            </div>
                            <div className="text-[11px] text-amber-700 dark:text-amber-400">
                              Exceeded threshold by +{alert.exceeded_by} µg/m³ ({alert.cpcb_band})
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Link
                        to="/saved-places"
                        onClick={() => setAlertsDropdownOpen(false)}
                        className="block text-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Manage saved places & thresholds →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile Avatar / Sign In Button */}
            {isAuthenticated ? (
              <div className="relative" ref={userRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  onKeyDown={(e) => handleDropdownKeyDown(e, setUserDropdownOpen, userDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                  aria-label="User account menu"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline-block text-xs font-medium text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                    {user?.name || 'Account'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    role="menu"
                  >
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{user?.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
                    </div>

                    <Link
                      to="/saved-places"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      role="menuitem"
                    >
                      <Bookmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>My Saved Places</span>
                    </Link>

                    <Link
                      to="/history"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      role="menuitem"
                    >
                      <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Audit History</span>
                    </Link>

                    {isInstallable && (
                      <button
                        type="button"
                        onClick={handleInstallClick}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-semibold"
                        role="menuitem"
                      >
                        <Download className="w-4 h-4" />
                        <span>Install Web App</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={mobileMenuOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Accessible Mobile Drawer (44px tap targets, focus trap, body scroll locked) */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          ref={drawerRef}
          className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-4 shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto animate-in fade-in slide-in-from-top-3 duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
        >
          {/* Quick Controls: Theme & Backend Status */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isBackendOnline ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
                }`}
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isBackendOnline ? 'Backend Online' : 'Connecting API...'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="min-h-[44px] flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Primary Navigation Links */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Primary Navigation
            </span>
            {primaryLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Insights Section */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Insights & AI Tools
            </span>
            {insightLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{item.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                  </div>
                </NavLink>
              );
            })}
          </div>

          {/* More Utilities Section */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Utilities & Documentation
            </span>
            {moreLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{item.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                  </div>
                </NavLink>
              );
            })}

            {canAccessWorker && (
              <NavLink
                to="/worker"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40"
              >
                <HardHat className="w-4 h-4 text-blue-600" />
                <span>Worker Portal</span>
              </NavLink>
            )}

            {canAccessAdmin && (
              <NavLink
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40"
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Admin Portal</span>
              </NavLink>
            )}
          </div>

          {/* PWA Install Button (If Available) */}
          {isInstallable && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full min-h-[44px] flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Install Pollution XAI Web App</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
