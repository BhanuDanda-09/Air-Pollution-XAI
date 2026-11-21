import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getCPCBStyle, formatNumber } from '../utils/formatters';
import { Trophy, CheckCircle2, AlertCircle, BarChart2, ShieldAlert } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ModelComparison({ comparisonData }) {
  if (!comparisonData || !comparisonData.predictions) return null;

  const { predictions, best_model, comparison_summary, has_partial_failures } = comparisonData;

  const modelKeys = Object.keys(predictions);
  const availableKeys = modelKeys.filter(
    (k) => predictions[k].pm25 !== null && predictions[k].pm25 !== undefined
  );
  const labels = availableKeys.map((k) => predictions[k].display_name || k);
  const pm25Values = availableKeys.map((k) => predictions[k].pm25);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Predicted PM2.5 (µg/m³)',
        data: pm25Values,
        backgroundColor: availableKeys.map((k) =>
          k === best_model ? 'rgba(37, 99, 235, 0.85)' : 'rgba(100, 116, 139, 0.65)'
        ),
        borderColor: availableKeys.map((k) =>
          k === best_model ? '#1D4ED8' : '#475569'
        ),
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.parsed.y.toFixed(2)} µg/m³`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'PM2.5 (µg/m³)' },
        grid: { color: '#E2E8F0' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Multi-Model Analysis</span>
          <h3 className="text-xl font-bold text-navy-800 mt-0.5">Model Predictions & Benchmarks</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Top Held-out Architecture: Gradient Boosted Trees</span>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {modelKeys.map((key) => {
          const item = predictions[key];
          const isBest = key === best_model;
          const cpcbStyle = getCPCBStyle(item.cpcb_category);

          return (
            <div
              key={key}
              className={`rounded-2xl p-5 border transition-all ${
                isBest
                  ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500">{item.paradigm}</span>
                {isBest && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                    Best Test R²
                  </span>
                )}
              </div>

              <h4 className="text-base font-bold text-navy-800">{item.display_name}</h4>

              {/* Prediction */}
              <div className="my-3 py-2 px-3 rounded-xl bg-white border border-slate-200/80">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Input Prediction</div>
                {item.pm25 !== null && item.pm25 !== undefined ? (
                  <>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-2xl font-black text-navy-800">{item.pm25}</span>
                      <span className="text-xs text-slate-500">µg/m³</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${cpcbStyle.badge}`}>
                        {item.cpcb_category}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="py-1">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{item.status === 'unavailable' ? 'Live Inference Offline' : 'Inference Blocked'}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                      {item.error || 'Live inference temporarily unavailable. Showing verified generalization benchmark below.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Held-out test metrics */}
              <div className="space-y-1.5 text-xs">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Held-Out Test Benchmark</div>
                <div className="flex justify-between text-slate-600">
                  <span>Test R² Score:</span>
                  <span className="font-bold text-slate-800">{formatNumber(item.test_benchmark?.r2, 4)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Test RMSE:</span>
                  <span className="font-bold text-slate-800">{formatNumber(item.test_benchmark?.rmse, 2)} µg/m³</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Test MAE:</span>
                  <span className="font-bold text-slate-800">{formatNumber(item.test_benchmark?.mae, 2)} µg/m³</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart: Comparative Predictions */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <BarChart2 className="w-4 h-4 text-blue-600" />
          <span>Comparative Predicted Concentration for Current Input</span>
        </h4>
        <div className="h-64">
          {availableKeys.length > 0 ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No live model predictions available for the chart. Precomputed held-out benchmarks are shown above.
            </div>
          )}
        </div>
      </div>

      {/* Summary Note & Scientific Distinction */}
      <div className="bg-slate-100/80 rounded-xl p-4 text-xs text-slate-600 space-y-2">
        <p>
          <strong>Benchmark Note:</strong> {comparison_summary}
        </p>
        <p className="text-slate-500 italic">
          <strong>Scientific Guidance:</strong> Model accuracy is determined by generalization on the 406 held-out test observations. 
          A model producing a lower prediction on a single input does not indicate higher accuracy for that specific instance.
        </p>
      </div>
    </div>
  );
}
