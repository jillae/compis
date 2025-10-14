
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActionCard } from '@/components/intelligence/action-card';
import { Sparkles, RefreshCw, TrendingUp, Calendar } from 'lucide-react';
import Link from 'next/link';
import { BackButton } from '@/components/ui/back-button';

interface WeeklyAction {
  id: string;
  priority: number;
  title: string;
  category: string;
  expectedImpact: number;
  description: string;
  reasoning: string;
  status: string;
  steps: any[];
  evidence: any[];
  weekStartDate: string;
}

export default function ActionsPage() {
  const { data: session } = useSession() || {};
  const [actions, setActions] = useState<WeeklyAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/intelligence/actions/weekly');
      const result = await response.json();

      if (result.success) {
        setActions(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch actions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleActionUpdate = async (actionId: string, updates: any) => {
    try {
      const response = await fetch('/api/intelligence/actions/weekly', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, ...updates }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setActions((prev) =>
          prev.map((action) =>
            action.id === actionId ? { ...action, ...updates } : action
          )
        );
      }
    } catch (err) {
      console.error('Failed to update action:', err);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('Detta kommer ta bort nuvarande rekommendationer och generera nya. Fortsätt?')) {
      return;
    }

    setRegenerating(true);
    try {
      // Delete old actions (you may want to add an API endpoint for this)
      // For now, we'll just refetch
      await fetchActions();
    } finally {
      setRegenerating(false);
    }
  };

  const totalImpact = actions
    .filter((a) => a.status !== 'DISMISSED')
    .reduce((sum, a) => sum + a.expectedImpact, 0);

  const completedActions = actions.filter((a) => a.status === 'COMPLETED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Genererar Rekommendationer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Fel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={fetchActions}>Försök igen</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <BackButton href="/dashboard" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
            Regenerera
          </Button>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="h-8 w-8" />
              <h1 className="text-3xl md:text-4xl font-bold">Veckans Prioriteter</h1>
            </div>
            <p className="text-lg text-blue-50 mb-4">
              Datadrivna rekommendationer för att optimera din klinik och öka intäkter
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 mt-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm opacity-90">Total Potential</span>
                </div>
                <div className="text-3xl font-bold">
                  +{totalImpact.toLocaleString('sv-SE')} kr
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm opacity-90">Denna Vecka</span>
                </div>
                <div className="text-3xl font-bold">
                  {actions.filter((a) => a.status !== 'DISMISSED').length} actions
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm opacity-90">Genomförda</span>
                </div>
                <div className="text-3xl font-bold">
                  {completedActions}/{actions.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions List */}
        {actions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Inga rekommendationer än</h3>
              <p className="text-muted-foreground mb-4">
                Vi behöver lite mer data för att generera personaliserade rekommendationer.
              </p>
              <Link href="/dashboard">
                <Button>Tillbaka till Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {actions
              .filter((a) => a.status !== 'DISMISSED')
              .map((action) => (
                <ActionCard 
                  key={action.id} 
                  action={action as any} 
                  onUpdate={handleActionUpdate}
                />
              ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="py-6">
            <h3 className="font-semibold mb-2">💡 Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Nya rekommendationer genereras automatiskt varje måndag</li>
              <li>Checka av steg allteftersom du genomför dem</li>
              <li>Förväntad impact är baserad på din historiska data</li>
              <li>Du kan avfärda rekommendationer som inte passar din klinik</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
