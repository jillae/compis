
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { translations, chartColors, formatters, formatSwedishDate } from '@/lib/translations';

interface EnhancedRevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
  compareData?: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
  showComparison?: boolean;
}

export function EnhancedRevenueChart({ data, compareData, showComparison = false }: EnhancedRevenueChartProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Open by default
  const [viewMode, setViewMode] = useState<'revenue' | 'bookings' | 'both'>('both');

  // Calculate metrics
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalBookings = data.reduce((sum, item) => sum + item.bookings, 0);
  const avgRevenue = totalRevenue / data.length;
  const avgBookings = totalBookings / data.length;

  // Calculate trend
  const recentRevenue = data.slice(-7).reduce((sum, item) => sum + item.revenue, 0) / 7;
  const previousRevenue = data.slice(-14, -7).reduce((sum, item) => sum + item.revenue, 0) / 7;
  const revenueTrend = ((recentRevenue - previousRevenue) / previousRevenue) * 100;

  // Format data for display
  const formattedData = data.map((item, index) => ({
    ...item,
    date: formatSwedishDate(item.date),
    avgRevenue: avgRevenue,
    avgBookings: avgBookings,
    compareRevenue: compareData?.[index]?.revenue || 0,
    compareBookings: compareData?.[index]?.bookings || 0,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {viewMode !== 'bookings' && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.revenue }}></div>
              <span className="text-sm">{translations.charts.revenue}: <strong>{formatters.currency(payload[0]?.value || 0)}</strong></span>
            </div>
          )}
          {viewMode !== 'revenue' && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.bookings }}></div>
              <span className="text-sm">{translations.charts.bookings}: <strong>{formatters.number(payload[viewMode === 'bookings' ? 0 : 1]?.value || 0)}</strong></span>
            </div>
          )}
          {showComparison && compareData && (
            <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
              <p>{translations.charts.comparison}: {formatters.currency(payload[2]?.value || 0)}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (!isExpanded) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Intäktstrend & Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  {totalRevenue.toLocaleString('sv-SE')} kr • {totalBookings} bokningar
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(true)}>
              <ChevronDown className="h-4 w-4 mr-2" />
              Visa Graf
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">Intäktstrend & Bokningar</CardTitle>
            <CardDescription>
              Interaktiv analys av intäktsutveckling över tid
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Metrics Summary - Mobile Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">{translations.charts.totalRevenue}</p>
            <p className="text-lg font-bold">{formatters.currency(totalRevenue)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">{translations.charts.totalBookings}</p>
            <p className="text-lg font-bold">{formatters.number(totalBookings)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">{translations.charts.trend7day}</p>
            <div className="flex items-center gap-2">
              {revenueTrend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <p className={`text-lg font-bold ${revenueTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatters.percentage(Math.abs(revenueTrend))}
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle - Mobile Responsive */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={viewMode === 'revenue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('revenue')}
          >
            {translations.charts.revenue}
          </Button>
          <Button
            variant={viewMode === 'bookings' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('bookings')}
          >
            {translations.charts.bookings}
          </Button>
          <Button
            variant={viewMode === 'both' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('both')}
          >
            Båda
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'currentColor', fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis
              yAxisId="left"
              className="text-xs"
              tick={{ fill: 'currentColor', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              hide={viewMode === 'bookings'}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-xs"
              tick={{ fill: 'currentColor', fontSize: 12 }}
              hide={viewMode === 'revenue'}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />

            {/* Average Reference Lines */}
            {viewMode !== 'bookings' && (
              <ReferenceLine
                yAxisId="left"
                y={avgRevenue}
                stroke={chartColors.average}
                strokeDasharray="5 5"
                label={{ value: translations.charts.average, position: 'right', fill: chartColors.average }}
                opacity={0.5}
              />
            )}

            {/* Main Lines - DISTINCT COLORS */}
            {viewMode !== 'bookings' && (
              <>
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  fill={chartColors.revenue}
                  fillOpacity={0.1}
                  stroke="none"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke={chartColors.revenue}
                  strokeWidth={3}
                  dot={{ fill: chartColors.revenue, r: 4 }}
                  activeDot={{ r: 6 }}
                  name={translations.charts.revenueKr}
                />
              </>
            )}
            
            {viewMode !== 'revenue' && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bookings"
                stroke={chartColors.bookings}
                strokeWidth={3}
                dot={{ fill: chartColors.bookings, r: 4 }}
                activeDot={{ r: 6 }}
                name={translations.charts.bookings}
              />
            )}

            {/* Comparison Line */}
            {showComparison && compareData && viewMode !== 'bookings' && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="compareRevenue"
                stroke={chartColors.comparison}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name={translations.charts.comparison}
                opacity={0.5}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
