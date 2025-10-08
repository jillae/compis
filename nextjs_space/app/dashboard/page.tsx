
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  DollarSign,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { BookingPatternChart } from '@/components/dashboard/booking-pattern-chart';
import { WeekdayChart } from '@/components/dashboard/weekday-chart';
import { AIInsightsSection } from '@/components/dashboard/ai-insights-section';
import { SyncButton } from '@/components/dashboard/sync-button';

interface DashboardData {
  overview: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    noShowBookings: number;
    totalRevenue: number;
    onlineBookingPercentage: number;
    completionRate: number;
    cancellationRate: number;
    noShowRate: number;
  };
  topServices: Array<{
    serviceId: string;
    name: string;
    category: string;
    _count: { id: number };
    _sum: { price: number | null };
  }>;
  bookingsTrend: Array<{
    date: string;
    count: number;
  }>;
  staffPerformance: Array<{
    staffId: string;
    name: string;
    role: string;
    _count: { id: number };
    _sum: { price: number | null };
  }>;
}

interface AnalyticsData {
  revenueTrend: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
  bookingPattern: Array<{
    hour: string;
    bookings: number;
  }>;
  weekdayDistribution: Array<{
    day: string;
    bookings: number;
    revenue: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    bookings: number;
    revenue: number;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchDashboardData();
  }, [days]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch overview data
      const overviewResponse = await fetch(`/api/dashboard/overview?days=${days}`);
      const overviewResult = await overviewResponse.json();

      // Fetch analytics data
      const analyticsResponse = await fetch(`/api/dashboard/analytics?days=${days}`);
      const analyticsResult = await analyticsResponse.json();

      if (overviewResult.success && analyticsResult.success) {
        setData(overviewResult.data);
        setAnalytics(analyticsResult.data);
        setError(null);
      } else {
        setError(overviewResult.error || analyticsResult.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'No data available'}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, topServices, staffPerformance } = data;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Flow Dashboard</h1>
            <p className="text-muted-foreground">
              Revenue Intelligence for ArchClinic
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SyncButton />
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
          {/* Total Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.onlineBookingPercentage}% online bookings
              </p>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview.totalRevenue.toLocaleString('sv-SE')} kr
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {overview.completedBookings} completed bookings
              </p>
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.completionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.completedBookings} / {overview.totalBookings} bookings
              </p>
            </CardContent>
          </Card>

          {/* Cancellation Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.cancellationRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.cancelledBookings} cancelled, {overview.noShowBookings} no-shows
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Services */}
          <Card>
            <CardHeader>
              <CardTitle>Top Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topServices.map((service, index) => (
                  <div key={service.serviceId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">{service.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{service._count.id} bookings</p>
                      <p className="text-xs text-muted-foreground">
                        {(service._sum.price || 0).toLocaleString('sv-SE')} kr
                      </p>
                    </div>
                  </div>
                ))}
                {topServices.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No services data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Staff Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffPerformance.map((staff, index) => (
                  <div key={staff.staffId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{staff.name}</p>
                        <p className="text-xs text-muted-foreground">{staff.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{staff._count.id} bookings</p>
                      <p className="text-xs text-muted-foreground">
                        {(staff._sum.price || 0).toLocaleString('sv-SE')} kr
                      </p>
                    </div>
                  </div>
                ))}
                {staffPerformance.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No staff data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        {analytics && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart data={analytics.revenueTrend} />
              <WeekdayChart data={analytics.weekdayDistribution} />
            </div>
            <BookingPatternChart data={analytics.bookingPattern} />
          </>
        )}

        {/* AI Insights Section */}
        <AIInsightsSection days={days} />
      </div>
    </div>
  );
}
