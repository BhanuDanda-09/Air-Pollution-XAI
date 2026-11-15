import React, { useState } from 'react';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function PerformanceChart({ models = [] }) {
  const [activeMetric, setActiveMetric] = useState('r2');

  const available = models.filter((m) => m.available && m.test_metrics);
  if (available.length === 0) return null;

  const labels = available.map((m) => m.display_name);

  const metricConfigs = {
    r2: {
      title: 'R² Score (Higher is Better)',
      unit: '',
      color: 'rgba(37, 99, 235, 0.85)',
      borderColor: '#1D4ED8',
      extractor: (m) => m.test_metrics.r2,
    },
    rmse: {
      title: 'Root Mean Squared Error (Lower is Better)',
      unit: ' µg/m³',
      color: 'rgba(245, 158, 11, 0.85)',
      borderColor: '#D97706',
      extractor: (m) => m.test_metrics.rmse,
    },
    mae: {
      title: 'Mean Absolute Error (Lower is Better)',
      unit: ' µg/m³',
      color: 'rgba(13, 148, 136, 0.85)',
      borderColor: '#0F766E',
      extractor: (m) => m.test_metrics.mae,
    },
  };

  const currentConfig = metricConfigs[activeMetric];

  const data = {
    labels,
    datasets: [
      {
        label: currentConfig.title,
        data: available.map(currentConfig.extractor),
        backgroundColor: currentConfig.color,
        borderColor: currentConfig.borderColor,
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y.toFixed(4)}${currentConfig.unit}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: currentConfig.title },
        grid: { color: '#E2E8F0' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="space-y-4">
      {/* Metric Selector Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveMetric('r2')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeMetric === 'r2'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          R² Score
        </button>
        <button
          onClick={() => setActiveMetric('rmse')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeMetric === 'rmse'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          RMSE
        </button>
        <button
          onClick={() => setActiveMetric('mae')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeMetric === 'mae'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          MAE
        </button>
      </div>

      <div className="h-64 w-full">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
