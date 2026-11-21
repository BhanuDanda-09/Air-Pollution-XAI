import React from 'react';
import {
  FileText,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Building,
} from 'lucide-react';
import usePageMeta from '../hooks/usePageMeta';

export default function TermsPage() {
  usePageMeta('/terms');

  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
          <Scale className="w-3.5 h-3.5" />
          <span>Legal & Transparency</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Effective Date: November 2026 • Platform: AirIQ India
        </p>
      </div>

      {/* Crucial Advisory Notice */}
      <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3.5 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
          <h4 className="font-bold">Medical and Statutory Notice</h4>
          <p>
            AirIQ India provides environmental risk estimates and comparative insights for public awareness and lifestyle planning. Our metrics do not constitute official statutory regulatory measurements or individual clinical medical advice. If you have asthma, COPD, cardiovascular conditions, or pregnancy complications, always consult your physician for clinical care.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using AirIQ India (the "Platform", accessible at air-pollution-xai.vercel.app), you agree to be bound by these Terms of Service. If you do not agree to all provisions, you may discontinue use of the platform.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            2. Scope of Service & Gridded Estimates
          </h2>
          <p>
            AirIQ India aggregates atmospheric telemetry from Open-Meteo, the European Copernicus Atmosphere Monitoring Service (CAMS), and ground validation data from the Central Pollution Control Board (CPCB).
          </p>
          <p>
            <strong>Village and Rural Disclosures:</strong> For locations located beyond 50 km from physical continuous ambient monitoring stations, values are synthesized using gridded numerical models (~11 km grid cells). These are regional estimates rather than point physical measurements.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            3. User Accounts & Health Profiles
          </h2>
          <p>
            You may optionally register an account to save favorite locations, configure custom PM2.5 alerts, and personalize health vulnerability thresholds.
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400">
            <li>You are responsible for safeguarding your login credentials.</li>
            <li>Providing health attributes (asthma, pregnancy, heart conditions) is completely voluntary.</li>
            <li>In compliance with the Digital Personal Data Protection (DPDP) Act 2023, you retain full ownership of your data and may permanently delete your profile at any time.</li>
          </ul>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            4. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by applicable Indian law, AirIQ India and its contributors shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from relocation decisions, lifestyle changes, or outdoor activities undertaken based on platform estimates.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            5. Governing Law
          </h2>
          <p>
            These terms are governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of or related to the platform shall be subject to the exclusive jurisdiction of the competent courts in India.
          </p>
        </div>
      </div>
    </div>
  );
}
