
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  CheckCircle2,
  X,
  RefreshCw,
  ChevronRight,
  Sparkles,
  DollarSign,
  Target,
  Clock,
  Users,
  Calendar,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActionCard } from '@/components/dashboard/action-card';

interface ActionData {
  id: string;
  priority: number;
  title: string;
  category: string;
  expectedImpact: number;
  description: string;
  reasoning: string;
  status: string;
  steps: Array<{
    description: string;
    completed: boolean;
  }>;
  evidence: Array<{
    metric: string;
    currentValue: number;
    targetValue: number;
  }>;
  createdAt: string;
  completedAt?: string;
  dismissedAt?: string;
}

interface StatsData {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  dismissed: number;
  totalImpact: number;
  potentialImpact: number;
}

const categoryIcons: Record<string, any> = {
  CAPACITY_OPTIMIZATION: Calendar,
  PRICING: DollarSign,
  MARKETING: TrendingUp,
  SERVICE_MIX: Target,
  CUSTOMER_RETENTION: Users,
  STAFFING: Clock,
};

const categoryColors: Record<string, string> = {
  CAPACITY_OPTIMIZATION: 'text-blue-600 bg-blue-50',
  PRICING: 'text-green-600 bg-green-50',
  MARKETING: 'text-purple-600 bg-purple-50',
  SERVICE_MIX: 'text-orange-600 bg-orange-50',
  CUSTOMER_RETENTION: 'text-pink-600 bg-pink-50',
  STAFFING: 'text-indigo-600 bg-indigo-50',
};

const priorityLabels: Record<number, { label: string; color: string }> = {
  1: { label: 'KRITISK', color: 'bg-red-500' },
  2: { label: 'HÖG', color: 'bg-orange-500' },
  3: { label: 'MEDEL', color: 'bg-yellow-500' },
};

export default function ActionsPage() {
  const { data: session } = useSession() || {};
  const [actions, setActions] = useState<ActionData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/actions/list');
      const data = await response.json();
      
      if (data.success) {
        setActions(data.actions);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/ai/recommendations');
      const data = await response.json();
      
      if (data.success) {
        await loadActions(); // Reload list
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setGenerating(false);
    }
  };

  const updateAction = async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/ai/recommendations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        await loadActions(); // Reload list
      }
    } catch (error) {
      console.error('Error updating action:', error);
    }
  };

  const filteredActions = actions.filter(action => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return action.status === 'PENDING';
    if (activeTab === 'active') return action.status === 'IN_PROGRESS';
    if (activeTab === 'completed') return action.status === 'COMPLETED';
    return true;
  });

  const criticalActions = filteredActions.filter(a => a.priority === 1);
  const highActions = filteredActions.filter(a => a.priority === 2);
  const mediumActions = filteredActions.filter(a => a.priority === 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Laddar rekommendationer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-blue-600" />
            AI Rekommendationer
          </h1>
          <p className="text-gray-600 mt-1">
            Proaktiva åtgärder för att maximera din intäkt
          </p>
        </div>
        <Button
          onClick={generateRecommendations}
          disabled={generating}
          className="flex items-center gap-2"
        >
          {generating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Genererar...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Uppdatera Rekommendationer
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aktiva Åtgärder</p>
                  <p className="text-2xl font-bold">{stats.pending + stats.inProgress}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Slutförda</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Potentiell Impact</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(stats.potentialImpact).toLocaleString('sv-SE')} kr
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Impact</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(stats.totalImpact).toLocaleString('sv-SE')} kr
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {actions.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inga rekommendationer än</h3>
              <p className="text-gray-600 mb-6">
                Klicka på "Uppdatera Rekommendationer" för att generera AI-drivna åtgärder
              </p>
              <Button onClick={generateRecommendations} disabled={generating}>
                {generating ? 'Genererar...' : 'Generera Rekommendationer'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      {actions.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              Alla ({actions.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Väntande ({stats?.pending || 0})
            </TabsTrigger>
            <TabsTrigger value="active">
              Pågående ({stats?.inProgress || 0})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Slutförda ({stats?.completed || 0})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Critical Actions */}
      {criticalActions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-xl font-bold">Kritiska Åtgärder</h2>
            <Badge className="bg-red-500">Prioritet 1</Badge>
          </div>
          <div className="space-y-4">
            {criticalActions.map(action => (
              <ActionCard
                key={action.id}
                action={action}
                onUpdate={updateAction}
              />
            ))}
          </div>
        </div>
      )}

      {/* High Priority Actions */}
      {highActions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-orange-600" />
            <h2 className="text-xl font-bold">Höga Prioritet</h2>
            <Badge className="bg-orange-500">Prioritet 2</Badge>
          </div>
          <div className="space-y-4">
            {highActions.map(action => (
              <ActionCard
                key={action.id}
                action={action}
                onUpdate={updateAction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority Actions */}
      {mediumActions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-yellow-600" />
            <h2 className="text-xl font-bold">Medel Prioritet</h2>
            <Badge className="bg-yellow-500">Prioritet 3</Badge>
          </div>
          <div className="space-y-4">
            {mediumActions.map(action => (
              <ActionCard
                key={action.id}
                action={action}
                onUpdate={updateAction}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
