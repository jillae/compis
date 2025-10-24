
/**
 * Forecast Chart Component
 * Displays historical data + forward-looking predictions with scenarios
 */

'use client';

import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface ForecastChartProps {
  historical: Array<{ date: string; amount: number }>;
  forecast: Array<{
    dateStr: string;
    optimistic: number;
    realistic: number;
    conservative: number;
    confidence: number;
  }>;
  viewMode: 'historical' | 'forecast' | 'both';
}

export function ForecastChart({ historical, forecast, viewMode }: ForecastChartProps) {
  // Combine historical and forecast data
  const chartData = [
    ...historical.map(d => ({
      date: d.date,
      actual: d.amount,
      type: 'historical',
    })),
    ...forecast.map(d => ({
      date: d.dateStr,
      optimistic: d.optimistic,
      realistic: d.realistic,
      conservative: d.conservative,
      type: 'forecast',
    })),
  ];

  // Find today's date for reference line
  const today = format(new Date(), 'yyyy-MM-dd');

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isHistorical = data.type === 'historical';

      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="text-sm font-semibold mb-2">
            {format(parseISO(data.date), 'MMM dd, yyyy')}
          </p>
          {isHistorical ? (
            <p className="text-sm">
              <span className="font-medium">Faktiskt:</span>{' '}
              {data.actual.toLocaleString('sv-SE')} kr
            </p>
          ) : (
            <>
              <p className="text-sm text-green-600">
                <span className="font-medium">Optimistisk:</span>{' '}
                {data.optimistic.toLocaleString('sv-SE')} kr
              </p>
              <p className="text-sm text-blue-600">
                <span className="font-medium">Realistisk:</span>{' '}
                {data.realistic.toLocaleString('sv-SE')} kr
              </p>
              <p className="text-sm text-orange-600">
                <span className="font-medium">Konservativ:</span>{' '}
                {data.conservative.toLocaleString('sv-SE')} kr
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
        />
        <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />

        {/* Vertical line for "today" */}
        <ReferenceLine
          x={today}
          stroke="#94a3b8"
          strokeDasharray="3 3"
          label={{ value: 'Idag', position: 'top' }}
        />

        {/* Historical line (solid, blue) */}
        {(viewMode === 'historical' || viewMode === 'both') && (
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            name="Historisk"
            connectNulls
          />
        )}

        {/* Forecast scenarios */}
        {(viewMode === 'forecast' || viewMode === 'both') && (
          <>
            {/* Optimistic scenario (green, dashed) */}
            <Line
              type="monotone"
              dataKey="optimistic"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Optimistisk"
              connectNulls
            />

            {/* Realistic scenario (blue, dashed) */}
            <Line
              type="monotone"
              dataKey="realistic"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Realistisk"
              connectNulls
            />

            {/* Conservative scenario (orange, dashed) */}
            <Line
              type="monotone"
              dataKey="conservative"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Konservativ"
              connectNulls
            />

            {/* Shaded area between optimistic and conservative */}
            <Area
              type="monotone"
              dataKey="optimistic"
              stroke="none"
              fill="#10b981"
              fillOpacity={0.1}
            />
            <Area
              type="monotone"
              dataKey="conservative"
              stroke="none"
              fill="#f59e0b"
              fillOpacity={0.1}
            />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
