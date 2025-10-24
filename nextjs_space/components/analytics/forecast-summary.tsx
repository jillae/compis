
/**
 * Forecast Summary Component
 * Displays key metrics and insights from the forecast
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ForecastSummaryProps {
  forecast: Array<{
    dateStr: string;
    optimistic: number;
    realistic: number;
    conservative: number;
    confidence: number;
  }>;
}

export function ForecastSummary({ forecast }: ForecastSummaryProps) {
  if (forecast.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Ingen prognosdata tillgänglig
      </div>
    );
  }

  // Calculate next 4 weeks (1 month)
  const next4Weeks = forecast
    .slice(0, 4)
    .reduce((sum, f) => sum + f.realistic, 0);

  // Calculate next 13 weeks (1 quarter)
  const next13Weeks = forecast.reduce((sum, f) => sum + f.realistic, 0);

  // Find lowest week (risk indicator)
  const lowestWeek = forecast.reduce((min, f) =>
    f.conservative < min.conservative ? f : min
  );

  // Find highest week (opportunity indicator)
  const highestWeek = forecast.reduce((max, f) =>
    f.optimistic > max.optimistic ? f : max
  );

  // Calculate trend (first week vs last week)
  const firstWeek = forecast[0].realistic;
  const lastWeek = forecast[forecast.length - 1].realistic;
  const trend = ((lastWeek - firstWeek) / firstWeek) * 100;
  const isTrendingUp = trend > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Next 4 weeks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Nästa 4 veckor</CardTitle>
          {isTrendingUp ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-orange-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(next4Weeks).toLocaleString('sv-SE')} kr
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Förväntad likviditet (realistisk)
          </p>
        </CardContent>
      </Card>

      {/* Next 13 weeks (Quarter) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Nästa kvartal</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(next13Weeks).toLocaleString('sv-SE')} kr
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total prognos (13 veckor)
          </p>
        </CardContent>
      </Card>

      {/* Risk Alert (Lowest week) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Riskvarning</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(lowestWeek.conservative).toLocaleString('sv-SE')} kr
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Lägsta veckan: {format(parseISO(lowestWeek.dateStr), 'MMM dd')}
          </p>
        </CardContent>
      </Card>

      {/* Opportunity (Highest week) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Bästa vecka</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {Math.round(highestWeek.optimistic).toLocaleString('sv-SE')} kr
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Högsta veckan: {format(parseISO(highestWeek.dateStr), 'MMM dd')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
