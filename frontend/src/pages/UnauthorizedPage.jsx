import React from 'react';
import { ShieldAlert, ArrowLeft, HardHat, Shield, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  isDemoModeEnabled,
  getActiveRole,
  switchDemoRole,
  DEMO_ROLES,
} from '../services/demoAuth';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const activeRole = getActiveRole();
  const demoEnabled = isDemoModeEnabled();

  const handleSwitchAndGo = (targetRole, targetPath) => {
    if (switchDemoRole(targetRole)) {
      navigate(targetPath);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm max-w-lg w-full text-center space-y-6">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            HTTP 403 Forbidden
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Access Restricted</h1>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Your current account role (<strong className="capitalize">{activeRole}</strong>) does not have authorization to view this protected resource.
          </p>
        </div>

        {/* DEMO-GATED ONE-CLICK SWITCHER: Only visible when VITE_ENABLE_DEMO_MODE === 'true' */}
        {demoEnabled && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Capstone Evaluator Demo Controls</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              In demo mode, you can immediately elevate your persona to test protected routes:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleSwitchAndGo(DEMO_ROLES.WORKER, '/worker')}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <HardHat className="w-3.5 h-3.5" />
                Switch to Worker
              </button>

              <button
                type="button"
                onClick={() => handleSwitchAndGo(DEMO_ROLES.ADMIN, '/admin')}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                Switch to Admin
              </button>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}
