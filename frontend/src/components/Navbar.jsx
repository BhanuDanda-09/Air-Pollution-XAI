import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
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
} from 'lucide-react';
import RoleSwitcher from './RoleSwitcher';
import { hasRoleAccess, isDemoModeEnabled } from '../services/demoAuth';

export default function Navbar({ isBackendOnline }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleUpdated, setRoleUpdated] = useState(0);

  useEffect(() => {
    const onRoleChanged = () => setRoleUpdated((prev) => prev + 1);
    window.addEventListener('auth:role-changed', onRoleChanged);
    return () => window.removeEventListener('auth:role-changed', onRoleChanged);
  }, []);

  const navLinks = [
    { to: '/', label: 'Home', icon: Wind },
    { to: '/livability', label: 'Livability Verdict', icon: Compass },
    { to: '/live-assessment', label: 'Live Assessment', icon: MapPin },
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/prediction', label: 'Prediction', icon: Activity },
    { to: '/comparison', label: 'Model Comparison', icon: GitCompare },
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
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            {canAccessWorker && (
              <NavLink
                to="/worker"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-blue-700 bg-blue-50/70 hover:bg-blue-100'
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
                  `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-purple-100 text-purple-800'
                      : 'text-purple-700 bg-purple-50/70 hover:bg-purple-100'
                  }`
                }
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </NavLink>
            )}
          </nav>

          {/* Status Indicator, Role Switcher & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {/* Demo Role Switcher (strictly gated behind VITE_ENABLE_DEMO_MODE) */}
            <RoleSwitcher />

            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span>{isBackendOnline ? 'Backend Online' : 'Connecting API...'}</span>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-1 shadow-lg animate-fadeIn">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-5 h-5 text-blue-600" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {canAccessWorker && (
            <NavLink
              to="/worker"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-bold text-blue-700 bg-blue-50"
            >
              <HardHat className="w-5 h-5 text-blue-600" />
              <span>Worker Portal</span>
            </NavLink>
          )}

          {canAccessAdmin && (
            <NavLink
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-bold text-purple-700 bg-purple-50"
            >
              <Shield className="w-5 h-5 text-purple-600" />
              <span>Admin Portal</span>
            </NavLink>
          )}
        </div>
      )}
    </header>
  );
}
