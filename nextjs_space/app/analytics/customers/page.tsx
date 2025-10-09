

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, TrendingUp, TrendingDown, AlertCircle, ArrowLeft } from 'lucide-react';
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
      const daysParam = days === 999999 ? 999999 : days;
      const response = await fetch(`/api/analytics/customers?days=${daysParam}`);
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
          <p className="text-muted-foreground">Laddar kunddata...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Ingen data tillgänglig</p>
    </div>;
  }

  const { overview, segmentation, topCustomers } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-950 dark:to-emerald-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Kundanalys
            </h1>
            <p className="text-muted-foreground mt-1">Djupdykning i kundbeteende och retention</p>
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

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totalt Kunder</CardTitle>
              <Users className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalCustomers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.newCustomers} nya i perioden
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Återkommande</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.repeatRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.returningCustomers} återkommande kunder
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bortfall</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.churnRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.churnedCustomers} förlorade kunder
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">I Riskzonen</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.atRiskCustomers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.potentialRevenue.toLocaleString('sv-SE')} kr potential
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Customer Lifetime Value */}
        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
            <CardTitle>Customer Lifetime Value (CLV)</CardTitle>
            <CardDescription>Genomsnittlig intäkt per kund</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {overview.customerLifetimeValue.toLocaleString('sv-SE')} kr
            </div>
          </CardContent>
        </Card>

        {/* Customer Segmentation */}
        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardTitle>Kundsegmentering</CardTitle>
            <CardDescription>Kunder grupperade efter bokningsfrekvens</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-xl hover:shadow-md transition-all bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                <div className="text-3xl font-bold text-slate-600 dark:text-slate-400">{segmentation.oneTime}</div>
                <p className="text-sm font-semibold mt-2">Engångskunder</p>
                <p className="text-xs text-muted-foreground">1 bokning</p>
              </div>
              <div className="text-center p-4 border rounded-xl hover:shadow-md transition-all bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-blue-950">
                <div className="text-3xl font-bold text-blue-600">{segmentation.occasional}</div>
                <p className="text-sm font-semibold mt-2">Tillfälliga</p>
                <p className="text-xs text-muted-foreground">2-3 bokningar</p>
              </div>
              <div className="text-center p-4 border rounded-xl hover:shadow-md transition-all bg-gradient-to-br from-white to-green-50 dark:from-slate-900 dark:to-green-950">
                <div className="text-3xl font-bold text-green-600">{segmentation.regular}</div>
                <p className="text-sm font-semibold mt-2">Reguljära</p>
                <p className="text-xs text-muted-foreground">4-6 bokningar</p>
              </div>
              <div className="text-center p-4 border rounded-xl hover:shadow-md transition-all bg-gradient-to-br from-white to-purple-50 dark:from-slate-900 dark:to-purple-950">
                <div className="text-3xl font-bold text-purple-600">{segmentation.loyal}</div>
                <p className="text-sm font-semibold mt-2">Lojala</p>
                <p className="text-xs text-muted-foreground">7+ bokningar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
            <CardTitle>Topkunder efter Intäkt</CardTitle>
            <CardDescription>Dina mest värdefulla kunder</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-all bg-gradient-to-r from-white to-violet-50 dark:from-slate-900 dark:to-violet-950">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900 dark:to-purple-900 text-violet-700 dark:text-violet-300 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                      {customer.totalRevenue.toLocaleString('sv-SE')} kr
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {customer.bookingCount} bokningar · Snitt {customer.averageBookingValue.toLocaleString('sv-SE')} kr
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

