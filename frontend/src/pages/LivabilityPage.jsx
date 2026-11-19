import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Home, Compass, AlertCircle, RefreshCw, SlidersHorizontal, Bookmark, Check } from 'lucide-react';
import LocationPicker from '../components/LocationPicker';
import HealthProfileSelector from '../components/HealthProfileSelector';
import LivabilityScoreCard from '../components/LivabilityScoreCard';
import PersonaAdviceSection from '../components/PersonaAdviceSection';
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

export default function LivabilityPage() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, healthProfile: userProfile } = useAuth();

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

  // Sync profile if user logs in or profile loads
  useEffect(() => {
    if (userProfile) {
      setHealthProfile(userProfile);
    }
  }, [userProfile]);

  const fetchLivability = async (lat = latitude, lon = longitude, profile = healthProfile) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await livabilityService.assessLivability(lat, lon, profile);
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

  const handleLocationChange = (newLat, newLon) => {
    setLatitude(newLat);
    setLongitude(newLon);
    setSaveSuccess(false);
  };

  const handleProfileChange = (updatedProfile) => {
    setHealthProfile(updatedProfile);
    fetchLivability(latitude, longitude, updatedProfile);
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
                Phase 2 Decision Synthesis
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Livability & Exposure Assessment
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
              Should I Live In / Go To This Place?
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Synthesize real-world air pollution exposure into clear, actionable verdicts. The score is
              driven primarily by regional Copernicus (CAMS) reference data and forecasts, with local surface
              meteorological machine learning providing secondary atmospheric context.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {isAuthenticated && (
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

            <button
              type="button"
              onClick={() => fetchLivability(latitude, longitude, healthProfile)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Re-evaluate Livability
            </button>
          </div>
        </div>
      </div>

      {/* Cold Start Notice (Render 5s Delay Indicator) */}
      <ColdStartNotice isLoading={isLoading} />

      {/* Error Alert */}
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

      {/* Location Picker */}
      <LocationPicker
        latitude={latitude}
        longitude={longitude}
        onLocationChange={handleLocationChange}
        onAssess={() => fetchLivability(latitude, longitude, healthProfile)}
        isLoading={isLoading}
      />

      {/* Health Risk Profile Selector */}
      <HealthProfileSelector
        value={healthProfile}
        onChange={handleProfileChange}
      />

      {/* Master Livability Score & Verdict Card */}
      {assessmentData?.livability && (
        <LivabilityScoreCard livabilityData={assessmentData.livability} />
      )}

      {/* Persona-specific Guidance Cards */}
      {assessmentData?.livability?.persona_guidance && (
        <PersonaAdviceSection
          personaGuidance={assessmentData.livability.persona_guidance}
        />
      )}
    </div>
  );
}
