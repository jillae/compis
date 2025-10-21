
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';

interface MRRChartProps {
  data: any[];
}

export function MRRChart({ data }: MRRChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MRR Growth Trend</CardTitle>
          <CardDescription>Monthly Recurring Revenue över tid</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Ingen data tillgänglig
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    month: format(parseISO(item.date), 'MMM yyyy', { locale: sv }),
    mrr: Number(item.mrr),
    arr: Number(item.arr) / 12, // Show monthly equivalent
    customers: item.activeCustomers,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>MRR Growth Trend</CardTitle>
        <CardDescription>Monthly Recurring Revenue över tid</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) =>
                new Intl.NumberFormat('sv-SE', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: any, name: string) => [
                new Intl.NumberFormat('sv-SE', {
                  style: 'currency',
                  currency: 'SEK',
                  minimumFractionDigits: 0,
                }).format(value),
                name === 'mrr' ? 'MRR' : name === 'arr' ? 'ARR/12' : 'Kunder',
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="mrr"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              name="MRR"
            />
            <Line
              type="monotone"
              dataKey="arr"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
              name="ARR/12"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Senaste MRR</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('sv-SE', {
                style: 'currency',
                currency: 'SEK',
                minimumFractionDigits: 0,
              }).format(chartData[chartData.length - 1].mrr)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Tillväxt (YTD)</p>
            <p className="text-2xl font-bold text-green-600">
              {data.length > 1
                ? `+${(
                    ((data[data.length - 1].mrr - data[0].mrr) / data[0].mrr) *
                    100
                  ).toFixed(1)}%`
                : 'N/A'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
