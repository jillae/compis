
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MessageSquare,
  Calendar,
  DollarSign,
  TrendingDown
} from 'lucide-react'

interface NoShowPrediction {
  bookingId: string
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  contributingFactors: string[]
  recommendations: string[]
  estimatedLoss: number
}

interface RevenueMetrics {
  totalBookings: number
  highRiskBookings: number
  mediumRiskBookings: number
  lowRiskBookings: number
  potentialLoss: number
}

export default function AtRiskClient() {
  const [predictions, setPredictions] = useState<NoShowPrediction[]>([])
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(14)

  useEffect(() => {
    fetchData()
  }, [timeRange])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch high-risk bookings
      const bookingsRes = await fetch(`/api/bookings/predict?days=${timeRange}`)
      const bookingsData = await bookingsRes.json()
      setPredictions(bookingsData.bookings || [])

      // Fetch revenue metrics
      const metricsRes = await fetch(`/api/bookings/predict?action=revenue-at-risk&days=${timeRange}`)
      const metricsData = await metricsRes.json()
      setMetrics(metricsData)
    } catch (error) {
      console.error('Failed to fetch at-risk data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'default'
      case 'LOW': return 'secondary'
      default: return 'default'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'HIGH': return <AlertCircle className="h-4 w-4" />
      case 'MEDIUM': return <AlertTriangle className="h-4 w-4" />
      case 'LOW': return <CheckCircle2 className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Analyzing bookings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">At-Risk Bookings</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered no-show prediction to protect your revenue
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === 7 ? 'default' : 'outline'}
            onClick={() => setTimeRange(7)}
          >
            7 Days
          </Button>
          <Button
            variant={timeRange === 14 ? 'default' : 'outline'}
            onClick={() => setTimeRange(14)}
          >
            14 Days
          </Button>
          <Button
            variant={timeRange === 30 ? 'default' : 'outline'}
            onClick={() => setTimeRange(30)}
          >
            30 Days
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Next {timeRange} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {metrics.highRiskBookings}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.totalBookings > 0 
                  ? ((metrics.highRiskBookings / metrics.totalBookings) * 100).toFixed(1)
                  : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {metrics.mediumRiskBookings}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.totalBookings > 0
                  ? ((metrics.mediumRiskBookings / metrics.totalBookings) * 100).toFixed(1)
                  : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue at Risk</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {metrics.potentialLoss.toLocaleString()} kr
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Expected loss from no-shows
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* High Risk Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            High-Risk Bookings Requiring Action
          </CardTitle>
          <CardDescription>
            {predictions.length === 0 
              ? 'No high-risk bookings found for this period'
              : `${predictions.length} booking${predictions.length !== 1 ? 's' : ''} flagged as high-risk`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {predictions.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">All bookings look good!</p>
              <p className="text-muted-foreground mt-2">
                No high-risk bookings detected for the next {timeRange} days
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {predictions.map((prediction) => (
                <Card key={prediction.bookingId} className="border-destructive/30">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={getRiskColor(prediction.riskLevel)} className="gap-1">
                            {getRiskIcon(prediction.riskLevel)}
                            {prediction.riskLevel} RISK
                          </Badge>
                          <span className="text-2xl font-bold text-destructive">
                            {prediction.riskScore}%
                          </span>
                          <span className="text-sm text-muted-foreground">chance of no-show</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">
                            {prediction.estimatedLoss.toLocaleString()} kr at risk
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Contributing Factors */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Why this booking is at risk:</h4>
                      <ul className="space-y-1">
                        {prediction.contributingFactors.map((factor, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-destructive mt-1">•</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">
                        Recommended Actions:
                      </h4>
                      <ul className="space-y-2">
                        {prediction.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="mt-0.5">{rec.split(' ')[0]}</span>
                            <span>{rec.split(' ').slice(1).join(' ')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" variant="default" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Send SMS
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Phone className="h-4 w-4" />
                        Call Customer
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Mail className="h-4 w-4" />
                        Send Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips & Best Practices */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">💡 Pro Tips for Reducing No-Shows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• <strong>Send multiple reminders:</strong> High-risk bookings should receive reminders 48h and 24h before</p>
          <p>• <strong>Personal touch:</strong> Phone calls are 3x more effective than SMS for high-risk customers</p>
          <p>• <strong>Make it easy:</strong> Include one-click confirm/cancel links in reminders</p>
          <p>• <strong>Build relationships:</strong> First-time customers need extra attention and communication</p>
          <p>• <strong>Strategic overbooking:</strong> Consider double-booking high-risk slots with backup customers</p>
        </CardContent>
      </Card>
    </div>
  )
}
