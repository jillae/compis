
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  RefreshCw,
  Loader2,
  Phone,
  Mail,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'

interface AtRiskCustomer {
  customerId: string
  name: string | null
  email: string | null
  phone: string | null
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  daysSinceLastVisit: number
  totalSpent: number
  avgBookingFrequency: number
  lastVisitDate: string | null
  recommendations: string[]
}

interface RetentionMetrics {
  totalAtRisk: number
  highRisk: number
  mediumRisk: number
  lowRisk: number
  averageRiskScore: number
  estimatedRevenueAtRisk: number
  churnRate: number
}

export default function RetentionPage() {
  const router = useRouter()
  const { data: session, status } = useSession() || {}
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [metrics, setMetrics] = useState<RetentionMetrics | null>(null)
  const [atRiskCustomers, setAtRiskCustomers] = useState<AtRiskCustomer[]>([])
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('ALL')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch metrics
      const metricsRes = await fetch('/api/retention/metrics')
      if (metricsRes.ok) {
        const data = await metricsRes.json()
        setMetrics(data.metrics)
      }

      // Fetch at-risk customers
      const customersRes = await fetch('/api/retention/at-risk?minRiskScore=40')
      if (customersRes.ok) {
        const data = await customersRes.json()
        setAtRiskCustomers(data.customers)
      }
    } catch (error) {
      console.error('Failed to fetch retention data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'LOW':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const filteredCustomers =
    selectedRiskLevel === 'ALL'
      ? atRiskCustomers
      : atRiskCustomers.filter((c) => c.riskLevel === selectedRiskLevel)

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton href="/dashboard" />
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              Retention Autopilot
            </h1>
            <p className="text-muted-foreground mt-1">
              Identifiera och rädda kunder i riskzonen
            </p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Uppdatera
        </Button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kunder i Riskzon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalAtRisk}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.highRisk} högriskkunder
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Intäkt i Riskzon</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.estimatedRevenueAtRisk.toLocaleString('sv-SE')} kr
              </div>
              <p className="text-xs text-muted-foreground">Total lifetime value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.churnRate}%</div>
              <p className="text-xs text-muted-foreground">
                Kunder 90+ dagar inaktiva
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Genomsnittlig Risk</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageRiskScore}/100</div>
              <p className="text-xs text-muted-foreground">Risk score</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Corex Integration Alert */}
      <Alert className="bg-purple-50 border-purple-200">
        <Users className="h-4 w-4 text-purple-600" />
        <AlertDescription>
          <p className="font-semibold text-purple-900 mb-2">
            🤖 Corex Integration Ready
          </p>
          <p className="text-sm text-purple-800">
            Flow identifierar at-risk customers automatiskt. Använd Corex för att
            skicka personaliserade re-engagement-meddelanden via SMS, email och
            sociala kanaler.
          </p>
        </AlertDescription>
      </Alert>

      {/* Risk Level Filters */}
      <div className="flex gap-2">
        <Button
          variant={selectedRiskLevel === 'ALL' ? 'default' : 'outline'}
          onClick={() => setSelectedRiskLevel('ALL')}
          size="sm"
        >
          Alla ({atRiskCustomers.length})
        </Button>
        <Button
          variant={selectedRiskLevel === 'CRITICAL' ? 'default' : 'outline'}
          onClick={() => setSelectedRiskLevel('CRITICAL')}
          size="sm"
          className="bg-red-600 hover:bg-red-700"
        >
          Critical ({atRiskCustomers.filter((c) => c.riskLevel === 'CRITICAL').length})
        </Button>
        <Button
          variant={selectedRiskLevel === 'HIGH' ? 'default' : 'outline'}
          onClick={() => setSelectedRiskLevel('HIGH')}
          size="sm"
          className="bg-orange-600 hover:bg-orange-700"
        >
          High ({atRiskCustomers.filter((c) => c.riskLevel === 'HIGH').length})
        </Button>
        <Button
          variant={selectedRiskLevel === 'MEDIUM' ? 'default' : 'outline'}
          onClick={() => setSelectedRiskLevel('MEDIUM')}
          size="sm"
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          Medium ({atRiskCustomers.filter((c) => c.riskLevel === 'MEDIUM').length})
        </Button>
      </div>

      {/* At-Risk Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kunder i Riskzon ({filteredCustomers.length})</CardTitle>
          <CardDescription>
            Sorterat efter risk score (högsta först)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCustomers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Inga kunder i riskzonen 🎉
              </p>
            ) : (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.customerId}
                  className="border rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {customer.name || 'Okänd kund'}
                        </h3>
                        <Badge className={getRiskBadgeColor(customer.riskLevel)}>
                          {customer.riskLevel}
                        </Badge>
                        <Badge variant="outline">
                          Risk: {customer.riskScore}/100
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {customer.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {customer.daysSinceLastVisit} dagar sedan senaste besök
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {customer.totalSpent.toLocaleString('sv-SE')} kr lifetime value
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-semibold mb-2">
                      Rekommendationer:
                    </p>
                    <ul className="space-y-1">
                      {customer.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-700">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
