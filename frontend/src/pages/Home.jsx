import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wind,
  MapPin,
  Navigation,
  Compass,
  Activity,
  Sparkles,
  BarChart3,
  GitCompare,
  Bookmark,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Flame,
  Car,
} from 'lucide-react';

const PRESET_PLACES = [
  { name: 'Connaught Place', lat: 28.6139, lon: 77.209, area: 'Central Delhi' },
  { name: 'Cyber City Gurgaon', lat: 28.495, lon: 77.0895, area: 'Gurgaon, HR' },
  { name: 'Noida Sector 62', lat: 28.5355, lon: 77.391, area: 'Noida, UP' },
  { name: 'Anand Vihar', lat: 28.6469, lon: 77.316, area: 'East Delhi' },
];

export default function Home() {
  const navigate = useNavigate();
  const [selectedPreset, setSelectedPreset] = useState(PRESET_PLACES[0]);
  const [isLocating, setIsLocating] = useState(false);
  const [disclaimerExpanded, setDisclaimerExpanded] = useState(false);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lon = parseFloat(pos.coords.longitude.toFixed(4));
        navigate(`/live-assessment?lat=${lat}&lon=${lon}&name=My%20Location`);
      },
      (err) => {
        setIsLocating(false);
        // Fallback to Connaught Place if denied/timeout
        navigate(`/live-assessment?lat=28.6139&lon=77.2090&name=Connaught%20Place`);
      },
      { timeout: 8000 }
    );
  };

  const modelsList = [
    {
      name: 'XGBoost Regressor (Tuned)',
      tag: 'Top Performer',
      metric: 'Test R² = 0.7455',
      desc: 'Optimized gradient boosted decision tree ensemble with 5-fold cross-validation.',
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

  const featureCards = [
    {
      title: 'Live Air Quality Assessment',
      desc: 'Pinpoint any location with the interactive Leaflet map picker to get live Open-Meteo weather, Copernicus CAMS PM2.5, and model comparison.',
      icon: MapPin,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      link: '/live-assessment',
      action: 'Check Live Location',
    },
    {
      title: 'Livability & Head-to-Head Comparison',
      desc: 'Comprehensive 0–100 Livability Score with personalized health risk sensitivity profiles and side-by-side comparison between two places.',
      icon: Compass,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      link: '/livability',
      action: 'Compare Places',
    },
    {
      title: 'Explainable AI & Source Attribution',
      desc: 'Understand the "why" behind pollution spikes using exact local SHAP feature attributions and empirical source sector decomposition.',
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      link: '/explainability',
      action: 'Explore XAI Engine',
    },
    {
      title: 'Saved Places & Safety Alerts',
      desc: 'Bookmark Home, Work, and Campus with custom PM2.5 threshold alerts notifying you via the Navbar bell whenever air quality deteriorates.',
      icon: Bookmark,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      link: '/saved-places',
      action: 'Manage Saved Places',
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-16 py-6 sm:py-8 max-w-7xl mx-auto">
      {/* Hero Section: 2-Column Responsive Layout */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-slate-900 text-white p-6 sm:p-10 lg:p-14 border border-slate-800 shadow-2xl">
        {/* Decorative background glow */}
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Real-World Benefit Copy & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-teal-300 border border-white/15 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>AI Decision Intelligence • Delhi-NCR Airshed</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Is the air safe where you are <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-sky-300 to-blue-300">right now?</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Get real-time location-based air quality assessments, multi-factor livability scores, and explainable PM2.5 insights backed by Copernicus satellite data and machine learning.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 active:scale-98 text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Detecting Location...' : 'Check My Location'}</span>
              </button>

              <Link
                to="/prediction"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 active:scale-98 text-white border border-white/20 transition-all"
              >
                <Activity className="w-4 h-4 text-teal-300" />
                <span>Try Prediction Model</span>
              </Link>
            </div>

            {/* Trust Badges Strip */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Copernicus CAMS Satellite Data</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>SHAP Source Attribution</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Personalized Health Guidance</span>
              </div>
            </div>
          </div>

          {/* Right Column: "Check Your Air Now" Card */}
          <div className="lg:col-span-5">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 sm:p-6 text-slate-900 border border-white/20 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-navy-900">Check Your Air Now</h3>
                    <p className="text-[11px] text-slate-500">Live Delhi-NCR air quality check</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Sync
                </span>
              </div>

              {/* Quick Preset Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Select a Popular Hub:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_PLACES.map((p) => {
                    const isSelected = selectedPreset.name === p.name;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setSelectedPreset(p)}
                        className={`p-2 rounded-xl text-left border transition-all text-xs ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate">{p.area}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mini Verdict Preview Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{selectedPreset.name}</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {selectedPreset.lat}, {selectedPreset.lon}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Evaluation</span>
                    <div className="text-xs font-bold text-slate-700">Real-time Weather & CAMS</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Airshed</span>
                    <div className="text-xs font-bold text-emerald-700">Delhi-NCR Validated</div>
                  </div>
                </div>
              </div>

              {/* Direct Actions */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/live-assessment?lat=${selectedPreset.lat}&lon=${selectedPreset.lon}&name=${encodeURIComponent(
                        selectedPreset.name
                      )}`
                    )
                  }
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>Assess {selectedPreset.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/livability?lat=${selectedPreset.lat}&lon=${selectedPreset.lon}&name=${encodeURIComponent(
                        selectedPreset.name
                      )}`
                    )
                  }
                  className="w-full py-2 px-4 rounded-xl font-semibold text-xs text-blue-700 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Check Livability Verdict</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compact Collapsible Scientific Disclaimer */}
      <section className="bg-slate-100/80 border border-slate-200/90 rounded-2xl p-3.5 transition-all">
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Scientific & Regional Scope:</strong> Validated strictly for the Delhi-NCR airshed. Reference PM2.5 is sourced from Copernicus CAMS model data.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDisclaimerExpanded(!disclaimerExpanded)}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 shrink-0"
          >
            <span>{disclaimerExpanded ? 'Hide Details' : 'Read Scope'}</span>
            {disclaimerExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {disclaimerExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-1.5 animate-fadeIn">
            <p>
              This platform synthesizes empirical machine learning models (XGBoost, Random Forest, MLP) with real-time Open-Meteo meteorology and European Copernicus Atmosphere Monitoring Service (CAMS) regional reanalysis.
            </p>
            <p>
              Model estimates are empirical physical indicators rather than official regulatory CPCB 24-hour statutory AQI measurements. For locations outside Delhi-NCR bounds, predictions represent unvalidated geographic extrapolations.
            </p>
          </div>
        )}
      </section>

      {/* 3-Step "How It Works" Section */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Workflow</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            How Pollution XAI Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            From atmospheric physics to actionable personal livability decisions in 3 steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center">
              1
            </div>
            <h3 className="text-base font-bold text-navy-900">Live Satellite & Weather Sensing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fetches genuine surface meteorology (relative humidity, wind vector, barometric pressure, temperature) and Copernicus CAMS regional aerosol reference models.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-extrabold text-xs flex items-center justify-center">
              2
            </div>
            <h3 className="text-base font-bold text-navy-900">AI Attribution & Source Apportionment</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Processes inputs through tuned XGBoost and neural models, calculating exact local SHAP feature impacts and apportioning pollution origin sectors (vehicles, stubble, industry).
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center">
              3
            </div>
            <h3 className="text-base font-bold text-navy-900">Personalized Livability Guidance</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Synthesizes PM2.5, comfort, and diurnal forecast stability into a 0–100 Livability Score with tailored advice for asthma, elderly, pregnancy, and outdoor workers.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Discovery Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Platform Features</span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900">Explore Decision Tools</h2>
          </div>
          <span className="text-xs text-slate-500">Zero guest friction • 100% open access</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featureCards.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-navy-900">{feat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
                <Link
                  to={feat.link}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 group"
                >
                  <span>{feat.action}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Evaluated Model Zoo */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Model Zoo</span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900">Trained Machine Learning Architectures</h2>
          </div>
          <Link to="/comparison" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
            <span>View test comparison</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {modelsList.map((m) => (
            <div key={m.name} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy-900">{m.name}</span>
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
