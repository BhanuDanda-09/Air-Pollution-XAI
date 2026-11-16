import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { MapPin, Navigation, Search, CheckCircle, AlertCircle, Compass, Loader2, Map } from 'lucide-react';
import locationService from '../services/locationService';

// Lazy-load the Leaflet OpenStreetMap picker to avoid loading map assets into initial page bundle
const MapPicker = lazy(() => import('./MapPicker'));

const PRESETS = [
  {
    name: 'Connaught Place',
    region: 'Central Delhi',
    lat: 28.6315,
    lon: 77.2167,
    isNCR: true,
  },
  {
    name: 'Anand Vihar',
    region: 'East Delhi',
    lat: 28.6502,
    lon: 77.3150,
    isNCR: true,
  },
  {
    name: 'Noida Sec-62',
    region: 'Uttar Pradesh (NCR)',
    lat: 28.6280,
    lon: 77.3649,
    isNCR: true,
  },
  {
    name: 'Gurgaon CyberCity',
    region: 'Haryana (NCR)',
    lat: 28.4950,
    lon: 77.0895,
    isNCR: true,
  },
  {
    name: 'Mumbai (Outside)',
    region: 'Maharashtra (Extrapolation)',
    lat: 18.9256,
    lon: 72.8242,
    isNCR: false,
  },
  {
    name: 'Bengaluru (Outside)',
    region: 'Karnataka (Extrapolation)',
    lat: 12.9698,
    lon: 77.7500,
    isNCR: false,
  },
];

export default function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
  onAssess,
  isLoading,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const searchTimeoutRef = useRef(null);

  // Debounced geocoding search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await locationService.searchGeocoding(searchQuery);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const handleSelectSearchResult = (item) => {
    onLocationChange(item.latitude, item.longitude);
    setSearchQuery(item.displayName);
    setShowDropdown(false);
  };

  const handleUseCurrentLocation = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lon = Math.round(pos.coords.longitude * 10000) / 10000;
        onLocationChange(lat, lon);
        setSearchQuery(`GPS Location (${lat}, ${lon})`);
      },
      (err) => {
        setGpsError(`GPS permission denied or unavailable: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const isDelhiNCR =
    latitude >= 28.1 && latitude <= 28.9 && longitude >= 76.8 && longitude <= 77.6;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Live Geographic Assessment
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Evaluate real-time PM2.5 and meteorological conditions anywhere via live satellite & surface data
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <Map className="w-3.5 h-3.5 text-indigo-600" />
            <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
          </button>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>Use My GPS</span>
          </button>
        </div>
      </div>

      {gpsError && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* City / Place Search Autocomplete */}
      <div className="relative mb-6">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Search City, Landmark or District
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            placeholder="e.g. Connaught Place, Gurgaon, Noida, Mumbai..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-800"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          {isSearching && (
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin absolute right-3.5 top-3.5" />
          )}
        </div>

        {/* Dropdown Results */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSearchResult(item)}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.displayName}</p>
                </div>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                  {item.latitude.toFixed(2)}, {item.longitude.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Select Presets */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Preset Locations
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PRESETS.map((preset) => {
            const isSelected =
              Math.abs(latitude - preset.lat) < 0.005 &&
              Math.abs(longitude - preset.lon) < 0.005;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  onLocationChange(preset.lat, preset.lon);
                  setSearchQuery(preset.name);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${isSelected
                    ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {preset.name}
                  </span>
                  {preset.isNCR ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Delhi-NCR Validated" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Outside Validated Region" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 truncate">{preset.region}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Coordinate Inputs & Submit Trigger */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Latitude (°N)</label>
            <input
              type="number"
              step="0.0001"
              value={latitude}
              onChange={(e) => onLocationChange(parseFloat(e.target.value) || 0, longitude)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono text-slate-800 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Longitude (°E)</label>
            <input
              type="number"
              step="0.0001"
              value={longitude}
              onChange={(e) => onLocationChange(latitude, parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono text-slate-800 bg-white"
            />
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={onAssess}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Assessing Location...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" />
                <span>Fetch Live Assessment</span>
              </>
            )}
          </button>
        </div>

        {/* Region Verification Tag */}
        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            {isDelhiNCR ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Within Validated Region (Delhi-NCR: [28.1°-28.9°N, 76.8°-77.6°E])
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Outside Validated Region (Delhi-NCR) — Model extrapolation disclaimer applies
              </span>
            )}
          </div>
          <span className="font-mono text-slate-400 text-[11px]">
            {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
          </span>
        </div>
      </div>

      {/* Interactive OpenStreetMap Picker (Lazy Loaded) */}
      {showMap && (
        <Suspense
          fallback={
            <div className="mt-4 h-64 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500 mr-2" />
              Loading Map View...
            </div>
          }
        >
          <MapPicker
            latitude={latitude}
            longitude={longitude}
            onLocationChange={onLocationChange}
          />
        </Suspense>
      )}
    </div>
  );
}
