
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CustomerDistributionChartProps {
  data: any;
  fullWidth?: boolean;
}

const COLORS = {
  FREE: '#94a3b8',
  BASIC: '#3b82f6',
  PROFESSIONAL: '#8b5cf6',
  ENTERPRISE: '#f59e0b',
  INTERNAL: '#10b981',
};

const TIER_LABELS: Record<string, string> = {
  FREE: 'Free (50 bookings)',
  BASIC: 'Basic (499 kr/mån)',
  PROFESSIONAL: 'Professional (1 499 kr/mån)',
  ENTERPRISE: 'Enterprise (2 999 kr/mån)',
  INTERNAL: 'Internal (Test)',
};

export function CustomerDistributionChart({ data, fullWidth }: CustomerDistributionChartProps) {
  if (!data?.tierDistribution) {
    return (
      <Card className={fullWidth ? 'col-span-2' : ''}>
        <CardHeader>
          <CardTitle>Kundfördelning per Tier</CardTitle>
          <CardDescription>Distribution av kunder över olika prenumerationstiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Ingen data tillgänglig
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = Object.entries(data.tierDistribution)
    .filter(([_, value]: [string, any]) => value.count > 0)
    .map(([tier, value]: [string, any]) => ({
      name: TIER_LABELS[tier] || tier,
      value: value.count,
      mrr: value.mrr,
    }));

  return (
    <Card className={fullWidth ? 'col-span-2' : ''}>
      <CardHeader>
        <CardTitle>Kundfördelning per Tier</CardTitle>
        <CardDescription>Distribution av kunder över olika prenumerationstiers</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => {
                const tierKey = Object.keys(TIER_LABELS).find(
                  (key) => TIER_LABELS[key] === entry.name
                );
                return <Cell key={`cell-${index}`} fill={COLORS[tierKey as keyof typeof COLORS] || '#888888'} />;
              })}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: any, name: string, props: any) => [
                `${value} kunder (${new Intl.NumberFormat('sv-SE', {
                  style: 'currency',
                  currency: 'SEK',
                  minimumFractionDigits: 0,
                }).format(props.payload.mrr)} MRR)`,
                name,
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Totalt Kunder</p>
            <p className="text-2xl font-bold">{data.totalCustomers}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total MRR</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('sv-SE', {
                style: 'currency',
                currency: 'SEK',
                minimumFractionDigits: 0,
              }).format(data.totalMrr)}
            </p>
          </div>
          <div className="space-y-1 col-span-2">
            <p className="text-sm text-muted-foreground">Genomsnittlig intäkt per kund (ARPC)</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('sv-SE', {
                style: 'currency',
                currency: 'SEK',
                minimumFractionDigits: 0,
              }).format(data.avgRevenuePerCustomer)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
