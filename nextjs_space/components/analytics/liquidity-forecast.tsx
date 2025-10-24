
/**
 * Liquidity Forecast Component
 * Main component for forward-looking cashflow planning
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info } from 'lucide-react';
import { ForecastChart } from './forecast-chart';
import { ForecastSummary } from './forecast-summary';
import { ScenarioControls } from './scenario-controls';

interface ForecastData {
  historical: Array<{ date: string; amount: number }>;
  forecast: Array<{
    dateStr: string;
    optimistic: number;
    realistic: number;
    conservative: number;
    confidence: number;
  }>;
  metadata: {
    generatedAt: string;
    basedOnMonths: number;
    forecastWeeks: number;
    dataPoints: number;
    trendStrength: number;
  };
}

export function LiquidityForecast() {
  const [viewMode, setViewMode] = useState<'historical' | 'forecast' | 'both'>('both');
  const [forecastWeeks, setForecastWeeks] = useState(13);
  const [historicalMonths, setHistoricalMonths] = useState(3);
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch forecast data
  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/analytics/forecast?historicalMonths=${historicalMonths}&forecastWeeks=${forecastWeeks}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch forecast data');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Forecast error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [historicalMonths, forecastWeeks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Ett fel uppstod vid hämtning av prognosdata: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>Ingen prognosdata tillgänglig</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Prognosen baseras på historiska försäljnings- och banktransaktionsdata.
          Tre scenarier visas: <strong>Optimistisk</strong> (bästa fallet),{' '}
          <strong>Realistisk</strong> (mest sannolik), och{' '}
          <strong>Konservativ</strong> (värsta fallet).
        </AlertDescription>
      </Alert>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Visningsläge</CardTitle>
                  <CardDescription>Välj vad som ska visas i grafen</CardDescription>
                </div>
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => {
                    if (value) setViewMode(value as typeof viewMode);
                  }}
                >
                  <ToggleGroupItem value="historical">Historik</ToggleGroupItem>
                  <ToggleGroupItem value="forecast">Prognos</ToggleGroupItem>
                  <ToggleGroupItem value="both">Båda</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </CardHeader>
          </Card>
        </div>

        <ScenarioControls
          historicalMonths={historicalMonths}
          forecastWeeks={forecastWeeks}
          onHistoricalMonthsChange={setHistoricalMonths}
          onForecastWeeksChange={setForecastWeeks}
        />
      </div>

      {/* Summary Cards */}
      <ForecastSummary forecast={data.forecast} />

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Likviditetsplanering</CardTitle>
          <CardDescription>
            Baserat på {data.metadata.dataPoints} datapunkter från de senaste{' '}
            {data.metadata.basedOnMonths} månaderna.
            Trendstyrka: {(data.metadata.trendStrength * 100).toFixed(0)}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForecastChart
            historical={data.historical}
            forecast={data.forecast}
            viewMode={viewMode}
          />
        </CardContent>
      </Card>
    </div>
  );
}
