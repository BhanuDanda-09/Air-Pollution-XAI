import React from 'react';
import { Layers, Activity, Brain, Compass, ShieldCheck, BarChart2, Wind } from 'lucide-react';
import usePageMeta from '../hooks/usePageMeta';

export default function MethodologyPage() {
  usePageMeta('/methodology');

  const steps = [
    {
      title: '1. Satellite Atmospheric Reanalysis (Copernicus CAMS)',
      icon: SatelliteIcon,
      description:
        'Continuous assimilation of global satellite sensor observations (MODIS, Sentinel-5P) providing continuous planetary boundary layer particulate matter, optical depth, and wind dispersion vectors across India at ~11 km resolution.',
    },
    {
      title: '2. Real-Time Surface Meteorology Integration',
      icon: Wind,
      description:
        'Live measurement of boundary layer temperature, relative humidity, surface pressure (mmHg), and thermal inversion dynamics that directly affect whether pollution stays trapped near the ground.',
    },
    {
      title: '3. Machine Learning Ground Calibration',
      icon: Brain,
      description:
        'Tuned gradient-boosted decision trees (XGBoost) trained on regulatory station telemetry to correct regional satellite biases and model localized terrain and thermal trapping effects ($R^2 = 0.7455$).',
    },
    {
      title: '4. Explainable AI (SHAP) Feature Attribution',
      icon: BarChart2,
      description:
        'Every forecast is accompanied by mathematical feature attribution using Shapley Additive Explanations (SHAP), calculating the exact contribution of each atmospheric factor in raising or lowering particulate levels.',
    },
  ];

  return (
    <div className="space-y-10 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5" />
          <span>Scientific Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          How AirIQ India Calculates Air Quality
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Combining satellite atmospheric chemistry, physics-driven boundary layer dynamics, and machine learning calibrated against regulatory ground stations.
        </p>
      </div>

      {/* Methodology Pipeline */}
      <div className="space-y-6">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-4 hover:border-cyan-500/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {s.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {s.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verification & Transparency */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Rigorous Validation & CPCB Alignment</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          AirIQ India evaluates all predictions against the official Central Pollution Control Board (CPCB) National Air Quality Index concentration categories: Good (0–30), Satisfactory (31–60), Moderate (61–90), Poor (91–120), Very Poor (121–250), and Severe (250+ µg/m³).
        </p>
      </div>
    </div>
  );
}

function SatelliteIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 7 9 3 5 7l4 4" />
      <path d="m17 11 4 4-4 4-4-4" />
      <path d="m8 12 4 4 6-6-4-4Z" />
      <path d="m16 8 3-3" />
      <path d="M9 21a6 6 0 0 0-6-6" />
    </svg>
  );
}
