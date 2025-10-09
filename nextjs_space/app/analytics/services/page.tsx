
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, TrendingUp, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
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
      // Handle "all" time option
      const daysParam = days === 999999 ? 999999 : days;
      const response = await fetch(`/api/analytics/services?days=${daysParam}`);
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
          <p className="text-muted-foreground">Laddar analysdata...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Ingen data tillgänglig</p>
    </div>;
  }

  const { topPerformers, categoryBreakdown, optimization } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Tjänsteanalys
            </h1>
            <p className="text-muted-foreground mt-1">Prestandainsikter för dina tjänster</p>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {/* Top Performers */}
        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Topppresterande Tjänster
            </CardTitle>
            <CardDescription>Tjänster med högst intäkter</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {topPerformers.map((service, index) => (
                <div key={service.id} className="flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-shadow bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-700 dark:text-green-300 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.category}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Intäkt</p>
                      <p className="font-bold">{service.totalRevenue.toLocaleString('sv-SE')} kr</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bokningar</p>
                      <p className="font-bold">{service.totalBookings}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Genomförande</p>
                      <p className="font-bold">{service.completionRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Kapacitet</p>
                      <p className="font-bold">{service.capacityUtilization}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Kategorifördelning
            </CardTitle>
            <CardDescription>Intäktsfördelning per kategori</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryBreakdown.map((category) => (
                <div key={category.category} className="p-4 border rounded-xl hover:shadow-md transition-all bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-blue-950">
                  <h4 className="font-semibold mb-2">{category.category}</h4>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">{category.revenue.toLocaleString('sv-SE')} kr</p>
                    <p className="text-sm text-muted-foreground">
                      {category.bookings} bokningar · Snitt {category.averageValue.toLocaleString('sv-SE')} kr
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Optimization Recommendations */}
        {optimization.length > 0 && (
          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                AI-rekommendationer för Optimering
              </CardTitle>
              <CardDescription>AI-drivna förslag för att förbättra tjänsteprestanda</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {optimization.map((service) => (
                  <div key={service.id} className="p-4 border rounded-xl bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-950/50 dark:to-yellow-950/50 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{service.name}</h4>
                        <p className="text-sm text-muted-foreground">{service.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Intäktsbidrag</p>
                        <p className="font-bold">{service.revenueContribution}%</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 mt-3 p-3 bg-white dark:bg-slate-900 rounded-lg border-l-4 border-amber-600">
                      <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{service.recommendation}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-3 text-center text-sm">
                      <div>
                        <p className="text-muted-foreground">Bokningar</p>
                        <p className="font-semibold">{service.totalBookings}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Genomförande</p>
                        <p className="font-semibold">{service.completionRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avbokning</p>
                        <p className="font-semibold">{service.cancellationRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Kapacitet</p>
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
