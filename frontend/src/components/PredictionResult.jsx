import React from 'react';
import { getCPCBStyle, formatPM25 } from '../utils/formatters';
import { Activity, ShieldAlert, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PredictionResult({ result, features, selectedModel }) {
  if (!result) return null;

  const { prediction, cpcb_category, model_name, paradigm, scientific_disclaimer } = result;
  const pm25Val = prediction?.pm25;
  const categoryName = cpcb_category?.category || 'Moderate';
  const cpcbStyle = getCPCBStyle(categoryName);

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
      {/* Top Banner with Category */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inference Output</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-600">{model_name || selectedModel}</span>
          </div>
          <h3 className="text-xl font-bold text-navy-800 mt-0.5">PM2.5 Prediction Result</h3>
        </div>

        {/* CPCB Indicative Category Badge */}
        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${cpcbStyle.bg} ${cpcbStyle.border}`}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cpcbStyle.hex }} />
          <div className="text-left">
            <div className={`text-xs font-bold uppercase tracking-wider ${cpcbStyle.text}`}>
              {categoryName}
            </div>
            <div className="text-[10px] text-slate-500">Indicative CPCB Band</div>
          </div>
        </div>
      </div>

      {/* Main Metric Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-navy-800 rounded-2xl p-6 text-white flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-teal-300">
              Estimated 24-hr Concentration
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-200">
              {paradigm || 'Machine Learning'}
            </span>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-white">
                {pm25Val !== undefined ? Number(pm25Val).toFixed(2) : '—'}
              </span>
              <span className="text-lg font-semibold text-slate-300">µg/m³</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Fine particulate matter aerodynamic diameter ≤ 2.5 µm</p>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span>Health Advisory: {cpcb_category?.health_statement || 'Standard advisory'}</span>
          </div>
        </div>

        {/* Model & CPCB Details Card */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classification Guide</span>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-600">Model Used:</span>
                <span className="font-semibold text-navy-800">{model_name || selectedModel}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-600">Health Band:</span>
                <span className={`font-bold ${cpcbStyle.text}`}>{categoryName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Official AQI:</span>
                <span className="font-medium text-slate-500">No (Indicative Band)</span>
              </div>
            </div>
          </div>

          <Link
            to="/explainability"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Explain with SHAP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Submitted Feature Echo */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Input Echo</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {features &&
            Object.entries(features).map(([k, v]) => (
              <div key={k} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] font-semibold text-slate-400">{k}</div>
                <div className="text-sm font-bold text-slate-800">{v}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Scientific Disclaimer Alert */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-amber-900 text-xs flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Regulatory Disclaimer:</strong> {cpcb_category?.disclaimer || scientific_disclaimer}
        </p>
      </div>
    </div>
  );
}
