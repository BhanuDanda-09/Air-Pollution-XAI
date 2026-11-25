import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon assets for bundled Leaflet
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Delhi-NCR validated bounds: [28.1, 76.8] to [28.9, 77.6]
const DELHI_NCR_BOUNDS = [
  [28.1, 76.8],
  [28.9, 77.6],
];

export default function MapPicker({ latitude, longitude, onLocationChange }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = useCallback(() => {
    setTilesFailed(false);
    setRetryKey((k) => k + 1);
  }, []);

  // Initialize Map directly with bundled Leaflet (zero CDN external script dependence)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up previous instance if retrying or remounting
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }

    const initialLat = latitude || 28.6139;
    const initialLon = longitude || 77.209;

    let map;
    try {
      map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: 11,
        scrollWheelZoom: true,
      });
    } catch (err) {
      console.warn('Leaflet initialization error:', err);
      setTilesFailed(true);
      return;
    }

    // OpenStreetMap Tile Layer with visible attribution complying with Tile Usage Policy
    const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    let errorCount = 0;
    let loadedCount = 0;

    // Show error only if no tile loaded after 15 s AND tile errors were reported
    const timeoutTimer = setTimeout(() => {
      if (loadedCount === 0 && errorCount > 0) {
        setTilesFailed(true);
      }
    }, 15000);

    tileLayer.on('tileerror', () => {
      errorCount += 1;
    });

    tileLayer.on('tileload', () => {
      loadedCount += 1;
      // Hide the overlay immediately on the first successful tile load
      setTilesFailed(false);
      clearTimeout(timeoutTimer);
    });

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

    // Draggable Pin Marker
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

    // Refresh dimensions after container mount
    const resizeTimer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      clearTimeout(resizeTimer);
      clearTimeout(timeoutTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [retryKey]);

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

  return (
    <div className="relative mt-4 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner">
      {tilesFailed ? (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-900/50 rounded-xl text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Interactive map tiles could not be loaded</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Interactive map tiles could not be loaded. You can still input coordinates or select presets above.
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
      ) : (
        <>
          <div
            ref={mapContainerRef}
            className="h-64 w-full"
            style={{ zIndex: 1 }}
          />
          <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 pointer-events-none flex items-center gap-1.5 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block opacity-70" />
            <span>Dashed Blue: Delhi-NCR Validated Boundary. Click or drag pin anywhere.</span>
          </div>
        </>
      )}
    </div>
  );
}
