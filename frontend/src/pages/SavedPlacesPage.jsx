import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Plus,
  Trash2,
  Navigation,
  Compass,
  Home,
  Briefcase,
  GraduationCap,
  Dumbbell,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';

const LABEL_ICONS = {
  Home: Home,
  Work: Briefcase,
  Campus: GraduationCap,
  Gym: Dumbbell,
  Other: Bookmark,
};

export default function SavedPlacesPage() {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [label, setLabel] = useState('Home');
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadLocations();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getSavedLocations();
      setLocations(data);
    } catch (err) {
      setError(err?.message || 'Failed to load saved locations.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(4));
        setLongitude(pos.coords.longitude.toFixed(4));
        if (!name) setName('My Current Location');
        setGpsLoading(false);
      },
      (err) => {
        setError(`GPS error: ${err.message}. Please enter coordinates manually.`);
        setGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!name || !latitude || !longitude) {
      setError('Please provide a name and valid coordinates.');
      return;
    }

    setSubmitLoading(true);
    setError(null);
    try {
      await userService.addSavedLocation({
        label,
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });
      setName('');
      setLatitude('');
      setLongitude('');
      setShowAddForm(false);
      await loadLocations();
    } catch (err) {
      setError(err?.message || 'Failed to bookmark location.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteLocation = async (id) => {
    try {
      await userService.deleteSavedLocation(id);
      setLocations((prev) => prev.filter((loc) => loc.id !== id));
    } catch (err) {
      setError(err?.message || 'Failed to remove location.');
    }
  };

  const navigateToAssess = (loc) => {
    navigate(`/live-assessment?lat=${loc.latitude}&lon=${loc.longitude}&name=${encodeURIComponent(loc.name)}`);
  };

  const navigateToLivability = (loc) => {
    navigate(`/livability?lat=${loc.latitude}&lon=${loc.longitude}&name=${encodeURIComponent(loc.name)}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-center p-8 md:p-12">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Bookmark className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Saved Places & Quick Assessment
          </h1>
          <p className="mt-3 text-slate-600 max-w-lg mx-auto text-sm leading-relaxed">
            Bookmark your frequent destinations—such as Home, Workplace, School, or Outdoor Jogging spots—for instant 1-click exposure assessments.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto my-8 text-left">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-semibold text-slate-900 text-xs sm:text-sm mb-1">Instant 1-Click</div>
              <p className="text-xs text-slate-500">Check live air quality and forecast without re-typing coordinates.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-semibold text-slate-900 text-xs sm:text-sm mb-1">Personalized Verdicts</div>
              <p className="text-xs text-slate-500">Evaluates conditions against your customized health profile.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-semibold text-slate-900 text-xs sm:text-sm mb-1">Cross-Device Sync</div>
              <p className="text-xs text-slate-500">Access your bookmarked places from phone, tablet, or desktop.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => openAuthModal('register')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all"
            >
              Sign In or Register
            </button>
            <button
              onClick={() => navigate('/live-assessment')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
            >
              Continue Guest Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">Saved Places</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {locations.length} {locations.length === 1 ? 'place' : 'places'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            One-click shortcuts to assess air quality, livability scores, and forecasts for your regular spots.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Form' : 'Add New Place'}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Add New Place Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddLocation}
          className="p-5 sm:p-6 bg-white rounded-2xl shadow-sm border border-blue-200 bg-gradient-to-b from-blue-50/30 to-white animate-fadeIn"
        >
          <h2 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-blue-600" />
            <span>Add a Favorite Place</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Label</label>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Campus">Campus / School</option>
                <option value="Gym">Gym / Sports</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Place Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cyber City, Gurugram"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="28.4595"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="77.0266"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={gpsLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
              <span>{gpsLoading ? 'Detecting GPS...' : 'Use My Current GPS'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                {submitLoading ? 'Saving...' : 'Save Place'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Places Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs">Loading saved places...</p>
        </div>
      ) : locations.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No saved places yet</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Click "Add New Place" to bookmark your home, office, or university campus for fast 1-click air assessments.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => {
            const Icon = LABEL_ICONS[loc.label] || Bookmark;
            return (
              <div
                key={loc.id}
                className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {loc.label}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteLocation(loc.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove place"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-navy-900 group-hover:text-blue-700 transition-colors">
                    {loc.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {loc.latitude.toFixed(4)}°N, {loc.longitude.toFixed(4)}°E
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => navigateToAssess(loc)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Live Assess</span>
                  </button>
                  <button
                    onClick={() => navigateToLivability(loc)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Verdict</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
