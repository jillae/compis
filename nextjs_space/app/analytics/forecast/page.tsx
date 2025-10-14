

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Calendar, DollarSign, Activity, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
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

interface ForecastData {
  historical: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
  forecast: Array<{
    date: string;
    predictedRevenue: number;
    predictedBookings: number;
  }>;
  summary: {
    totalForecastRevenue: number;
    totalForecastBookings: number;
    revenueGrowthRate: number;
    bookingsGrowthRate: number;
    confidenceScore: number;
    trendDirection: string;
  };
}

export default function ForecastPage() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [forecastDays, setForecastDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [days, forecastDays]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const daysParam = days === 999999 ? 999999 : days;
      const response = await fetch(`/api/analytics/forecast?days=${daysParam}&forecastDays=${forecastDays}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laddar prognosdata...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Ingen data tillgänglig</p>
    </div>;
  }

  const { historical, forecast, summary } = data;

  // Combine historical and forecast data for chart
  const chartData = [
    ...historical.map((d) => ({
      date: d.date,
      actualRevenue: d.revenue,
      actualBookings: d.bookings,
      predictedRevenue: null,
      predictedBookings: null,
    })),
    ...forecast.map((f) => ({
      date: f.date,
      actualRevenue: null,
      actualBookings: null,
      predictedRevenue: f.predictedRevenue,
      predictedBookings: f.predictedBookings,
    })),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 dark:from-slate-950 dark:to-violet-950">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background border-b shadow-sm">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Intäktsprognos
              </h1>
              <p className="text-muted-foreground mt-1">Datadrivna förutsägelser för din verksamhet</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors bg-white dark:bg-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Tillbaka</span>
              </Link>
              <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="px-4 py-2 border rounded-lg bg-white dark:bg-slate-900 font-medium shadow-sm"
              >
                <option value={7}>Senaste 7 dagarna</option>
                <option value={30}>Senaste 30 dagarna</option>
                <option value={90}>Senaste 90 dagarna</option>
                <option value={180}>Senaste 6 månaderna</option>
                <option value={365}>Senaste året</option>
                <option value={730}>Senaste 2 åren</option>
                <option value={999999}>Hela perioden</option>
              </select>
              <select
                value={forecastDays}
                onChange={(e) => setForecastDays(parseInt(e.target.value))}
                className="px-4 py-2 border rounded-lg bg-white dark:bg-slate-900 font-medium shadow-sm"
              >
                <option value={7}>Prognos 7 dagar</option>
                <option value={30}>Prognos 30 dagar</option>
                <option value={60}>Prognos 60 dagar</option>
                <option value={90}>Prognos 90 dagar</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content with padding */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Förväntad Intäkt</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(summary.totalForecastRevenue || 0).toLocaleString('sv-SE')} kr</div>
              <p className="text-xs text-muted-foreground mt-1">Nästa {forecastDays} dagar</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Förväntade Bokningar</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalForecastBookings || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Nästa {forecastDays} dagar</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tillväxttakt</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(summary.revenueGrowthRate || 0) > 0 ? '+' : ''}{(summary.revenueGrowthRate || 0)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Trend: {summary.trendDirection === 'increasing' ? 'ökande' : 'minskande'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Säkerhetsnivå</CardTitle>
              <Activity className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.confidenceScore || 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">Prognosnoggrannhet</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Forecast Chart */}
        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
            <CardTitle>Intäktsprognos</CardTitle>
            <CardDescription>Historisk data (heldragen linje) vs prognostiserade värden (streckad linje)</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: any) => {
                    if (value === null || value === undefined) return 'N/A';
                    return `${Number(value).toLocaleString('sv-SE')} kr`;
                  }}
                  labelFormatter={(label) => `Datum: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actualRevenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Faktisk Intäkt"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="predictedRevenue" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Prognostiserad Intäkt"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bookings Forecast Chart */}
        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950">
            <CardTitle>Bokningsprognos</CardTitle>
            <CardDescription>Historiska bokningar vs prognostiserade bokningar</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: any) => {
                    if (value === null || value === undefined) return 'N/A';
                    return `${Number(value)} bokningar`;
                  }}
                  labelFormatter={(label) => `Datum: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actualBookings" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Faktiska Bokningar"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="predictedBookings" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Prognostiserade Bokningar"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardTitle>Prognosinsikter</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-xl hover:shadow-md transition-shadow bg-gradient-to-r from-white to-blue-50 dark:from-slate-900 dark:to-blue-950">
                <h4 className="font-semibold mb-2">📈 Intäktstrend</h4>
                <p className="text-sm text-muted-foreground">
                  Baserat på de senaste {days} dagarnas data är intäkten{' '}
                  <span className="font-semibold">{summary.trendDirection === 'increasing' ? 'ökande' : 'minskande'}</span> med en tillväxttakt på{' '}
                  <span className="font-semibold">{(summary.revenueGrowthRate || 0)}%</span>.
                </p>
              </div>
              
              <div className="p-4 border rounded-xl hover:shadow-md transition-shadow bg-gradient-to-r from-white to-violet-50 dark:from-slate-900 dark:to-violet-950">
                <h4 className="font-semibold mb-2">🎯 Prognosnoggrannhet</h4>
                <p className="text-sm text-muted-foreground">
                  Prognosen har en säkerhetsnivå på <span className="font-semibold">{(summary.confidenceScore || 0)}%</span>.
                  {(summary.confidenceScore || 0) >= 70 ? ' Detta indikerar hög tillförlitlighet i förutsägelserna.' : ' Mer historisk data skulle förbättra noggrannheten.'}
                </p>
              </div>
              
              <div className="p-4 border rounded-xl hover:shadow-md transition-shadow bg-gradient-to-r from-white to-emerald-50 dark:from-slate-900 dark:to-emerald-950">
                <h4 className="font-semibold mb-2">💰 Förväntad Prestation</h4>
                <p className="text-sm text-muted-foreground">
                  Under de nästa {forecastDays} dagarna förväntar vi oss ungefär{' '}
                  <span className="font-semibold">{((summary.totalForecastRevenue || 0)).toLocaleString('sv-SE')} kr</span> i intäkter från{' '}
                  <span className="font-semibold">{(summary.totalForecastBookings || 0)} bokningar</span>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

