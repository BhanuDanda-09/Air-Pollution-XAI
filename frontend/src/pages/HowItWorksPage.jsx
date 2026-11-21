import React from 'react';
import { Link } from 'react-router-dom';
import {
  Satellite,
  Compass,
  HeartPulse,
  ShieldCheck,
  MapPin,
  Wind,
  Layers,
  ArrowRight,
  Activity,
  CheckCircle2,
  Building2,
  HelpCircle,
} from 'lucide-react';
import usePageMeta from '../hooks/usePageMeta';

export default function HowItWorksPage() {
  usePageMeta('/how-it-works');

  const steps = [
    {
      num: '01',
      title: 'Satellite & Ground Data Ingestion',
      icon: Satellite,
      desc: 'We continuously stream atmospheric data from the European Copernicus satellite network (CAMS), ground-truth observations from the Central Pollution Control Board (CPCB), and surface weather physics from Open-Meteo.',
    },
    {
      num: '02',
      title: 'Weather & Atmospheric Physics Modeling',
      icon: Wind,
      desc: 'Air pollution is not static. We simulate how wind speeds disperse particulate matter, how winter temperature inversions trap toxic smoke near the ground, and how humidity swells aerosol particles.',
    },
    {
      num: '03',
      title: 'Personalized Health Sensitivity Scoring',
      icon: HeartPulse,
      desc: 'The same air quality impacts an athlete, an infant, and an asthma patient very differently. Following World Health Organization (WHO 2021) guidelines, we adjust risk thresholds for respiratory, cardiac, and sensitive profiles.',
    },
    {
      num: '04',
      title: 'Actionable Health & Relocation Guidance',
      icon: Compass,
      desc: 'Instead of just showing raw, confusing numbers, we provide clear recommendations: whether to exercise outdoors, optimal commute windows, mask advisories, or comparative relocation benefits.',
    },
  ];

  const tiers = [
    {
      tier: 'Tier 1',
      badge: 'Station-Validated',
      color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      rule: 'Within 25 km of an active CPCB station',
      details: 'High precision. Live readings from official continuous monitoring stations directly validate our models. Shows the exact station name and distance.',
    },
    {
      tier: 'Tier 2',
      badge: 'District Model-Derived',
      color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      rule: 'Within 25 to 50 km or district centers',
      details: 'Medium precision. Calibrated against regional district geography, topography, and synoptic weather patterns across all 36 Indian States and Union Territories.',
    },
    {
      tier: 'Tier 3',
      badge: 'Gridded Regional Estimate',
      color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      rule: 'Remote towns & villages > 50 km from stations',
      details: 'Over 95% of rural India lacks ground stations. We provide gridded regional estimates (~11 km resolution) with transparent disclosures. Health verdicts are marked as indicative.',
    },
  ];

  return (
    <div className="space-y-12 py-6 max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5" />
          Transparent Science & Technology
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          How AirIQ India Works
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          From satellite sensors in orbit to neighborhood air quality forecasts. Here is how we turn complex atmospheric physics into practical, health-first advice for families across India.
        </p>
      </div>

      {/* 4-Step Process Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-colors"
            >
              <div className="text-4xl font-black text-slate-200 dark:text-slate-800 absolute right-4 top-4 group-hover:text-emerald-500/20 transition-colors">
                {step.num}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* 3-Tier Coverage Standard */}
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            Scientific Honesty Framework
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Our 3-Tier Coverage Standards
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            We never pretend a rural village has an on-site physical sensor when it doesn’t. Every search result displays a verified tier badge so you know the exact source and confidence of your reading.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((t) => (
            <div
              key={t.tier}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">{t.tier}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${t.color}`}>
                  {t.badge}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {t.rule}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t.details}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg shadow-emerald-900/20">
        <div className="space-y-1.5">
          <h3 className="text-xl sm:text-2xl font-bold">Ready to check the air near you?</h3>
          <p className="text-sm text-emerald-100 max-w-xl">
            Search any city, town, village, or 6-digit PIN code across India for instant, personalized guidance.
          </p>
        </div>
        <Link
          to="/live-assessment"
          className="px-6 py-3 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-sm shadow-md transition-all shrink-0 inline-flex items-center gap-2"
        >
          <span>Check My Air</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
