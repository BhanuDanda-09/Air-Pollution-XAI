import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, Check, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import airService from '../services/airService';
import CoverageTierBadge from './CoverageTierBadge';

/**
 * LocationHierarchySelector:
 * Complete Indian administrative hierarchy selector supporting:
 * 1. Cascading State -> District -> Village/Town/Locality search
 * 2. 6-digit Indian PIN code box with auto-fill and multi-office disambiguation
 * 3. Browser GPS / Geolocation reverse geocoding
 */
export default function LocationHierarchySelector({
  label = 'Select Location',
  onSelectLocation,
  initialLocation = null,
  className = '',
}) {
  const [mode, setMode] = useState('pin'); // 'pin' | 'hierarchy' | 'gps'
  const [selectedPlace, setSelectedPlace] = useState(initialLocation);

  // Guided Hierarchy State
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

  // PIN Code State
  const [pincode, setPincode] = useState('');
  const [pinResolved, setPinResolved] = useState(null);
  const [isResolvingPin, setIsResolvingPin] = useState(false);
  const [pinError, setPinError] = useState('');

  // GPS State
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Load States on mount
  useEffect(() => {
    let isMounted = true;
    async function loadStates() {
      try {
        const res = await airService.getStates();
        if (isMounted && res && res.states) {
          setStates(res.states);
        }
      } catch (err) {
        console.error('Failed to load states:', err);
      }
    }
    loadStates();
    return () => { isMounted = false; };
  }, []);

  // Load Districts when state changes
  useEffect(() => {
    if (!selectedState) {
      setDistricts([]);
      setSelectedDistrict('');
      return;
    }
    let isMounted = true;
    async function loadDistricts() {
      try {
        const res = await airService.getDistricts(selectedState);
        if (isMounted && res && res.districts) {
          setDistricts(res.districts);
          setSelectedDistrict('');
        }
      } catch (err) {
        console.error('Failed to load districts:', err);
      }
    }
    loadDistricts();
    return () => { isMounted = false; };
  }, [selectedState]);

  // Handle PIN Code Input
  const handlePinChange = async (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(val);
    setPinError('');
    setPinResolved(null);

    if (val.length === 6) {
      if (!/^[1-9][0-9]{5}$/.test(val)) {
        setPinError('Invalid PIN code format. Must start with digits 1-9.');
        return;
      }
      setIsResolvingPin(true);
      try {
        const res = await airService.resolvePincode(val);
        if (res && (res.success || res.status === 'success')) {
          setPinResolved(res);
          const locationData = {
            name: res.place_name,
            district: res.district,
            state: res.state,
            lat: res.latitude || res.lat,
            lon: res.longitude || res.lon,
            pincode: val,
            display_name: res.display_name,
            coverage: res.coverage,
          };
          setSelectedPlace(locationData);
          if (onSelectLocation) onSelectLocation(locationData);
        } else {
          setPinError(res?.message || 'Unable to resolve PIN code.');
        }
      } catch (err) {
        setPinError('Network error resolving PIN code. Please try again.');
      } finally {
        setIsResolvingPin(false);
      }
    }
  };

  // Disambiguate post office if multiple exist
  const handleSelectPostOffice = (po) => {
    if (!pinResolved) return;
    const locationData = {
      name: po.name,
      district: pinResolved.district,
      state: pinResolved.state,
      lat: pinResolved.latitude || pinResolved.lat,
      lon: pinResolved.longitude || pinResolved.lon,
      pincode: pinResolved.pincode,
      display_name: `${po.name}, ${pinResolved.district} district, ${pinResolved.state}, PIN ${pinResolved.pincode}`,
      coverage: pinResolved.coverage,
    };
    setSelectedPlace(locationData);
    if (onSelectLocation) onSelectLocation(locationData);
  };

  // Debounced search for places in Hierarchy Mode
  useEffect(() => {
    if (!placeQuery.trim() || placeQuery.length < 2) {
      setPlaceResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingPlaces(true);
      try {
        const res = await airService.searchPlaces({
          query: placeQuery,
          state: selectedState || undefined,
          district: selectedDistrict || undefined,
          limit: 8,
        });
        if (res && res.places) {
          setPlaceResults(res.places);
        }
      } catch (err) {
        console.error('Place search failed:', err);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [placeQuery, selectedState, selectedDistrict]);

  // Select place from Hierarchy search
  const handleSelectHierarchyPlace = (place) => {
    const locationData = {
      name: place.name,
      district: place.district,
      state: place.state,
      lat: place.lat,
      lon: place.lon,
      pincode: place.pincode || '',
      display_name: place.display_name,
      coverage: place.coverage,
    };
    setSelectedPlace(locationData);
    setPlaceResults([]);
    setPlaceQuery(place.name);
    if (onSelectLocation) onSelectLocation(locationData);
  };

  // GPS Geolocation Handler
  const handleGpsLocate = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocatingGps(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await airService.reverseGeocode({ lat, lon });
          if (res && res.success) {
            const locationData = {
              name: res.place_name,
              district: res.district,
              state: res.state,
              lat,
              lon,
              pincode: res.pincode || '',
              display_name: res.formatted_hierarchy || res.display_name,
              coverage: res.coverage,
            };
            setSelectedPlace(locationData);
            if (onSelectLocation) onSelectLocation(locationData);
          } else {
            setGpsError(res?.message || 'Location could not be reverse-geocoded.');
          }
        } catch (err) {
          setGpsError('Failed to resolve GPS coordinates.');
        } finally {
          setIsLocatingGps(false);
        }
      },
      (err) => {
        setIsLocatingGps(false);
        setGpsError(err.message || 'Permission denied. Please select location manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4 ${className}`}>
      {/* Header and Input Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          {label}
        </label>

        {/* Mode Selector Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('pin')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              mode === 'pin'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            6-Digit PIN
          </button>
          <button
            type="button"
            onClick={() => setMode('hierarchy')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              mode === 'hierarchy'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            State & District
          </button>
          <button
            type="button"
            onClick={() => { setMode('gps'); handleGpsLocate(); }}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
              mode === 'gps'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Navigation className="w-3 h-3" />
            GPS
          </button>
        </div>
      </div>

      {/* MODE 1: 6-Digit PIN Code Input */}
      {mode === 'pin' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Enter Indian Postal PIN Code (e.g., 506001, 110001, 560034)
            </label>
            <div className="relative">
              <input
                type="text"
                value={pincode}
                onChange={handlePinChange}
                maxLength={6}
                placeholder="6-digit PIN code"
                className="w-full px-3 py-2 pl-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {isResolvingPin && (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3 top-2.5" />
              )}
            </div>
            {pinError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {pinError}
              </p>
            )}
          </div>

          {/* Multi-Office Disambiguation Pills */}
          {pinResolved && pinResolved.has_multiple_post_offices && (
            <div className="space-y-1.5 pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Multiple post offices found for PIN {pincode}. Select your specific locality:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                {pinResolved.post_offices.map((po, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPostOffice(po)}
                    className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                      selectedPlace?.name === po.name
                        ? 'bg-emerald-600 text-white font-medium shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {po.name} {po.branch_type ? `(${po.branch_type})` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: Guided Cascading Hierarchy (State -> District -> Village/Town) */}
      {mode === 'hierarchy' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* State Dropdown */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                State / Union Territory
              </label>
              <div className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full appearance-none px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select State / UT (36) --</option>
                  {states.map((st) => (
                    <option key={st.name} value={st.name}>
                      {st.name} ({st.district_count} dists)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* District Dropdown */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                District
              </label>
              <div className="relative">
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={!selectedState}
                  className="w-full appearance-none px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  <option value="">-- All Districts ({districts.length}) --</option>
                  {districts.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Place / Village / Locality Autocomplete Search */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              City, Town, Village, or Locality Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                placeholder="Type village/town name (e.g. Hanamkonda, BTM Layout)..."
                className="w-full px-3 py-2 pl-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {isSearchingPlaces && (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3 top-2.5" />
              )}
            </div>

            {/* Autocomplete Dropdown List */}
            {placeResults.length > 0 && (
              <div className="mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto z-10">
                {placeResults.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectHierarchyPlace(p)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700/60 border-b border-slate-100 dark:border-slate-700/50 last:border-none flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</span>
                      <span className="text-slate-500 dark:text-slate-400 ml-1.5 text-[11px]">
                        ({p.district}, {p.state})
                      </span>
                    </div>
                    {p.coverage && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {p.coverage.tier_number === 1 ? 'Tier 1' : p.coverage.tier_number === 2 ? 'Tier 2' : 'Tier 3'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 3: GPS Geolocation */}
      {mode === 'gps' && (
        <div className="space-y-2 py-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGpsLocate}
              disabled={isLocatingGps}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isLocatingGps ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Acquiring GPS Fix & Reverse Geocoding...
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  Refresh My GPS Location
                </>
              )}
            </button>
          </div>
          {gpsError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {gpsError}
            </p>
          )}
        </div>
      )}

      {/* Selected Location Summary with Coverage Tier Badge */}
      {selectedPlace && (
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 mt-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Selected Place</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                {selectedPlace.name || selectedPlace.display_name}
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {selectedPlace.display_name || `${selectedPlace.name}, ${selectedPlace.district}, ${selectedPlace.state}`}
              </p>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                Coordinates: {selectedPlace.lat?.toFixed(4)}°N, {selectedPlace.lon?.toFixed(4)}°E
                {selectedPlace.pincode ? ` | PIN ${selectedPlace.pincode}` : ''}
              </p>
            </div>
          </div>

          {/* Precision Coverage Tier & Confidence Indicator */}
          {selectedPlace.coverage && (
            <CoverageTierBadge coverage={selectedPlace.coverage} showDetails={true} />
          )}
        </div>
      )}
    </div>
  );
}
