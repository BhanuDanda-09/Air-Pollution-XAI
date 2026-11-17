import React from 'react';
import {
  Heart,
  Baby,
  User,
  Shield,
  Stethoscope,
  Briefcase,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

const DEFAULT_PROFILE = {
  age_group: 'adult', // 'child' | 'adult' | 'senior'
  asthma: false,
  has_heart_condition: false,
  is_pregnant: false,
  is_outdoor_worker: false,
};

export default function HealthProfileSelector({ value = DEFAULT_PROFILE, onChange }) {
  const profile = { ...DEFAULT_PROFILE, ...value };

  // Calculate local sensitivity shift for immediate UI feedback
  const calculateShift = () => {
    let total = 0;
    if (profile.age_group === 'child') total += 8;
    if (profile.age_group === 'senior') total += 8;
    if (profile.asthma) total += 10;
    if (profile.has_heart_condition) total += 10;
    if (profile.is_pregnant) total += 10;
    if (profile.is_outdoor_worker) total += 8;
    return Math.min(total, 25);
  };

  const totalShift = calculateShift();

  const handleAgeChange = (age) => {
    if (onChange) {
      onChange({ ...profile, age_group: age });
    }
  };

  const handleToggle = (key) => {
    if (onChange) {
      onChange({ ...profile, [key]: !profile[key] });
    }
  };

  const handleReset = () => {
    if (onChange) {
      onChange(DEFAULT_PROFILE);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-rose-500" />
              Personalized Health Risk Profile
            </h3>
            {totalShift > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                +{totalShift} pts sensitivity shift
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tightens exposure thresholds to trigger earlier protective advisories for vulnerable individuals.
          </p>
        </div>

        {totalShift > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset to Standard
          </button>
        )}
      </div>

      {/* 1. Age Group Selector */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Age Category
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'child', label: 'Child (<18)', icon: Baby, desc: 'Developing respiratory tract' },
            { key: 'adult', label: 'Adult (18-64)', icon: User, desc: 'Standard baseline tolerance' },
            { key: 'senior', label: 'Senior (65+)', icon: Shield, desc: 'Elevated cardiopulmonary risk' },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = profile.age_group === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleAgeChange(item.key)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.key !== 'adult' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      +8 pts
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs">{item.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Medical & Exposure Conditions */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Health & Occupational Factors
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Asthma / Respiratory */}
          <button
            type="button"
            onClick={() => handleToggle('asthma')}
            className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
              profile.asthma
                ? 'border-rose-500 bg-rose-50/60 shadow-xs ring-1 ring-rose-500 text-rose-950'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
            }`}
          >
            <input
              type="checkbox"
              checked={profile.asthma}
              onChange={() => {}} // handled by parent button
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Asthma / Respiratory Condition</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                  +10 pts
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                COPD, chronic bronchitis, reactive airway disease, or dust allergies
              </p>
            </div>
          </button>

          {/* Heart Condition */}
          <button
            type="button"
            onClick={() => handleToggle('has_heart_condition')}
            className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
              profile.has_heart_condition
                ? 'border-rose-500 bg-rose-50/60 shadow-xs ring-1 ring-rose-500 text-rose-950'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
            }`}
          >
            <input
              type="checkbox"
              checked={profile.has_heart_condition}
              onChange={() => {}}
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Cardiovascular / Heart Condition</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                  +10 pts
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Hypertension, coronary disease, post-angioplasty, or heart failure
              </p>
            </div>
          </button>

          {/* Pregnancy */}
          <button
            type="button"
            onClick={() => handleToggle('is_pregnant')}
            className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
              profile.is_pregnant
                ? 'border-purple-500 bg-purple-50/60 shadow-xs ring-1 ring-purple-500 text-purple-950'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
            }`}
          >
            <input
              type="checkbox"
              checked={profile.is_pregnant}
              onChange={() => {}}
              className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Pregnancy</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                  +10 pts
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Maternal particulate exposure protection for fetal growth and health
              </p>
            </div>
          </button>

          {/* Outdoor Worker */}
          <button
            type="button"
            onClick={() => handleToggle('is_outdoor_worker')}
            className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
              profile.is_outdoor_worker
                ? 'border-amber-500 bg-amber-50/60 shadow-xs ring-1 ring-amber-500 text-amber-950'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
            }`}
          >
            <input
              type="checkbox"
              checked={profile.is_outdoor_worker}
              onChange={() => {}}
              className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Outdoor Worker / Prolonged Exposure</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  +8 pts
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Delivery personnel, traffic wardens, construction workers, or marathoners
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Threshold Explanation Note */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5 leading-relaxed">
        <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Transparent Rule-Based Adjustment: </span>
          {totalShift > 0 ? (
            <span>
              Your profile tightens the livability score by{' '}
              <strong className="text-amber-700">-{totalShift} points</strong> (capped at 25).
              Ambient air quality remains unchanged, but advisories transition to more protective categories sooner.
            </span>
          ) : (
            <span>
              Standard adult baseline active. No threshold penalties applied. Check conditions above if evaluating for family members or sensitive health groups.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
