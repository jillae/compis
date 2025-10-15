
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Calendar, TrendingUp } from 'lucide-react'
import { CapacityDailyTable } from './capacity-daily-table'

interface DailyCapacityForecast {
  date: string
  dayOfWeek: string
  totalCapacity: number
  bookedCapacity: number
  utilizationRate: number
  availableSlots: number
  optimalSlots: number
  recommendation: string
  status: 'UNDERUTILIZED' | 'OPTIMAL' | 'NEAR_FULL' | 'OVERBOOKED'
}

interface WeeklyCapacityForecast {
  weekNumber: number
  weekLabel: string
  startDate: string
  endDate: string
  totalCapacity: number
  bookedCapacity: number
  utilizationRate: number
  availableSlots: number
  revenue: number
  projectedRevenue: number
  days: DailyCapacityForecast[]
}

interface Props {
  week: WeeklyCapacityForecast
}

export function CapacityWeekCard({ week }: Props) {
  const [expanded, setExpanded] = useState(false)

  const getStatusColor = (utilization: number) => {
    if (utilization < 60) return 'bg-orange-100 text-orange-700 border-orange-300'
    if (utilization >= 60 && utilization < 85) return 'bg-green-100 text-green-700 border-green-300'
    if (utilization >= 85 && utilization < 100) return 'bg-blue-100 text-blue-700 border-blue-300'
    return 'bg-red-100 text-red-700 border-red-300'
  }

  const getStatusText = (utilization: number) => {
    if (utilization < 60) return 'UNDERUTILIZED'
    if (utilization >= 60 && utilization < 85) return 'OPTIMAL'
    if (utilization >= 85 && utilization < 100) return 'NEAR FULL'
    return 'OVERBOOKED'
  }

  const revenueGap = week.projectedRevenue - week.revenue
  const hasGap = revenueGap > 0

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className={`${getStatusColor(week.utilizationRate)} border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6" />
            <div>
              <CardTitle className="text-xl">
                {week.weekLabel}
              </CardTitle>
              <p className="text-sm opacity-80">
                {new Date(week.startDate).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })} 
                {' - '}
                {new Date(week.endDate).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-lg font-bold">
              {week.utilizationRate}%
            </Badge>
            <Badge variant="outline" className="font-medium">
              {getStatusText(week.utilizationRate)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Total Capacity */}
          <div>
            <p className="text-sm text-muted-foreground">Total Kapacitet</p>
            <p className="text-2xl font-bold">{week.totalCapacity}h</p>
          </div>

          {/* Booked */}
          <div>
            <p className="text-sm text-muted-foreground">Bokat</p>
            <p className="text-2xl font-bold">{week.bookedCapacity.toFixed(1)}h</p>
          </div>

          {/* Available Slots */}
          <div>
            <p className="text-sm text-muted-foreground">Lediga Slots</p>
            <p className="text-2xl font-bold text-orange-600">{week.availableSlots}</p>
          </div>

          {/* Revenue */}
          <div>
            <p className="text-sm text-muted-foreground">Intäkt</p>
            <p className="text-2xl font-bold text-green-600">
              {week.revenue.toLocaleString('sv-SE')} kr
            </p>
          </div>
        </div>

        {/* Revenue Gap Alert */}
        {hasGap && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-900">
                💰 Du lämnar {revenueGap.toLocaleString('sv-SE')} kr på bordet
              </p>
              <p className="text-sm text-orange-700 mt-1">
                Vid 80% beläggning skulle du kunna tjäna {week.projectedRevenue.toLocaleString('sv-SE')} kr denna vecka
              </p>
            </div>
          </div>
        )}

        {/* Expand/Collapse Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              Dölj daglig breakdown
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" />
              Visa daglig breakdown
            </>
          )}
        </Button>

        {/* Daily Breakdown Table */}
        {expanded && (
          <div className="mt-6">
            <CapacityDailyTable days={week.days} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
