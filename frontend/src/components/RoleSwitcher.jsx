import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, HardHat, ChevronDown } from 'lucide-react';
import {
  isDemoModeEnabled,
  getDemoRole,
  switchDemoRole,
  DEMO_ROLES,
} from '../services/demoAuth';

export default function RoleSwitcher() {
  const [activeRole, setActiveRole] = useState(getDemoRole() || DEMO_ROLES.CITIZEN);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isDemoModeEnabled()) return;

    const handleRoleChange = () => {
      setActiveRole(getDemoRole() || DEMO_ROLES.CITIZEN);
    };

    window.addEventListener('auth:role-changed', handleRoleChange);
    return () => {
      window.removeEventListener('auth:role-changed', handleRoleChange);
    };
  }, []);

  // Strict Gating: If demo mode is disabled, render NOTHING
  if (!isDemoModeEnabled()) {
    return null;
  }

  const roleConfig = {
    [DEMO_ROLES.CITIZEN]: {
      label: 'Citizen',
      icon: UserCheck,
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    [DEMO_ROLES.WORKER]: {
      label: 'Worker',
      icon: HardHat,
      color: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    [DEMO_ROLES.ADMIN]: {
      label: 'Admin',
      icon: Shield,
      color: 'bg-purple-100 text-purple-800 border-purple-300',
    },
  };

  const current = roleConfig[activeRole] || roleConfig[DEMO_ROLES.CITIZEN];
  const CurrentIcon = current.icon;

  const handleSelectRole = (r) => {
    switchDemoRole(r);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${current.color}`}
        title="Switch Evaluator Demo Persona"
      >
        <CurrentIcon className="w-3.5 h-3.5" />
        <span>Demo: {current.label}</span>
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            Select Demo Persona
          </div>
          {Object.entries(roleConfig).map(([key, config]) => {
            const Icon = config.icon;
            const isSelected = activeRole === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectRole(key)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 cursor-pointer ${
                  isSelected ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-slate-500" />
                <div className="flex-1">
                  <div>{config.label}</div>
                  <div className="text-[10px] text-slate-400">
                    {key === 'admin'
                      ? 'Admin tools & diagnostics'
                      : key === 'worker'
                      ? 'Field worker tasks & PPE'
                      : 'Standard public view'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
