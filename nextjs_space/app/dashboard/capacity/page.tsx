
'use client'
import { BackButton } from '@/components/ui/back-button';

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'
import { CapacityWeekCard } from '@/components/dashboard/capacity-week-card'
import { CapacityInsights } from '@/components/dashboard/capacity-insights'

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

interface CapacityInsight {
  type: 'WARNING' | 'OPPORTUNITY' | 'INFO'
  title: string
  description: string
  impact: string
  actionItems: string[]
}

interface ForecastData {
  weeks: WeeklyCapacityForecast[]
  insights: CapacityInsight[]
  summary: {
    averageUtilization: number
    peakUtilization: number
    lowestUtilization: number
    totalRevenue: number
    potentialRevenue: number
    capacityGap: number
  }
}

export default function CapacityForecastPage() {
  const router = useRouter()
  const { data: session, status } = useSession() || {}
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [weeksAhead, setWeeksAhead] = useState(4)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchForecast()
    }
  }, [status, weeksAhead])

  const fetchForecast = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/capacity/forecast?weeks=${weeksAhead}`)
      if (!response.ok) {
        throw new Error('Failed to fetch capacity forecast')
      }
      const result = await response.json()
      setForecastData(result.data)
    } catch (err) {
      console.error('Error fetching forecast:', err)
      setError('Kunde inte ladda kapacitetsprognos')
    } finally {
      setLoading(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
      <BackButton href="/dashboard" />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!forecastData) {
    return (
      <div className="container mx-auto py-8 px-4">
      <BackButton href="/dashboard" />
        <Alert>
          <AlertDescription>Ingen data tillgänglig</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { weeks, insights, summary } = forecastData

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <BackButton href="/dashboard" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            <Calendar className="h-10 w-10 text-purple-600" />
            Kapacitetsprognos
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Förutse kapacitetsbehov och optimera bokningar {weeksAhead} veckor framåt
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={weeksAhead === 2 ? 'default' : 'outline'}
            onClick={() => setWeeksAhead(2)}
          >
            2 veckor
          </Button>
          <Button
            variant={weeksAhead === 4 ? 'default' : 'outline'}
            onClick={() => setWeeksAhead(4)}
          >
            4 veckor
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Average Utilization */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900">
              Genomsnittlig Beläggning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {summary.averageUtilization.toFixed(0)}%
            </div>
            <p className="text-xs text-blue-700 mt-1">
              {summary.averageUtilization < 70 ? 'Under optimal nivå' : 'Bra beläggning'}
            </p>
          </CardContent>
        </Card>

        {/* Peak vs Lowest */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-900">
              Peak vs Lägst
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-xl font-bold text-purple-900">
                  {summary.peakUtilization}%
                </span>
              </div>
              <span className="text-purple-700">/</span>
              <div className="flex items-center gap-1">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-xl font-bold text-purple-900">
                  {summary.lowestUtilization}%
                </span>
              </div>
            </div>
            <p className="text-xs text-purple-700 mt-1">
              Maximal vs minimal beläggning
            </p>
          </CardContent>
        </Card>

        {/* Current Revenue */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-900">
              Förväntad Intäkt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {summary.totalRevenue.toLocaleString('sv-SE')} kr
            </div>
            <p className="text-xs text-green-700 mt-1">
              Baserat på nuvarande bokningar
            </p>
          </CardContent>
        </Card>

        {/* Capacity Gap */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-900">
              Kapacitetsgap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">
              {summary.capacityGap.toLocaleString('sv-SE')} kr
            </div>
            <p className="text-xs text-orange-700 mt-1">
              Potential intäkt vid 80% beläggning
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      {insights && insights.length > 0 && (
        <CapacityInsights insights={insights} />
      )}

      {/* Weekly Forecasts */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Veckoöversikt</h2>
          <Badge variant="secondary" className="text-sm">
            {weeks.length} veckor
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {weeks.map((week) => (
            <CapacityWeekCard key={week.weekNumber} week={week} />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">
                🎯 Optimera din kapacitet nu!
              </h3>
              <p className="text-purple-100">
                Använd insikterna ovan för att maximera intäkt och minimera tomma slots
              </p>
            </div>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push('/dashboard/marketing')}
            >
              Kör Kampanj
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
