import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Compass,
  AlertCircle,
  RefreshCw,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Check,
  ArrowRight,
  Activity,
} from 'lucide-react';
import LocationPicker from '../components/LocationPicker';
import LocationHierarchySelector from '../components/LocationHierarchySelector';
import HealthProfileSelector from '../components/HealthProfileSelector';
import LivabilityScoreCard from '../components/LivabilityScoreCard';
import LiveAssessmentResult from '../components/LiveAssessmentResult';
import ColdStartNotice from '../components/ColdStartNotice';
import locationService from '../services/locationService';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';

const DEFAULT_PROFILE = {
  age_group: 'adult',
  asthma: false,
  has_heart_condition: false,
  is_pregnant: false,
  is_outdoor_worker: false,
};

export default function LiveAssessmentPage() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, healthProfile: userProfile } = useAuth();

  const initialLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : 28.6315;
  const initialLon = searchParams.get('lon') ? parseFloat(searchParams.get('lon')) : 77.2167;
  const initialName = searchParams.get('name') || '';

  const [latitude, setLatitude] = useState(initialLat);
  const [longitude, setLongitude] = useState(initialLon);
  const [healthProfile, setHealthProfile] = useState(userProfile || DEFAULT_PROFILE);
  const [showHealthProfile, setShowHealthProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync profile if user logs in or profile loads
  useEffect(() => {
    if (userProfile) {
      setHealthProfile(userProfile);
    }
  }, [userProfile]);

  const fetchAssessment = async (lat = latitude, lon = longitude, profile = healthProfile) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await locationService.assessLocation(lat, lon, profile);
      const result = response.data || response;
      setAssessmentData(result);

      // Record assessment to user history in the background if authenticated
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
      console.error('Location assessment failed:', err);
      setError(
        err.message || 'Failed to complete location assessment. Please verify backend status and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Perform initial assessment for specified coordinates or default location
  useEffect(() => {
    fetchAssessment(initialLat, initialLon, healthProfile);
  }, [initialLat, initialLon]);

  const handleLocationChange = (newLat, newLon) => {
    setLatitude(newLat);
    setLongitude(newLon);
    setSaveSuccess(false);
  };

  const handleProfileChange = (updatedProfile) => {
    setHealthProfile(updatedProfile);
    fetchAssessment(latitude, longitude, updatedProfile);
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-full">
                Phase 1, 2 & 3 Live Intelligence
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Open-Meteo, CAMS, Persistence & Livability</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
              Real-World Air Quality Assessment
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Assess live particulate air pollution (PM2.5) for any geographic coordinates using real-time
              satellite surface meteorology, calibrated XGBoost machine learning, and CAMS reference comparison.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleQuickSaveLocation}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                title="Bookmark this spot to Saved Places"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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

            <button
              type="button"
              onClick={() => setShowHealthProfile(!showHealthProfile)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Stethoscope className="w-3.5 h-3.5 text-rose-500" />
              <span>{showHealthProfile ? 'Hide Health Profile' : 'Personalize Health Risk'}</span>
              {showHealthProfile ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => fetchAssessment(latitude, longitude, healthProfile)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Assessment
            </button>
          </div>
        </div>

        {/* Purpose Clarity Banner */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <span className="font-extrabold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
              Scientific Diagnostic
            </span>
            <span>Deep physical weather telemetry, satellite CAMS reference PM2.5, and SHAP source attributions.</span>
          </div>
          <Link
            to={`/livability?lat=${latitude}&lon=${longitude}`}
            className="inline-flex items-center gap-1 font-bold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 shrink-0"
          >
            <span>Need Lifestyle Advice or Comparison? Go to Livability</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Cold Start Notice (Render 5s Delay Indicator) */}
      <ColdStartNotice isLoading={isLoading} />

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">Assessment Failed</h4>
            <p className="mt-0.5 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchAssessment(latitude, longitude, healthProfile)}
            className="text-xs underline font-semibold text-rose-900 dark:text-rose-200 hover:text-rose-950 dark:hover:text-white cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* All-India Administrative & PIN Code Selector */}
      <LocationHierarchySelector
        label="Search Any Place in India by PIN Code or State / District"
        onSelectLocation={(loc) => {
          handleLocationChange(loc.lat, loc.lon);
          fetchAssessment(loc.lat, loc.lon, healthProfile);
        }}
      />

      {/* Location Picker Component */}
      <LocationPicker
        latitude={latitude}
        longitude={longitude}
        onLocationChange={handleLocationChange}
        onAssess={() => fetchAssessment(latitude, longitude, healthProfile)}
        isLoading={isLoading}
      />

      {/* Optional Health Risk Profile Selector */}
      {showHealthProfile && (
        <HealthProfileSelector
          value={healthProfile}
          onChange={handleProfileChange}
        />
      )}

      {/* Master Livability Verdict & Decision Card (Phase 2 Requirement) */}
      {assessmentData?.livability && (
        <LivabilityScoreCard livabilityData={assessmentData.livability} />
      )}

      {/* Detailed Assessment Results Component (Meteorology, Model vs Reference, SHAP) */}
      <LiveAssessmentResult assessmentData={assessmentData} />
    </div>
  );
}
