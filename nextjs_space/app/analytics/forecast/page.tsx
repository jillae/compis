
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Calendar, DollarSign, Activity } from 'lucide-react';
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
      const response = await fetch(`/api/analytics/forecast?days=${days}&forecastDays=${forecastDays}`);
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
          <p className="text-muted-foreground">Loading forecast...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div>No data available</div>;
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Revenue Forecast</h1>
            <p className="text-muted-foreground">AI-powered predictions for your business</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="px-4 py-2 border rounded-md hover:bg-accent">
              ← Back to Dashboard
            </Link>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="px-4 py-2 border rounded-md bg-background"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <select
              value={forecastDays}
              onChange={(e) => setForecastDays(parseInt(e.target.value))}
              className="px-4 py-2 border rounded-md bg-background"
            >
              <option value={7}>Forecast 7 days</option>
              <option value={30}>Forecast 30 days</option>
              <option value={60}>Forecast 60 days</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forecast Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(summary.totalForecastRevenue || 0).toLocaleString('sv-SE')} kr</div>
              <p className="text-xs text-muted-foreground mt-1">Next {forecastDays} days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forecast Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalForecastBookings || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Next {forecastDays} days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(summary.revenueGrowthRate || 0) > 0 ? '+' : ''}{(summary.revenueGrowthRate || 0)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Trend: {summary.trendDirection}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confidence Score</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.confidenceScore || 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">Prediction accuracy</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Forecast Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Forecast</CardTitle>
            <CardDescription>Historical data (solid line) vs predicted values (dashed line)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: any) => {
                    if (value === null || value === undefined) return 'N/A';
                    return `${Number(value).toLocaleString('sv-SE')} kr`;
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actualRevenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Actual Revenue"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="predictedRevenue" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Predicted Revenue"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bookings Forecast Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings Forecast</CardTitle>
            <CardDescription>Historical bookings vs predicted bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: any) => {
                    if (value === null || value === undefined) return 'N/A';
                    return `${Number(value)} bookings`;
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actualBookings" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Actual Bookings"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="predictedBookings" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Predicted Bookings"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Forecast Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Revenue Trend</h4>
                <p className="text-sm text-muted-foreground">
                  Based on the last {days} days of data, revenue is trending{' '}
                  <span className="font-semibold">{summary.trendDirection || 'stable'}</span> with a growth rate of{' '}
                  <span className="font-semibold">{(summary.revenueGrowthRate || 0)}%</span>.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Forecast Accuracy</h4>
                <p className="text-sm text-muted-foreground">
                  The forecast has a confidence score of <span className="font-semibold">{(summary.confidenceScore || 0)}%</span>.
                  {(summary.confidenceScore || 0) >= 70 ? ' This indicates high reliability in the predictions.' : ' More historical data would improve accuracy.'}
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Expected Performance</h4>
                <p className="text-sm text-muted-foreground">
                  Over the next {forecastDays} days, we expect approximately{' '}
                  <span className="font-semibold">{((summary.totalForecastRevenue || 0)).toLocaleString('sv-SE')} kr</span> in revenue from{' '}
                  <span className="font-semibold">{(summary.totalForecastBookings || 0)} bookings</span>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
