import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wind,
  Activity,
  BarChart3,
  Sparkles,
  GitCompare,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Database,
  Cpu,
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      title: 'Precision PM2.5 Estimation',
      desc: 'Predict fine particulate matter concentrations using surface meteorological indicators without artificial timestamp dependencies.',
      icon: Activity,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      link: '/prediction',
    },
    {
      title: 'Model Benchmarking',
      desc: 'Compare Random Forest, tuned XGBoost, and deep-learning MLP models across held-out test evaluations.',
      icon: GitCompare,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      link: '/comparison',
    },
    {
      title: 'SHAP Explainable AI',
      desc: 'Unpack the black-box with exact local Shapley additive attributions, exposing which factors drive each prediction.',
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      link: '/explainability',
    },
  ];

  const modelsList = [
    {
      name: 'XGBoost Regressor (Tuned)',
      tag: 'Top Performer',
      metric: 'Test R² = 0.7455',
      desc: 'Optimized gradient boosted decision tree ensemble achieving best generalization.',
    },
    {
      name: 'Random Forest Regressor',
      tag: 'Bagging Baseline',
      metric: 'Test R² = 0.7269',
      desc: '100-tree ensemble with median imputation establishing robust tabular performance.',
    },
    {
      name: 'Multilayer Perceptron (MLP)',
      tag: 'Deep Learning',
      metric: 'Test R² = 0.5408',
      desc: '3-hidden-layer Keras 3 neural network trained on leak-free standardized features.',
    },
  ];

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-slate-900 text-white p-8 sm:p-14 border border-slate-800 shadow-xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-teal-300 border border-white/15 backdrop-blur-xs">
            <Wind className="w-3.5 h-3.5 text-teal-300" />
            <span>Final-Year B.Tech Capstone Project</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Understand Air Pollution Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-sky-200">Explainable AI</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Predict PM2.5 concentrations using meteorological indicators and understand how machine learning models influence their predictions.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/prediction"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
            >
              <Activity className="w-4 h-4" />
              <span>Start Prediction</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Explore Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Mandatory Scientific Disclaimer Banner */}
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 shadow-xs">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-amber-900">Official Scientific & Operational Disclaimer</h4>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              This application provides AI-based PM2.5 estimates from user-provided meteorological inputs. It is not a certified real-time air quality monitoring system. Output categories represent indicative concentration bands and should not be cited as an official multi-pollutant 24-hour CPCB AQI.
            </p>
          </div>
        </div>
      </section>

      {/* What is PM2.5? Explainer */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">The Target Variable</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-800">
            Why Fine Particulate Matter (PM2.5) Matters
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            PM2.5 denotes fine inhalable particles with diameters generally 2.5 micrometers and smaller—about 30 times thinner than a human hair. Due to their minute size, they bypass respiratory defenses, penetrating deep into alveolar tissue and the bloodstream.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Surface meteorology—including relative humidity, wind direction, solar radiation, barometric pressure, and ambient temperature—strongly dictates planetary boundary layer height, aerosol condensation, and pollutant dispersion.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Input Meteorological Envelope</h3>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="font-semibold text-slate-800">Relative Humidity (RH)</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">0.0 – 100.0 %</span>
            </li>
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="font-semibold text-slate-800">Wind Direction (WD)</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">0.0 – 360.0 °</span>
            </li>
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="font-semibold text-slate-800">Solar Radiation (SR)</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">0.0 – 1500.0 W/m²</span>
            </li>
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="font-semibold text-slate-800">Barometric Pressure (BP)</span>
              <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">
                700.0 – 780.0 mmHg
              </span>
            </li>
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="font-semibold text-slate-800">Air Temperature (AT)</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">-20.0 – 60.0 °C</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Core Project Capabilities */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Capabilities</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-800">Comprehensive AI Analytics</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Engineered with strict academic standards, held-out test benchmarks, and interpretable XAI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-navy-800">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
                <Link
                  to={item.link}
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 group"
                >
                  <span>Launch Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trained Models Overview */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Model Zoo</span>
            <h2 className="text-2xl font-bold text-navy-800">Evaluated Model Architectures</h2>
          </div>
          <Link to="/comparison" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
            <span>View detailed test comparison</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {modelsList.map((m, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy-800">{m.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {m.tag}
                </span>
              </div>
              <div className="text-sm font-black text-slate-800 font-mono">{m.metric}</div>
              <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
