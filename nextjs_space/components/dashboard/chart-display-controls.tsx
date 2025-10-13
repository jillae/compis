
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ChartDisplayControlsProps {
  // Visible metrics
  showUtilization?: boolean;
  showActiveCustomers?: boolean;
  showSuggestedIntake?: boolean;
  showIdleTime?: boolean;
  showPlannedIntake?: boolean;
  onToggleMetric?: (metric: string, enabled: boolean) => void;

  // Visible overlays/zones
  showOptimalUtilizationCorridor?: boolean;
  showOptimalIntakeCorridor?: boolean;
  showBreakEvenLine?: boolean;
  showMaxCapacityLevel?: boolean;
  onToggleOverlay?: (overlay: string, enabled: boolean) => void;
}

export function ChartDisplayControls({
  showUtilization = true,
  showActiveCustomers = false,
  showSuggestedIntake = false,
  showIdleTime = false,
  showPlannedIntake = false,
  onToggleMetric,
  
  showOptimalUtilizationCorridor = true,
  showOptimalIntakeCorridor = false,
  showBreakEvenLine = false,
  showMaxCapacityLevel = false,
  onToggleOverlay,
}: ChartDisplayControlsProps) {
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kapacitet & Beläggning</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics section */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Visa i diagram</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="metric-utilization"
                checked={showUtilization}
                onCheckedChange={(checked) => onToggleMetric?.('utilization', checked as boolean)}
              />
              <Label
                htmlFor="metric-utilization"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  Beläggning (%)
                </span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="metric-idle-time"
                checked={showIdleTime}
                onCheckedChange={(checked) => onToggleMetric?.('idleTime', checked as boolean)}
              />
              <Label
                htmlFor="metric-idle-time"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                  Lediga tider
                </span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="metric-active-customers"
                checked={showActiveCustomers}
                onCheckedChange={(checked) => onToggleMetric?.('activeCustomers', checked as boolean)}
              />
              <Label
                htmlFor="metric-active-customers"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  Aktiva kunder
                </span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="metric-planned-intake"
                checked={showPlannedIntake}
                onCheckedChange={(checked) => onToggleMetric?.('plannedIntake', checked as boolean)}
              />
              <Label
                htmlFor="metric-planned-intake"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
                  Planerat kundintag
                </span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="metric-suggested-intake"
                checked={showSuggestedIntake}
                onCheckedChange={(checked) => onToggleMetric?.('suggestedIntake', checked as boolean)}
              />
              <Label
                htmlFor="metric-suggested-intake"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  Föreslagt kundintag
                </span>
              </Label>
            </div>
          </div>
        </div>

        {/* Overlays/zones section */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-semibold text-muted-foreground">Områden och linjer</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="overlay-optimal-utilization" className="text-sm font-normal cursor-pointer">
                Optimal beläggningskorridor
              </Label>
              <Switch
                id="overlay-optimal-utilization"
                checked={showOptimalUtilizationCorridor}
                onCheckedChange={(checked) => onToggleOverlay?.('optimalUtilizationCorridor', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="overlay-optimal-intake" className="text-sm font-normal cursor-pointer">
                Optimal kundintags-korridor
              </Label>
              <Switch
                id="overlay-optimal-intake"
                checked={showOptimalIntakeCorridor}
                onCheckedChange={(checked) => onToggleOverlay?.('optimalIntakeCorridor', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="overlay-break-even" className="text-sm font-normal cursor-pointer">
                Break-even linje
              </Label>
              <Switch
                id="overlay-break-even"
                checked={showBreakEvenLine}
                onCheckedChange={(checked) => onToggleOverlay?.('breakEvenLine', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="overlay-max-capacity" className="text-sm font-normal cursor-pointer">
                Max kapacitetsnivå
              </Label>
              <Switch
                id="overlay-max-capacity"
                checked={showMaxCapacityLevel}
                onCheckedChange={(checked) => onToggleOverlay?.('maxCapacityLevel', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
