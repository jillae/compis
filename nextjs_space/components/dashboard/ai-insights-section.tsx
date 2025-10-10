
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb, Users, Award, CheckCircle, Circle, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

interface Insight {
  title: string;
  priority: 'high' | 'medium' | 'low';
  impact: number;
  description: string;
  recommendation: string;
  metrics: Record<string, any>;
}

interface AIInsightsProps {
  days: number;
}

interface Dismissal {
  insightKey: string;
  insightDate: string;
  dismissedAt: string;
  notes?: string;
}

const priorityConfig = {
  high: { color: 'bg-red-500', icon: AlertCircle, label: 'Hög Prioritet' },
  medium: { color: 'bg-yellow-500', icon: TrendingUp, label: 'Medel Prioritet' },
  low: { color: 'bg-blue-500', icon: Lightbulb, label: 'Låg Prioritet' },
};

const insightIcons = {
  'Revenue Recovery Opportunity': TrendingUp,
  'Peak Time Optimization': AlertCircle,
  'Customer Retention Strategy': Users,
  'Service Portfolio Optimization': Lightbulb,
  'Staff Performance Insights': Award,
};

export function AIInsightsSection({ days }: AIInsightsProps) {
  const [insights, setInsights] = useState<Record<string, Insight> | null>(null);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());
  const [showDismissed, setShowDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
    fetchDismissals();
  }, [days]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/ai-insights?days=${days}`);
      const result = await response.json();
      if (result.success) {
        setInsights(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDismissals = async () => {
    try {
      const response = await fetch('/api/dashboard/insights/dismiss');
      const result = await response.json();
      if (result.success) {
        const dismissed = new Set<string>(
          result.data.map((d: Dismissal) => `${d.insightKey}_${d.insightDate}`)
        );
        setDismissedInsights(dismissed);
      }
    } catch (error) {
      console.error('Failed to fetch dismissals:', error);
    }
  };

  const handleDismiss = async (insightKey: string) => {
    try {
      setDismissing(insightKey);
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch('/api/dashboard/insights/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insightKey,
          insightDate: today
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setDismissedInsights(prev => new Set(prev).add(`${insightKey}_${today}`));
        toast.success('Insikt markerad som hanterad! ✓');
      } else {
        toast.error('Kunde inte markera insikt');
      }
    } catch (error) {
      console.error('Error dismissing insight:', error);
      toast.error('Ett fel uppstod');
    } finally {
      setDismissing(null);
    }
  };

  const isInsightDismissed = (insightKey: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dismissedInsights.has(`${insightKey}_${today}`);
  };

  if (loading) {
    return (
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            AI-insikter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  // Filter insights based on dismissed status
  const filteredInsights = insights
    ? Object.entries(insights).filter(([key]) => {
        const dismissed = isInsightDismissed(key);
        return showDismissed ? dismissed : !dismissed;
      })
    : [];

  const dismissedCount = insights
    ? Object.keys(insights).filter(key => isInsightDismissed(key)).length
    : 0;

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            AI-drivna Intäktsinsikter
          </CardTitle>
          {dismissedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDismissed(!showDismissed)}
              className="text-xs"
            >
              {showDismissed ? (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Visa aktiva ({Object.keys(insights || {}).length - dismissedCount})
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Visa hanterade ({dismissedCount})
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredInsights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {showDismissed 
              ? 'Inga hanterade insikter än' 
              : 'Inga aktiva insikter just nu - bra jobbat! 🎉'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInsights.map(([key, insight]) => {
              const priorityInfo = priorityConfig[insight.priority];
              const IconComponent = insightIcons[insight.title as keyof typeof insightIcons] || Lightbulb;
              const isDismissed = isInsightDismissed(key);

              return (
                <div
                  key={key}
                  className={`p-4 bg-background rounded-lg border transition-colors ${
                    isDismissed 
                      ? 'border-green-300 bg-green-50/50 opacity-75' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <IconComponent className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{insight.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${priorityInfo.color} text-white border-0`}>
                        {priorityInfo.label}
                      </Badge>
                      <Button
                        variant={isDismissed ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => !isDismissed && handleDismiss(key)}
                        disabled={dismissing === key || isDismissed}
                        className={isDismissed ? 'bg-green-600 hover:bg-green-700' : ''}
                        title={isDismissed ? 'Hanterad' : 'Markera som hanterad'}
                      >
                        {dismissing === key ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : isDismissed ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>

                  <div className="bg-primary/10 rounded-md p-3 mb-3 border-l-4 border-primary">
                    <p className="text-sm font-medium">💡 Rekommendation:</p>
                    <p className="text-sm mt-1">{insight.recommendation}</p>
                  </div>

                  {insight.impact > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        Potential påverkan: +{Math.round(insight.impact).toLocaleString('sv-SE')} kr/månad
                      </span>
                    </div>
                  )}

                  {Object.keys(insight.metrics).length > 0 && (
                    <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2">
                      {Object.entries(insight.metrics).map(([metricKey, metricValue]) => (
                        <div key={metricKey} className="text-xs">
                          <span className="text-muted-foreground capitalize">
                            {metricKey.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="ml-1 font-medium">
                            {typeof metricValue === 'number'
                              ? metricValue.toLocaleString('sv-SE')
                              : metricValue}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
