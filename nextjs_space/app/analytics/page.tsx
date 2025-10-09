
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Package, 
  TrendingUp, 
  BarChart3,
  ArrowRight,
  Calendar,
  DollarSign,
  Target
} from 'lucide-react';
import Link from 'next/link';

interface AnalyticsOverview {
  customers: {
    total: number;
    new: number;
    atRisk: number;
    clv: number;
  };
  services: {
    total: number;
    topPerformer: string;
    underperforming: number;
    totalRevenue: number;
  };
  forecast: {
    nextMonthRevenue: number;
    confidenceLevel: number;
    trendDirection: 'up' | 'down' | 'stable';
  };
}

export default function AdvancedAnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      
      // Fetch basic overview data from existing endpoints
      const [customersResponse, servicesResponse] = await Promise.all([
        fetch('/api/analytics/customers?overview=true'),
        fetch('/api/analytics/services?overview=true')
      ]);

      const customersData = await customersResponse.json();
      const servicesData = await servicesResponse.json();

      if (customersData.success && servicesData.success) {
        setOverview({
          customers: {
            total: customersData.data.overview?.totalCustomers || 0,
            new: customersData.data.overview?.newCustomers || 0,
            atRisk: customersData.data.overview?.atRiskCustomers || 0,
            clv: Math.round(customersData.data.overview?.customerLifetimeValue || 0),
          },
          services: {
            total: servicesData.data.allServices?.length || 0,
            topPerformer: servicesData.data.topPerformers?.[0]?.name || 'N/A',
            underperforming: servicesData.data.underperformers?.length || 0,
            totalRevenue: Math.round(servicesData.data.allServices?.reduce((sum: number, s: any) => sum + (s.totalRevenue || 0), 0) || 0),
          },
          forecast: {
            nextMonthRevenue: 250000, // Placeholder - would come from forecast API
            confidenceLevel: 85,
            trendDirection: 'up'
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch analytics overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground mt-2">Dive deeper into your business data with detailed analytics</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Advanced Analytics</span>
        </div>
        <h1 className="text-3xl font-bold">Advanced Analytics</h1>
        <p className="text-muted-foreground mt-2">Dive deeper into your business data with detailed analytics</p>
      </div>

      {/* Quick Stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-blue-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-bold">{overview.customers.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Package className="h-4 w-4 text-green-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Active Services</p>
                  <p className="text-2xl font-bold">{overview.services.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Service Revenue</p>
                  <p className="text-2xl font-bold">{overview.services.totalRevenue.toLocaleString('sv-SE')} kr</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className={`h-4 w-4 ${overview.forecast.trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`} />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Forecast Trend</p>
                  <p className="text-2xl font-bold">{overview.forecast.confidenceLevel}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Customer Analytics */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Customer Analytics
            </CardTitle>
            <CardDescription>
              Lifetime value, churn rate, segmentation, and retention insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">New Customers</span>
                <span className="font-semibold">{overview?.customers.new || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">At Risk</span>
                <span className="font-semibold text-orange-600">{overview?.customers.atRisk || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg. CLV</span>
                <span className="font-semibold">{overview?.customers.clv.toLocaleString('sv-SE') || 0} kr</span>
              </div>
            </div>
            <Link href="/analytics/customers" passHref>
              <Button variant="outline" className="w-full">
                View Customer Analytics
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Service Analytics */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Service Analytics
            </CardTitle>
            <CardDescription>
              Performance metrics, capacity utilization, and optimization recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Top Service</span>
                <span className="font-semibold truncate ml-2">{overview?.services.topPerformer || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Underperforming</span>
                <span className="font-semibold text-orange-600">{overview?.services.underperforming || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <span className="font-semibold">{overview?.services.totalRevenue.toLocaleString('sv-SE') || 0} kr</span>
              </div>
            </div>
            <Link href="/analytics/services" passHref>
              <Button variant="outline" className="w-full">
                View Service Analytics
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Revenue Forecast */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Revenue Forecast
            </CardTitle>
            <CardDescription>
              AI-powered predictions for future revenue and booking trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Next Month</span>
                <span className="font-semibold">{overview?.forecast.nextMonthRevenue.toLocaleString('sv-SE') || 0} kr</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Confidence</span>
                <span className="font-semibold text-green-600">{overview?.forecast.confidenceLevel || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Trend</span>
                <span className={`font-semibold flex items-center gap-1 ${
                  overview?.forecast.trendDirection === 'up' ? 'text-green-600' : 
                  overview?.forecast.trendDirection === 'down' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {overview?.forecast.trendDirection === 'up' && <TrendingUp className="h-3 w-3" />}
                  {overview?.forecast.trendDirection === 'down' && <TrendingUp className="h-3 w-3 rotate-180" />}
                  {overview?.forecast.trendDirection === 'stable' && <Target className="h-3 w-3" />}
                  {overview?.forecast.trendDirection || 'stable'}
                </span>
              </div>
            </div>
            <Link href="/analytics/forecast" passHref>
              <Button variant="outline" className="w-full">
                View Revenue Forecast
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">More Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Staff Performance</h3>
                  <p className="text-sm text-muted-foreground">Individual and team performance metrics</p>
                </div>
                <Button variant="ghost" size="sm" disabled>
                  <Calendar className="h-4 w-4" />
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Marketing ROI</h3>
                  <p className="text-sm text-muted-foreground">Campaign effectiveness and attribution analysis</p>
                </div>
                <Button variant="ghost" size="sm" disabled>
                  <Target className="h-4 w-4" />
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
