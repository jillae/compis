
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
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoleToggle } from '@/components/dashboard/role-toggle';
import { EnhancedRevenueChart } from '@/components/dashboard/enhanced-revenue-chart';
import { BookingPatternChart } from '@/components/dashboard/booking-pattern-chart';
import { WeekdayChart } from '@/components/dashboard/weekday-chart';
import { InsightsSection } from '@/components/dashboard/insights-section';
import { MetaAlerts } from '@/components/dashboard/meta-alerts';
import { SyncButton } from '@/components/dashboard/sync-button';
import { OnboardingBanner } from '@/components/dashboard/onboarding-banner';
import { WorkdayToggle } from '@/components/dashboard/workday-toggle';
import { TimePeriodSelector } from '@/components/time-period-selector';
import { HamburgerMenu } from '@/components/dashboard/hamburger-menu';
import { ExpandableRiskZone } from '@/components/dashboard/expandable-risk-zone';
import { DisplayModeSwitcher } from '@/components/display-mode-switcher';
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
  const [simulatedRole, setSimulatedRole] = useState<UserRole>(() => {
    // Initialize from localStorage or default to user's actual role
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('simulatedRole');
      if (saved && Object.values(UserRole).includes(saved as UserRole)) {
        return saved as UserRole;
      }
    }
    return UserRole.ADMIN;
  });

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

  // Initialize simulatedRole from user's actual role when session loads
  useEffect(() => {
    if (session?.user?.role) {
      const saved = localStorage.getItem('simulatedRole');
      if (!saved) {
        // First time: set to user's actual role
        setSimulatedRole(session.user.role);
        localStorage.setItem('simulatedRole', session.user.role);
      }
    }
  }, [session?.user?.role]);

  // Save simulatedRole to localStorage whenever it changes
  useEffect(() => {
    if (simulatedRole) {
      localStorage.setItem('simulatedRole', simulatedRole);
    }
  }, [simulatedRole]);

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
            <div className="flex items-center justify-between gap-4">
              {/* Clickable Logo/Title */}
              <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Flow
                  </h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Intäktsintelligens för ArchClinic
                  </p>
                </div>
              </Link>

              {/* Right side controls */}
              <div className="flex items-center gap-2">
                <WorkdayToggle value={workdays} onChange={setWorkdays} />
                <SyncButton />
                <div data-tour="time-period-selector">
                  <TimePeriodSelector 
                    value={timePeriod} 
                    onChange={setTimePeriod}
                    className="w-[120px] md:w-[160px]"
                  />
                </div>
                
                {/* Display Mode Switcher */}
                <DisplayModeSwitcher />
                
                {/* Hamburger Menu */}
                <div data-tour="hamburger-menu">
                  <HamburgerMenu 
                    userRole={session?.user?.role}
                    simulatedRole={simulatedRole}
                    onRoleChange={setSimulatedRole}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content with padding */}
        <div className="p-6 space-y-6">

        {/* Horizontal CTA Cards - Main Action Cards (1+1+1) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 1. Veckans Rekommendationer - PRIMARY */}
          <Link href="/dashboard/actions" data-tour="actions-card">
            <Card className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 text-white hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 transition-all duration-300 cursor-pointer border-0 shadow-xl hover:shadow-2xl h-full">
              <CardContent className="p-6">
                <div className="flex flex-col h-full">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold">Veckans Rekommendationer</h3>
                          <span className="text-lg">✨</span>
                        </div>
                        <p className="text-xs text-white/70 mt-0.5 tracking-wide">
                          NYA V{(() => {
                            const now = new Date();
                            const start = new Date(now.getFullYear(), 0, 1);
                            const diff = now.getTime() - start.getTime();
                            const oneWeek = 1000 * 60 * 60 * 24 * 7;
                            return Math.ceil(diff / oneWeek);
                          })()}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-white/95">
                      <strong className="font-semibold">3 konkreta åtgärder</strong> för att öka intäkter. Flow har analyserat din data! 🚀
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 mt-3">
                    <ArrowRight className="h-4 w-4" />
                    <span className="font-medium">Se rekommendationer</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* 2. Intäktssimulator - SECONDARY */}
          <Link href="/dashboard/simulator" data-tour="simulator-card">
            <Card className="bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 cursor-pointer border-0 shadow-lg hover:shadow-xl h-full">
              <CardContent className="p-6">
                <div className="flex flex-col h-full">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold flex-1">Intäktssimulator</h3>
                    </div>
                    <p className="text-sm text-blue-50/90 leading-relaxed">
                      Testa "what-if" scenarion och se 12-månaders impact på din verksamhet
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 mt-3">
                    <ArrowRight className="h-4 w-4" />
                    <span className="font-medium">Öppna simulator</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* 3. Marketing Intelligence - TERTIARY (PRO+) */}
          <Link href="/dashboard/marketing" data-tour="marketing-card">
            <Card className="bg-purple-600 text-white hover:bg-purple-700 transition-all duration-300 cursor-pointer border-0 shadow-lg hover:shadow-xl h-full">
              <CardContent className="p-6">
                <div className="flex flex-col h-full">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold">Marketing Intelligence</h3>
                        </div>
                        <span className="text-xs bg-white/30 px-2 py-0.5 rounded font-semibold inline-block mt-1">PRO+</span>
                      </div>
                    </div>
                    <p className="text-sm text-purple-50/90 leading-relaxed">
                      Meta kampanjoptimering & kapacitetsstyrning för maximala intäkter
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 mt-3">
                    <ArrowRight className="h-4 w-4" />
                    <span className="font-medium">Gå till Marketing</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Overview Cards - Information Only (Not Clickable) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" data-tour="overview-cards">
          {/* Total Bookings - Blue - STATIC */}
          <Card className="bg-white border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bokningar</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{overview.totalBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.onlineBookingPercentage}% online
              </p>
            </CardContent>
          </Card>

          {/* Total Revenue - Green - STATIC */}
          <Card className="bg-white border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Intäkt (kr)</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {overview.totalRevenue.toLocaleString('sv-SE')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Från {overview.completedBookings} klara
              </p>
            </CardContent>
          </Card>

          {/* Completion Rate - Emerald - STATIC */}
          <Card className="bg-white border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Genomfört</CardTitle>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{overview.completionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.completedBookings} / {overview.totalBookings} bokningar
              </p>
            </CardContent>
          </Card>

          {/* Cancellation Rate - Orange - STATIC */}
          <Card className="bg-white border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avbokningar</CardTitle>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <XCircle className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{overview.cancellationRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.cancelledBookings} avbokade, {overview.noShowBookings} no-show
              </p>
            </CardContent>
          </Card>

          {/* At-Risk Bookings - Red - Expandable - INTERACTIVE */}
          {atRiskMetrics && (
            <ExpandableRiskZone 
              metrics={atRiskMetrics}
              timeRange={14}
            />
          )}
        </div>

        {/* Quick Action Cards - CLEARLY CLICKABLE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Capacity Forecast - CLICKABLE */}
          <Link href="/dashboard/capacity" className="group">
            <Card className="cursor-pointer border-2 border-purple-200 bg-purple-50 hover:border-purple-400 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                  Kapacitetsprognos
                  <ArrowRight className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                </CardTitle>
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-md">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">
                  4 veckor framåt
                </div>
                <p className="text-xs text-purple-600 mt-2 font-medium flex items-center gap-1">
                  Optimera lediga slots
                  <ExternalLink className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Retention Autopilot - CLICKABLE */}
          <Link href="/dashboard/retention" className="group">
            <Card className="cursor-pointer border-2 border-indigo-200 bg-indigo-50 hover:border-indigo-400 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                  Retention Autopilot
                  <ArrowRight className="h-4 w-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                </CardTitle>
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-md">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-700">
                  Identifiera at-risk
                </div>
                <p className="text-xs text-indigo-600 mt-2 font-medium flex items-center gap-1">
                  Rädda kunder innan de churnar
                  <ExternalLink className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Marketing Intelligence - CLICKABLE */}
          <Link href="/dashboard/marketing" className="group">
            <Card className="cursor-pointer border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 hover:border-cyan-400 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-cyan-900 flex items-center gap-2">
                  Marketing Intelligence
                  <ArrowRight className="h-4 w-4 text-cyan-600 group-hover:translate-x-1 transition-transform" />
                </CardTitle>
                <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg shadow-md">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-700">
                  Meta Ads-optimering
                </div>
                <p className="text-xs text-cyan-600 mt-2 font-medium flex items-center gap-1">
                  ROAS, CPL, Budget AI
                  <ExternalLink className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Two Column Layout - Colorful Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Services */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-white">
            <CardHeader className="border-b bg-gradient-to-r from-purple-100/50 to-pink-100/50">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Populäraste Tjänster
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {topServices.map((service, index) => {
                  const colors = [
                    'from-purple-500 to-pink-500',
                    'from-blue-500 to-cyan-500',
                    'from-green-500 to-emerald-500',
                    'from-orange-500 to-red-500',
                    'from-indigo-500 to-purple-500'
                  ];
                  return (
                    <div key={service.serviceId} className="flex items-center justify-between p-3 rounded-lg bg-white border border-purple-100 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${colors[index % colors.length]} text-white font-bold text-sm shadow-md`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{service.name}</p>
                          <p className="text-xs text-purple-600 font-medium">{service.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-700">{service._count.id} <span className="text-xs font-normal">bok</span></p>
                        <p className="text-sm font-semibold text-green-600">
                          {(service._sum.price || 0).toLocaleString('sv-SE')} kr
                        </p>
                      </div>
                    </div>
                  );
                })}
                {topServices.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Ingen tjänstedata tillgänglig
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Staff Performance */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
            <CardHeader className="border-b bg-gradient-to-r from-blue-100/50 to-indigo-100/50">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Users className="h-5 w-5 text-blue-600" />
                Personalprestanda
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {staffPerformance.map((staff, index) => {
                  const colors = [
                    'from-blue-500 to-indigo-500',
                    'from-cyan-500 to-blue-500',
                    'from-teal-500 to-cyan-500',
                    'from-indigo-500 to-blue-500',
                    'from-sky-500 to-blue-500'
                  ];
                  return (
                    <div key={staff.staffId} className="flex items-center justify-between p-3 rounded-lg bg-white border border-blue-100 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${colors[index % colors.length]} text-white font-bold text-sm shadow-md`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{staff.name}</p>
                          <p className="text-xs text-blue-600 font-medium">{staff.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-700">{staff._count.id} <span className="text-xs font-normal">bok</span></p>
                        <p className="text-sm font-semibold text-green-600">
                          {(staff._sum.price || 0).toLocaleString('sv-SE')} kr
                        </p>
                      </div>
                    </div>
                  );
                })}
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

        {/* Flow Insights Section */}
        <InsightsSection days={getDaysFromTimePeriod(timePeriod)} />

        {/* Quick Links to Advanced Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Avancerad Analys & Verktyg</CardTitle>
            <p className="text-sm text-muted-foreground">
              Datadrivna insikter för att optimera din klinik och öka intäkterna
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
                  Förutsägelse av uteblivna besök med åtgärdsrekommendationer för att skydda intäkter
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
                  Datadrivna förutsägelser för framtida intäkter och bokningstrender
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
