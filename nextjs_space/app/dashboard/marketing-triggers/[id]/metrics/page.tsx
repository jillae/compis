
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/back-button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Send,
  SkipForward,
  XCircle,
  Banknote,
  ArrowUpCircle,
  BarChart2,
  AlertCircle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DailyData {
  date: string;
  sent: number;
  skipped: number;
  failed: number;
  revenue: number;
}

interface RecentExecution {
  id: string;
  customerName: string;
  customerId: string;
  status: string;
  skippedReason: string | null;
  costSEK: number | null;
  revenueSEK: number | null;
  createdAt: string;
}

interface Metrics {
  sent: number;
  skipped: number;
  failed: number;
  totalCost: number;
  totalRevenue: number;
  roas: number;
  skipReasons: Record<string, number>;
  conversionRate: number;
}

interface TriggerInfo {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  channel: string;
  isActive: boolean;
  totalExecutions: number;
  successfulSends: number;
  failedSends: number;
  totalCostSEK: number;
  totalRevenueSEK: number;
  averageROAS: number | null;
}

interface MetricsData {
  metrics: Metrics;
  trigger: TriggerInfo;
  dailyData: DailyData[];
  recentExecutions: RecentExecution[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DATE_RANGES = [
  { label: '7 dagar', value: 7 },
  { label: '30 dagar', value: 30 },
  { label: '90 dagar', value: 90 },
];

const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const SKIP_REASON_LABELS: Record<string, string> = {
  cooldown: 'Cooldown',
  max_executions: 'Max utskick nått',
  opt_out: 'Avregistrerad',
  no_contact_info: 'Saknar kontaktinfo',
  daily_limit: 'Daglig gräns',
};

const STATUS_LABELS: Record<string, string> = {
  sent: 'Skickad',
  skipped: 'Hoppade över',
  failed: 'Misslyckades',
  pending: 'Väntar',
};

// ─── Helper functions ─────────────────────────────────────────────────────────

function formatSEK(amount: number | null | undefined): string {
  if (amount == null) return '-';
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'sent':
      return 'default';
    case 'skipped':
      return 'secondary';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center text-muted-foreground"
      style={{ height }}
    >
      <Skeleton className="w-full h-full rounded-md" />
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

function SummaryCard({ title, value, description, icon, highlight }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={highlight ? 'text-green-500' : 'text-muted-foreground'}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${highlight ? 'text-green-600' : ''}`}>{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TriggerMetricsPage() {
  const router = useRouter();
  const params = useParams();
  const triggerId = params?.id as string;
  const { data: session, status: authStatus } = useSession() || {};

  const [days, setDays] = useState(30);
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!triggerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/marketing-triggers/${triggerId}/metrics?days=${days}&detailed=true`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Kunde inte hämta statistik');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Okänt fel');
    } finally {
      setLoading(false);
    }
  }, [triggerId, days]);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchMetrics();
    }
  }, [fetchMetrics, authStatus]);

  // ── Loading state ──
  if (loading || authStatus === 'loading') {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <BackButton href="/dashboard/marketing-triggers" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <ChartSkeleton />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <ChartSkeleton />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <BackButton href="/dashboard/marketing-triggers" />
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            Triggerstatistik
          </h1>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <p className="text-lg font-semibold">Kunde inte ladda statistik</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button onClick={fetchMetrics}>Försök igen</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, trigger, dailyData, recentExecutions } = data;

  const totalExecutions = metrics.sent + metrics.skipped + metrics.failed;
  const successRate =
    totalExecutions > 0
      ? ((metrics.sent / totalExecutions) * 100).toFixed(1)
      : '0';
  const skipRate =
    totalExecutions > 0
      ? ((metrics.skipped / totalExecutions) * 100).toFixed(1)
      : '0';

  // Skip reasons for pie chart
  const skipReasonData = Object.entries(metrics.skipReasons).map(([key, count]) => ({
    name: SKIP_REASON_LABELS[key] || key,
    value: count,
  }));

  // Revenue trend for line chart
  const revenueTrend = dailyData.map((d) => ({
    date: formatShortDate(d.date),
    intäkter: d.revenue,
    skickade: d.sent,
  }));

  // Bar chart data (grouped by day or week if 90d)
  const barData =
    days === 90
      ? // Group into weeks for 90d view
        (() => {
          const weeks: Record<string, { label: string; skickade: number; överhoppade: number; misslyckade: number }> = {};
          dailyData.forEach((d) => {
            const date = new Date(d.date);
            const weekNum = Math.floor(
              (date.getTime() - new Date(dailyData[0].date).getTime()) /
                (7 * 24 * 60 * 60 * 1000)
            );
            const label = `V${weekNum + 1}`;
            if (!weeks[label]) {
              weeks[label] = { label, skickade: 0, överhoppade: 0, misslyckade: 0 };
            }
            weeks[label].skickade += d.sent;
            weeks[label].överhoppade += d.skipped;
            weeks[label].misslyckade += d.failed;
          });
          return Object.values(weeks);
        })()
      : dailyData.map((d) => ({
          label: formatShortDate(d.date),
          skickade: d.sent,
          överhoppade: d.skipped,
          misslyckade: d.failed,
        }));

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    color: 'hsl(var(--popover-foreground))',
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <BackButton href="/dashboard/marketing-triggers" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <BarChart2 className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              {trigger.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {trigger.description || 'Triggerstatistik och analys'}
            </p>
          </div>
        </div>
        {/* Date range filter */}
        <div className="flex items-center gap-2">
          {DATE_RANGES.map((range) => (
            <Button
              key={range.value}
              variant={days === range.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Trigger meta */}
      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant={trigger.isActive ? 'default' : 'secondary'}>
          {trigger.isActive ? 'Aktiv' : 'Pausad'}
        </Badge>
        <Badge variant="outline" className="capitalize">
          {trigger.channel === 'email' ? 'E-post' : 'SMS'}
        </Badge>
        <Badge variant="outline" className="text-xs text-muted-foreground">
          Totalt historik: {trigger.totalExecutions.toLocaleString('sv-SE')} körningar
        </Badge>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryCard
          title="Totalt körningar"
          value={totalExecutions.toLocaleString('sv-SE')}
          description={`Senaste ${days} dagar`}
          icon={<Send className="h-4 w-4" />}
        />
        <SummaryCard
          title="Framgångsgrad"
          value={`${successRate}%`}
          description={`${metrics.sent} skickade`}
          icon={<TrendingUp className="h-4 w-4" />}
          highlight={parseFloat(successRate) >= 50}
        />
        <SummaryCard
          title="Överhoppade"
          value={`${skipRate}%`}
          description={`${metrics.skipped} st`}
          icon={<SkipForward className="h-4 w-4" />}
        />
        <SummaryCard
          title="Total kostnad"
          value={formatSEK(metrics.totalCost)}
          description="Inkl. SMS/e-postkostnad"
          icon={<Banknote className="h-4 w-4" />}
        />
        <SummaryCard
          title="Total intäkt"
          value={formatSEK(metrics.totalRevenue)}
          description="Attributerad intäkt"
          icon={<ArrowUpCircle className="h-4 w-4" />}
          highlight={metrics.totalRevenue > 0}
        />
        <SummaryCard
          title="ROAS"
          value={metrics.roas > 0 ? `${metrics.roas.toFixed(2)}x` : '-'}
          description="Avkastning på annonskostnad"
          icon={<TrendingUp className="h-4 w-4" />}
          highlight={metrics.roas >= 1}
        />
      </div>

      {/* ── Charts row 1: Bar chart + Pie chart ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar chart: Executions over time */}
        <Card>
          <CardHeader>
            <CardTitle>Körningar över tid</CardTitle>
            <CardDescription>
              Daglig fördelning av skickade, överhoppade och misslyckade
            </CardDescription>
          </CardHeader>
          <CardContent>
            {barData.every(
              (d) => d.skickade === 0 && d.överhoppade === 0 && d.misslyckade === 0
            ) ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                Ingen data för vald period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    interval={days === 7 ? 0 : days === 30 ? 3 : 1}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar
                    dataKey="skickade"
                    stackId="a"
                    fill="hsl(var(--chart-1))"
                    name="Skickade"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="överhoppade"
                    stackId="a"
                    fill="hsl(var(--chart-3))"
                    name="Överhoppade"
                  />
                  <Bar
                    dataKey="misslyckade"
                    stackId="a"
                    fill="hsl(var(--chart-5))"
                    name="Misslyckade"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie chart: Skip reasons */}
        <Card>
          <CardHeader>
            <CardTitle>Anledning till överhoppning</CardTitle>
            <CardDescription>
              Fördelning av varför körningar hoppades över
            </CardDescription>
          </CardHeader>
          <CardContent>
            {skipReasonData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                {metrics.skipped === 0
                  ? 'Inga överhoppade körningar'
                  : 'Ingen anledning angiven'}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={skipReasonData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {skipReasonData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: any, name: string) => [value, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                  {skipReasonData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                      <span
                        className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-muted-foreground">
                        {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Chart row 2: Revenue/conversion trend ── */}
      <Card>
        <CardHeader>
          <CardTitle>Intäkts- & skicktrendanalys</CardTitle>
          <CardDescription>
            Daglig attributerad intäkt och antal skickade meddelanden
          </CardDescription>
        </CardHeader>
        <CardContent>
          {revenueTrend.every((d) => d.intäkter === 0 && d.skickade === 0) ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              Ingen data för vald period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  interval={days === 7 ? 0 : days === 30 ? 3 : 6}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(v) =>
                    new Intl.NumberFormat('sv-SE', {
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(v)
                  }
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: any, name: string) => {
                    if (name === 'intäkter') return [formatSEK(value), 'Intäkt'];
                    return [value, 'Skickade'];
                  }}
                />
                <Legend
                  formatter={(value) =>
                    value === 'intäkter' ? 'Intäkt (SEK)' : 'Skickade'
                  }
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="intäkter"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="intäkter"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="skickade"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="skickade"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Recent executions table ── */}
      <Card>
        <CardHeader>
          <CardTitle>Senaste körningar</CardTitle>
          <CardDescription>De 20 senaste exekveringarna i vald period</CardDescription>
        </CardHeader>
        <CardContent>
          {recentExecutions.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <XCircle className="h-8 w-8 opacity-40" />
              <p className="text-sm">Inga körningar under vald period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tidpunkt</TableHead>
                    <TableHead>Kund</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Överhoppningsorsak</TableHead>
                    <TableHead className="text-right">Kostnad</TableHead>
                    <TableHead className="text-right">Intäkt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentExecutions.map((exec) => (
                    <TableRow key={exec.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(exec.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{exec.customerName}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(exec.status)}>
                          {STATUS_LABELS[exec.status] || exec.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {exec.skippedReason
                          ? SKIP_REASON_LABELS[exec.skippedReason] || exec.skippedReason
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {exec.costSEK != null ? formatSEK(exec.costSEK) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {exec.revenueSEK != null && exec.revenueSEK > 0 ? (
                          <span className="text-green-600">{formatSEK(exec.revenueSEK)}</span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
