import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Wind,
  Compass,
  MapPin,
  BarChart3,
  Activity,
  GitCompare,
  Sparkles,
  Info,
  Menu,
  X,
  Shield,
  HardHat,
  Bookmark,
  History,
  User as UserIcon,
  LogOut,
  LogIn,
  Bell,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Download,
} from 'lucide-react';
import RoleSwitcher from './RoleSwitcher';
import { hasRoleAccess } from '../services/demoAuth';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';

export default function Navbar({ isBackendOnline }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState(false);
  const [alertsData, setAlertsData] = useState({ active_alerts: [], preference: { pm25_threshold: 100 } });
  const [roleUpdated, setRoleUpdated] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const dropdownRef = useRef(null);
  const alertsRef = useRef(null);

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
  };

  useEffect(() => {
    const onRoleChanged = () => setRoleUpdated((prev) => prev + 1);
    window.addEventListener('auth:role-changed', onRoleChanged);
    return () => window.removeEventListener('auth:role-changed', onRoleChanged);
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(e.target)) {
        setAlertsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { to: '/', label: 'Home', icon: Wind },
    { to: '/livability', label: 'Livability Verdict', icon: Compass },
    { to: '/live-assessment', label: 'Live Assessment', icon: MapPin },
    { to: '/saved-places', label: 'Saved Places', icon: Bookmark },
    { to: '/history', label: 'History', icon: History },
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/prediction', label: 'Prediction', icon: Activity },
    { to: '/comparison', label: 'Comparison', icon: GitCompare },
    { to: '/explainability', label: 'Explainability', icon: Sparkles },
    { to: '/about', label: 'About', icon: Info },
  ];

  // Dynamic role-based routes for Worker and Admin
  const canAccessWorker = hasRoleAccess('worker');
  const canAccessAdmin = hasRoleAccess('admin');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-navy-800 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Wind className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-navy-800 tracking-tight">Air Pollution XAI</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 rounded">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Explainable PM2.5 Intelligence</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            {canAccessWorker && (
              <NavLink
                to="/worker"
                className={({ isActive }) =>
                  `flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-800' : 'text-blue-700 bg-blue-50/70 hover:bg-blue-100'
                  }`
                }
              >
                <HardHat className="w-3.5 h-3.5" />
                <span>Worker</span>
              </NavLink>
            )}

            {canAccessAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    isActive ? 'bg-purple-100 text-purple-800' : 'text-purple-700 bg-purple-50/70 hover:bg-purple-100'
                  }`
                }
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </NavLink>
            )}
          </nav>

          {/* User Auth, Role Switcher & Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Demo Role Switcher (strictly gated behind VITE_ENABLE_DEMO_MODE) */}
            <RoleSwitcher />

            {/* User Account / Auth Actions */}
            {isAuthenticated ? (
              <>
                {/* Alert Notification Bell */}
                <div className="relative" ref={alertsRef}>
                  <button
                    onClick={() => setAlertsDropdownOpen(!alertsDropdownOpen)}
                    className="relative p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                    title="Air Quality Threshold Alerts"
                  >
                    {alertsData.active_alerts.length > 0 ? (
                      <BellRing className="w-4 h-4 text-amber-600 animate-pulse" />
                    ) : (
                      <Bell className="w-4 h-4 text-slate-500" />
                    )}
                    {alertsData.active_alerts.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                        {alertsData.active_alerts.length}
                      </span>
                    )}
                  </button>

                  {alertsDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-fadeIn">
                      <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Bell className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-navy-900">Saved Place Alerts</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Threshold: {alertsData.preference.pm25_threshold} µg/m³
                        </span>
                      </div>

                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {alertsData.active_alerts.length === 0 ? (
                          <div className="p-4 text-center">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                            <p className="text-xs font-semibold text-slate-800">Air Quality Safe</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              All your saved locations are currently below your {alertsData.preference.pm25_threshold} µg/m³ safety threshold.
                            </p>
                          </div>
                        ) : (
                          alertsData.active_alerts.map((alert) => (
                            <div key={alert.location_id} className="p-3 hover:bg-slate-50/80 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                  <span className="text-xs font-bold text-navy-900 truncate max-w-[170px]">
                                    {alert.name}
                                  </span>
                                </div>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  +{alert.exceeded_by} µg/m³
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-2 pt-1 text-[11px]">
                                <span className="text-slate-500">
                                  Current: <strong className="text-rose-600 font-semibold">{Math.round(alert.current_pm25)} µg/m³</strong>
                                </span>
                                <Link
                                  to={`/live-assessment?lat=${alert.latitude}&lon=${alert.longitude}&name=${encodeURIComponent(alert.name)}`}
                                  onClick={() => setAlertsDropdownOpen(false)}
                                  className="text-blue-600 hover:text-blue-800 font-semibold"
                                >
                                  View Live →
                                </Link>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="px-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <Link
                          to="/saved-places"
                          onClick={() => setAlertsDropdownOpen(false)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Manage Saved Places
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-all"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    {user?.name ? user.name[0] : (user?.email ? user.email[0] : 'U')}
                  </div>
                  <span className="hidden sm:inline-block max-w-[100px] truncate font-semibold">
                    {user?.name || user?.email?.split('@')[0]}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-navy-900 truncate">{user?.name || 'User Account'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/saved-places"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Bookmark className="w-4 h-4 text-blue-600" />
                        <span>Saved Places</span>
                      </Link>
                      <Link
                        to="/history"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <History className="w-4 h-4 text-indigo-600" />
                        <span>Assessment History</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Install PWA Prompt Button */}
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-all shadow-xs"
                title="Install AirXAI App to your Home Screen"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Install</span>
              </button>
            )}

            {/* Backend status indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="hidden xl:inline">{isBackendOnline ? 'Online' : 'Connecting...'}</span>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-1 shadow-lg animate-fadeIn max-h-[80vh] overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-blue-600" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {canAccessWorker && (
            <NavLink
              to="/worker"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-blue-700 bg-blue-50"
            >
              <HardHat className="w-4 h-4 text-blue-600" />
              <span>Worker Portal</span>
            </NavLink>
          )}

          {canAccessAdmin && (
            <NavLink
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-purple-700 bg-purple-50"
            >
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Admin Portal</span>
            </NavLink>
          )}

          {isInstallable && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleInstallClick();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 mt-2"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Install Web App</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
