
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BackButton } from '@/components/ui/back-button';
import { FlaskConical, Play, Pause, TrendingUp, Eye, MousePointerClick, Target } from 'lucide-react';
import { toast } from 'sonner';

interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: string;
  targetPage: string;
  variants: Array<{
    variant: string;
    views: number;
    clicks: number;
    conversions: number;
    conversionRate: number | null;
  }>;
  trafficSplit: number;
  startDate?: string;
  endDate?: string;
}

export default function ABTestingPage() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ab-testing');
      if (response.ok) {
        const data = await response.json();
        setTests(data);
      }
    } catch (error) {
      console.error('Failed to fetch tests:', error);
      toast.error('Kunde inte hämta A/B-tester');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/ab-testing/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });

      if (response.ok) {
        toast.success('Test startad!');
        fetchTests();
      }
    } catch (error) {
      toast.error('Kunde inte starta test');
    }
  };

  const handleStopTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/ab-testing/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });

      if (response.ok) {
        toast.success('Test stoppad!');
        fetchTests();
      }
    } catch (error) {
      toast.error('Kunde inte stoppa test');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      DRAFT: 'outline',
      RUNNING: 'default',
      PAUSED: 'secondary',
      COMPLETED: 'secondary',
      ARCHIVED: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Laddar A/B-tester...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <BackButton />
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">A/B Testing</h1>
              <p className="text-muted-foreground mt-1">Experimentera och optimera konvertering</p>
            </div>
          </div>
          <Button>
            <FlaskConical className="h-4 w-4 mr-2" />
            Nytt Test
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Totalt Tester</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Aktiva</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tests.filter((t) => t.status === 'RUNNING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Färdiga</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.filter((t) => t.status === 'COMPLETED').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Utkast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {tests.filter((t) => t.status === 'DRAFT').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tests List */}
      <div className="space-y-4">
        {tests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inga A/B-tester än</h3>
              <p className="text-muted-foreground mb-4">
                Börja experimentera med olika versioner för att optimera konvertering
              </p>
              <Button>Skapa Ditt Första Test</Button>
            </CardContent>
          </Card>
        ) : (
          tests.map((test) => (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle>{test.name}</CardTitle>
                      {getStatusBadge(test.status)}
                    </div>
                    {test.description && (
                      <CardDescription className="mt-2">{test.description}</CardDescription>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {test.targetPage}
                      </span>
                      <span>Traffic Split: {test.trafficSplit}%</span>
                      {test.startDate && <span>Started: {new Date(test.startDate).toLocaleDateString('sv-SE')}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {test.status === 'DRAFT' && (
                      <Button size="sm" onClick={() => handleStartTest(test.id)}>
                        <Play className="h-4 w-4 mr-1" />
                        Starta
                      </Button>
                    )}
                    {test.status === 'RUNNING' && (
                      <Button size="sm" variant="outline" onClick={() => handleStopTest(test.id)}>
                        <Pause className="h-4 w-4 mr-1" />
                        Stoppa
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {test.variants.map((variant) => (
                    <div key={variant.variant} className="space-y-3 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Variant {variant.variant}</h4>
                        {variant.conversionRate !== null && (
                          <Badge variant={variant.variant === 'B' ? 'default' : 'secondary'}>
                            {variant.conversionRate.toFixed(2)}% CR
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Eye className="h-4 w-4" />
                            Views
                          </span>
                          <span className="font-medium">{variant.views}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <MousePointerClick className="h-4 w-4" />
                            Clicks
                          </span>
                          <span className="font-medium">{variant.clicks}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            Conversions
                          </span>
                          <span className="font-medium">{variant.conversions}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
