import React, { useState, useEffect } from 'react';
import { Loader2, Server } from 'lucide-react';

/**
 * Displays a friendly cold-start notice when an API request takes longer than 5 seconds.
 * Helps users understand Render free-tier idle spin-up instead of thinking the app is broken.
 */
export default function ColdStartNotice({ isLoading, thresholdMs = 5000 }) {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    let timer;
    if (isLoading) {
      timer = setTimeout(() => {
        setShowNotice(true);
      }, thresholdMs);
    } else {
      setShowNotice(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, thresholdMs]);

  if (!isLoading || !showNotice) return null;

  return (
    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-3 animate-fadeIn shadow-xs my-3">
      <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
        <Server className="w-4 h-4 animate-pulse" />
      </div>
      <div className="flex-1">
        <p className="font-bold flex items-center gap-1.5 text-amber-950">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
          Server waking up, please wait...
        </p>
        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
          The backend runs on Render free tier and spins down when idle. Cold start typically takes 20–45 seconds. Your request is in progress.
        </p>
      </div>
    </div>
  );
}
