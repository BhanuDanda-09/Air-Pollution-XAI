import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';

export default function ServiceWorkerToast() {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    // Listen for custom SW update event dispatched by main.jsx
    const handleUpdateAvailable = (event) => {
      const reg = event.detail?.registration;
      if (reg && reg.waiting) {
        setWaitingWorker(reg.waiting);
        setShowToast(true);
      }
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);

    // Check directly on mount if navigator.serviceWorker has an update waiting
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          setWaitingWorker(reg.waiting);
          setShowToast(true);
        }
      });

      // Reload page ONLY when update was explicitly initiated by user
      const onControllerChange = () => {
        if (isUpdatingRef.current) {
          window.location.reload();
        }
      };

      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

      return () => {
        window.removeEventListener('sw-update-available', handleUpdateAvailable);
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      };
    }

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleUpdate = () => {
    setIsUpdating(true);
    isUpdatingRef.current = true;
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  if (!showToast) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:max-w-sm z-50 p-4 bg-slate-900 dark:bg-slate-800 text-white rounded-xl shadow-2xl border border-blue-500/30 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg shrink-0 mt-0.5">
        <Sparkles className="w-5 h-5 text-blue-400" />
      </div>

      <div className="flex-1 text-xs">
        <h4 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
          Update Available
        </h4>
        <p className="text-slate-300 mt-1 leading-relaxed">
          A new version of AirIQ India is available with improved accuracy and fixes.
        </p>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Updating...' : 'Refresh Now'}
          </button>
          <button
            onClick={() => setShowToast(false)}
            className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            Later
          </button>
        </div>
      </div>

      <button
        onClick={() => setShowToast(false)}
        aria-label="Dismiss update notification"
        className="text-slate-400 hover:text-white transition-colors p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
