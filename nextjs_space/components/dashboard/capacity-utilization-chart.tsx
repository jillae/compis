
'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface CapacityUtilizationChartProps {
  data: Array<{
    week: string;
    utilization: number;
    bookings?: number;
    capacity?: number;
  }>;
  optimalMinUtilization: number;
  optimalMaxUtilization: number;
  showOptimalZones?: boolean;
  title?: string;
  description?: string;
}

export function CapacityUtilizationChart({
  data,
  optimalMinUtilization,
  optimalMaxUtilization,
  showOptimalZones = true,
  title = 'Kapacitetsutnyttjande över Tid',
  description = 'Visualisering av klinikens beläggning med optimal korridor'
}: CapacityUtilizationChartProps) {
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{data.week}</p>
          <p className="text-sm">
            <span className="font-medium">Beläggning:</span>{' '}
            <span className={`font-bold ${
              data.utilization >= optimalMinUtilization && data.utilization <= optimalMaxUtilization
                ? 'text-green-600'
                : data.utilization > optimalMaxUtilization
                ? 'text-red-600'
                : 'text-yellow-600'
            }`}>
              {data.utilization.toFixed(1)}%
            </span>
          </p>
          {data.bookings !== undefined && (
            <p className="text-sm">
              <span className="font-medium">Bokningar:</span> {data.bookings}
            </p>
          )}
          {data.capacity !== undefined && (
            <p className="text-sm">
              <span className="font-medium">Kapacitet:</span> {data.capacity}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Calculate status for legend
  const statusCounts = useMemo(() => {
    const optimal = data.filter(d => d.utilization >= optimalMinUtilization && d.utilization <= optimalMaxUtilization).length;
    const overloaded = data.filter(d => d.utilization > optimalMaxUtilization).length;
    const underutilized = data.filter(d => d.utilization < optimalMinUtilization).length;
    return { optimal, overloaded, underutilized };
  }, [data, optimalMinUtilization, optimalMaxUtilization]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status summary */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 text-center">
              <p className="text-yellow-800 font-semibold">{statusCounts.underutilized}</p>
              <p className="text-yellow-700 text-xs">Underutnyttjad</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-md p-2 text-center">
              <p className="text-green-800 font-semibold">{statusCounts.optimal}</p>
              <p className="text-green-700 text-xs">Optimal</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-md p-2 text-center">
              <p className="text-red-800 font-semibold">{statusCounts.overloaded}</p>
              <p className="text-red-700 text-xs">Överbelastad</p>
            </div>
          </div>

          {/* Chart */}
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 14, right: 30, left: 5, bottom: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="week"
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  domain={[0, 120]}
                  ticks={[0, 20, 40, 60, 80, 100, 120]}
                  label={{ value: 'Beläggning (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />

                {/* Optimal zone (green) */}
                {showOptimalZones && (
                  <ReferenceArea
                    y1={optimalMinUtilization}
                    y2={optimalMaxUtilization}
                    stroke="none"
                    fill="#22c55e"
                    fillOpacity={0.1}
                  />
                )}

                {/* Warning zone - above optimal (red) */}
                {showOptimalZones && (
                  <ReferenceArea
                    y1={optimalMaxUtilization}
                    y2={120}
                    stroke="none"
                    fill="#ef4444"
                    fillOpacity={0.08}
                  />
                )}

                {/* Warning zone - below optimal (yellow) */}
                {showOptimalZones && (
                  <ReferenceArea
                    y1={0}
                    y2={optimalMinUtilization}
                    stroke="none"
                    fill="#eab308"
                    fillOpacity={0.08}
                  />
                )}

                {/* Reference lines for optimal corridor */}
                <ReferenceLine
                  y={optimalMinUtilization}
                  stroke="#22c55e"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: `Min optimal: ${optimalMinUtilization}%`, position: 'insideTopRight', fill: '#22c55e', fontSize: 11 }}
                />
                <ReferenceLine
                  y={optimalMaxUtilization}
                  stroke="#22c55e"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: `Max optimal: ${optimalMaxUtilization}%`, position: 'insideBottomRight', fill: '#22c55e', fontSize: 11 }}
                />

                {/* Actual utilization line */}
                <Line
                  type="monotone"
                  dataKey="utilization"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#8b5cf6' }}
                  activeDot={{ r: 6 }}
                  name="Beläggning"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
