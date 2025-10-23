
'use client';

import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface HealthScoreChartProps {
  excellent: number;
  healthy: number;
  atRisk: number;
  critical: number;
}

export function HealthScoreChart({ excellent, healthy, atRisk, critical }: HealthScoreChartProps) {
  const data = {
    labels: ['Excellent (76-100)', 'Healthy (51-75)', 'At Risk (26-50)', 'Critical (0-25)'],
    datasets: [
      {
        data: [excellent, healthy, atRisk, critical],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // green-500
          'rgba(59, 130, 246, 0.8)',  // blue-500
          'rgba(251, 146, 60, 0.8)',  // orange-500
          'rgba(239, 68, 68, 0.8)',   // red-500
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(251, 146, 60)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: ${value} customers (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-[300px] flex items-center justify-center">
      <Pie data={data} options={options} />
    </div>
  );
}
