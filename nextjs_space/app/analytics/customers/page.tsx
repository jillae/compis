
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface CustomerAnalytics {
  overview: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    atRiskCustomers: number;
    customerLifetimeValue: number;
    repeatRate: number;
    churnRate: number;
    churnedCustomers: number;
    potentialRevenue: number;
  };
  segmentation: {
    oneTime: number;
    occasional: number;
    regular: number;
    loyal: number;
  };
  topCustomers: Array<{
    id: string;
    name: string;
    email: string;
    totalRevenue: number;
    bookingCount: number;
    averageBookingValue: number;
  }>;
}

export default function CustomerAnalyticsPage() {
  const [data, setData] = useState<CustomerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/customers?days=${days}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch customer analytics:', error);
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

  const { overview, segmentation, topCustomers } = data;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Analytics</h1>
            <p className="text-muted-foreground">Deep dive into customer behavior and retention</p>
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

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalCustomers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.newCustomers} new in period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repeat Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.repeatRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.returningCustomers} returning customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.churnRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.churnedCustomers} churned customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.atRiskCustomers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.potentialRevenue.toLocaleString()} kr potential
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Customer Lifetime Value */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Lifetime Value</CardTitle>
            <CardDescription>Average revenue per customer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {overview.customerLifetimeValue.toLocaleString('sv-SE')} kr
            </div>
          </CardContent>
        </Card>

        {/* Customer Segmentation */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Segmentation</CardTitle>
            <CardDescription>Customers grouped by booking frequency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-slate-600">{segmentation.oneTime}</div>
                <p className="text-sm text-muted-foreground mt-2">One-Time</p>
                <p className="text-xs text-muted-foreground">1 booking</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{segmentation.occasional}</div>
                <p className="text-sm text-muted-foreground mt-2">Occasional</p>
                <p className="text-xs text-muted-foreground">2-3 bookings</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-green-600">{segmentation.regular}</div>
                <p className="text-sm text-muted-foreground mt-2">Regular</p>
                <p className="text-xs text-muted-foreground">4-6 bookings</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{segmentation.loyal}</div>
                <p className="text-sm text-muted-foreground mt-2">Loyal</p>
                <p className="text-xs text-muted-foreground">7+ bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers by Revenue</CardTitle>
            <CardDescription>Your most valuable customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{customer.totalRevenue.toLocaleString('sv-SE')} kr</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.bookingCount} bookings · Avg {customer.averageBookingValue.toLocaleString('sv-SE')} kr
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
