import React from 'react';
import FeatureImportanceChart from './FeatureImportanceChart';
import { Sparkles, TrendingUp, TrendingDown, ShieldAlert, Info, Layers } from 'lucide-react';

export default function SHAPExplanation({ explanationData }) {
  if (!explanationData) return null;

  const {
    model_name,
    explainer_type,
    base_value,
    predicted_value,
    attributions,
    ranked_importance,
    dominant_feature,
    scientific_disclaimer,
  } = explanationData;

  const netImpact = predicted_value - base_value;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weather Factor Analysis</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Verified Factors
            </span>
          </div>
          <h3 className="text-xl font-bold text-navy-800 mt-1">What's Affecting Your Air Quality</h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500">Explaining Model:</span>
          <div className="text-sm font-bold text-navy-800">{model_name}</div>
        </div>
      </div>

      {/* Tri-Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Base Value */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Base Expected Value</span>
            <Info className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-black text-slate-800">{base_value}</span>
            <span className="text-xs text-slate-500">µg/m³</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Expected baseline under model training distribution</p>
        </div>

        {/* Net SHAP Shift */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Net Feature Shift</span>
            {netImpact >= 0 ? (
              <TrendingUp className="w-4 h-4 text-rose-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-teal-500" />
            )}
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className={`text-2xl font-black ${netImpact >= 0 ? 'text-rose-600' : 'text-teal-600'}`}>
              {netImpact >= 0 ? `+${netImpact.toFixed(2)}` : netImpact.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500">µg/m³</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total departure from model baseline</p>
        </div>

        {/* Final Predicted Output */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-navy-800 to-blue-900 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-teal-300">Final Predicted Value</span>
            <Sparkles className="w-4 h-4 text-teal-300" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-black text-white">{predicted_value}</span>
            <span className="text-xs text-slate-300">µg/m³</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1">Base baseline + combined weather factor impacts</p>
        </div>
      </div>

      {/* SHAP Horizontal Contribution Chart */}
      <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-navy-800">Feature Contribution Breakdown</h4>
            <p className="text-xs text-slate-500">
              Red bars increase predicted PM2.5 above baseline; green bars decrease predicted PM2.5.
            </p>
          </div>
          {dominant_feature && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 self-start sm:self-auto">
              Dominant Factor: {dominant_feature}
            </span>
          )}
        </div>

        <FeatureImportanceChart attributions={ranked_importance || attributions} />
      </div>

      {/* Detailed Attributions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <th className="py-2.5 px-3">Feature</th>
              <th className="py-2.5 px-3">Input Value</th>
              <th className="py-2.5 px-3">Impact Value</th>
              <th className="py-2.5 px-3">Direction</th>
              <th className="py-2.5 px-3">Impact Explanation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(ranked_importance || attributions).map((item) => {
              const isPositive = item.direction === 'positive';
              return (
                <tr key={item.feature} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {item.name} <span className="text-slate-400 font-normal">({item.feature})</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-mono">
                    {item.value} {item.unit}
                  </td>
                  <td className={`py-2.5 px-3 font-mono font-bold ${isPositive ? 'text-rose-600' : 'text-teal-600'}`}>
                    {isPositive ? `+${item.shap_value}` : item.shap_value} µg/m³
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isPositive ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isPositive ? 'Increases PM2.5' : 'Decreases PM2.5'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{item.impact}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Scientific Disclaimer */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-amber-900 text-xs flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Scientific Disclaimer on Causality:</strong> {scientific_disclaimer}
        </p>
      </div>
    </div>
  );
}
