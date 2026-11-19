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
  AlertTriangle,
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
import RoleSwitcher from './RoleSwitcher';
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
  const [alertsData, setAlertsData] = useState({ active_alerts: [], preference: { pm25_threshold: 100 } });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const insightsRef = useRef(null);
  const moreRef = useRef(null);
  const userRef = useRef(null);
  const alertsRef = useRef(null);
  const drawerRef = useRef(null);

  // PWA beforeinstallprompt handler
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

  // Close all menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setInsightsDropdownOpen(false);
    setMoreDropdownOpen(false);
    setUserDropdownOpen(false);
    setAlertsDropdownOpen(false);
  }, [location.pathname]);

  // Handle escape key to close menus
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

  // Fetch alerts for authenticated user
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

  // Click outside listener for desktop dropdowns
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

  // Primary navigation links (Clean & concise labels, whitespace-nowrap)
  const primaryLinks = [
    { to: '/', label: 'Home', icon: Wind },
    { to: '/live-assessment', label: 'Live Assessment', icon: MapPin },
    { to: '/livability', label: 'Livability', icon: Compass },
    { to: '/saved-places', label: 'Saved Places', icon: Bookmark },
  ];

  // Secondary Tools (Grouped in Insights dropdown)
  const insightLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3, desc: 'City-wide air quality metrics' },
    { to: '/prediction', label: 'Model Prediction', icon: Activity, desc: 'Meteorological PM2.5 estimator' },
    { to: '/comparison', label: 'Model Comparison', icon: GitCompare, desc: 'XGBoost, RF, MLP benchmarks' },
    { to: '/explainability', label: 'Explainability', icon: Sparkles, desc: 'SHAP force & waterfall plots' },
  ];

  // More links (History, About, Documentation)
  const moreLinks = [
    { to: '/history', label: 'History', icon: History, desc: 'Past personal exposure audits' },
    { to: '/about', label: 'About', icon: Info, desc: 'Scientific methodology & data' },
  ];

  const isInsightsActive = ['/dashboard', '/prediction', '/comparison', '/explainability'].includes(
    location.pathname
  );
  const isMoreActive = ['/history', '/about', '/worker', '/admin'].includes(location.pathname);

  const canAccessWorker = hasRoleAccess('worker');
  const canAccessAdmin = hasRoleAccess('admin');

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-1 sm:gap-4">
          {/* Logo & Brand - Guaranteed single-line (whitespace-nowrap) */}
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-2.5 shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg pr-1"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Wind className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-extrabold text-sm sm:text-lg text-navy-900 dark:text-white tracking-tight whitespace-nowrap">
                Pollution <span className="text-blue-600 dark:text-blue-400">XAI</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/80 uppercase tracking-wider">
                Delhi-NCR
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (Consolidated 4 Primaries + Insights & More Dropdowns) */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-1.5 text-xs">
            {primaryLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
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
                className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  isInsightsActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-expanded={insightsDropdownOpen}
              >
                <span>Insights</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${insightsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {insightsDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fadeIn">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
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
                          `flex items-start gap-2.5 px-3.5 py-2.5 text-xs transition-colors ${
                            isActive
                              ? 'bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                          }`
                        }
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
                className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  isMoreActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-expanded={moreDropdownOpen}
              >
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fadeIn">
                  {moreLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setMoreDropdownOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3.5 py-2.5 text-xs transition-colors ${
                            isActive
                              ? 'bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-100">{link.label}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{link.desc}</div>
                        </div>
                      </NavLink>
                    );
                  })}

                  {(canAccessWorker || canAccessAdmin) && (
                    <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Portals
                      </div>
                      {canAccessWorker && (
                        <NavLink
                          to="/worker"
                          onClick={() => setMoreDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
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

          {/* Right Section: Micro Dot Status, Theme Toggle, Alerts Bell, Auth Avatar, Mobile Trigger */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Ultra-compact API Status Dot with Tooltip */}
            <div className="relative group flex items-center px-0.5 sm:px-1 py-1">
              <span
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  isBackendOnline
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                    : 'bg-rose-500 animate-ping'
                }`}
                aria-label={isBackendOnline ? 'API Operational' : 'Connecting to API...'}
              />
              <div className="absolute right-0 top-full mt-2 hidden group-hover:flex items-center px-2 py-1 text-[11px] font-medium text-white bg-slate-900 rounded-md shadow-md whitespace-nowrap z-50 pointer-events-none">
                {isBackendOnline ? 'Backend API Online' : 'Connecting to API...'}
              </div>
            </div>

            {/* Dark / Light Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Alert Notification Bell (For Authenticated Users) */}
            {isAuthenticated && (
              <div className="relative" ref={alertsRef}>
                <button
                  type="button"
                  onClick={() => setAlertsDropdownOpen(!alertsDropdownOpen)}
                  className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Air Quality Threshold Alerts"
                  aria-label="View air quality alerts"
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
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-fadeIn">
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

            {/* User Profile / Sign In */}
            {isAuthenticated ? (
              <div className="relative" ref={userRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline-block text-xs font-medium text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                    {user?.name || 'Account'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{user?.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
                    </div>

                    <Link
                      to="/saved-places"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Bookmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>My Saved Places</span>
                    </Link>

                    <Link
                      to="/history"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Audit History</span>
                    </Link>

                    {isInstallable && (
                      <button
                        type="button"
                        onClick={handleInstallClick}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-semibold"
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
                className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition-all whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden min-w-[38px] min-h-[38px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={mobileMenuOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Accessible Mobile Drawer Below lg (Focus trapped & 44px tap targets) */}
      {mobileMenuOpen && (
        <div
          ref={drawerRef}
          className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-4 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
        >
          {/* Quick Controls: Theme Toggle & Role Switcher */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Theme</span>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Primary Links */}
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
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
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
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                  </div>
                </NavLink>
              );
            })}
          </div>

          {/* Utilities Section */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Utilities & Project
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
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{item.label}</span>
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
                <span>Install Pollution XAI App</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
