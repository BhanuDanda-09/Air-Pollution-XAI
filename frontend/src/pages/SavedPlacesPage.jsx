import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
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
  Bell,
  Sliders,
  Check,
  Search,
  X,
  RotateCw,
  FileSpreadsheet,
  GitCompare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import PageSkeleton from '../components/PageSkeleton';
import ColdStartNotice from '../components/ColdStartNotice';
import ErrorMessage from '../components/ErrorMessage';

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

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Alert threshold state
  const [threshold, setThreshold] = useState(100);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [thresholdSaved, setThresholdSaved] = useState(false);
  const [thresholdLoading, setThresholdLoading] = useState(false);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [label, setLabel] = useState('Home');
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Edit state
  const [editingLocation, setEditingLocation] = useState(null);
  const [editName, setEditName] = useState('');
  const [editLabel, setEditLabel] = useState('Home');
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation state
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadLocations();
      loadAlerts();
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

  const loadAlerts = async () => {
    try {
      const res = await userService.getAlerts();
      if (res) {
        if (res.preference?.pm25_threshold) {
          setThreshold(res.preference.pm25_threshold);
        }
        if (res.active_alerts) {
          setActiveAlerts(res.active_alerts);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch alerts:', err);
    }
  };

  const handleUpdateThreshold = async (e) => {
    e.preventDefault();
    setThresholdLoading(true);
    try {
      await userService.updateAlerts({ pm25_threshold: parseFloat(threshold) });
      setThresholdSaved(true);
      setTimeout(() => setThresholdSaved(false), 3000);
      await loadAlerts();
    } catch (err) {
      setError(err?.message || 'Failed to update alert threshold.');
    } finally {
      setThresholdLoading(false);
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

  const openEditModal = (loc) => {
    setEditingLocation(loc);
    setEditName(loc.name);
    setEditLabel(loc.label || 'Home');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingLocation || !editName.trim()) return;

    setEditLoading(true);
    try {
      await userService.updateSavedLocation(editingLocation.id, {
        name: editName.trim(),
        label: editLabel,
      });
      setEditingLocation(null);
      await loadLocations();
    } catch (err) {
      setError(err?.message || 'Failed to update place.');
    } finally {
      setEditLoading(false);
    }
  };

  const confirmDeleteLocation = async () => {
    if (!locationToDelete) return;
    setDeleteLoading(true);
    try {
      await userService.deleteSavedLocation(locationToDelete.id);
      setLocations((prev) => prev.filter((loc) => loc.id !== locationToDelete.id));
      setLocationToDelete(null);
    } catch (err) {
      setError(err?.message || 'Failed to remove location.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const navigateToAssess = (loc) => {
    navigate(`/live-assessment?lat=${loc.latitude}&lon=${loc.longitude}&name=${encodeURIComponent(loc.name)}`);
  };

  const navigateToLivability = (loc) => {
    navigate(`/livability?lat=${loc.latitude}&lon=${loc.longitude}&name=${encodeURIComponent(loc.name)}`);
  };

  const handleExportCSV = () => {
    if (locations.length === 0) return;
    const headers = ['ID', 'Name', 'Category', 'Latitude', 'Longitude'];
    const rows = locations.map((loc) => [
      loc.id,
      `"${(loc.name || '').replace(/"/g, '""')}"`,
      loc.label || 'Home',
      loc.latitude,
      loc.longitude,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `airiq_india_saved_places_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLocations = locations.filter((loc) => {
    const q = searchQuery.toLowerCase();
    return loc.name?.toLowerCase().includes(q) || loc.label?.toLowerCase().includes(q);
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden text-center p-8 md:p-12">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Bookmark className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            Saved Places & Custom Alerts
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
            Bookmark your frequent spots (Home, Office, School, Gym) to monitor localized air quality, receive automated PM2.5 threshold warnings, and run 1-click livability assessments.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto my-8 text-left">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
              <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm mb-1">
                1-Click Diagnostics
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instant assessment for your regular coordinates without re-entering lat/lon.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
              <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm mb-1">
                Personalized Alerts
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Set a custom PM2.5 limit (e.g. 100 µg/m³) and get warned whenever safe thresholds are breached.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
              <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm mb-1">
                Persistent Sync
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bookmarks sync across your browser and mobile PWA via secure authentication.
              </p>
            </div>
          </div>

          <button
            onClick={() => openAuthModal('register')}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all"
          >
            Sign In or Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            Saved Places
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Bookmark your frequent locations for 1-click diagnostics and automated PM2.5 threshold alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {locations.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              title="Download saved places as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showAddForm ? 'Cancel' : 'Add New Place'}</span>
          </button>
        </div>
      </div>

      <ColdStartNotice isLoading={loading} />

      {error && (
        <ErrorMessage
          title="Saved Places Notice"
          message={error}
          onRetry={loadLocations}
        />
      )}

      {/* Add New Place Accordion Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddLocation}
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 shadow-md space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-blue-600" />
              <span>Bookmark a Location</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Delhi-NCR region recommended</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="place-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Place Name / Description
              </label>
              <input
                id="place-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Apartment, Sector 62 Noida"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="place-label" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category Label
              </label>
              <select
                id="place-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Home">Home</option>
                <option value="Work">Work / Office</option>
                <option value="Campus">School / College</option>
                <option value="Gym">Gym / Sports</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="place-lat" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Latitude (°N)
              </label>
              <input
                id="place-lat"
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="28.6139"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="place-lon" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Longitude (°E)
              </label>
              <input
                id="place-lon"
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="77.2090"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={gpsLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>{gpsLoading ? 'Acquiring GPS...' : 'Use My Current GPS'}</span>
            </button>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {submitLoading ? 'Saving Location...' : 'Save Place'}
            </button>
          </div>
        </form>
      )}

      {/* Alert Threshold Banner */}
      <form
        onSubmit={handleUpdateThreshold}
        className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              PM2.5 Pollution Alert Threshold
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Highlights your saved locations in amber/rose whenever live ambient PM2.5 exceeds this limit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <div className="relative">
            <input
              type="number"
              min="10"
              max="500"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold text-right pr-12 focus:ring-2 focus:ring-blue-500 outline-none"
              aria-label="PM2.5 threshold value in micrograms per cubic meter"
            />
            <span className="absolute right-2.5 top-2 text-[11px] text-slate-400 font-medium pointer-events-none">
              µg/m³
            </span>
          </div>

          <button
            type="submit"
            disabled={thresholdLoading}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-semibold text-xs transition-all disabled:opacity-50"
          >
            {thresholdSaved ? 'Saved!' : thresholdLoading ? 'Saving...' : 'Update'}
          </button>
        </div>
      </form>

      {/* Filter / Search Bar */}
      {locations.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter saved places by name or category..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            aria-label="Filter saved places"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Places Grid */}
      {loading ? (
        <PageSkeleton variant="table" />
      ) : locations.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No saved places yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Click <strong>"Add New Place"</strong> above to bookmark your residence, office, or gym for fast 1-click air assessments and threshold alerts.
          </p>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No saved places matched "<strong>{searchQuery}</strong>".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((loc) => {
            const Icon = LABEL_ICONS[loc.label] || Bookmark;
            const hasAlert = activeAlerts.some((a) => a.location_id === loc.id);
            const alertInfo = activeAlerts.find((a) => a.location_id === loc.id);

            return (
              <div
                key={loc.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/80 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {loc.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(loc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                        title="Edit place name or label"
                        aria-label={`Edit ${loc.name}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setLocationToDelete(loc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        title="Remove place"
                        aria-label={`Remove ${loc.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-navy-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {loc.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {loc.latitude.toFixed(4)}°N, {loc.longitude.toFixed(4)}°E
                    </span>
                  </div>

                  {hasAlert && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-[11px] font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>
                        PM2.5: {Math.round(alertInfo?.current_pm25 || 0)} µg/m³ (Exceeds {threshold} µg/m³)
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => navigateToAssess(loc)}
                    className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold transition-colors cursor-pointer"
                    title="Run live meteorological assessment"
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>Assess</span>
                  </button>
                  <button
                    onClick={() => navigateToLivability(loc)}
                    className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
                    title="View residential livability score"
                  >
                    <Compass className="w-3.5 h-3.5 shrink-0" />
                    <span>Verdict</span>
                  </button>
                  <button
                    onClick={() => navigate(`/livability?lat=${loc.latitude}&lon=${loc.longitude}&tab=compare`)}
                    className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold transition-colors cursor-pointer"
                    title="Compare this place with another"
                  >
                    <GitCompare className="w-3.5 h-3.5 shrink-0" />
                    <span>Compare</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Place Modal */}
      {editingLocation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label="Edit saved place"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Saved Place</span>
              </h3>
              <button
                onClick={() => setEditingLocation(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Place Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work / Office</option>
                  <option value="Campus">School / College</option>
                  <option value="Gym">Gym / Sports</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLocation(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {locationToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm deletion"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete this saved place?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Are you sure you want to remove <strong>"{locationToDelete.name}"</strong>? This will also disable active threshold alerts for these coordinates.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLocationToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                Keep Place
              </button>
              <button
                type="button"
                onClick={confirmDeleteLocation}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {deleteLoading ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
