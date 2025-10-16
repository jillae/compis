

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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'bookings' | 'avgValue'>('revenue');

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

  // Filter and sort customers
  const filteredAndSortedCustomers = topCustomers
    .filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        case 'bookings':
          return b.bookingCount - a.bookingCount;
        case 'avgValue':
          return b.averageBookingValue - a.averageBookingValue;
        default:
          return 0;
      }
    });

  // Determine star customer (highest revenue)
  const starCustomer = topCustomers.length > 0 
    ? topCustomers.reduce((prev, current) => 
        prev.totalRevenue > current.totalRevenue ? prev : current
      ) 
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-950 dark:to-emerald-950">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background border-b shadow-sm">
        <div className="max-w-7xl mx-auto p-6">
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
        </div>
      </div>

      {/* Content with padding */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">

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
            <div className="flex flex-col gap-4">
              <div>
                <CardTitle>Topkunder efter Intäkt ⭐</CardTitle>
                <CardDescription>Dina mest värdefulla kunder</CardDescription>
              </div>
              
              {/* Search & Sort Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Sök kund (namn eller email)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-slate-900"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy('revenue')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === 'revenue'
                        ? 'bg-violet-600 text-white'
                        : 'bg-white dark:bg-slate-900 border hover:bg-violet-50'
                    }`}
                  >
                    Intäkt
                  </button>
                  <button
                    onClick={() => setSortBy('bookings')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === 'bookings'
                        ? 'bg-violet-600 text-white'
                        : 'bg-white dark:bg-slate-900 border hover:bg-violet-50'
                    }`}
                  >
                    Bokningar
                  </button>
                  <button
                    onClick={() => setSortBy('avgValue')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === 'avgValue'
                        ? 'bg-violet-600 text-white'
                        : 'bg-white dark:bg-slate-900 border hover:bg-violet-50'
                    }`}
                  >
                    Genomsnitt
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {filteredAndSortedCustomers.map((customer, index) => {
                const isStarCustomer = starCustomer?.id === customer.id;
                const isVIP = customer.totalRevenue > 50000 || customer.bookingCount > 20;
                
                return (
                  <div 
                    key={customer.id} 
                    className={`flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-all ${
                      isStarCustomer 
                        ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-300 dark:border-yellow-800'
                        : isVIP
                        ? 'bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-purple-200'
                        : 'bg-gradient-to-r from-white to-violet-50 dark:from-slate-900 dark:to-violet-950'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                        isStarCustomer
                          ? 'bg-gradient-to-br from-yellow-200 to-amber-200 dark:from-yellow-800 dark:to-amber-800 text-yellow-700 dark:text-yellow-300'
                          : isVIP
                          ? 'bg-gradient-to-br from-purple-200 to-violet-200 dark:from-purple-800 dark:to-violet-800 text-purple-700 dark:text-purple-300'
                          : 'bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900 dark:to-purple-900 text-violet-700 dark:text-violet-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{customer.name}</p>
                          {isStarCustomer && <span className="text-lg" title="Periodens stjärna!">🏆</span>}
                          {isVIP && !isStarCustomer && <span className="text-lg" title="VIP-kund">💎</span>}
                        </div>
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
                      {/* CTA - Corex driven actions */}
                      <div className="mt-2 flex gap-2">
                        <Link 
                          href={`/dashboard/retention?customer=${customer.id}`}
                          className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full transition-colors"
                        >
                          Skicka Tack 💌
                        </Link>
                        <Link 
                          href={`/dashboard/segments?highlight=${customer.id}`}
                          className="text-xs px-3 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-full transition-colors"
                        >
                          Specialerbjudande 🎁
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredAndSortedCustomers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Inga kunder hittades
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

