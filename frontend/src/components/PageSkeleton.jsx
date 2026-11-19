import React from 'react';

/**
 * Accessible, responsive skeleton loading states for all data pages.
 * Supports variants: 'dashboard', 'assessment', 'table', 'form', 'generic'.
 */
export default function PageSkeleton({ variant = 'generic', className = '' }) {
  if (variant === 'dashboard') {
    return (
      <div
        className={`space-y-6 animate-pulse ${className}`}
        role="status"
        aria-label="Loading dashboard telemetry"
        aria-busy="true"
      >
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <h1 className="sr-only">System & Model Dashboard Telemetry Loading</h1>
            <div className="h-7 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
          </div>
          <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800"></div>
              </div>
              <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
            </div>
          ))}
        </div>

        {/* 2 Chart Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-64 bg-slate-100 dark:bg-slate-800/40 rounded-xl"></div>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-64 bg-slate-100 dark:bg-slate-800/40 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'assessment' || variant === 'card') {
    return (
      <div
        className={`space-y-6 animate-pulse ${className}`}
        role="status"
        aria-label="Loading air quality assessment"
        aria-busy="true"
      >
        {/* Banner Skeleton */}
        <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl"></div>

        {/* Hero Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-8 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            </div>
            <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-48 bg-slate-100 dark:bg-slate-800/40 rounded-xl"></div>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-48 bg-slate-100 dark:bg-slate-800/40 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div
        className={`space-y-4 animate-pulse ${className}`}
        role="status"
        aria-label="Loading records"
        aria-busy="true"
      >
        <div className="h-10 w-full max-w-sm bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
                </div>
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                <div className="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default / generic variant
  return (
    <div
      className={`space-y-4 animate-pulse ${className}`}
      role="status"
      aria-label="Loading content"
      aria-busy="true"
    >
      <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 mt-6">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-36 bg-slate-100 dark:bg-slate-800/40 rounded-xl"></div>
        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/40 rounded"></div>
      </div>
    </div>
  );
}
