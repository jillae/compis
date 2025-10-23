
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
import { 
  Zap, 
  Plus, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  TrendingUp,
  Clock,
  Users,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/error-messages';

interface MarketingTrigger {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  channel: string;
  isActive: boolean;
  priority: number;
  totalExecutions: number;
  successfulSends: number;
  failedSends: number;
  totalCostSEK: number;
  totalRevenueSEK: number;
  averageROAS: number | null;
  maxExecutionsPerCustomer: number;
  cooldownDays: number;
  maxDailyExecutions: number;
  lastCheckedAt: string | null;
  _count: {
    executions: number;
  };
}

export default function MarketingTriggersPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  const [triggers, setTriggers] = useState<MarketingTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchTriggers();
  }, []);

  const fetchTriggers = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch('/api/marketing-triggers');
      
      if (!response.ok) {
        throw new Error(getErrorMessage('FETCH_FAILED'));
      }
      
      const data = await response.json();
      setTriggers(data.triggers || []);
    } catch (err) {
      const errorMessage = getErrorMessage(err as Error);
      setError(errorMessage);
      console.error('Error fetching triggers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (triggerId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/marketing-triggers/${triggerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        toast({
          title: 'Uppdaterad',
          description: `Trigger ${!isActive ? 'aktiverad' : 'pausad'}`,
        });
        fetchTriggers();
      }
    } catch (error) {
      console.error('Error toggling trigger:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte uppdatera trigger',
        variant: 'destructive',
      });
    }
  };

  const handleExecuteTrigger = async (triggerId: string) => {
    setExecuting(triggerId);
    try {
      const response = await fetch(`/api/marketing-triggers/${triggerId}/execute`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Trigger Kördes',
          description: `Skickade: ${data.result.executed}, Hoppade över: ${data.result.skipped}, Misslyckades: ${data.result.failed}`,
        });
        fetchTriggers();
      }
    } catch (error) {
      console.error('Error executing trigger:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte köra trigger',
        variant: 'destructive',
      });
    } finally {
      setExecuting(null);
    }
  };

  const handleExecuteAll = async () => {
    setExecuting('all');
    try {
      const response = await fetch('/api/marketing-triggers/execute-all', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Alla Triggers Kördes',
          description: `Totalt skickade: ${data.result.totalExecuted}, Hoppade över: ${data.result.totalSkipped}`,
        });
        fetchTriggers();
      }
    } catch (error) {
      console.error('Error executing all triggers:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte köra alla triggers',
        variant: 'destructive',
      });
    } finally {
      setExecuting(null);
    }
  };

  const handleDelete = async (triggerId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna trigger?')) {
      return;
    }

    try {
      const response = await fetch(`/api/marketing-triggers/${triggerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Borttagen',
          description: 'Trigger har tagits bort',
        });
        fetchTriggers();
      }
    } catch (error) {
      console.error('Error deleting trigger:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte ta bort trigger',
        variant: 'destructive',
      });
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      health_status_change: 'Hälsostatus Ändring',
      no_visit_days: 'Ingen Visit',
      high_value_at_risk: 'Högvärdeskund i Risk',
      low_engagement: 'Låg Engagemang',
      birthday: 'Födelsedag',
      milestone: 'Milstolpe',
    };
    return labels[type] || type;
  };

  const getChannelIcon = (channel: string) => {
    return channel === 'email' ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />;
  };

  // Loading state
  if (loading || status === 'loading') {
    return <ListPageSkeleton items={6} />;
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <BackButton href="/dashboard/marketing" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Zap className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
              Automatiska Marknadsföringstriggrar
            </h1>
          </div>
        </div>
        <ErrorState message={error} onRetry={fetchTriggers} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <BackButton href="/dashboard/marketing" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Zap className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
              Automatiska Marknadsföringstriggrar
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Skicka automatiska kampanjer baserat på kundbeteende
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleExecuteAll}
            disabled={executing !== null || triggers.filter(t => t.isActive).length === 0}
            variant="outline"
            size="sm"
            className="md:size-default"
          >
            {executing === 'all' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                Kör...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Kör Alla
              </>
            )}
          </Button>
          <Button 
            onClick={() => router.push('/dashboard/marketing-triggers/create')}
            size="sm"
            className="md:size-default"
          >
            <Plus className="h-4 w-4 mr-2" />
            Skapa Trigger
          </Button>
        </div>
      </div>

      {triggers.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="Inga Triggers Ännu"
          description="Skapa din första automatiska marknadsföringstriggern för att börja engagera kunder automatiskt"
          actionLabel="Skapa Din Första Trigger"
          onAction={() => router.push('/dashboard/marketing-triggers/create')}
        />
      ) : (
        <div className="grid gap-4">
          {triggers.map((trigger) => {
            const roas = trigger.averageROAS || 0;
            const successRate = trigger.totalExecutions > 0 
              ? ((trigger.successfulSends / trigger.totalExecutions) * 100).toFixed(1)
              : '0';

            return (
              <Card key={trigger.id} className={!trigger.isActive ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getChannelIcon(trigger.channel)}
                      <div>
                        <CardTitle className="text-lg">{trigger.name}</CardTitle>
                        <CardDescription>{trigger.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={trigger.isActive ? 'default' : 'secondary'}>
                        {trigger.isActive ? 'Aktiv' : 'Pausad'}
                      </Badge>
                      <Badge variant="outline">
                        Prioritet {trigger.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Typ</p>
                        <p className="font-medium">{getTriggerTypeLabel(trigger.triggerType)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Totalt Skickade</p>
                        <p className="font-medium">{trigger.successfulSends}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Framgångsgrad</p>
                        <p className="font-medium">{successRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ROAS</p>
                        <p className="font-medium text-green-600">
                          {roas > 0 ? `${roas.toFixed(2)}x` : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Max {trigger.maxExecutionsPerCustomer}x per kund
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {trigger.cooldownDays} dagar cooldown
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Max {trigger.maxDailyExecutions}/dag
                      </Badge>
                    </div>

                    {trigger.lastCheckedAt && (
                      <p className="text-xs text-muted-foreground">
                        Senast kontrollerad: {new Date(trigger.lastCheckedAt).toLocaleString('sv-SE')}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(trigger.id, trigger.isActive)}
                        className="flex-shrink-0"
                      >
                        {trigger.isActive ? (
                          <>
                            <Pause className="h-4 w-4 mr-1 md:mr-2" />
                            <span className="hidden sm:inline">Pausa</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1 md:mr-2" />
                            <span className="hidden sm:inline">Aktivera</span>
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExecuteTrigger(trigger.id)}
                        disabled={executing !== null}
                        className="flex-shrink-0"
                      >
                        {executing === trigger.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-1 md:mr-2"></div>
                            <span className="hidden sm:inline">Kör...</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1 md:mr-2" />
                            <span className="hidden sm:inline">Kör Nu</span>
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/dashboard/marketing-triggers/${trigger.id}/metrics`)}
                        className="flex-shrink-0"
                      >
                        <TrendingUp className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Statistik</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/dashboard/marketing-triggers/${trigger.id}/edit`)}
                        className="flex-shrink-0"
                      >
                        <Edit className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Redigera</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(trigger.id)}
                        className="text-red-600 hover:text-red-700 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Ta Bort</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
