
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoleToggle } from '@/components/dashboard/role-toggle';
import { EnhancedRevenueChart } from '@/components/dashboard/enhanced-revenue-chart';
import { BookingPatternChart } from '@/components/dashboard/booking-pattern-chart';
import { WeekdayChart } from '@/components/dashboard/weekday-chart';
import { AIInsightsSection } from '@/components/dashboard/ai-insights-section';
import { MetaAlerts } from '@/components/dashboard/meta-alerts';
import { SyncButton } from '@/components/dashboard/sync-button';
import { OnboardingBanner } from '@/components/dashboard/onboarding-banner';
import { WorkdayToggle } from '@/components/dashboard/workday-toggle';
import { TimePeriodSelector } from '@/components/time-period-selector';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

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
  const { data: session } = useSession() || {};
  const [data, setData] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [atRiskMetrics, setAtRiskMetrics] = useState<AtRiskMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<string>('30');
  const [workdays, setWorkdays] = useState<'5' | '7'>('7');
  const [simulatedRole, setSimulatedRole] = useState<UserRole>(UserRole.ADMIN);

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
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Flow Dashboard</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Intäktsintelligens för ArchClinic
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link href="/" className="hidden md:block">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    <span className="hidden lg:inline">Till landningssida</span>
                    <span className="lg:hidden">Hem</span>
                  </Button>
                </Link>
                
                {session?.user?.role === UserRole.SUPER_ADMIN && (
                  <RoleToggle 
                    currentRole={simulatedRole} 
                    onRoleChange={setSimulatedRole} 
                  />
                )}
                
                <WorkdayToggle value={workdays} onChange={setWorkdays} />
                <SyncButton />
                <TimePeriodSelector 
                  value={timePeriod} 
                  onChange={setTimePeriod}
                  className="w-[140px] md:w-[180px]"
                />
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    const res = await fetch('/api/email/weekly-report');
                    if (res.ok) {
                      alert('✅ Veckorapport skickad till din e-post!');
                    } else {
                      alert('❌ Kunde inte skicka rapport. Försök igen.');
                    }
                  }}
                  title="Skicka veckorapport till din e-post"
                  className="hidden sm:flex"
                >
                  📧 <span className="hidden lg:inline ml-1">Veckorapport</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/auth/login' })}
                >
                  <LogOut className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Logga ut</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content with padding */}
        <div className="p-6 space-y-6">

        {/* AI Action Dashboard CTA - PRIMARY */}
        <Link href="/dashboard/actions">
          <Card className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 transition-all cursor-pointer border-0 shadow-xl">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                      <TrendingUp className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl md:text-3xl font-bold">Veckans AI-Rekommendationer</h3>
                        <span className="text-2xl">✨</span>
                      </div>
                      <p className="text-sm text-white/80 mt-1">
                        NYA DENNA VECKA
                      </p>
                    </div>
                  </div>
                  <p className="text-base md:text-lg text-white/95">
                    <strong>3 konkreta åtgärder</strong> för att öka intäkter denna vecka. 
                    AI har analyserat din data och hittat optimeringsmöjligheter värda tiotusentals kr! 🚀
                  </p>
                  <div className="flex items-center gap-2 text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 w-fit">
                    <CheckCircle className="h-4 w-4" />
                    <span>Klicka för att se dina personliga rekommendationer</span>
                  </div>
                </div>
                <ArrowRight className="h-10 w-10 flex-shrink-0 hidden md:block" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Revenue Simulator CTA - SECONDARY */}
        <Link href="/dashboard/simulator">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all cursor-pointer border-0">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    <h3 className="text-xl font-bold">Intäktssimulator</h3>
                  </div>
                  <p className="text-sm text-blue-50">
                    Testa "what-if" scenarion och se 12-månaders impact
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Marketing Intelligence CTA - TERTIARY (Professional+) */}
        <Link href="/dashboard/marketing">
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all cursor-pointer border-0">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    <h3 className="text-xl font-bold">Marketing Intelligence</h3>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">PRO+</span>
                  </div>
                  <p className="text-sm text-indigo-50">
                    Meta kampanjoptimering & kapacitetsstyrning
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 flex-shrink-0" />
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

        {/* META Ads Intelligence - PROACTIVE ALERTS */}
        <MetaAlerts />

        {/* Enhanced Analytics Charts with Toggle */}
        {analytics && (
          <>
            <EnhancedRevenueChart data={analytics.revenueTrend} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeekdayChart data={analytics.weekdayDistribution} />
              <BookingPatternChart data={analytics.bookingPattern} />
            </div>
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
                href="/dashboard/risk-alerts"
                className="p-6 border-2 border-destructive/30 bg-destructive/5 rounded-lg hover:border-destructive hover:bg-destructive/10 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <h3 className="font-semibold">No-Show Riskanalys</h3>
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

        {/* Staff Management */}
        <Card>
          <CardHeader>
            <CardTitle>Personalhantering</CardTitle>
            <p className="text-sm text-muted-foreground">
              Hantera personal, schema och ledighet
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/staff"
                className="p-6 border rounded-lg hover:border-primary hover:bg-accent transition-all"
              >
                <h3 className="font-semibold mb-2">Personal</h3>
                <p className="text-sm text-muted-foreground">
                  Överskådlig lista över all personal och deras prestanda
                </p>
              </Link>
              
              <Link
                href="/staff/leave"
                className="p-6 border rounded-lg hover:border-primary hover:bg-accent transition-all"
              >
                <h3 className="font-semibold mb-2">Ledighetshantering</h3>
                <p className="text-sm text-muted-foreground">
                  Registrera och godkänn semester, sjukfrånvaro och annan ledighet
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
