
'use client';

import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";

interface OptimalCorridorControlsProps {
  minUtilization: number;
  maxUtilization: number;
  onChange: (min: number, max: number) => void;
  minPlannedIntake?: number;
  maxPlannedIntake?: number;
  onChangePlannedIntake?: (min: number, max: number) => void;
}

export function OptimalCorridorControls({
  minUtilization,
  maxUtilization,
  onChange,
  minPlannedIntake,
  maxPlannedIntake,
  onChangePlannedIntake
}: OptimalCorridorControlsProps) {
  // Ensure we have valid values
  const safeMinUtilization = Math.max(0, minUtilization);
  const safeMaxUtilization = Math.min(100, Math.max(minUtilization + 5, maxUtilization));
  const safeMinPlannedIntake = minPlannedIntake !== undefined ? Math.max(0, minPlannedIntake) : 1;
  const safeMaxPlannedIntake = maxPlannedIntake !== undefined ? Math.max(minPlannedIntake || 1 + 1, maxPlannedIntake) : 10;

  // Utilization corridor handlers
  const handleMinUtilizationChange = (value: number[]) => {
    if (!value.length) return;
    const newMin = Math.min(value[0], safeMaxUtilization - 5);
    onChange(newMin, safeMaxUtilization);
  };

  const handleMaxUtilizationChange = (value: number[]) => {
    if (!value.length) return;
    const newMax = Math.max(value[0], safeMinUtilization + 5);
    onChange(safeMinUtilization, newMax);
  };

  const handleMinUtilizationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value < safeMaxUtilization) {
      onChange(value, safeMaxUtilization);
    }
  };

  const handleMaxUtilizationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > safeMinUtilization && value <= 100) {
      onChange(safeMinUtilization, value);
    }
  };

  // Planned intake corridor handlers
  const handleMinPlannedIntakeChange = (value: number[]) => {
    if (!value.length || !onChangePlannedIntake) return;
    const newMin = Math.min(value[0], safeMaxPlannedIntake - 1);
    onChangePlannedIntake(newMin, safeMaxPlannedIntake);
  };

  const handleMaxPlannedIntakeChange = (value: number[]) => {
    if (!value.length || !onChangePlannedIntake) return;
    const newMax = Math.max(value[0], safeMinPlannedIntake + 1);
    onChangePlannedIntake(safeMinPlannedIntake, newMax);
  };

  const handleMinPlannedIntakeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChangePlannedIntake) return;
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value < safeMaxPlannedIntake) {
      onChangePlannedIntake(value, safeMaxPlannedIntake);
    }
  };

  const handleMaxPlannedIntakeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChangePlannedIntake) return;
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > safeMinPlannedIntake) {
      onChangePlannedIntake(safeMinPlannedIntake, value);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🎯 Definiera Optimal Korridor</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Utilization Corridor */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Kapacitetsutnyttjande</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="minUtilization">Minimal optimal beläggning</Label>
              <Input
                id="minUtilization-input"
                type="number"
                value={safeMinUtilization}
                onChange={handleMinUtilizationInput}
                className="w-20 text-right"
                min={0}
                max={safeMaxUtilization - 5}
              />
            </div>
            <div className="flex items-center gap-2">
              <Slider 
                id="minUtilization"
                min={0}
                max={90}
                step={5}
                value={[safeMinUtilization]}
                onValueChange={handleMinUtilizationChange}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right">{safeMinUtilization}%</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="maxUtilization">Maximal optimal beläggning</Label>
              <Input
                id="maxUtilization-input"
                type="number"
                value={safeMaxUtilization}
                onChange={handleMaxUtilizationInput}
                className="w-20 text-right"
                min={safeMinUtilization + 5}
                max={100}
              />
            </div>
            <div className="flex items-center gap-2">
              <Slider 
                id="maxUtilization"
                min={10}
                max={100}
                step={5}
                value={[safeMaxUtilization]}
                onValueChange={handleMaxUtilizationChange}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right">{safeMaxUtilization}%</span>
            </div>
          </div>
        </div>

        {/* Planned Intake Corridor */}
        {onChangePlannedIntake && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-sm">Kundintag per Period</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="minPlannedIntake">Minimalt optimalt kundintag</Label>
                <Input
                  id="minPlannedIntake-input"
                  type="number"
                  value={safeMinPlannedIntake}
                  onChange={handleMinPlannedIntakeInput}
                  className="w-20 text-right"
                  min={0}
                  max={safeMaxPlannedIntake - 1}
                />
              </div>
              <div className="flex items-center gap-2">
                <Slider 
                  id="minPlannedIntake"
                  min={0}
                  max={30}
                  step={1}
                  value={[safeMinPlannedIntake]}
                  onValueChange={handleMinPlannedIntakeChange}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">{safeMinPlannedIntake}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="maxPlannedIntake">Maximalt optimalt kundintag</Label>
                <Input
                  id="maxPlannedIntake-input"
                  type="number"
                  value={safeMaxPlannedIntake}
                  onChange={handleMaxPlannedIntakeInput}
                  className="w-20 text-right"
                  min={safeMinPlannedIntake + 1}
                  max={50}
                />
              </div>
              <div className="flex items-center gap-2">
                <Slider 
                  id="maxPlannedIntake"
                  min={1}
                  max={50}
                  step={1}
                  value={[safeMaxPlannedIntake]}
                  onValueChange={handleMaxPlannedIntakeChange}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">{safeMaxPlannedIntake}</span>
              </div>
            </div>
          </div>
        )}

        {/* Info box */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md text-sm text-blue-800">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Den optimala korridoren ({safeMinUtilization}% - {safeMaxUtilization}%) definierar det ideala beläggningsintervallet för din verksamhet.
            {onChangePlannedIntake && (
              <> Kundintagskorridoren ({safeMinPlannedIntake} - {safeMaxPlannedIntake} kunder) definierar det optimala intervallet för inflöde av nya kunder.</>
            )}
            {' '}Systemet kommer att varna när prognosen går utanför dessa gränser.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
