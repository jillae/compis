
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
import { ErrorState } from '@/components/dashboard/error-state';
import { CompetitorCard } from '@/components/dashboard/competitor-card';
import { PriceComparisonMatrix } from '@/components/dashboard/price-comparison-matrix';
import { 
  Target,
  Plus,
  TrendingUp,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/error-messages';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Competitor {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  location: string | null;
  category: string | null;
  tier: string | null;
  services: string[];
  overallRating: number | null;
  totalReviews: number | null;
  isActive: boolean;
  isMonitoring: boolean;
  lastCheckedAt: string | null;
  priceSnapshots: Array<{
    id: string;
    serviceName: string;
    price: number;
    ourPrice: number | null;
    priceDiff: number | null;
    priceDiffPct: number | null;
    snapshotDate: string;
  }>;
}

export default function CompetitorsPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    location: '',
    category: 'direct',
    tier: 'mid',
    services: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const fetchCompetitors = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch('/api/competitors');
      
      if (!response.ok) {
        throw new Error(getErrorMessage('FETCH_FAILED'));
      }
      
      const data = await response.json();
      setCompetitors(data.competitors || []);
    } catch (err) {
      const errorMessage = getErrorMessage(err as Error);
      setError(errorMessage);
      console.error('Error fetching competitors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setAdding(true);
      const response = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          services: formData.services.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add competitor');
      }

      toast({
        title: 'Competitor Added',
        description: `${formData.name} has been added to your competitor list`,
      });

      setAddDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        website: '',
        location: '',
        category: 'direct',
        tier: 'mid',
        services: '',
      });
      
      await fetchCompetitors();
    } catch (err) {
      toast({
        title: 'Failed to Add Competitor',
        description: getErrorMessage(err as Error),
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const activeCompetitors = competitors.filter(c => c.isActive);
  const monitoredCompetitors = competitors.filter(c => c.isMonitoring);

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
          title="Failed to Load Competitors"
          message={error}
          onRetry={fetchCompetitors}
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
          <h1 className="text-3xl font-bold mt-2">Competitive Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Monitor competitors and track market positioning
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Competitor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Competitor</DialogTitle>
              <DialogDescription>
                Add a competitor to monitor their pricing and services
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCompetitor} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Competitor Name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the competitor"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct Competitor</SelectItem>
                      <SelectItem value="indirect">Indirect Competitor</SelectItem>
                      <SelectItem value="emerging">Emerging Competitor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tier">Price Tier</Label>
                  <Select
                    value={formData.tier}
                    onValueChange={(value) => setFormData({ ...formData, tier: value })}
                  >
                    <SelectTrigger id="tier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="mid">Mid-range</SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://competitor.com"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Stockholm, Sweden"
                />
              </div>

              <div>
                <Label htmlFor="services">Services (comma-separated)</Label>
                <Input
                  id="services"
                  value={formData.services}
                  onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                  placeholder="Massage, Facial, Manicure"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={adding}>
                  {adding ? 'Adding...' : 'Add Competitor'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Competitors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCompetitors.length}</div>
            <p className="text-xs text-muted-foreground">Active tracking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitored</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{monitoredCompetitors.length}</div>
            <p className="text-xs text-muted-foreground">Price monitoring active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Snapshots</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {competitors.reduce((sum, c) => sum + c.priceSnapshots.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Historical data points</p>
          </CardContent>
        </Card>
      </div>

      {/* Price Comparison Matrix */}
      {competitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Price Comparison</CardTitle>
            <CardDescription>
              Compare your pricing with competitors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PriceComparisonMatrix competitors={competitors} />
          </CardContent>
        </Card>
      )}

      {/* Competitor List */}
      <Card>
        <CardHeader>
          <CardTitle>Competitor Profiles</CardTitle>
          <CardDescription>
            {competitors.length} competitors tracked
          </CardDescription>
        </CardHeader>
        <CardContent>
          {competitors.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No Competitors Yet"
              description="Add your first competitor to start tracking market positioning and pricing."
              actionLabel="Add Competitor"
              onAction={() => setAddDialogOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {competitors.map((competitor) => (
                <CompetitorCard 
                  key={competitor.id} 
                  competitor={competitor}
                  onUpdate={fetchCompetitors}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
