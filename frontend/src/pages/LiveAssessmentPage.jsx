import React, { useState, useEffect } from 'react';
import { Compass, AlertCircle, RefreshCw } from 'lucide-react';
import LocationPicker from '../components/LocationPicker';
import LiveAssessmentResult from '../components/LiveAssessmentResult';
import locationService from '../services/locationService';

export default function LiveAssessmentPage() {
  const [latitude, setLatitude] = useState(28.6315); // Connaught Place, New Delhi default
  const [longitude, setLongitude] = useState(77.2167);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);

  const fetchAssessment = async (lat = latitude, lon = longitude) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await locationService.assessLocation(lat, lon);
      // Backend returns either direct fields or data payload
      const result = response.data || response;
      setAssessmentData(result);
    } catch (err) {
      console.error('Location assessment failed:', err);
      setError(
        err.message || 'Failed to complete location assessment. Please verify backend status and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Perform initial assessment for default location on page mount
  useEffect(() => {
    fetchAssessment(28.6315, 77.2167);
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
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 rounded-full">
                Phase 1 Live Intelligence
              </span>
              <span className="text-xs text-slate-500 font-medium">Open-Meteo & CAMS Integration</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
              Real-World Air Quality Assessment
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Assess live particulate air pollution (PM2.5) for any geographic coordinates using real-time
              satellite surface meteorology, calibrated XGBoost machine learning, and CAMS reference comparison.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchAssessment(latitude, longitude)}
            disabled={isLoading}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Live Assessment
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">Assessment Failed</h4>
            <p className="mt-0.5 text-xs text-rose-700 leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchAssessment(latitude, longitude)}
            className="text-xs underline font-semibold text-rose-900 hover:text-rose-950"
          >
            Retry
          </button>
        </div>
      )}

      {/* Location Picker Component */}
      <LocationPicker
        latitude={latitude}
        longitude={longitude}
        onLocationChange={handleLocationChange}
        onAssess={() => fetchAssessment(latitude, longitude)}
        isLoading={isLoading}
      />

      {/* Assessment Results Component */}
      <LiveAssessmentResult assessmentData={assessmentData} />
    </div>
  );
}
