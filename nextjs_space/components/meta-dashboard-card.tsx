
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Users, 
  Eye,
  MousePointer,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface MetaMetrics {
  summary: {
    totalSpend: number
    totalRevenue: number
    roas: number
    totalLeads: number
    qualityLeads: number
    leadQualityRate: number
    avgCPL: number
    impressions: number
    clicks: number
  } | null
  budgetRecommendation: {
    currentUtilization: number
    recommendation: 'INCREASE' | 'DECREASE' | 'MAINTAIN'
    reason: string
    targetCPL: number | null
  } | null
}

export function MetaDashboardCard() {
  const [metrics, setMetrics] = useState<MetaMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/meta/metrics?days=30')
      if (!response.ok) throw new Error('Failed to fetch metrics')
      const data = await response.json()
      setMetrics(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      const response = await fetch('/api/meta/sync', { method: 'POST' })
      if (!response.ok) throw new Error('Sync failed')
      await fetchMetrics()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meta Marketing API</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!metrics?.summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meta Marketing API</CardTitle>
          <CardDescription>Inga kampanjdata tillgängliga ännu</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Synkroniserar...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Synka kampanjdata
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { summary, budgetRecommendation } = metrics
  const formatCurrency = (value: number) => `${value.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} kr`
  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  return (
    <div className="space-y-6">
      {/* Budget Recommendation Alert */}
      {budgetRecommendation && (
        <Alert className={
          budgetRecommendation.recommendation === 'INCREASE' 
            ? 'bg-amber-50 border-amber-200' 
            : budgetRecommendation.recommendation === 'DECREASE'
            ? 'bg-red-50 border-red-200'
            : 'bg-green-50 border-green-200'
        }>
          {budgetRecommendation.recommendation === 'MAINTAIN' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-600" />
          )}
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">
                Kapacitetsutnyttjande: {budgetRecommendation.currentUtilization}%
              </p>
              <p className="text-sm">{budgetRecommendation.reason}</p>
              {budgetRecommendation.recommendation !== 'MAINTAIN' && (
                <p className="text-sm font-medium">
                  Rekommendation: {
                    budgetRecommendation.recommendation === 'INCREASE' 
                      ? 'Öka kampanjbudget för fler leads' 
                      : 'Minska budget för att undvika overbooking'
                  }
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Meta Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalSpend)}</div>
            <p className="text-xs text-muted-foreground">Senaste 30 dagarna</p>
          </CardContent>
        </Card>

        {/* ROAS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROAS</CardTitle>
            <TrendingUp className={`h-4 w-4 ${summary.roas >= 3 ? 'text-green-600' : 'text-amber-600'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.roas.toFixed(2)}x</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.totalRevenue)} intäkt
            </p>
          </CardContent>
        </Card>

        {/* Total Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {summary.qualityLeads} kvalitets-leads ({formatPercent(summary.leadQualityRate)})
            </p>
          </CardContent>
        </Card>

        {/* CPL */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPL</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.avgCPL)}</div>
            <p className="text-xs text-muted-foreground">
              Cost Per Lead
            </p>
          </CardContent>
        </Card>

        {/* Impressions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.impressions.toLocaleString('sv-SE')}</div>
            <p className="text-xs text-muted-foreground">Visningar</p>
          </CardContent>
        </Card>

        {/* Clicks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.clicks.toLocaleString('sv-SE')}</div>
            <p className="text-xs text-muted-foreground">Klick</p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Button */}
      <div className="flex justify-end">
        <Button onClick={handleSync} disabled={syncing} variant="outline">
          {syncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Synkroniserar...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Synka kampanjdata
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
