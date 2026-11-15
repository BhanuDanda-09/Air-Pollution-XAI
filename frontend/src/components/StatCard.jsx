import React from 'react';

export default function StatCard({ title, value, unit, subtitle, icon: Icon, color = 'blue', badge }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      iconBg: 'bg-blue-100 text-blue-600',
      badge: 'bg-blue-100 text-blue-800',
    },
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      iconBg: 'bg-teal-100 text-teal-600',
      badge: 'bg-teal-100 text-teal-800',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      iconBg: 'bg-amber-100 text-amber-600',
      badge: 'bg-amber-100 text-amber-800',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      iconBg: 'bg-purple-100 text-purple-600',
      badge: 'bg-purple-100 text-purple-800',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      iconBg: 'bg-rose-100 text-rose-600',
      badge: 'bg-rose-100 text-rose-800',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-extrabold text-navy-800 tracking-tight">{value}</span>
        {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
      </div>

      <div className="mt-2 flex items-center justify-between">
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        {badge && (
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${scheme.badge}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
