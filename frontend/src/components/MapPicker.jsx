import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Layers, Loader2 } from 'lucide-react';

const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

// Delhi-NCR validated bounds: [28.1, 76.8] to [28.9, 77.6]
const DELHI_NCR_BOUNDS = [
  [28.1, 76.8],
  [28.9, 77.6],
];

export default function MapPicker({ latitude, longitude, onLocationChange }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Dynamically load Leaflet from CDN on demand to avoid bundling 150KB into main bundle
  useEffect(() => {
    if (window.L) {
      setIsLeafletLoaded(true);
      return;
    }

    // Inject CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS_URL}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS_URL;
      document.head.appendChild(link);
    }

    // Inject JS
    if (!document.querySelector(`script[src="${LEAFLET_JS_URL}"]`)) {
      const script = document.createElement('script');
      script.src = LEAFLET_JS_URL;
      script.async = true;
      script.onload = () => setIsLeafletLoaded(true);
      script.onerror = () => setLoadError(true);
      document.body.appendChild(script);
    } else {
      const existingScript = document.querySelector(`script[src="${LEAFLET_JS_URL}"]`);
      existingScript.addEventListener('load', () => setIsLeafletLoaded(true));
    }
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

      // OpenStreetMap Tiles
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
        Interactive map tiles could not be loaded. You can still input coordinates or select presets above.
      </div>
    );
  }

  return (
    <div className="relative mt-4 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner">
      {!isLeafletLoaded && (
        <div className="h-64 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
          <span>Loading OpenStreetMap tiles...</span>
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
