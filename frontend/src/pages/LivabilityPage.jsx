import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Home,
  Compass,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  Bookmark,
  Check,
  GitCompare,
  ArrowRight,
  Trophy,
  Scale,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import LocationPicker from '../components/LocationPicker';
import HealthProfileSelector from '../components/HealthProfileSelector';
import LivabilityScoreCard from '../components/LivabilityScoreCard';
import PersonaAdviceSection from '../components/PersonaAdviceSection';
import SourceAttributionBreakdown from '../components/SourceAttributionBreakdown';
import ColdStartNotice from '../components/ColdStartNotice';
import livabilityService from '../services/livabilityService';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';

const DEFAULT_PROFILE = {
  age_group: 'adult',
  asthma: false,
  has_heart_condition: false,
  is_pregnant: false,
  is_outdoor_worker: false,
};

const LOCATION_PRESETS = [
  { name: 'Connaught Place, Central Delhi', lat: 28.6315, lon: 77.2167 },
  { name: 'Cyber City, Gurugram', lat: 28.4900, lon: 77.0800 },
  { name: 'Noida Sector 62', lat: 28.6250, lon: 77.3650 },
  { name: 'Anand Vihar, East Delhi', lat: 28.6470, lon: 77.3150 },
  { name: 'Rohini, North Delhi', lat: 28.7350, lon: 77.1150 },
  { name: 'Faridabad Sector 16', lat: 28.4100, lon: 77.3150 },
];

export default function LivabilityPage() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, healthProfile: userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'compare'

  // Single location mode state
  const initialLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : 28.6315;
  const initialLon = searchParams.get('lon') ? parseFloat(searchParams.get('lon')) : 77.2167;
  const initialName = searchParams.get('name') || '';

  const [latitude, setLatitude] = useState(initialLat);
  const [longitude, setLongitude] = useState(initialLon);
  const [healthProfile, setHealthProfile] = useState(userProfile || DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Compare mode state
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [locA, setLocA] = useState({ name: 'Connaught Place, Central Delhi', lat: 28.6315, lon: 77.2167 });
  const [locB, setLocB] = useState({ name: 'Cyber City, Gurugram', lat: 28.4900, lon: 77.0800 });
  const [comparisonData, setComparisonData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState(null);

  useEffect(() => {
    if (userProfile) {
      setHealthProfile(userProfile);
    }
  }, [userProfile]);

  useEffect(() => {
    if (isAuthenticated) {
      userService.getSavedLocations().then((places) => {
        if (places && places.length > 0) {
          setSavedPlaces(places);
        }
      });
    }
  }, [isAuthenticated]);

  const fetchLivability = async (lat = latitude, lon = longitude, profile = healthProfile) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await livabilityService.assessLivability(lat, lon, profile);
      const result = response.data || response;
      setAssessmentData(result);

      if (isAuthenticated && result) {
        userService.recordHistory({
          latitude: lat,
          longitude: lon,
          place_name: initialName || result.location_name || 'Delhi-NCR Location',
          score: result.livability?.score,
          verdict: result.livability?.verdict?.label || 'Good to go',
          pm25_reference: result.reference_air_quality?.reference_pm25,
          pm25_model: result.model_prediction?.pm25,
        });
      }
    } catch (err) {
      console.error('Livability evaluation failed:', err);
      setError(
        err.message || 'Failed to compute livability score. Please verify backend status and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLivability(initialLat, initialLon, healthProfile);
  }, [initialLat, initialLon]);

  const handleRunComparison = async () => {
    setCompareLoading(true);
    setCompareError(null);
    try {
      const res = await livabilityService.compareLivability(locA, locB, healthProfile);
      setComparisonData(res);
    } catch (err) {
      setCompareError(err?.message || 'Failed to compute head-to-head comparison.');
    } finally {
      setCompareLoading(false);
    }
  };

  const handleLocationChange = (newLat, newLon) => {
    setLatitude(newLat);
    setLongitude(newLon);
    setSaveSuccess(false);
  };

  const handleProfileChange = (updatedProfile) => {
    setHealthProfile(updatedProfile);
    if (activeTab === 'single') {
      fetchLivability(latitude, longitude, updatedProfile);
    } else {
      handleRunComparison();
    }
  };

  const handleQuickSaveLocation = async () => {
    if (!isAuthenticated) return;
    try {
      await userService.addSavedLocation({
        label: 'Saved Place',
        name: initialName || `Coordinates (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
        latitude,
        longitude,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn('Failed to quick-save location:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 rounded-full">
                Decision Synthesis Engine
              </span>
              <span className="text-xs text-slate-500 font-medium">Livability, Forecasts & Comparison</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
              Should I Live In / Go To This Place?
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Synthesize regional Copernicus (CAMS) reference data, local surface meteorological modeling, and 7-day
              forecast trends into plain-language decision guidance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {isAuthenticated && activeTab === 'single' && (
              <button
                type="button"
                onClick={handleQuickSaveLocation}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold border border-blue-200 transition-colors"
                title="Bookmark this spot to Saved Places"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Bookmark Place</span>
                  </>
                )}
              </button>
            )}

            {/* Mode Switcher Tabs */}
            <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('single')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'single' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>Single Place</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('compare');
                  if (!comparisonData) handleRunComparison();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'compare' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
                <span>Compare Two Places</span>
              </button>
            </div>
          </div>
        </div>

        {/* Purpose Clarity Banner */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <span className="font-extrabold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Livability & Comparison
            </span>
            <span>Personal 0–100 score, health sensitivity shifts, and head-to-head place comparison.</span>
          </div>
          <Link
            to={`/live-assessment?lat=${latitude}&lon=${longitude}`}
            className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 shrink-0"
          >
            <span>Need Raw Meteorological Telemetry & SHAP? Go to Live Assessment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <ColdStartNotice isLoading={isLoading || compareLoading} />

      {/* Health Risk Profile Selector */}
      <HealthProfileSelector value={healthProfile} onChange={handleProfileChange} />

      {/* TAB 1: Single Location Mode */}
      {activeTab === 'single' && (
        <div className="space-y-6 animate-fadeIn">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold">Evaluation Failed</h4>
                <p className="mt-0.5 text-xs text-rose-700 leading-relaxed">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => fetchLivability(latitude, longitude, healthProfile)}
                className="text-xs underline font-semibold text-rose-900 hover:text-rose-950 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            onLocationChange={handleLocationChange}
            onAssess={() => fetchLivability(latitude, longitude, healthProfile)}
            isLoading={isLoading}
          />

          {assessmentData?.livability && <LivabilityScoreCard livabilityData={assessmentData.livability} />}

          {assessmentData?.source_attribution && (
            <SourceAttributionBreakdown attributionData={assessmentData.source_attribution} />
          )}

          {assessmentData?.livability?.persona_guidance && (
            <PersonaAdviceSection personaGuidance={assessmentData.livability.persona_guidance} />
          )}
        </div>
      )}

      {/* TAB 2: Compare Two Locations Mode */}
      {activeTab === 'compare' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Comparison Selector Controls */}
          <div className="p-5 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>Head-to-Head Livability Comparison: Where is it Safer?</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location A */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    Location A
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({locA.lat.toFixed(2)}°, {locA.lon.toFixed(2)}°)
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Preset or Saved Place</label>
                  <select
                    onChange={(e) => {
                      const val = JSON.parse(e.target.value);
                      setLocA(val);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  >
                    <optgroup label="Popular NCR Hubs">
                      {LOCATION_PRESETS.map((p, idx) => (
                        <option key={idx} value={JSON.stringify(p)} selected={p.name === locA.name}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                    {savedPlaces.length > 0 && (
                      <optgroup label="My Saved Places">
                        {savedPlaces.map((sp) => (
                          <option
                            key={sp.id}
                            value={JSON.stringify({ name: `${sp.label}: ${sp.name}`, lat: sp.latitude, lon: sp.longitude })}
                          >
                            ⭐ {sp.label}: {sp.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              {/* Location B */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                    Location B
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({locB.lat.toFixed(2)}°, {locB.lon.toFixed(2)}°)
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Preset or Saved Place</label>
                  <select
                    onChange={(e) => {
                      const val = JSON.parse(e.target.value);
                      setLocB(val);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  >
                    <optgroup label="Popular NCR Hubs">
                      {LOCATION_PRESETS.map((p, idx) => (
                        <option key={idx} value={JSON.stringify(p)} selected={p.name === locB.name}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                    {savedPlaces.length > 0 && (
                      <optgroup label="My Saved Places">
                        {savedPlaces.map((sp) => (
                          <option
                            key={sp.id}
                            value={JSON.stringify({ name: `${sp.label}: ${sp.name}`, lat: sp.latitude, lon: sp.longitude })}
                          >
                            ⭐ {sp.label}: {sp.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleRunComparison}
                disabled={compareLoading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <GitCompare className={`w-3.5 h-3.5 ${compareLoading ? 'animate-spin' : ''}`} />
                <span>{compareLoading ? 'Evaluating Both Spots...' : 'Compare Livability Now'}</span>
              </button>
            </div>
          </div>

          {compareError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              {compareError}
            </div>
          )}

          {/* Comparison Results */}
          {comparisonData && (
            <div className="space-y-6 animate-fadeIn">
              {/* Winner Decision Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-900 text-sm sm:text-base">Recommendation Verdict</h3>
                    <p className="text-xs sm:text-sm text-emerald-900 mt-0.5 leading-relaxed font-medium">
                      {comparisonData.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card A */}
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Location A
                    </span>
                    {comparisonData.winner === 'location_a' && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Recommended</span>
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-bold text-navy-900">{comparisonData.location_a.name}</h4>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-navy-900">{comparisonData.location_a.score}</span>
                    <span className="text-xs text-slate-500 font-semibold">/ 100 Score</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Verdict</span>
                      <strong className="text-slate-800">{comparisonData.location_a.verdict.label}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reference PM2.5 (CAMS)</span>
                      <strong className="text-slate-800">
                        {Math.round(comparisonData.location_a.pm25_reference || 0)} µg/m³
                      </strong>
                    </div>
                    {comparisonData.location_a.best_time_today && (
                      <div className="flex justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Best Time Today</span>
                        <strong className="text-emerald-700">
                          {comparisonData.location_a.best_time_today.time_window}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card B */}
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                      Location B
                    </span>
                    {comparisonData.winner === 'location_b' && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Recommended</span>
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-bold text-navy-900">{comparisonData.location_b.name}</h4>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-navy-900">{comparisonData.location_b.score}</span>
                    <span className="text-xs text-slate-500 font-semibold">/ 100 Score</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Verdict</span>
                      <strong className="text-slate-800">{comparisonData.location_b.verdict.label}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reference PM2.5 (CAMS)</span>
                      <strong className="text-slate-800">
                        {Math.round(comparisonData.location_b.pm25_reference || 0)} µg/m³
                      </strong>
                    </div>
                    {comparisonData.location_b.best_time_today && (
                      <div className="flex justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Best Time Today</span>
                        <strong className="text-emerald-700">
                          {comparisonData.location_b.best_time_today.time_window}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
