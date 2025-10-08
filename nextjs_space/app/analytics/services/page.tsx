
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface ServiceMetrics {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  completionRate: number;
  cancellationRate: number;
  averageBookingValue: number;
  capacityUtilization: number;
  revenueContribution?: number;
  recommendation?: string;
}

interface ServiceAnalytics {
  allServices: ServiceMetrics[];
  topPerformers: ServiceMetrics[];
  underperformers: ServiceMetrics[];
  categoryBreakdown: Array<{
    category: string;
    revenue: number;
    bookings: number;
    averageValue: number;
  }>;
  optimization: ServiceMetrics[];
}

export default function ServiceAnalyticsPage() {
  const [data, setData] = useState<ServiceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/services?days=${days}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch service analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div>No data available</div>;
  }

  const { topPerformers, categoryBreakdown, optimization } = data;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Service Analytics</h1>
            <p className="text-muted-foreground">Performance insights for your services</p>
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
          </div>
        </div>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Performing Services
            </CardTitle>
            <CardDescription>Services with highest revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((service, index) => (
                <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.category}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="font-bold">{service.totalRevenue.toLocaleString('sv-SE')} kr</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bookings</p>
                      <p className="font-bold">{service.totalBookings}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completion</p>
                      <p className="font-bold">{service.completionRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Capacity</p>
                      <p className="font-bold">{service.capacityUtilization}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Category Breakdown
            </CardTitle>
            <CardDescription>Revenue distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryBreakdown.map((category) => (
                <div key={category.category} className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">{category.category}</h4>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{category.revenue.toLocaleString('sv-SE')} kr</p>
                    <p className="text-sm text-muted-foreground">
                      {category.bookings} bookings · Avg {category.averageValue.toLocaleString('sv-SE')} kr
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Optimization Recommendations */}
        {optimization.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Service Optimization Recommendations
              </CardTitle>
              <CardDescription>AI-powered suggestions to improve service performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimization.map((service) => (
                  <div key={service.id} className="p-4 border rounded-lg bg-yellow-50/50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{service.name}</h4>
                        <p className="text-sm text-muted-foreground">{service.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Revenue Contribution</p>
                        <p className="font-bold">{service.revenueContribution}%</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 mt-3 p-3 bg-white rounded border-l-4 border-yellow-600">
                      <CheckCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{service.recommendation}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-3 text-center text-sm">
                      <div>
                        <p className="text-muted-foreground">Bookings</p>
                        <p className="font-semibold">{service.totalBookings}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Completion</p>
                        <p className="font-semibold">{service.completionRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cancellation</p>
                        <p className="font-semibold">{service.cancellationRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Capacity</p>
                        <p className="font-semibold">{service.capacityUtilization}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
