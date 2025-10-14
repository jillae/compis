
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { translations, chartColors, formatters } from '@/lib/translations';

interface BookingPatternChartProps {
  data: Array<{
    hour: string;
    bookings: number;
  }>;
}

export function BookingPatternChart({ data }: BookingPatternChartProps) {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">Timme: {label}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.hour }}></div>
            <span className="text-sm">{translations.charts.bookings}: <strong>{formatters.number(payload[0]?.value || 0)}</strong></span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bokningsmönster per Timme</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mobile Responsive Container */}
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={300} minWidth={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis
                dataKey="hour"
                className="text-xs"
                tick={{ fill: 'currentColor', fontSize: 11 }}
                interval={1}
              />
              <YAxis 
                className="text-xs" 
                tick={{ fill: 'currentColor', fontSize: 11 }}
                tickFormatter={formatters.number}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* DISTINCT COLOR: Pink for hourly booking pattern */}
              <Bar 
                dataKey="bookings" 
                fill={chartColors.hour} 
                radius={[4, 4, 0, 0]}
                name={translations.charts.bookings}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
