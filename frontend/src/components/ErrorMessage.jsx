import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ title = 'Error', message, onRetry, details }) {
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 my-4 text-rose-900 shadow-xs">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-rose-900">{title}</h4>
          <p className="text-sm text-rose-700 mt-1 leading-relaxed">{message}</p>
          {details && (
            <div className="mt-2 text-xs bg-rose-100/60 p-2.5 rounded-lg font-mono text-rose-800 break-words">
              {typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details)}
            </div>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
