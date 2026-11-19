import React, { useState, useEffect } from 'react';
import { AlertTriangle, UserCheck, ShieldAlert, LogOut } from 'lucide-react';
import {
  isDemoModeEnabled,
  getDemoRole,
  switchDemoRole,
  clearDemoRole,
  DEMO_ROLES,
} from '../services/demoAuth';

export default function DemoBanner() {
  const [currentDemoRole, setCurrentDemoRole] = useState(getDemoRole());

  useEffect(() => {
    // If demo mode is disabled, do nothing
    if (!isDemoModeEnabled()) return;

    const handleRoleChange = () => {
      setCurrentDemoRole(getDemoRole());
    };

    window.addEventListener('auth:role-changed', handleRoleChange);
    return () => {
      window.removeEventListener('auth:role-changed', handleRoleChange);
    };
  }, []);

  // Strict Gating: If demo mode is disabled or no demo persona is active, render NOTHING
  if (!isDemoModeEnabled() || !currentDemoRole) {
    return null;
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case DEMO_ROLES.ADMIN:
        return 'Administrator';
      case DEMO_ROLES.WORKER:
        return 'Field Worker';
      default:
        return 'Citizen';
    }
  };

  return (
    <aside
      aria-label="Demo Mode Indicator"
      className="bg-amber-400 text-amber-950 px-4 py-2 text-xs font-semibold border-b border-amber-500 shadow-xs relative z-50 animate-fadeIn"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-amber-900 text-amber-100 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3 text-amber-300" />
            DEMO MODE
          </span>
          <span className="font-bold text-amber-950">
            Active Persona: <span className="underline">{getRoleLabel(currentDemoRole)}</span>
          </span>
          <span className="hidden md:inline text-amber-800">
            (Simulating role permissions for capstone evaluation)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-amber-900 hidden sm:inline">Switch Persona:</span>
          <div className="inline-flex rounded-lg shadow-2xs bg-amber-300/80 p-0.5">
            {[
              { role: DEMO_ROLES.CITIZEN, label: 'Citizen' },
              { role: DEMO_ROLES.WORKER, label: 'Worker' },
              { role: DEMO_ROLES.ADMIN, label: 'Admin' },
            ].map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => switchDemoRole(item.role)}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  currentDemoRole === item.role
                    ? 'bg-amber-950 text-amber-100 shadow-xs'
                    : 'text-amber-900 hover:bg-amber-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={clearDemoRole}
            className="inline-flex items-center gap-1 ml-2 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-amber-950 hover:text-white transition-colors text-[11px] font-bold cursor-pointer"
            title="Exit Demo Persona"
          >
            <LogOut className="w-3 h-3" />
            Exit Demo
          </button>
        </div>
      </div>
    </aside>
  );
}
