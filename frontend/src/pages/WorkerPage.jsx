import React, { useState, useEffect } from 'react';
import { HardHat, ClipboardList, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { isDemoModeEnabled } from '../services/demoAuth';

export default function WorkerPage() {
  const [tasks, setTasks] = useState([]);
  const [advisories, setAdvisories] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWorkerData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/worker/field-tasks');
      const advData = await api.get('/api/worker/shift-advisories');
      setTasks(data.data?.tasks || data.tasks || []);
      setAdvisories(advData.data || advData);
    } catch (err) {
      if (isDemoModeEnabled()) {
        // Fallback for demo presentation if backend offline
        setTasks([
          {
            id: 'TASK-101',
            title: 'Anand Vihar Mobile Sensor Calibration',
            priority: 'High',
            location: 'Anand Vihar, New Delhi (28.6469, 77.3160)',
            air_quality_window: 'Schedule during peak dispersion (12:00 - 15:00)',
            mandatory_ppe: 'N95 / FFP2 mask mandatory during prolonged outdoor exposure',
            status: 'In Progress',
          },
          {
            id: 'TASK-102',
            title: 'Gurugram Cyber City Road Dust Suppression Verification',
            priority: 'Medium',
            location: 'Cyber City, Gurugram (28.4900, 77.0900)',
            air_quality_window: 'Early morning audit (07:00 - 09:00)',
            mandatory_ppe: 'Safety goggles and N95 respirator',
            status: 'Pending',
          },
        ]);
        setAdvisories({
          shift_recommendations: {
            heavy_exertion_max_hours: 4,
            mandatory_hydration_rest_minutes: 15,
            respirator_fit_test: 'Required prior to field deployment',
          },
          advisory_notes:
            'Field workers with respiratory conditions must report to site coordinator if particulate levels exceed 150 µg/m³.',
        });
      } else {
        setError(err.message || 'Failed to load worker tasks');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 rounded-full">
            Field Operations
          </span>
          <span className="text-xs text-slate-500 font-medium">RBAC Role: Field Personnel</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-2">Field Worker Task Board & Safety Advisories</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Targeted outdoor operation windows, PPE requirements, and personal exposure duration limits.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {advisories && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Shift Safety Rules</span>
          </div>
          <p className="text-xs text-amber-800 mb-3">{advisories.advisory_notes}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-white/80 border border-amber-200">
              <span className="font-semibold block text-slate-700">Max Exertion Time:</span>
              <strong className="text-amber-950">
                {advisories.shift_recommendations?.heavy_exertion_max_hours || 4} Hours Max
              </strong>
            </div>
            <div className="p-2.5 rounded-lg bg-white/80 border border-amber-200">
              <span className="font-semibold block text-slate-700">Rest / Hydration:</span>
              <strong className="text-amber-950">
                {advisories.shift_recommendations?.mandatory_hydration_rest_minutes || 15} Mins / Cycle
              </strong>
            </div>
            <div className="p-2.5 rounded-lg bg-white/80 border border-amber-200">
              <span className="font-semibold block text-slate-700">Respirator Fit Check:</span>
              <strong className="text-amber-950">Mandatory Daily</strong>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-600" />
          Assigned Tasks & Optimal Weather Windows
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((t) => (
            <div key={t.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-400">{t.id}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    t.priority === 'High'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {t.priority} Priority
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">{t.title}</h4>
              <p className="text-xs text-slate-500 font-mono">{t.location}</p>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="text-indigo-700 font-semibold">
                  <span>Target Window: </span>
                  <span className="text-slate-800 font-normal">{t.air_quality_window}</span>
                </div>
                <div className="text-rose-700 font-semibold">
                  <span>PPE Requirement: </span>
                  <span className="text-slate-800 font-normal">{t.mandatory_ppe}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
