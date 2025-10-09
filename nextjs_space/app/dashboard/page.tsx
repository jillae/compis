
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { BookingPatternChart } from '@/components/dashboard/booking-pattern-chart';
import { WeekdayChart } from '@/components/dashboard/weekday-chart';
import { AIInsightsSection } from '@/components/dashboard/ai-insights-section';
import { SyncButton } from '@/components/dashboard/sync-button';
import { OnboardingBanner } from '@/components/dashboard/onboarding-banner';
import { WorkdayToggle } from '@/components/dashboard/workday-toggle';
import { TimePeriodSelector } from '@/components/time-period-selector';
import Link from 'next/link';

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

interface AtRiskMetrics {
  totalBookings: number;
  highRiskBookings: number;
  mediumRiskBookings: number;
  lowRiskBookings: number;
  potentialLoss: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [atRiskMetrics, setAtRiskMetrics] = useState<AtRiskMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<string>('30');
  const [workdays, setWorkdays] = useState<'5' | '7'>('7');

  // Helper function to convert timePeriod to days
  const getDaysFromTimePeriod = (period: string): number => {
    if (period === 'currentYear') {
      return Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    } else if (period === 'previousYear') {
      return 365;
    } else if (period === 'all') {
      return 3650; // 10 years as "all"
    }
    return parseInt(period) || 30;
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timePeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Convert timePeriod to days for API
      const daysParam = getDaysFromTimePeriod(timePeriod);
      
      // Fetch overview data
      const overviewResponse = await fetch(`/api/dashboard/overview?days=${daysParam}`);
      const overviewResult = await overviewResponse.json();

      // Fetch analytics data
      const analyticsResponse = await fetch(`/api/dashboard/analytics?days=${daysParam}`);
      const analyticsResult = await analyticsResponse.json();

      // Fetch at-risk metrics
      const atRiskResponse = await fetch(`/api/bookings/predict?action=revenue-at-risk&days=14`);
      const atRiskResult = await atRiskResponse.json();

      if (overviewResult.success && analyticsResult.success) {
        setData(overviewResult.data);
        setAnalytics(analyticsResult.data);
        setAtRiskMetrics(atRiskResult);
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
          <p className="text-muted-foreground">Laddar dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Fel</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'Ingen data tillgänglig'}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Försök igen
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, topServices, staffPerformance } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Onboarding Banner */}
        <div className="p-6 pb-0">
          <OnboardingBanner />
        </div>
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-background border-b shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Flow Dashboard</h1>
                <p className="text-muted-foreground">
                  Intäktsintelligens för ArchClinic
                </p>
              </div>
              <div className="flex items-center gap-3">
                <WorkdayToggle value={workdays} onChange={setWorkdays} />
                <SyncButton />
                <TimePeriodSelector 
                  value={timePeriod} 
                  onChange={setTimePeriod}
                  className="w-[180px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content with padding */}
        <div className="p-6 space-y-6">

        {/* Revenue Simulator CTA */}
        <Link href="/dashboard/simulator">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all cursor-pointer border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6" />
                    <h3 className="text-2xl font-bold">Intäktssimulator</h3>
                  </div>
                  <p className="text-blue-50">
                    Testa "what-if" scenarion: Öka bokningar +2/dag → Se exakt vad det ger på 12 månader! 🚀
                  </p>
                </div>
                <ArrowRight className="h-8 w-8 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totalt Bokningar</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{overview.totalBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.onlineBookingPercentage}% onlinebokningar
              </p>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Intäkt</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {overview.totalRevenue.toLocaleString('sv-SE')} kr
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Från {overview.completedBookings} genomförda bokningar
              </p>
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Genomförandegrad</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{overview.completionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.completedBookings} / {overview.totalBookings} bokningar
              </p>
            </CardContent>
          </Card>

          {/* Cancellation Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avbokningsgrad</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{overview.cancellationRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.cancelledBookings} avbokade, {overview.noShowBookings} uteblivna
              </p>
            </CardContent>
          </Card>

          {/* At-Risk Bookings */}
          {atRiskMetrics && (
            <Link href="/dashboard/at-risk">
              <Card className="cursor-pointer hover:border-destructive/50 transition-all border-destructive/30 bg-destructive/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Risk Nästa 14d</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-destructive">
                    {atRiskMetrics.highRiskBookings}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {atRiskMetrics.potentialLoss.toLocaleString()} kr i riskzon
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Services */}
          <Card>
            <CardHeader>
              <CardTitle>Populäraste Tjänster</CardTitle>
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
                      <p className="font-semibold">{service._count.id} bokningar</p>
                      <p className="text-xs text-muted-foreground">
                        {(service._sum.price || 0).toLocaleString('sv-SE')} kr
                      </p>
                    </div>
                  </div>
                ))}
                {topServices.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Ingen tjänstedata tillgänglig
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Staff Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Personalprestanda</CardTitle>
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
                      <p className="font-semibold">{staff._count.id} bokningar</p>
                      <p className="text-xs text-muted-foreground">
                        {(staff._sum.price || 0).toLocaleString('sv-SE')} kr
                      </p>
                    </div>
                  </div>
                ))}
                {staffPerformance.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Ingen personaldata tillgänglig
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
        <AIInsightsSection days={getDaysFromTimePeriod(timePeriod)} />

        {/* Quick Links to Advanced Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Avancerad Analys & AI-verktyg</CardTitle>
            <p className="text-sm text-muted-foreground">
              AI-drivna insikter för att optimera din klinik och öka intäkterna
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/dashboard/at-risk"
                className="p-6 border-2 border-destructive/30 bg-destructive/5 rounded-lg hover:border-destructive hover:bg-destructive/10 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <h3 className="font-semibold">Riskbokningar</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  AI-förutsägelse av uteblivna besök med åtgärdsrekommendationer för att skydda intäkter
                </p>
              </Link>

              <Link
                href="/analytics/customers"
                className="p-6 border rounded-lg hover:border-primary hover:bg-accent transition-all"
              >
                <h3 className="font-semibold mb-2">Kundanalys</h3>
                <p className="text-sm text-muted-foreground">
                  Livstidsvärde, churn-rate, segmentering och retentionsinsikter
                </p>
              </Link>
              
              <Link
                href="/analytics/services"
                className="p-6 border rounded-lg hover:border-primary hover:bg-accent transition-all"
              >
                <h3 className="font-semibold mb-2">Tjänsteanalys</h3>
                <p className="text-sm text-muted-foreground">
                  Prestationsmätningar, kapacitetsutnyttjande och optimeringsrekommendationer
                </p>
              </Link>
              
              <Link
                href="/analytics/forecast"
                className="p-6 border rounded-lg hover:border-primary hover:bg-accent transition-all"
              >
                <h3 className="font-semibold mb-2">Intäktsprognos</h3>
                <p className="text-sm text-muted-foreground">
                  AI-drivna förutsägelser för framtida intäkter och bokningstrender
                </p>
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
