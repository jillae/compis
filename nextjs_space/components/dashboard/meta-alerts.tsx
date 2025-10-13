
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  TrendingDown,
  Info,
  ExternalLink,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';

interface MetaAlert {
  severity: 'critical' | 'warning' | 'info';
  type: 'budget' | 'lead_quality' | 'lag_detected' | 'creative_fatigue';
  title: string;
  description: string;
  recommendation: string;
  impactEstimate: number;
  daysUntilImpact: number;
}

interface MetaAlertsData {
  alerts: MetaAlert[];
  bookingLag: {
    days: number;
    description: string;
  };
  budgetRecommendation: {
    recommendedDailyBudget: number;
    currentBudget: number;
    expectedBookings: number;
    confidence: number;
  };
  metrics: {
    current: {
      totalSpend: number;
      avgROAS: number;
      totalConversions: number;
    };
    historical: {
      totalSpend: number;
      avgROAS: number;
      totalConversions: number;
    };
  };
}

export function MetaAlerts() {
  const [data, setData] = useState<MetaAlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/marketing/meta/alerts?days=30');
      const result = await response.json();

      if (result.setupRequired) {
        setSetupRequired(true);
      } else if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Failed to fetch META alerts:', err);
      setError('Kunde inte hämta META-data');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5" />;
      case 'warning':
        return <TrendingDown className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Hämtar META-data...</p>
        </CardContent>
      </Card>
    );
  }

  if (setupRequired) {
    return (
      <Card className="border-2 border-dashed border-orange-300 bg-orange-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-lg">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>META Marketing Integration</CardTitle>
              <CardDescription>Proaktiv annonsövervakning inte konfigurerad</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Setup Krävs</AlertTitle>
            <AlertDescription>
              För att aktivera proaktiv META-analys behöver du konfigurera din META Marketing API access.
            </AlertDescription>
          </Alert>

          <div className="bg-white rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm">Vad du får med META-integration:</h4>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Varningar <strong>INNAN</strong> kalendern blir tom (baserat på annonstro̊ghet)</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Realtidsövervakning av lead-kvalitet och konvertering</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Automatiska budgetrekommendationer baserat på ROAS</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Creative fatigue-detektering innan prestandan sjunker</span>
              </li>
            </ul>
          </div>

          <Button className="w-full" onClick={() => window.open('https://developers.facebook.com/docs/marketing-api/get-started', '_blank')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Läs Setup-guide
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-4">{error || 'Ingen data tillgänglig'}</p>
          <Button variant="outline" size="sm" onClick={fetchAlerts}>
            Försök igen
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isExpanded) {
    return (
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500 p-2 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">META Ads Intelligence</h3>
                <p className="text-sm text-muted-foreground">
                  {data.alerts.length} aktiva varningar • {data.bookingLag.days} dagars tröghet
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(true)}>
              <ChevronDown className="h-4 w-4 mr-2" />
              Visa Detaljer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { alerts, bookingLag, budgetRecommendation, metrics } = data;

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">META Ads Intelligence</CardTitle>
              <CardDescription>Proaktiv övervakning & rekommendationer</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-3">
            <p className="text-xs text-purple-700 font-medium mb-1">Bokningströghet</p>
            <p className="text-2xl font-bold text-purple-900">{bookingLag.days} dagar</p>
            <p className="text-xs text-purple-600 mt-1">Annons → Bokning</p>
          </div>
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-700 font-medium mb-1">Aktuell ROAS</p>
            <p className="text-2xl font-bold text-blue-900">{metrics.current.avgROAS.toFixed(2)}</p>
            <p className="text-xs text-blue-600 mt-1">
              {metrics.current.avgROAS > metrics.historical.avgROAS ? '↑' : '↓'} vs historik
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-lg p-3">
            <p className="text-xs text-green-700 font-medium mb-1">Rekommenderad Budget</p>
            <p className="text-2xl font-bold text-green-900">
              {budgetRecommendation.recommendedDailyBudget.toLocaleString('sv-SE')} kr
            </p>
            <p className="text-xs text-green-600 mt-1">
              {budgetRecommendation.confidence * 100}% säkerhet
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Alerts */}
        {alerts.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Aktiva Varningar ({alerts.length})
            </h4>
            {alerts.map((alert, index) => (
              <Alert
                key={index}
                className={`border-l-4 ${
                  alert.severity === 'critical'
                    ? 'border-l-red-500 bg-red-50'
                    : alert.severity === 'warning'
                    ? 'border-l-orange-500 bg-orange-50'
                    : 'border-l-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)} text-white`}>
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <AlertTitle className="text-base font-semibold">{alert.title}</AlertTitle>
                      <Badge variant="outline" className="shrink-0">
                        {alert.daysUntilImpact}d påverkan
                      </Badge>
                    </div>
                    <AlertDescription className="text-sm">
                      {alert.description}
                    </AlertDescription>
                    <div className="bg-white/50 rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium">💡 Rekommendation:</p>
                      <p className="text-sm text-muted-foreground">{alert.recommendation}</p>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">Potentiell påverkan:</span>
                        <span className="text-sm font-bold">
                          {alert.impactEstimate.toLocaleString('sv-SE')} kr
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        ) : (
          <Alert className="bg-green-50 border-green-200">
            <Info className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Allt ser bra ut! ✅</AlertTitle>
            <AlertDescription className="text-green-800">
              Inga varningar för tillfället. Dina META-kampanjer presterar enligt förväntningarna.
            </AlertDescription>
          </Alert>
        )}

        {/* Budget Recommendation */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Budgetoptimering
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Nuvarande budget/dag:</p>
              <p className="text-lg font-bold">
                {budgetRecommendation.currentBudget.toLocaleString('sv-SE')} kr
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Förväntade bokningar:</p>
              <p className="text-lg font-bold">{budgetRecommendation.expectedBookings} / dag</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Baserat på historisk data och {bookingLag.days} dagars tröghet
          </p>
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={fetchAlerts}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Uppdatera Data
        </Button>
      </CardContent>
    </Card>
  );
}
