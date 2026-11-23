import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Layers, Loader2, RotateCcw, AlertTriangle } from 'lucide-react';

const LEAFLET_CDN_PROVIDERS = [
  {
    name: 'cdnjs',
    css: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
    js: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  },
  {
    name: 'jsdelivr',
    css: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',
    js: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',
  },
  {
    name: 'unpkg',
    css: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    js: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  },
];

// Delhi-NCR validated bounds: [28.1, 76.8] to [28.9, 77.6]
const DELHI_NCR_BOUNDS = [
  [28.1, 76.8],
  [28.9, 77.6],
];

export default function MapPicker({ latitude, longitude, onLocationChange }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [providerIndex, setProviderIndex] = useState(0);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [currentProviderName, setCurrentProviderName] = useState(LEAFLET_CDN_PROVIDERS[0].name);

  // Load Leaflet dynamically across multiple CDN providers with automatic fallback
  useEffect(() => {
    if (window.L) {
      setIsLeafletLoaded(true);
      return;
    }

    if (providerIndex >= LEAFLET_CDN_PROVIDERS.length) {
      setLoadError(true);
      return;
    }

    const provider = LEAFLET_CDN_PROVIDERS[providerIndex];
    setCurrentProviderName(provider.name);

    // 1. Inject CSS if not already present
    const cssId = `leaflet-css-${provider.name}`;
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = provider.css;
      document.head.appendChild(link);
    }

    // 2. Inject JS with timeout failover
    let timer = null;
    const scriptId = `leaflet-js-${provider.name}`;
    let script = document.getElementById(scriptId);

    const handleSuccess = () => {
      if (timer) clearTimeout(timer);
      setIsLeafletLoaded(true);
      setLoadError(false);
    };

    const handleFailure = () => {
      if (timer) clearTimeout(timer);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Try next CDN provider
      setProviderIndex((prev) => prev + 1);
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = provider.js;
      script.async = true;
      script.onload = handleSuccess;
      script.onerror = handleFailure;
      document.body.appendChild(script);

      // 6-second timeout before advancing to next CDN in case of hanging network
      timer = setTimeout(() => {
        if (!window.L) {
          handleFailure();
        }
      }, 6000);
    } else {
      script.addEventListener('load', handleSuccess);
      script.addEventListener('error', handleFailure);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [providerIndex]);

  const handleRetry = useCallback(() => {
    setLoadError(false);
    setIsLeafletLoaded(false);
    setProviderIndex(0);
  }, []);

  // Initialize Map once Leaflet is available and DOM container is mounted
  useEffect(() => {
    if (!isLeafletLoaded || !window.L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const L = window.L;
      const initialLat = latitude || 28.6139;
      const initialLon = longitude || 77.209;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: 11,
        scrollWheelZoom: true,
      });

      // OpenStreetMap Tiles with graceful fallback
      const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // High-Density Monitoring Region (Delhi-NCR) Bounding Box
      const ncrRect = L.rectangle(DELHI_NCR_BOUNDS, {
        color: '#2563eb',
        weight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        dashArray: '4, 4',
      }).addTo(map);

      ncrRect.bindTooltip('High-Density Monitoring Region (Delhi-NCR)', {
        permanent: false,
        direction: 'top',
      });

      // Clickable / Draggable Pin Marker
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background-color: #ef4444; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); transform: translate(-9px, -9px);"></div>`,
        iconSize: [18, 18],
      });

      const marker = L.marker([initialLat, initialLon], {
        draggable: true,
        icon: customIcon,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onLocationChange(
          Math.round(pos.lat * 10000) / 10000,
          Math.round(pos.lng * 10000) / 10000
        );
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        const roundedLat = Math.round(lat * 10000) / 10000;
        const roundedLon = Math.round(lng * 10000) / 10000;
        marker.setLatLng([roundedLat, roundedLon]);
        onLocationChange(roundedLat, roundedLon);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isLeafletLoaded]);

  // Sync external coordinate changes with marker position & map view
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (
        Math.abs(currentPos.lat - latitude) > 0.0001 ||
        Math.abs(currentPos.lng - longitude) > 0.0001
      ) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.panTo([latitude, longitude], { animate: true });
      }
    }
  }, [latitude, longitude]);

  if (loadError) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-amber-200 dark:border-amber-900/50 rounded-xl text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Interactive map tiles could not be loaded</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          An ad-blocker, privacy extension, or network firewall may be blocking map CDN domains. You can still input coordinates or select presets above.
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry loading map</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative mt-4 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner">
      {!isLeafletLoaded && (
        <div className="h-64 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
          <span>Loading interactive map tiles ({currentProviderName})...</span>
        </div>
      )}
      <div
        ref={mapContainerRef}
        className={`h-64 w-full transition-opacity duration-300 ${
          isLeafletLoaded ? 'opacity-100' : 'opacity-0 h-0'
        }`}
      />
      {isLeafletLoaded && (
        <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 pointer-events-none flex items-center gap-1.5 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block opacity-70" />
          <span>Dashed Blue: Delhi-NCR Validated Boundary. Click or drag pin anywhere.</span>
        </div>
      )}
    </div>
  );
}
