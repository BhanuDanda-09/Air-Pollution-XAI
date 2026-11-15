import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...', size = 'default' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-6 h-6',
    large: 'w-10 h-10',
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.default} text-blue-600 animate-spin mb-3`} />
      {message && <p className="text-sm font-medium text-slate-600 animate-pulse">{message}</p>}
    </div>
  );
}
