
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Users, Calendar, AlertCircle, ArrowLeft, Target } from 'lucide-react';
import Link from 'next/link';
import { BackButton } from '@/components/ui/back-button';
import { OptimalCorridorControls } from '@/components/dashboard/optimal-corridor-controls';
import { CapacityUtilizationChart } from '@/components/dashboard/capacity-utilization-chart';
import { ChartDisplayControls } from '@/components/dashboard/chart-display-controls';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ProjectionData {
  currentMetrics: {
    bookingsPerDay: string;
    avgBookingValue: string;
    noShowRate: string;
    customersPerMonth: string;
  };
  historical: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
  baseline: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
  optimized: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
  summary: {
    totalProjectedRevenue: number;
    totalBaselineRevenue: number;
    potentialGain: number;
    percentageIncrease: string;
  };
}

export default function SimulatorPage() {
  const [data, setData] = useState<ProjectionData | null>(null);
  const [loading, setLoading] = useState(true);

  // Slider states
  const [bookingsPerDay, setBookingsPerDay] = useState<number>(0);
  const [avgBookingValue, setAvgBookingValue] = useState<number>(0);
  const [newCustomersPerMonth, setNewCustomersPerMonth] = useState<number>(0);
  const [retentionRate, setRetentionRate] = useState<number>(70);
  const [noShowRate, setNoShowRate] = useState<number>(0);
  
  // Optimal corridor states
  const [optimalMinUtilization, setOptimalMinUtilization] = useState<number>(70);
  const [optimalMaxUtilization, setOptimalMaxUtilization] = useState<number>(90);
  const [optimalMinPlannedIntake, setOptimalMinPlannedIntake] = useState<number>(1);
  const [optimalMaxPlannedIntake, setOptimalMaxPlannedIntake] = useState<number>(10);

  // Chart display controls
  const [showUtilization, setShowUtilization] = useState<boolean>(true);
  const [showActiveCustomers, setShowActiveCustomers] = useState<boolean>(false);
  const [showSuggestedIntake, setShowSuggestedIntake] = useState<boolean>(false);
  const [showIdleTime, setShowIdleTime] = useState<boolean>(false);
  const [showPlannedIntake, setShowPlannedIntake] = useState<boolean>(false);
  const [showOptimalUtilizationCorridor, setShowOptimalUtilizationCorridor] = useState<boolean>(true);
  const [showOptimalIntakeCorridor, setShowOptimalIntakeCorridor] = useState<boolean>(false);
  const [showBreakEvenLine, setShowBreakEvenLine] = useState<boolean>(false);
  const [showMaxCapacityLevel, setShowMaxCapacityLevel] = useState<boolean>(false);

  const handleOptimalCorridorChange = (min: number, max: number) => {
    setOptimalMinUtilization(min);
    setOptimalMaxUtilization(max);
  };

  const handleOptimalPlannedIntakeChange = (min: number, max: number) => {
    setOptimalMinPlannedIntake(min);
    setOptimalMaxPlannedIntake(max);
  };

  const handleToggleMetric = (metric: string, enabled: boolean) => {
    switch (metric) {
      case 'utilization':
        setShowUtilization(enabled);
        break;
      case 'activeCustomers':
        setShowActiveCustomers(enabled);
        break;
      case 'suggestedIntake':
        setShowSuggestedIntake(enabled);
        break;
      case 'idleTime':
        setShowIdleTime(enabled);
        break;
      case 'plannedIntake':
        setShowPlannedIntake(enabled);
        break;
    }
  };

  const handleToggleOverlay = (overlay: string, enabled: boolean) => {
    switch (overlay) {
      case 'optimalUtilizationCorridor':
        setShowOptimalUtilizationCorridor(enabled);
        break;
      case 'optimalIntakeCorridor':
        setShowOptimalIntakeCorridor(enabled);
        break;
      case 'breakEvenLine':
        setShowBreakEvenLine(enabled);
        break;
      case 'maxCapacityLevel':
        setShowMaxCapacityLevel(enabled);
        break;
    }
  };

  // Debounced fetch
  const fetchProjections = useCallback(async (params: any) => {
    try {
      const response = await fetch('/api/simulator/projections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const result = await response.json();
      setData(result);
      
      // Initialize sliders with current metrics if not set
      if (bookingsPerDay === 0) {
        setBookingsPerDay(parseFloat(result.currentMetrics.bookingsPerDay));
        setAvgBookingValue(parseFloat(result.currentMetrics.avgBookingValue));
        setNewCustomersPerMonth(parseInt(result.currentMetrics.customersPerMonth));
        setNoShowRate(parseFloat(result.currentMetrics.noShowRate));
      }
    } catch (error) {
      console.error('Error fetching projections:', error);
    } finally {
      setLoading(false);
    }
  }, [bookingsPerDay]);

  // Initial load
  useEffect(() => {
    fetchProjections({});
  }, []);

  // Update projections when sliders change (with debounce)
  useEffect(() => {
    if (!loading && bookingsPerDay > 0) {
      const timer = setTimeout(() => {
        fetchProjections({
          bookingsPerDay,
          avgBookingValue,
          newCustomersPerMonth,
          retentionRate,
          noShowRate,
        });
      }, 500); // 500ms debounce

      return () => clearTimeout(timer);
    }
  }, [bookingsPerDay, avgBookingValue, newCustomersPerMonth, retentionRate, noShowRate, loading, fetchProjections]);

  if (loading || !data || !data.summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Beräknar projektioner...</p>
        </div>
      </div>
    );
  }

  // Combine historical and projected data for charts
  const combinedRevenueData = [
    ...data.historical.map((h) => ({ ...h, type: 'Historisk' })),
    ...data.baseline.map((b) => ({ ...b, type: 'Baseline' })),
    ...data.optimized.map((o) => ({ ...o, type: 'Optimerad' })),
  ];

  const comparisonData = data.baseline.map((b, idx) => ({
    month: b.month,
    baseline: b.revenue,
    optimized: data.optimized[idx].revenue,
    gain: data.optimized[idx].revenue - b.revenue,
  }));

  // Generate mock capacity utilization data for demonstration
  const capacityData = data.baseline.map((b, idx) => {
    // Calculate a utilization rate based on bookings and sliders
    const baseUtilization = 60 + (bookingsPerDay / 40) * 30 + Math.random() * 10;
    const utilization = Math.min(100, Math.max(40, baseUtilization + idx * 2));
    
    return {
      week: `V${idx + 1}`,
      utilization: Math.round(utilization * 10) / 10,
      bookings: Math.round(bookingsPerDay * 7),
      capacity: Math.round((bookingsPerDay * 7) / (utilization / 100))
    };
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background border-b shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Tillbaka
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">📊 Intäktssimulator</h1>
                <p className="text-muted-foreground mt-1">
                  Justera parametrar och se direkt hur det påverkar dina intäkter
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content with padding */}
      <div className="p-6 space-y-6">

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuvarande Trajectory</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.totalBaselineRevenue.toLocaleString('sv-SE')} kr
            </div>
            <p className="text-xs text-muted-foreground">Kommande 12 månader</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimerad Projektion</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.summary.totalProjectedRevenue.toLocaleString('sv-SE')} kr
            </div>
            <p className="text-xs text-muted-foreground">Med dina justeringar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Ökning</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              +{data.summary.potentialGain.toLocaleString('sv-SE')} kr
            </div>
            <p className="text-xs text-green-600">+{data.summary.percentageIncrease}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Per Månad (snitt)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{Math.round(data.summary.potentialGain / 12).toLocaleString('sv-SE')} kr
            </div>
            <p className="text-xs text-muted-foreground">Extra intäkt/månad</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Controls */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>🎛️ Justera Parametrar</CardTitle>
            <CardDescription>Dra i slidersen och se vad som händer!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bookings per day */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Bokningar per dag</Label>
                <span className="text-2xl font-bold text-primary">{bookingsPerDay.toFixed(1)}</span>
              </div>
              <Slider
                value={[bookingsPerDay]}
                onValueChange={(v) => setBookingsPerDay(v[0])}
                min={0}
                max={50}
                step={0.5}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                Nuvarande: {data.currentMetrics.bookingsPerDay}/dag
              </p>
            </div>

            {/* Avg booking value */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Genomsnittligt bokningsvärde</Label>
                <span className="text-2xl font-bold text-primary">{avgBookingValue.toFixed(0)} kr</span>
              </div>
              <Slider
                value={[avgBookingValue]}
                onValueChange={(v) => setAvgBookingValue(v[0])}
                min={0}
                max={5000}
                step={50}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                Nuvarande: {data.currentMetrics.avgBookingValue} kr
              </p>
            </div>

            {/* New customers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Nya kunder per månad</Label>
                <span className="text-2xl font-bold text-primary">{newCustomersPerMonth}</span>
              </div>
              <Slider
                value={[newCustomersPerMonth]}
                onValueChange={(v) => setNewCustomersPerMonth(v[0])}
                min={0}
                max={200}
                step={5}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                Nuvarande: {data.currentMetrics.customersPerMonth}/månad
              </p>
            </div>

            {/* Retention rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Retention rate</Label>
                <span className="text-2xl font-bold text-primary">{retentionRate}%</span>
              </div>
              <Slider
                value={[retentionRate]}
                onValueChange={(v) => setRetentionRate(v[0])}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                Hur stor andel kunder kommer tillbaka
              </p>
            </div>

            {/* No-show rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>No-show rate</Label>
                <span className="text-2xl font-bold text-orange-600">{noShowRate.toFixed(1)}%</span>
              </div>
              <Slider
                value={[noShowRate]}
                onValueChange={(v) => setNoShowRate(v[0])}
                min={0}
                max={30}
                step={0.5}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                Nuvarande: {data.currentMetrics.noShowRate}%
              </p>
            </div>

            <div className="pt-4 border-t space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setBookingsPerDay(parseFloat(data.currentMetrics.bookingsPerDay));
                  setAvgBookingValue(parseFloat(data.currentMetrics.avgBookingValue));
                  setNewCustomersPerMonth(parseInt(data.currentMetrics.customersPerMonth));
                  setNoShowRate(parseFloat(data.currentMetrics.noShowRate));
                  setRetentionRate(70);
                }}
              >
                🔄 Återställ till nuläge/snitt
              </Button>
              <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  Projektionerna baseras på din historiska data och inkluderar 2% tillväxt per månad.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>📈 12-Månaders Projektion</CardTitle>
            <CardDescription>
              Jämförelse mellan nuvarande trajectory och optimerad projektion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="revenue" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="revenue">Intäkter</TabsTrigger>
                <TabsTrigger value="comparison">Jämförelse</TabsTrigger>
                <TabsTrigger value="capacity">Kapacitet</TabsTrigger>
              </TabsList>

              <TabsContent value="revenue" className="space-y-4">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => `${value.toLocaleString('sv-SE')} kr`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="baseline"
                      name="Baseline (nuvarande)"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="optimized"
                      name="Optimerad"
                      stroke="#22c55e"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="comparison" className="space-y-4">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => `${value.toLocaleString('sv-SE')} kr`}
                    />
                    <Legend />
                    <Bar dataKey="baseline" name="Baseline" fill="#94a3b8" />
                    <Bar dataKey="optimized" name="Optimerad" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="capacity" className="space-y-4">
                <CapacityUtilizationChart
                  data={capacityData}
                  optimalMinUtilization={optimalMinUtilization}
                  optimalMaxUtilization={optimalMaxUtilization}
                  showOptimalZones={showOptimalUtilizationCorridor}
                  title=""
                  description=""
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Chart Display Controls - Right below the charts */}
        <ChartDisplayControls
          showUtilization={showUtilization}
          showActiveCustomers={showActiveCustomers}
          showSuggestedIntake={showSuggestedIntake}
          showIdleTime={showIdleTime}
          showPlannedIntake={showPlannedIntake}
          onToggleMetric={handleToggleMetric}
          showOptimalUtilizationCorridor={showOptimalUtilizationCorridor}
          showOptimalIntakeCorridor={showOptimalIntakeCorridor}
          showBreakEvenLine={showBreakEvenLine}
          showMaxCapacityLevel={showMaxCapacityLevel}
          onToggleOverlay={handleToggleOverlay}
        />
      </div>

      {/* Optimal Corridor Controls */}
      <div className="grid gap-6 lg:grid-cols-2">
        <OptimalCorridorControls
          minUtilization={optimalMinUtilization}
          maxUtilization={optimalMaxUtilization}
          onChange={handleOptimalCorridorChange}
          minPlannedIntake={optimalMinPlannedIntake}
          maxPlannedIntake={optimalMaxPlannedIntake}
          onChangePlannedIntake={handleOptimalPlannedIntakeChange}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Optimal Korridor Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Beläggningskorridor</span>
                <span className="font-semibold text-green-600">
                  {optimalMinUtilization}% - {optimalMaxUtilization}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Kundintag per period</span>
                <span className="font-semibold text-blue-600">
                  {optimalMinPlannedIntake} - {optimalMaxPlannedIntake} kunder
                </span>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <h4 className="font-semibold text-green-800 text-sm mb-1">✓ Optimal Zon</h4>
                <p className="text-xs text-green-700">
                  När beläggningen ligger mellan {optimalMinUtilization}% och {optimalMaxUtilization}% är din klinik 
                  i den gröna zonen med optimal kapacitetsutnyttjande.
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <h4 className="font-semibold text-yellow-800 text-sm mb-1">⚠ Underutnyttjad</h4>
                <p className="text-xs text-yellow-700">
                  Under {optimalMinUtilization}% har du outnyttjad kapacitet - möjlighet att ta in fler kunder 
                  och öka intäkterna.
                </p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <h4 className="font-semibold text-red-800 text-sm mb-1">🔴 Överbelastad</h4>
                <p className="text-xs text-red-700">
                  Över {optimalMaxUtilization}% riskerar du kvalitetsförsämring och personalutbrändhet - 
                  överväg att utöka kapacitet eller begränsa intaget.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Vad betyder detta?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                Om du ökar bokningar med +2/dag
              </h4>
              <p className="text-sm text-muted-foreground">
                Med nuvarande pris blir det ca{' '}
                <span className="font-bold text-green-600">
                  +{Math.round((2 * 30 * parseFloat(data.currentMetrics.avgBookingValue) * 12)).toLocaleString('sv-SE')} kr
                </span>{' '}
                extra per år!
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-blue-600" />
                Om du höjer snittpriset med 10%
              </h4>
              <p className="text-sm text-muted-foreground">
                Det blir{' '}
                <span className="font-bold text-blue-600">
                  +{Math.round((data.summary.totalBaselineRevenue * 0.1)).toLocaleString('sv-SE')} kr
                </span>{' '}
                extra utan fler bokningar!
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-orange-600" />
                Om du minskar no-show med 5%
              </h4>
              <p className="text-sm text-muted-foreground">
                Det sparar{' '}
                <span className="font-bold text-orange-600">
                  ca +{Math.round((data.summary.totalBaselineRevenue * 0.05)).toLocaleString('sv-SE')} kr
                </span>{' '}
                i förlorad intäkt!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
