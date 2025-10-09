
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb, Users, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
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

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          AI-drivna Intäktsinsikter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(insights).map(([key, insight]) => {
            const priorityInfo = priorityConfig[insight.priority];
            const IconComponent = insightIcons[insight.title as keyof typeof insightIcons] || Lightbulb;

            return (
              <div
                key={key}
                className="p-4 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{insight.title}</h3>
                  </div>
                  <Badge variant="outline" className={`${priorityInfo.color} text-white border-0`}>
                    {priorityInfo.label}
                  </Badge>
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
                      Potential impact: +{Math.round(insight.impact).toLocaleString('sv-SE')} kr/månad
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
      </CardContent>
    </Card>
  );
}
