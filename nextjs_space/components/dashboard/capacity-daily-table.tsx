
'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

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

interface Props {
  days: DailyCapacityForecast[]
}

export function CapacityDailyTable({ days }: Props) {
  const getStatusBadge = (status: DailyCapacityForecast['status']) => {
    const variants = {
      UNDERUTILIZED: { variant: 'secondary' as const, className: 'bg-orange-100 text-orange-700' },
      OPTIMAL: { variant: 'secondary' as const, className: 'bg-green-100 text-green-700' },
      NEAR_FULL: { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-700' },
      OVERBOOKED: { variant: 'destructive' as const, className: '' },
    }
    return variants[status]
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 60) return 'text-orange-600'
    if (utilization >= 60 && utilization < 85) return 'text-green-600'
    if (utilization >= 85 && utilization < 100) return 'text-blue-600'
    return 'text-red-600'
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Dag</TableHead>
            <TableHead className="font-semibold text-center">Kapacitet</TableHead>
            <TableHead className="font-semibold text-center">Bokat</TableHead>
            <TableHead className="font-semibold text-center">Beläggning</TableHead>
            <TableHead className="font-semibold text-center">Lediga</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Rekommendation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {days.map((day) => {
            const statusBadge = getStatusBadge(day.status)
            return (
              <TableRow key={day.date} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold capitalize">{day.dayOfWeek}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('sv-SE', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {day.totalCapacity}h
                </TableCell>
                <TableCell className="text-center">
                  {day.bookedCapacity.toFixed(1)}h
                </TableCell>
                <TableCell className="text-center">
                  <span className={`font-bold ${getUtilizationColor(day.utilizationRate)}`}>
                    {day.utilizationRate}%
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-semibold">{day.availableSlots}</span>
                  {day.optimalSlots > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (behöver {day.optimalSlots})
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={statusBadge.variant}
                    className={statusBadge.className}
                  >
                    {day.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs">
                  {day.recommendation}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
