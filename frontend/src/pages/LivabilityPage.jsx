import React, { useState, useEffect } from 'react';
import { Home, Compass, AlertCircle, RefreshCw } from 'lucide-react';
import LocationPicker from '../components/LocationPicker';
import LivabilityScoreCard from '../components/LivabilityScoreCard';
import PersonaAdviceSection from '../components/PersonaAdviceSection';
import livabilityService from '../services/livabilityService';

export default function LivabilityPage() {
  const [latitude, setLatitude] = useState(28.6315); // Connaught Place, New Delhi default
  const [longitude, setLongitude] = useState(77.2167);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);

  const fetchLivability = async (lat = latitude, lon = longitude) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await livabilityService.assessLivability(lat, lon);
      const result = response.data || response;
      setAssessmentData(result);
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
    fetchLivability(28.6315, 77.2167);
  }, []);

  const handleLocationChange = (newLat, newLon) => {
    setLatitude(newLat);
    setLongitude(newLon);
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

          <button
            type="button"
            onClick={() => fetchLivability(latitude, longitude)}
            disabled={isLoading}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Re-evaluate Livability
          </button>
        </div>
      </div>

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
            onClick={() => fetchLivability(latitude, longitude)}
            className="text-xs underline font-semibold text-rose-900 hover:text-rose-950"
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
        onAssess={() => fetchLivability(latitude, longitude)}
        isLoading={isLoading}
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
