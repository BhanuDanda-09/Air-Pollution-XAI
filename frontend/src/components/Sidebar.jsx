import React from 'react';
import { NavLink } from 'react-router-dom';
import { Wind, BarChart3, Activity, GitCompare, Sparkles, Info } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const navItems = [
    { to: '/', label: 'Home', icon: Wind },
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/prediction', label: 'Prediction', icon: Activity },
    { to: '/comparison', label: 'Model Comparison', icon: GitCompare },
    { to: '/explainability', label: 'Explainability', icon: Sparkles },
    { to: '/about', label: 'About', icon: Info },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-navy-800 flex items-center justify-center text-white">
            <Wind className="w-4 h-4 text-teal-400" />
          </div>
          <span className="font-bold text-base text-navy-800">Air Pollution XAI</span>
        </div>

        {/* Links */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-blue-600" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          <p className="font-semibold text-slate-700 dark:text-slate-200">VayuPulse</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Know Your Air. Protect Your Life.</p>
        </div>
      </div>
    </aside>
  );
}
