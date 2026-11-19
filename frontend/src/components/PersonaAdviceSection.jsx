import React, { useState } from 'react';
import { Users, HeartHandshake, Activity, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

export default function PersonaAdviceSection({ personaGuidance }) {
  if (!personaGuidance) return null;

  const [activeTab, setActiveTab] = useState('general');

  const personas = [
    {
      key: 'general',
      title: 'General Healthy Adults',
      subtitle: 'Daily routines, commuting & home ventilation',
      icon: Users,
      data: personaGuidance.general,
    },
    {
      key: 'sensitive',
      title: 'Sensitive Groups',
      subtitle: 'Children, seniors, asthma & respiratory patients',
      icon: HeartHandshake,
      data: personaGuidance.sensitive,
    },
    {
      key: 'outdoor',
      title: 'Outdoor Athletes & Commuters',
      subtitle: 'Marathon training, cycling & outdoor exertion',
      icon: Activity,
      data: personaGuidance.outdoor,
    },
  ];

  const getTagColor = (tag) => {
    switch (tag?.toLowerCase()) {
      case 'safe':
      case 'recommended':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'acceptable':
      case 'good':
        return 'bg-lime-50 text-lime-800 border-lime-300';
      case 'minor caution':
      case 'moderate':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'caution':
      case 'adjust timing':
      case 'unfavorable':
        return 'bg-orange-50 text-orange-800 border-orange-300';
      case 'high caution':
      case 'not recommended':
      case 'hazardous':
      case 'emergency':
      case 'prohibited':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="mb-4 pb-3 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-800">
          Targeted Exposure Advisories by Persona
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Actionable health recommendations synthesized specifically for different vulnerability groups
        </p>
      </div>

      {/* Persona Tab Selectors (Responsive Grid to prevent tablet horizontal overflow) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-6">
        {personas.map((p) => {
          const Icon = p.icon;
          const isSelected = activeTab === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setActiveTab(p.key)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-500'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                  {p.title}
                </span>
                {p.data?.tag && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTagColor(
                      p.data.tag
                    )}`}
                  >
                    {p.data.tag}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">{p.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Active Persona Guidance Detail Box */}
      {personas.map((p) => {
        if (p.key !== activeTab || !p.data) return null;
        const Icon = p.icon;
        return (
          <div
            key={p.key}
            className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 animate-fadeIn"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{p.title} Guidance</h4>
                  <p className="text-xs text-slate-500">{p.subtitle}</p>
                </div>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${getTagColor(
                  p.data.tag
                )}`}
              >
                Status: {p.data.tag}
              </span>
            </div>

            <div className="space-y-3 mt-4">
              <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Primary Recommendation
                </span>
                <p className="text-sm font-semibold text-slate-800">{p.data.action}</p>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Specific Action Steps
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">{p.data.details}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
