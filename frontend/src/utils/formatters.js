/**
 * Formatting and visual style helpers
 */

export const CPCB_BAND_STYLES = {
  'Good': {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800',
    hex: '#10B981',
  },
  'Satisfactory': {
    bg: 'bg-lime-50',
    border: 'border-lime-200',
    text: 'text-lime-700',
    badge: 'bg-lime-100 text-lime-800',
    hex: '#84CC16',
  },
  'Moderate': {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800',
    hex: '#F59E0B',
  },
  'Poor': {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-800',
    hex: '#F97316',
  },
  'Very Poor': {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-800',
    hex: '#EF4444',
  },
  'Severe': {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-800',
    hex: '#9333EA',
  },
};

export function getCPCBStyle(category) {
  return CPCB_BAND_STYLES[category] || {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    badge: 'bg-slate-100 text-slate-800',
    hex: '#64748B',
  };
}

export function formatNumber(val, decimals = 2) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return Number(val).toFixed(decimals);
}

export function formatPM25(val) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${Number(val).toFixed(2)} µg/m³`;
}
