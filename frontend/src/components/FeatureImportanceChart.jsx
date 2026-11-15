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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function FeatureImportanceChart({ attributions }) {
  if (!attributions || attributions.length === 0) return null;

  // Sort by raw SHAP value or preserve order
  const labels = attributions.map((item) => `${item.name} (${item.feature})`);
  const values = attributions.map((item) => item.shap_value);
  const backgroundColors = attributions.map((item) =>
    item.direction === 'positive' ? 'rgba(239, 68, 68, 0.85)' : 'rgba(13, 148, 136, 0.85)'
  );
  const borderColors = attributions.map((item) =>
    item.direction === 'positive' ? '#DC2626' : '#0F766E'
  );

  const data = {
    labels,
    datasets: [
      {
        label: 'SHAP Contribution (µg/m³)',
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.x;
            const dir = val >= 0 ? 'Increases PM2.5' : 'Decreases PM2.5';
            return ` ${val > 0 ? '+' : ''}${val.toFixed(2)} µg/m³ (${dir})`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'SHAP Value / Impact on PM2.5 (µg/m³)',
        },
        grid: { color: '#E2E8F0' },
      },
      y: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="h-72 w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
