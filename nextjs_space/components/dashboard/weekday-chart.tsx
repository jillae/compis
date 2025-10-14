
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
  Legend,
} from 'recharts';
import { translations, chartColors, formatters } from '@/lib/translations';

interface WeekdayChartProps {
  data: Array<{
    day: string;
    bookings: number;
    revenue: number;
  }>;
}

export function WeekdayChart({ data }: WeekdayChartProps) {
  // Custom tooltip with distinct colors
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.bookings }}></div>
            <span className="text-sm">{translations.charts.bookings}: <strong>{formatters.number(payload[0]?.value || 0)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.revenue }}></div>
            <span className="text-sm">{translations.charts.revenue}: <strong>{formatters.currency(payload[1]?.value || 0)}</strong></span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Veckodag Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mobile Responsive Container */}
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={300} minWidth={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis 
                dataKey="day" 
                className="text-xs" 
                tick={{ fill: 'currentColor', fontSize: 11 }}
                interval={0}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor', fontSize: 11 }}
                tickFormatter={formatters.compact}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                iconType="circle"
              />
              {/* DISTINCT COLORS: Orange for bookings, Green for revenue */}
              <Bar 
                dataKey="bookings" 
                fill={chartColors.bookings} 
                radius={[4, 4, 0, 0]} 
                name={translations.charts.bookings}
              />
              <Bar 
                dataKey="revenue" 
                fill={chartColors.revenue} 
                radius={[4, 4, 0, 0]} 
                name={translations.charts.revenueKr}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
