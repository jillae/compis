
'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  Activity,
  Upload,
  Settings,
  LogOut,
  Lightbulb,
  ArrowRight
} from "lucide-react"
import { DashboardMetrics } from "@/lib/types"
import NoShowChart from "@/components/dashboard/no-show-chart"
import RevenueChart from "@/components/dashboard/revenue-chart"
import UtilizationChart from "@/components/dashboard/utilization-chart"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Insight {
  id: string
  type: 'warning' | 'optimization' | 'success' | 'info'
  category: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  actionable: boolean
  recommendation?: string
}

export default function DashboardClient() {
  const { data: session } = useSession()
  const router = useRouter()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
    fetchInsights()
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/dashboard/metrics')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/insights')
      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights.slice(0, 3)) // Show top 3 insights
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/login' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Flow</h1>
                <p className="text-sm text-gray-600">Revenue Intelligence</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="default" size="sm" onClick={() => router.push('/dashboard/insights')} className="bg-purple-600 hover:bg-purple-700">
                <TrendingUp className="h-4 w-4 mr-2" />
                AI Insights
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/import')}>
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.firstName || session?.user?.name || 'User'}
          </h2>
          <p className="text-gray-600">
            {session?.user?.companyName ? 
              `Here's what's happening at ${session.user.companyName}` :
              "Here's your clinic's performance overview"
            }
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Total Bookings
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalBookings || 0}</div>
              <p className="text-xs text-blue-100">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics?.totalRevenue?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-green-100">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">
                No-Show Rate
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.noShowRate || 0}%</div>
              <p className="text-xs text-orange-100">
                <Badge variant={metrics?.noShowRate && metrics.noShowRate > 15 ? "destructive" : "secondary"} className="text-xs">
                  {metrics?.noShowRate && metrics.noShowRate > 15 ? "High" : "Normal"}
                </Badge>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                Utilization
              </CardTitle>
              <Activity className="h-4 w-4 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.utilizationRate || 0}%</div>
              <p className="text-xs text-purple-100">Capacity utilization</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>No-Show Patterns by Hour</CardTitle>
              <CardDescription>
                Identify peak no-show times to optimize scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NoShowChart data={metrics?.hourlyNoShows || []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Booking Trends</CardTitle>
              <CardDescription>
                Booking volume and no-show patterns by day of week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart data={metrics?.dailyTrends || []} />
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Preview */}
        {insights.length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  <CardTitle>AI-Powered Recommendations</CardTitle>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push('/dashboard/insights')}
                  className="border-purple-300 hover:bg-purple-100"
                >
                  View All Insights
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              <CardDescription>
                Top recommendations to optimize your clinic performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((insight) => (
                <Alert 
                  key={insight.id} 
                  className={
                    insight.type === 'warning' ? 'bg-red-50 border-red-200' :
                    insight.type === 'optimization' ? 'bg-purple-50 border-purple-200' :
                    insight.type === 'success' ? 'bg-green-50 border-green-200' :
                    'bg-blue-50 border-blue-200'
                  }
                >
                  <div className="flex items-start space-x-2">
                    {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />}
                    {insight.type === 'optimization' && <Lightbulb className="h-4 w-4 text-purple-600 mt-0.5" />}
                    {insight.type === 'success' && <Activity className="h-4 w-4 text-green-600 mt-0.5" />}
                    {insight.type === 'info' && <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />}
                    <div className="flex-1">
                      <AlertTitle className={
                        insight.type === 'warning' ? 'text-red-900' :
                        insight.type === 'optimization' ? 'text-purple-900' :
                        insight.type === 'success' ? 'text-green-900' :
                        'text-blue-900'
                      }>
                        {insight.title}
                        {insight.impact === 'high' && (
                          <Badge className="ml-2 bg-red-100 text-red-700">High Impact</Badge>
                        )}
                      </AlertTitle>
                      <AlertDescription className={
                        insight.type === 'warning' ? 'text-red-800' :
                        insight.type === 'optimization' ? 'text-purple-800' :
                        insight.type === 'success' ? 'text-green-800' :
                        'text-blue-800'
                      }>
                        {insight.description.length > 150 
                          ? insight.description.substring(0, 150) + '...' 
                          : insight.description}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Additional Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Capacity Utilization Overview</CardTitle>
            <CardDescription>
              Monitor resource efficiency and identify optimization opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UtilizationChart utilizationRate={metrics?.utilizationRate || 0} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
