
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

interface WeekdayChartProps {
  data: Array<{
    day: string;
    bookings: number;
    revenue: number;
  }>;
}

export function WeekdayChart({ data }: WeekdayChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance by Weekday</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="day" className="text-xs" tick={{ fill: 'currentColor' }} />
            <YAxis
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: any, name: string) => {
                if (name === 'revenue') {
                  return [`${value.toLocaleString('sv-SE')} kr`, 'Revenue'];
                }
                return [value, 'Bookings'];
              }}
            />
            <Legend />
            <Bar dataKey="bookings" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Bookings" />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue (kr)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
