
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

interface AnalyticsData {
  totalClinics: number
  totalUsers: number
  totalCustomers: number
  totalBookings: number
  totalRevenue: number
  clinics: Array<{
    id: string
    name: string
    tier: string
    status: string
    revenue: number
    bookings: number
    customers: number
  }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/superadmin/stats')
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Kunde inte hämta analysdata')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div className="p-8">Kunde inte ladda data</div>
  }

  // Calculate averages
  const avgRevenuePerClinic = data.totalClinics > 0 ? data.totalRevenue / data.totalClinics : 0
  const avgUsersPerClinic = data.totalClinics > 0 ? data.totalUsers / data.totalClinics : 0
  const avgCustomersPerClinic = data.totalClinics > 0 ? data.totalCustomers / data.totalClinics : 0

  // Sort clinics by revenue
  const topClinics = [...data.clinics].sort((a, b) => b.revenue - a.revenue).slice(0, 10)

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Analytics Dashboard</h1>
        <p className="text-muted-foreground">System-wide metrics och insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Omsättning</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalRevenue.toLocaleString()} kr</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ø {Math.round(avgRevenuePerClinic).toLocaleString()} kr per klinik
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kliniker</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalClinics}</div>
            <p className="text-xs text-muted-foreground mt-1">Registrerade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Användare</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ø {Math.round(avgUsersPerClinic)} per klinik
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kunder</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ø {Math.round(avgCustomersPerClinic)} per klinik
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bokningar</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalBookings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Totalt</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Clinics by Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Kliniker - Omsättning</CardTitle>
          <CardDescription>Kliniker rankade efter total omsättning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topClinics.map((clinic, index) => {
              const revenueShare = data.totalRevenue > 0 
                ? ((clinic.revenue / data.totalRevenue) * 100).toFixed(1)
                : 0

              return (
                <div
                  key={clinic.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{clinic.name}</p>
                        <Badge variant={
                          clinic.tier === 'ENTERPRISE' ? 'destructive' :
                          clinic.tier === 'PROFESSIONAL' ? 'default' :
                          'secondary'
                        }>
                          {clinic.tier}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{clinic.bookings.toLocaleString()} bokningar</span>
                        <span>{clinic.customers.toLocaleString()} kunder</span>
                        <span>{revenueShare}% av total</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{clinic.revenue.toLocaleString()} kr</div>
                    {index === 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        <span>Högst</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {topClinics.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Ingen data tillgänglig</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tier Distribution */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Basic Tier</CardTitle>
            <CardDescription>Antal kliniker</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {data.clinics.filter(c => c.tier === 'BASIC').length}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {((data.clinics.filter(c => c.tier === 'BASIC').length / data.totalClinics) * 100).toFixed(1)}% av totalt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Professional Tier</CardTitle>
            <CardDescription>Antal kliniker</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {data.clinics.filter(c => c.tier === 'PROFESSIONAL').length}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {((data.clinics.filter(c => c.tier === 'PROFESSIONAL').length / data.totalClinics) * 100).toFixed(1)}% av totalt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enterprise Tier</CardTitle>
            <CardDescription>Antal kliniker</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {data.clinics.filter(c => c.tier === 'ENTERPRISE').length}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {((data.clinics.filter(c => c.tier === 'ENTERPRISE').length / data.totalClinics) * 100).toFixed(1)}% av totalt
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
