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
  AlertTriangle,
  HelpCircle,
  Eye,
  Sliders,
  CloudRain,
  Thermometer,
} from 'lucide-react';

const PRESET_PLACES = [
  { name: 'Connaught Place', lat: 28.6139, lon: 77.209, area: 'Central Delhi', samplePm: 148, band: 'Very Poor', color: 'bg-purple-500 text-white' },
  { name: 'Cyber City Gurgaon', lat: 28.495, lon: 77.0895, area: 'Gurgaon, HR', samplePm: 112, band: 'Poor', color: 'bg-amber-500 text-white' },
  { name: 'Noida Sector 62', lat: 28.5355, lon: 77.391, area: 'Noida, UP', samplePm: 135, band: 'Very Poor', color: 'bg-purple-500 text-white' },
  { name: 'Anand Vihar', lat: 28.6469, lon: 77.316, area: 'East Delhi', samplePm: 184, band: 'Very Poor', color: 'bg-purple-500 text-white' },
];

const FAQ_ITEMS = [
  {
    q: 'Where does the real-time air quality data originate?',
    a: 'Real-time surface meteorology (temperature, relative humidity, boundary layer height, wind vector) is ingested directly from Open-Meteo. Regional reference PM2.5 concentrations are anchored to the European Copernicus Atmosphere Monitoring Service (CAMS) near-real-time atmospheric chemistry model.',
  },
  {
    q: 'Why is the platform calibrated specifically for Delhi-NCR?',
    a: 'The machine learning models (XGBoost, Random Forest, MLP) were trained on longitudinal meteorological and pollutant data within the Delhi-NCR geographical bounding box (28.2°N–29.0°N, 76.8°E–77.6°E). Predictions within this airshed reflect rigorous empirical calibration.',
  },
  {
    q: 'How does Pollution XAI differ from official CPCB regulatory monitors?',
    a: 'Central Pollution Control Board (CPCB) continuous ambient monitoring stations (CAAQMS) report physical sensor readings for discrete fixed locations. Pollution XAI complements this by providing continuous spatial estimation from surface weather, model-vs-CAMS variance checks, and exact SHAP source attributions.',
  },
  {
    q: 'How is the Residential Livability Score computed?',
    a: 'The Livability Score is a normalized 0–100 index evaluated across four sub-factors: (1) Reference CAMS PM2.5 concentration, (2) Surface Meteorological Comfort (temperature & humidity index), (3) Diurnal Atmospheric Stability (inversion & stagnation risk), and (4) Personalized Health Profile sensitivity weighting (Normal, Respiratory/Asthma, Elderly, Child).',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [selectedPreset, setSelectedPreset] = useState(PRESET_PLACES[0]);
  const [isLocating, setIsLocating] = useState(false);
  const [disclaimerExpanded, setDisclaimerExpanded] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(0);

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
      () => {
        setIsLocating(false);
        navigate(`/live-assessment?lat=28.6139&lon=77.2090&name=Connaught%20Place`);
      },
      { timeout: 8000 }
    );
  };

  const featureCards = [
    {
      title: 'Live Air Quality Assessment',
      desc: 'Pinpoint any location with the interactive Leaflet map picker to get live Open-Meteo weather, Copernicus CAMS PM2.5, and model comparison.',
      icon: MapPin,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
      link: '/live-assessment',
      action: 'Check Live Location',
    },
    {
      title: 'Livability & Head-to-Head Comparison',
      desc: 'Comprehensive 0–100 Livability Score with personalized health risk sensitivity profiles and side-by-side comparison between two places.',
      icon: Compass,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
      link: '/livability',
      action: 'Compare Places',
    },
    {
      title: 'Explainable AI & Source Attribution',
      desc: 'Understand the "why" behind pollution spikes using exact local SHAP feature attributions and empirical source sector decomposition.',
      icon: Sparkles,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
      link: '/explainability',
      action: 'Explore XAI Engine',
    },
    {
      title: 'Saved Places & Safety Alerts',
      desc: 'Bookmark Home, Work, and Campus with custom PM2.5 threshold alerts notifying you via the Navbar bell whenever air quality deteriorates.',
      icon: Bookmark,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
      link: '/saved-places',
      action: 'Manage Saved Places',
    },
  ];

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

  return (
    <div className="space-y-12 sm:space-y-16 py-4 sm:py-6 max-w-7xl mx-auto">
      
      {/* 1. Hero Section: 2-Column Benefit-First Layout */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6 sm:p-10 lg:p-14 border border-slate-800 shadow-2xl">
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Real-World Benefit Copy & Direct CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-teal-300 border border-white/15 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>AI Decision Intelligence • Delhi-NCR Airshed</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Is the air safe where you are <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-sky-300 to-blue-300">right now?</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Instant residential air safety diagnostics, multi-factor livability scoring, and explainable PM2.5 insights backed by Copernicus satellite models and machine learning.
            </p>

            {/* CTAs: Check My Location (Primary) & Try Prediction Model (Secondary) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 active:scale-98 text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Detecting GPS Location...' : 'Check My Location'}</span>
              </button>

              <Link
                to="/prediction"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 active:scale-98 text-white border border-white/20 transition-all focus-visible:ring-2 focus-visible:ring-white"
              >
                <Activity className="w-4 h-4 text-teal-300" />
                <span>Try the Prediction Model</span>
              </Link>
            </div>

            {/* Trust Badges Strip */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Copernicus CAMS Ground Truth</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>SHAP Local Feature Attribution</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>0–100 Residential Livability Index</span>
              </div>
            </div>
          </div>

          {/* Right Column: "Check Your Air Now" Card */}
          <div className="lg:col-span-5">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-5 sm:p-6 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Check Your Air Now</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Delhi-NCR instant presets</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Live Sync
                </span>
              </div>

              {/* Preset Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Select Delhi-NCR Hub:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_PLACES.map((p) => {
                    const isSelected = selectedPreset.name === p.name;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setSelectedPreset(p)}
                        className={`p-2 rounded-xl text-left border transition-all text-xs focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-400 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-bold shadow-xs'
                            : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate">{p.area}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mini Verdict Preview Box with CPCB Colour Badge */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-100">{selectedPreset.name}</span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {selectedPreset.lat}, {selectedPreset.lon}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Estimated PM2.5</span>
                    <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                      ~{selectedPreset.samplePm} <span className="text-xs font-normal text-slate-500">µg/m³</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">CPCB Band</span>
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${selectedPreset.color}`}>
                        {selectedPreset.band}
                      </span>
                    </div>
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
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
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
                  className="w-full py-2 px-4 rounded-xl font-semibold text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Check Livability Verdict</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Compact Collapsible Scientific Disclaimer */}
      <section className="bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-all">
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Scientific & Regional Scope:</strong> Model calibrated strictly for the Delhi-NCR airshed (28.2°N–29.0°N, 76.8°E–77.6°E). Reference values are Copernicus CAMS atmospheric chemistry model data.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDisclaimerExpanded(!disclaimerExpanded)}
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-0.5 shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1.5 py-0.5"
            aria-expanded={disclaimerExpanded}
          >
            <span>{disclaimerExpanded ? 'Hide Details' : 'Read Scope'}</span>
            {disclaimerExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {disclaimerExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2 animate-in fade-in duration-200">
            <p>
              This platform synthesizes empirical machine learning models (XGBoost, Random Forest, MLP) with real-time Open-Meteo meteorology and European Copernicus Atmosphere Monitoring Service (CAMS) regional reanalysis.
            </p>
            <p>
              Output categories represent indicative concentration bands derived from meteorological physics and do not constitute an official statutory CPCB 24-hour continuous ambient monitoring station (CAAQMS) certified measurement. For points outside Delhi-NCR, predictions represent unvalidated geographic extrapolations.
            </p>
          </div>
        )}
      </section>

      {/* 3. "How It Works" 3-Step Walkthrough Section */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Workflow</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How Pollution XAI Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            From atmospheric physics to actionable personal livability decisions in 3 steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 font-extrabold text-xs flex items-center justify-center">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Live Satellite & Weather Sensing</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Fetches genuine surface meteorology (relative humidity, wind vector, barometric pressure, temperature) and Copernicus CAMS regional aerosol reference models.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 font-extrabold text-xs flex items-center justify-center">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Attribution & Source Apportionment</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Processes inputs through tuned XGBoost and neural models, calculating exact local SHAP feature impacts and apportioning pollution origin sectors (vehicles, stubble, industry).
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Personalized Livability Guidance</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Synthesizes PM2.5, comfort, and diurnal forecast stability into a 0–100 Livability Score with tailored advice for asthma, elderly, pregnancy, and outdoor workers.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Live Example Diagnostic Result Showcase */}
      <section className="bg-gradient-to-r from-blue-50/70 to-teal-50/70 dark:from-slate-900 dark:to-slate-900/90 rounded-3xl p-6 sm:p-8 border border-blue-100 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <Eye className="w-4 h-4" />
              <span>Diagnostic Output Showcase</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              Sample Assessment: Connaught Place, Central Delhi
            </h3>
          </div>
          <Link
            to="/live-assessment?lat=28.6139&lon=77.2090&name=Connaught%20Place"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors self-start sm:self-auto"
          >
            <span>Run Live Assessment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Diagnostic Sample Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Copernicus CAMS Reference</span>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
              142.0 <span className="text-xs font-normal text-slate-500">µg/m³</span>
            </div>
            <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500 text-white">
              Very Poor (CPCB)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">XGBoost ML Prediction</span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              134.8 <span className="text-xs font-normal text-slate-500">µg/m³</span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Delta: -7.2 µg/m³ (Consistent)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Top SHAP Drivers</span>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Wind Stagnation</span>
                <span className="font-mono text-rose-500 font-bold">+28 µg/m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Boundary Layer</span>
                <span className="font-mono text-blue-500 font-bold">-34 µg/m³</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Livability Verdict</span>
            <div className="text-2xl font-black text-amber-500 font-mono">
              46 <span className="text-xs font-normal text-slate-500">/ 100</span>
            </div>
            <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
              Sensitive groups should limit outdoor exertion.
            </div>
          </div>
        </div>
      </section>

      {/* 5. Feature Discovery Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Platform Features</span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">Explore Decision Tools</h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Zero guest friction • 100% open access</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featureCards.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{feat.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
                <Link
                  to={feat.link}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 group"
                >
                  <span>{feat.action}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Machine Learning Model Zoo Benchmark Strip */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Model Zoo</span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">Trained Machine Learning Architectures</h2>
          </div>
          <Link to="/comparison" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            <span>View test comparison</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {modelsList.map((m) => (
            <div key={m.name} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{m.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {m.tag}
                </span>
              </div>
              <div className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono">{m.metric}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Short Viva & Evaluator FAQ Accordion */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Frequently Asked Questions</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Scientific & Practical Guidance
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Key questions regarding data provenance, regional scope, and AI attribution.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {FAQ_ITEMS.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{faq.q}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
