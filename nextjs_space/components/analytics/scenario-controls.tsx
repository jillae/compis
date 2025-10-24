
/**
 * Scenario Controls Component
 * Interactive sliders for adjusting forecast parameters
 */

'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';

interface ScenarioControlsProps {
  historicalMonths: number;
  forecastWeeks: number;
  onHistoricalMonthsChange: (value: number) => void;
  onForecastWeeksChange: (value: number) => void;
}

export function ScenarioControls({
  historicalMonths,
  forecastWeeks,
  onHistoricalMonthsChange,
  onForecastWeeksChange,
}: ScenarioControlsProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Historical Period */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="historical-months">
                Baserat på senaste:
              </Label>
              <span className="text-sm font-medium">
                {historicalMonths} månader
              </span>
            </div>
            <Slider
              id="historical-months"
              value={[historicalMonths]}
              onValueChange={([v]) => onHistoricalMonthsChange(v)}
              min={1}
              max={12}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Ju längre historik, desto mer data för prognosen
            </p>
          </div>

          {/* Forecast Period */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="forecast-weeks">
                Prognos framåt:
              </Label>
              <span className="text-sm font-medium">
                {forecastWeeks} veckor
              </span>
            </div>
            <Slider
              id="forecast-weeks"
              value={[forecastWeeks]}
              onValueChange={([v]) => onForecastWeeksChange(v)}
              min={4}
              max={52}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              13 veckor = 1 kvartal, 26 veckor = 6 månader
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
