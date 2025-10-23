
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/back-button';
import { ListPageSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { EmptyState } from '@/components/dashboard/empty-state';
import { ErrorState, InlineErrorState } from '@/components/dashboard/error-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HealthScoreChart } from '@/components/dashboard/health-score-chart';
import { CustomerHealthCard } from '@/components/dashboard/customer-health-card';
import { 
  Heart, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Filter,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/error-messages';

interface CustomerHealth {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  healthScore: number | null;
  healthStatus: 'EXCELLENT' | 'HEALTHY' | 'AT_RISK' | 'CRITICAL' | null;
  lastHealthCalculation: string | null;
  riskFactors: string[] | null;
  totalVisits: number;
  lifetimeValue: number;
}

type HealthStatusFilter = 'ALL' | 'EXCELLENT' | 'HEALTHY' | 'AT_RISK' | 'CRITICAL';

export default function CustomerHealthPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<CustomerHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<HealthStatusFilter>('ALL');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchCustomerHealth();
  }, []);

  const fetchCustomerHealth = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch('/api/customer-health');
      
      if (!response.ok) {
        throw new Error(getErrorMessage('FETCH_FAILED'));
      }
      
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (err) {
      const errorMessage = getErrorMessage(err as Error);
      setError(errorMessage);
      console.error('Error fetching customer health:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshHealthScores = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/customer-health', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh health scores');
      }

      const data = await response.json();
      
      toast({
        title: 'Health Scores Updated',
        description: `Updated ${data.results.length} customer health scores`,
      });

      // Refresh the list
      await fetchCustomerHealth();
    } catch (err) {
      toast({
        title: 'Refresh Failed',
        description: getErrorMessage(err as Error),
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate metrics
  const healthMetrics = {
    excellent: customers.filter(c => c.healthStatus === 'EXCELLENT').length,
    healthy: customers.filter(c => c.healthStatus === 'HEALTHY').length,
    atRisk: customers.filter(c => c.healthStatus === 'AT_RISK').length,
    critical: customers.filter(c => c.healthStatus === 'CRITICAL').length,
    avgScore: customers.length > 0 
      ? Math.round(customers.reduce((sum, c) => sum + (c.healthScore || 0), 0) / customers.length)
      : 0,
  };

  // Filter customers
  const filteredCustomers = statusFilter === 'ALL' 
    ? customers 
    : customers.filter(c => c.healthStatus === statusFilter);

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <ListPageSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <BackButton href="/dashboard" />
        <ErrorState 
          title="Failed to Load Customer Health"
          message={error}
          onRetry={fetchCustomerHealth}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <BackButton href="/dashboard" />
          <h1 className="text-3xl font-bold mt-2">Customer Health</h1>
          <p className="text-muted-foreground mt-1">
            Monitor customer engagement and health scores
          </p>
        </div>
        <Button 
          onClick={handleRefreshHealthScores} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Updating...' : 'Refresh Scores'}
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthMetrics.avgScore}</div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excellent</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthMetrics.excellent}</div>
            <p className="text-xs text-muted-foreground">Score 76-100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <Heart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{healthMetrics.healthy}</div>
            <p className="text-xs text-muted-foreground">Score 51-75</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{healthMetrics.atRisk}</div>
            <p className="text-xs text-muted-foreground">Score 26-50</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{healthMetrics.critical}</div>
            <p className="text-xs text-muted-foreground">Score 0-25</p>
          </CardContent>
        </Card>
      </div>

      {/* Health Distribution Chart */}
      {customers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Health Score Distribution</CardTitle>
            <CardDescription>Visual breakdown of customer health statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <HealthScoreChart 
              excellent={healthMetrics.excellent}
              healthy={healthMetrics.healthy}
              atRisk={healthMetrics.atRisk}
              critical={healthMetrics.critical}
            />
          </CardContent>
        </Card>
      )}

      {/* Filter & Customer List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>
                {filteredCustomers.length} of {customers.length} customers
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as HealthStatusFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Customers</SelectItem>
                  <SelectItem value="EXCELLENT">Excellent</SelectItem>
                  <SelectItem value="HEALTHY">Healthy</SelectItem>
                  <SelectItem value="AT_RISK">At Risk</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <EmptyState
              icon={Users}
              title={statusFilter === 'ALL' ? 'No Customers Yet' : `No ${statusFilter} Customers`}
              description={statusFilter === 'ALL' 
                ? 'Customer health data will appear here once you have customers with bookings.'
                : `There are no customers in the ${statusFilter} health category.`}
            />
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <CustomerHealthCard 
                  key={customer.id} 
                  customer={customer}
                  onUpdate={fetchCustomerHealth}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
