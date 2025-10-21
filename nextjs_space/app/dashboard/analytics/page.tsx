
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Users, Target, AlertCircle } from 'lucide-react';
import { MRRChart } from '@/components/analytics/mrr-chart';
import { CustomerDistributionChart } from '@/components/analytics/customer-distribution-chart';
import { ChurnAnalysis } from '@/components/analytics/churn-analysis';
import { CohortHeatmap } from '@/components/analytics/cohort-heatmap';
import { TopCustomersTable } from '@/components/analytics/top-customers-table';
import { useClinic } from '@/context/ClinicContext';

export default function AnalyticsPage() {
  const { data: session } = useSession() || {};
  const { selectedClinic } = useClinic();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [churnData, setChurnData] = useState<any>(null);
  const [cohortData, setCohortData] = useState<any>(null);

  // Determine which clinic to fetch data for
  const clinicId = session?.user?.role === 'SUPER_ADMIN' && selectedClinic
    ? selectedClinic
    : session?.user?.clinicId;

  useEffect(() => {
    if (!clinicId) return;

    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const [revenueRes, customersRes, churnRes, cohortsRes] = await Promise.all([
          fetch(`/api/analytics/revenue?clinicId=${clinicId}`),
          fetch(`/api/analytics/customers?clinicId=${clinicId}`),
          fetch(`/api/analytics/churn?clinicId=${clinicId}&months=12`),
          fetch(`/api/analytics/cohorts?clinicId=${clinicId}&months=6`),
        ]);

        if (revenueRes.ok) {
          const data = await revenueRes.json();
          setMetrics(data);
        }

        if (customersRes.ok) {
          const data = await customersRes.json();
          setCustomerData(data);
        }

        if (churnRes.ok) {
          const data = await churnRes.json();
          setChurnData(data);
        }

        if (cohortsRes.ok) {
          const data = await cohortsRes.json();
          setCohortData(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [clinicId]);

  if (isLoading || !metrics) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laddar analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate current metrics from latest data point
  const latestMetric = metrics.metrics?.[metrics.metrics.length - 1];
  const previousMetric = metrics.metrics?.[metrics.metrics.length - 2];
  
  const currentMRR = latestMetric?.mrr || 0;
  const currentARR = latestMetric?.arr || 0;
  const activeCustomers = latestMetric?.activeCustomers || 0;
  const avgChurnRate = churnData?.avgChurnRate || 0;

  const mrrGrowth = latestMetric && previousMetric
    ? ((latestMetric.mrr - previousMetric.mrr) / previousMetric.mrr) * 100
    : 0;

  const exportToCSV = () => {
    if (!metrics.metrics) return;

    const csvData = metrics.metrics.map((m: any) => ({
      Date: m.date,
      MRR: m.mrr,
      ARR: m.arr,
      'Active Customers': m.activeCustomers,
      'New Customers': m.newCustomers,
      'Churned Customers': m.churnedCustomers,
      'Churn Rate': (m.churnRate * 100).toFixed(2) + '%',
      'Retention Rate': (m.retentionRate * 100).toFixed(2) + '%',
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row: any) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-metrics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Revenue Intelligence Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive MRR/ARR tracking and customer analytics
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportera till CSV
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('sv-SE', {
                style: 'currency',
                currency: 'SEK',
                minimumFractionDigits: 0,
              }).format(currentMRR)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className={mrrGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {mrrGrowth >= 0 ? '+' : ''}{mrrGrowth.toFixed(1)}%
              </span>{' '}
              från förra månaden
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('sv-SE', {
                style: 'currency',
                currency: 'SEK',
                minimumFractionDigits: 0,
              }).format(currentARR)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              MRR × 12 månader
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestMetric?.newCustomers || 0} nya denna månad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(avgChurnRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Retention: {((1 - avgChurnRate) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Kunder</TabsTrigger>
          <TabsTrigger value="churn">Churn & Retention</TabsTrigger>
          <TabsTrigger value="cohorts">Cohort Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <MRRChart data={metrics.metrics} />
            <CustomerDistributionChart data={customerData} />
          </div>
          <TopCustomersTable clinicId={clinicId || ''} />
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <CustomerDistributionChart data={customerData} fullWidth />
          <TopCustomersTable clinicId={clinicId || ''} />
        </TabsContent>

        <TabsContent value="churn" className="space-y-4">
          <ChurnAnalysis data={churnData} />
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-4">
          <CohortHeatmap data={cohortData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
