import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  MapPin,
  HeartPulse,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Printer,
  Sparkles,
  RefreshCw,
  Users,
  Activity,
  Plus,
  Trash2,
  Calendar,
  Wind,
  Info,
  Heart,
  Sun,
} from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import { useAuth } from '../context/AuthContext';
import airService from '../services/airService';
import LocationHierarchySelector from '../components/LocationHierarchySelector';
import CoverageTierBadge from '../components/CoverageTierBadge';

const PRESET_ORIGINS = [
  { name: 'Delhi', district: 'New Delhi', state: 'Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
  { name: 'Kolkata', district: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  { name: 'Patna', district: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376 },
  { name: 'Kanpur', district: 'Kanpur Nagar', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319 },
];

const PRESET_DESTINATIONS = [
  { name: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { name: 'Pune', district: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
  { name: 'Kochi', district: 'Ernakulam', state: 'Kerala', lat: 9.9312, lon: 76.2673 },
  { name: 'Shillong', district: 'East Khasi Hills', state: 'Meghalaya', lat: 25.5788, lon: 91.8933 },
  { name: 'Mysuru', district: 'Mysuru', state: 'Karnataka', lat: 12.2958, lon: 76.6394 },
  { name: 'Coimbatore', district: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558 },
];

const HEALTH_CONDITIONS = [
  { id: 'asthma', label: 'Asthma (Hyper-reactive airways)' },
  { id: 'copd', label: 'COPD / Chronic Bronchitis' },
  { id: 'bronchitis', label: 'Recurrent Bronchitis' },
  { id: 'cardiovascular_disease', label: 'Cardiovascular / Coronary Disease' },
  { id: 'hypertension', label: 'Hypertension (High Blood Pressure)' },
  { id: 'diabetes', label: 'Type 2 Diabetes' },
  { id: 'allergic_rhinitis', label: 'Allergic Rhinitis / Sinusitis' },
];

export default function RelocationAdvisorPage() {
  usePageMeta({
    title: 'Relocation Advisor | AirIQ India',
    description: 'Health-personalised relocation decision engine and side-by-side air quality comparison across Indian cities.',
  });

  const { isAuthenticated, user } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [origin, setOrigin] = useState(PRESET_ORIGINS[0]);
  const [destinations, setDestinations] = useState([
    PRESET_DESTINATIONS[0],
    PRESET_DESTINATIONS[1],
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingType, setSearchingType] = useState('dest'); // 'origin' or 'dest'

  // Profile State
  const [ageGroup, setAgeGroup] = useState('adult');
  const [isPregnant, setIsPregnant] = useState(false);
  const [smokingStatus, setSmokingStatus] = useState('never');
  const [outdoorHours, setOutdoorHours] = useState(5);
  const [commuteMode, setCommuteMode] = useState('two_wheeler');
  const [selectedConditions, setSelectedConditions] = useState(['asthma']);
  const [household, setHousehold] = useState('children');
  const [dpdpConsent, setDpdpConsent] = useState(true);

  // Comparison Report Result
  const [comparisonReport, setComparisonReport] = useState(null);
  const [expandedPrecautions, setExpandedPrecautions] = useState({});
  const [expandedHowCalculated, setExpandedHowCalculated] = useState({});

  // Search geocode debouncer
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await airService.geocode(searchQuery.trim());
        if (res.results) {
          setSearchResults(res.results);
        }
      } catch (err) {
        console.error('Geocode search failed', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLocation = (loc) => {
    const item = {
      name: loc.name,
      lat: loc.lat,
      lon: loc.lon,
    };
    if (searchingType === 'origin') {
      setOrigin(item);
    } else {
      if (destinations.length < 4 && !destinations.some((d) => d.name === item.name)) {
        setDestinations([...destinations, item]);
      }
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveDestination = (idx) => {
    setDestinations(destinations.filter((_, i) => i !== idx));
  };

  const toggleCondition = (condId) => {
    if (selectedConditions.includes(condId)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== condId));
    } else {
      setSelectedConditions([...selectedConditions, condId]);
    }
  };

  const runComparison = async () => {
    if (!origin || destinations.length === 0) {
      setError('Please provide origin and at least one destination.');
      return;
    }
    if (!dpdpConsent) {
      setError('Please accept the DPDP Act 2023 health data processing consent.');
      return;
    }

    setLoading(true);
    setError(null);

    const profilePayload = {
      age_group: ageGroup,
      is_pregnant: isPregnant,
      smoking_status: smokingStatus,
      outdoor_exercise_hours: outdoorHours,
      commute_mode: commuteMode,
      conditions: selectedConditions,
      household: household,
      dpdp_consent: dpdpConsent,
    };

    try {
      const response = await airService.compareRelocation({
        origin,
        destinations,
        profile: profilePayload,
      });

      if (response.success || response.origin) {
        setComparisonReport(response);
        setStep(4); // Move to results step
      } else {
        setError(response.message || 'Comparison calculation failed.');
      }
    } catch (err) {
      console.error('Relocation comparison failed:', err);
      setError(err?.response?.data?.error?.message || 'Failed to generate relocation comparison.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            Decision Intelligence Engine
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Health-Personalised Relocation Advisor
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Compare living in your current city against up to 4 candidate destinations. Uses official CPCB AQI breakpoints, WHO 2021 sensitivity multipliers, and seasonal inversion models.
          </p>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-3xl mx-auto">
          {[
            { num: 1, label: 'Places' },
            { num: 2, label: 'Health Profile' },
            { num: 3, label: 'Household & Consent' },
            { num: 4, label: 'Comparison Report' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => {
                if (s.num <= 3 || comparisonReport) setStep(s.num);
              }}
              className={`p-2 sm:p-3 rounded-xl border text-center transition-all ${
                step === s.num
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 font-bold'
                  : step > s.num
                  ? 'bg-white dark:bg-slate-900 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs sm:text-sm font-semibold">Step {s.num}</div>
              <div className="text-[11px] truncate hidden sm:block">{s.label}</div>
            </button>
          ))}
        </div>

        {error && (
          <div className="max-w-3xl mx-auto p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: PLACES (ORIGIN & DESTINATIONS) */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Where do you live, and where do you want to compare?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Pick your baseline city and up to 4 candidate relocation destinations in India.
              </p>
            </div>

            {/* Origin Selection */}
            <div className="space-y-3">
              <LocationHierarchySelector
                label="Current Origin Location (Where you live now)"
                initialLocation={origin}
                onSelectLocation={(loc) => {
                  setOrigin({
                    name: loc.name || loc.display_name,
                    lat: loc.lat,
                    lon: loc.lon,
                    district: loc.district,
                    state: loc.state,
                    pincode: loc.pincode,
                    coverage: loc.coverage,
                  });
                }}
              />

              {/* Quick Presets for Origin */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-xs text-slate-400 self-center mr-1">Quick Presets:</span>
                {PRESET_ORIGINS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setOrigin(p)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                      origin.name === p.name
                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Candidate Destinations */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Candidate Destinations ({destinations.length}/4 selected)
                </label>
              </div>

              {/* Selected Destinations List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {destinations.map((d, idx) => (
                  <div
                    key={d.name}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{d.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {d.lat?.toFixed(2)}°N, {d.lon?.toFixed(2)}°E {d.pincode ? `| PIN ${d.pincode}` : ''}
                      </div>
                    </div>
                    {destinations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDestination(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors"
                        title="Remove destination"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Destination using LocationHierarchySelector */}
              {destinations.length < 4 && (
                <div className="pt-2">
                  <LocationHierarchySelector
                    label={`Add Candidate Destination (${destinations.length + 1} of 4)`}
                    onSelectLocation={(loc) => {
                      const item = {
                        name: loc.name || loc.display_name,
                        lat: loc.lat,
                        lon: loc.lon,
                        district: loc.district,
                        state: loc.state,
                        pincode: loc.pincode,
                        coverage: loc.coverage,
                      };
                      if (!destinations.some((d) => d.name === item.name)) {
                        setDestinations([...destinations, item]);
                      }
                    }}
                  />

                  {/* Preset Suggestions */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    <span className="text-xs text-slate-400 self-center mr-1">Recommended Cities:</span>
                    {PRESET_DESTINATIONS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        disabled={destinations.some((d) => d.name === p.name) || destinations.length >= 4}
                        onClick={() => {
                          if (!destinations.some((d) => d.name === p.name) && destinations.length < 4) {
                            setDestinations([...destinations, p]);
                          }
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        + {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-colors"
              >
                <span>Continue to Health Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: HEALTH PROFILE */}
        {step === 2 && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-600" />
                Personal Health Vulnerability Profile
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Air pollution impacts individuals differently based on airway reactivity and cardiopulmonary reserves.
              </p>
            </div>

            {/* Pre-existing Conditions Multi-Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Pre-existing Health Conditions (Select all that apply)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {HEALTH_CONDITIONS.map((cond) => {
                  const active = selectedConditions.includes(cond.id);
                  return (
                    <button
                      key={cond.id}
                      type="button"
                      onClick={() => toggleCondition(cond.id)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                        active
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <span>{cond.label}</span>
                      <span className={`w-4 h-4 rounded-md border flex items-center justify-center ${active ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                        {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Age Group & Pregnancy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Primary Age Group
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'child', label: 'Child (<12)' },
                    { id: 'adult', label: 'Adult (18-64)' },
                    { id: 'senior', label: 'Senior (65+)' },
                  ].map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAgeGroup(a.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors ${
                        ageGroup === a.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Pregnancy Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPregnant(false)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      !isPregnant
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Not Pregnant
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPregnant(true)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      isPregnant
                        ? 'bg-rose-600 text-white border-rose-600 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Pregnant (Fetal Sensitivity)
                  </button>
                </div>
              </div>
            </div>

            {/* Outdoor Activity & Commute */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <span>Outdoor Exercise / Sport</span>
                  <span className="text-blue-600 font-extrabold">{outdoorHours} hrs/week</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={outdoorHours}
                  onChange={(e) => setOutdoorHours(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <span className="text-[11px] text-slate-400">
                  Higher ventilation during cardio increases deep aerosol inhalation dose.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Primary Commute Mode
                </label>
                <select
                  value={commuteMode}
                  onChange={(e) => setCommuteMode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="two_wheeler">Two-Wheeler / Motorcycle (Direct Exhaust)</option>
                  <option value="open_auto">Auto Rickshaw / Open Transit</option>
                  <option value="walking">Walking / Bicycle</option>
                  <option value="car">Car (AC with Cabin Filter)</option>
                  <option value="metro">Metro / Air-Conditioned Train</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-colors"
              >
                <span>Continue to Household & Consent</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: HOUSEHOLD & CONSENT */}
        {step === 3 && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                Household Members & DPDP Act 2023 Consent
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Configure family sensitivities and provide explicit statutory consent under India's Digital Personal Data Protection Act.
              </p>
            </div>

            {/* Household dependents */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Are any vulnerable family members relocating with you?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'none', label: 'None (Solo/Adults)' },
                  { id: 'children', label: 'Children under 5' },
                  { id: 'elderly', label: 'Elderly (65+)' },
                  { id: 'both', label: 'Both Children & Seniors' },
                ].map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setHousehold(h.id)}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-colors ${
                      household === h.id
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            {/* DPDP Act 2023 Explicit Consent Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>DPDP Act 2023 Explicit Consent Verification</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Under the Digital Personal Data Protection (DPDP) Act, 2023, processing of personal health data requires voluntary and informed consent. Your health responses are strictly utilized to compute mathematical exposure multipliers and are never shared with advertisers or third parties.
              </p>

              <label className="flex items-start gap-3 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dpdpConsent}
                  onChange={(e) => setDpdpConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  I give explicit consent for my health parameters to be used for personalized air quality risk estimation. I understand that I can withdraw consent, export my data, or permanently delete my profile at any time in Privacy Settings.
                </span>
              </label>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100"
              >
                Back
              </button>

              <button
                type="button"
                disabled={loading || !dpdpConsent}
                onClick={runComparison}
                className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 text-white font-extrabold text-sm hover:from-blue-700 hover:to-teal-700 shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Evaluating Atmospheric Models...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Relocation Decision Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: DECISION REPORT (SIDE-BY-SIDE COMPARISON) */}
        {step === 4 && comparisonReport && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Bar Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Verified Comparative Report: {comparisonReport.origin?.name} vs {comparisonReport.candidates?.length} Destinations
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Edit Parameters</span>
                </button>
              </div>
            </div>

            {/* Origin Card (Baseline) */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-400">Current Origin Baseline</div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold">{comparisonReport.origin?.name}</h2>
                  <div className="text-xs text-slate-400 mt-1">
                    Governing Pollutant: <span className="text-white font-bold">{comparisonReport.origin?.governing_pollutant}</span> | Category: <span className="font-bold text-amber-300">{comparisonReport.origin?.cpcb_category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <div className="text-2xl sm:text-3xl font-extrabold">{comparisonReport.origin?.current_aqi}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-300">CPCB AQI</div>
                  </div>
                  <div className="text-center p-3 rounded-2xl bg-rose-500/20 backdrop-blur-sm border border-rose-400/30">
                    <div className="text-2xl sm:text-3xl font-extrabold text-rose-300">
                      {comparisonReport.origin?.personal_risk?.score}/100
                    </div>
                    <div className="text-[10px] uppercase font-bold text-rose-200">Personal Risk</div>
                  </div>
                </div>
              </div>

              {/* Origin Precision Coverage Tier Badge */}
              {comparisonReport.origin?.coverage && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <CoverageTierBadge coverage={comparisonReport.origin.coverage} showDetails={false} />
                </div>
              )}
            </div>

            {/* Side-by-Side Candidates Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {comparisonReport.candidates?.map((cand, idx) => (
                <div
                  key={cand.destination?.name}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  {/* Suitability Header Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Destination Candidate {idx + 1}</span>
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {cand.destination?.name}
                      </h3>
                    </div>

                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                        cand.suitability === 'Suitable'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : cand.suitability === 'Suitable with precautions'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{cand.display_verdict || cand.suitability}</span>
                    </div>
                  </div>

                  {/* Key Comparative Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-xs text-slate-400 font-medium">Destination AQI</div>
                      <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {cand.current_aqi}
                      </div>
                      <div className="text-[10px] font-bold" style={{ color: cand.cpcb_color }}>
                        {cand.cpcb_category}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                      <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Exposure Shift</div>
                      <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {cand.exposure_diff_points > 0 ? `-${cand.exposure_diff_points} pts` : `+${Math.abs(cand.exposure_diff_points)} pts`}
                      </div>
                      <div className="text-[10px] text-emerald-600/80 font-bold">vs Origin ({cand.aqi_reduction_pct > 0 ? `-${cand.aqi_reduction_pct}%` : `+${Math.abs(cand.aqi_reduction_pct)}%`} AQI)</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
                      <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">Personal Risk</div>
                      <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                        {cand.personal_risk?.score}/100
                      </div>
                      <div className="text-[10px] text-blue-600/80 font-bold">
                        {cand.personal_risk?.tier}
                      </div>
                    </div>
                  </div>

                  {/* Precision Coverage Tier Badge */}
                  {cand.coverage && (
                    <div className="pt-1">
                      <CoverageTierBadge coverage={cand.coverage} showDetails={true} />
                    </div>
                  )}

                  {/* Personalized Suitability Rationale */}
                  {cand.numeric_reasons && cand.numeric_reasons.length > 0 && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Personalized Suitability Rationale
                      </span>
                      <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                        {cand.numeric_reasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-blue-500 font-bold">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Health-based Relocation Assessment */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Health-based Relocation Assessment</span>
                      </div>
                    </div>
                    <p>{cand.explanation_narrative}</p>

                    {/* How this is calculated expander */}
                    <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/40">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedHowCalculated((prev) => ({
                            ...prev,
                            [idx]: !prev[idx],
                          }))
                        }
                        className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                      >
                        <Info className="w-3 h-3 text-blue-500" />
                        <span>{expandedHowCalculated[idx] ? 'Hide calculation details' : 'How this is calculated'}</span>
                      </button>
                      {expandedHowCalculated[idx] && (
                        <div className="mt-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
                          <p>
                            Suitability is evaluated using your health profile baseline threshold against the destination's verified annual PM2.5 mean ({cand.best_month_to_move?.annual_mean_pm25} µg/m³) and peak winter inversion factor ({cand.climatology?.winter_inversion_factor}×).
                          </p>
                          <p className="italic text-slate-500 dark:text-slate-400 font-medium">
                            Advisory only, not medical advice. Follow your doctor's asthma/health action plan.
                          </p>
                          <Link to="/methodology" className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1">
                            <span>Read full scientific methodology</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Best Time to Go Out Today */}
                  {cand.best_time_today && (
                    <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                          Best Time to Go Out Today
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-extrabold text-[11px]">
                          {cand.best_time_today.window}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                        {cand.best_time_today.guidance}
                      </p>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-3 pt-0.5">
                        <span>Hourly PM2.5: <strong className="text-slate-700 dark:text-slate-200">{cand.best_time_today.pm25} µg/m³</strong></span>
                        <span>Ozone (O3): <strong className="text-slate-700 dark:text-slate-200">{cand.best_time_today.o3} µg/m³</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Place Precautions */}
                  {cand.place_precautions && cand.place_precautions.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Location & Profile Precautions ({cand.place_precautions.length})</span>
                        </div>
                        <Link
                          to="/faq"
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <span>FAQ</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>

                      <div className="space-y-2.5">
                        {(expandedPrecautions[idx]
                          ? cand.place_precautions
                          : cand.place_precautions.slice(0, 3)
                        ).map((item) => (
                          <div
                            key={item.id || item.text}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs shadow-2xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {item.category}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.priority === 'High'
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                                    : item.priority === 'Medium'
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                                }`}
                              >
                                {item.priority} Priority
                              </span>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                              {item.text}
                            </p>

                            <div className="pt-1 flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                              <span>
                                <strong className="text-slate-700 dark:text-slate-300">Trigger:</strong> {item.trigger}
                              </span>
                              <span className="italic">
                                Source: {item.source}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {cand.place_precautions.length > 3 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPrecautions((prev) => ({
                              ...prev,
                              [idx]: !prev[idx],
                            }))
                          }
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1 flex items-center gap-1"
                        >
                          <span>
                            {expandedPrecautions[idx]
                              ? 'Show fewer precautions'
                              : `Show all ${cand.place_precautions.length} precautions`}
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Mini 12-Month Month-by-Month Climatology Chart */}
                  {cand.best_month_to_move?.monthly_pm25 && cand.best_month_to_move.monthly_pm25.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          12-Month PM2.5 Climatology & Seasonal Trapping
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Inversion Factor: <strong className="text-slate-800 dark:text-slate-200">{cand.climatology?.winter_inversion_factor}×</strong>
                        </span>
                      </div>

                      {/* Bar Chart rendering */}
                      <div className="pt-2 pb-1">
                        <div className="h-24 flex items-end gap-1.5 sm:gap-2 px-1">
                          {(() => {
                            const monthsData = cand.best_month_to_move.monthly_pm25;
                            const maxPm25 = Math.max(120, ...monthsData.map((m) => m.mean_pm25 || 0));
                            return monthsData.map((m) => {
                              const val = m.mean_pm25 || 0;
                              const heightPct = Math.max(8, Math.round((val / maxPm25) * 100));
                              const isBest = m.month === cand.best_month_to_move?.month;
                              const isWorst = m.month_name === cand.best_month_to_move?.worst_month_name;
                              let barBg = 'bg-blue-400 dark:bg-blue-500';
                              if (val <= 30) barBg = 'bg-emerald-500';
                              else if (val <= 60) barBg = 'bg-lime-500';
                              else if (val <= 90) barBg = 'bg-amber-400';
                              else if (val <= 120) barBg = 'bg-orange-500';
                              else barBg = 'bg-rose-500';

                              return (
                                <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                                  {/* Tooltip on hover */}
                                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                                    {m.month_name}: {val} µg/m³
                                  </div>
                                  <div
                                    className={`w-full rounded-t-md transition-all ${barBg} ${
                                      isBest ? 'ring-2 ring-emerald-400' : isWorst ? 'ring-2 ring-rose-500' : ''
                                    }`}
                                    style={{ height: `${heightPct}%` }}
                                  />
                                  <span className={`text-[10px] font-semibold ${isBest ? 'text-emerald-600 font-bold' : isWorst ? 'text-rose-600 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {m.month_name?.slice(0, 3)}
                                  </span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>
                          Cleanest: <strong className="text-emerald-600 dark:text-emerald-400">{cand.best_month_to_move?.month_name}</strong> ({cand.best_month_to_move?.mean_pm25} µg/m³)
                        </span>
                        <span>
                          Peak Pollution: <strong className="text-rose-600 dark:text-rose-400">{cand.best_month_to_move?.worst_month_name}</strong> ({cand.best_month_to_move?.worst_mean_pm25} µg/m³)
                        </span>
                        <span>
                          Annual Mean: <strong className="text-slate-800 dark:text-slate-200">{cand.best_month_to_move?.annual_mean_pm25} µg/m³</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Scientific Methodology & Standards Note */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <div className="font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Scientific Advisory & Health Standards</span>
                </div>
                <Link to="/methodology" className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
                  <span>Methodology</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <p>
                <strong>Scientific Validity:</strong> Comparative suitability is evaluated using rule-based multi-criteria environmental modeling anchored in Copernicus (CAMS) atmospheric reanalysis, local meteorological dispersion factors, and epidemiological sensitivity weightings from WHO 2021 air quality guidelines.
              </p>
              <p>
                <strong>Legal & Medical Disclaimer:</strong> Advisory only, not medical advice. Follow your doctor's asthma/health action plan. Air quality estimates are for general environmental information and do not substitute for personalized medical diagnosis or statutory governmental advisories.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
