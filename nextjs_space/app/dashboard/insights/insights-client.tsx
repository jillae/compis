
'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb,
  ArrowLeft,
  Sparkles,
  Target,
  TrendingDown,
  Settings,
  LogOut
} from "lucide-react"
import { signOut } from "next-auth/react"

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

export default function InsightsClient() {
  const { data: session } = useSession()
  const router = useRouter()
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/insights')
      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights)
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/login' })
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      case 'optimization':
        return <Lightbulb className="h-5 w-5" />
      case 'success':
        return <CheckCircle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getVariant = (type: string) => {
    switch (type) {
      case 'warning':
        return 'destructive'
      case 'optimization':
        return 'default'
      case 'success':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50'
      case 'medium':
        return 'text-orange-600 bg-orange-50'
      default:
        return 'text-blue-600 bg-blue-50'
    }
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
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="bg-purple-600 p-2 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Insights</h1>
                <p className="text-sm text-gray-600">Data-driven recommendations</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
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
        {/* Hero Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            AI-Powered Revenue Intelligence
          </h2>
          <p className="text-gray-600">
            Actionable insights to optimize your clinic's performance and maximize revenue
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                Total Insights
              </CardTitle>
              <Target className="h-4 w-4 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.length}</div>
              <p className="text-xs text-purple-100">Generated from your data</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">
                Actionable Items
              </CardTitle>
              <Lightbulb className="h-4 w-4 text-orange-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {insights.filter(i => i.actionable).length}
              </div>
              <p className="text-xs text-orange-100">Ready to implement</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-600 to-red-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-100">
                High Impact
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-red-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {insights.filter(i => i.impact === 'high').length}
              </div>
              <p className="text-xs text-red-100">Priority recommendations</p>
            </CardContent>
          </Card>
        </div>

        {/* Insights List */}
        <div className="space-y-4">
          {insights.map((insight) => (
            <Card key={insight.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      insight.type === 'warning' ? 'bg-red-100 text-red-600' :
                      insight.type === 'optimization' ? 'bg-purple-100 text-purple-600' :
                      insight.type === 'success' ? 'bg-green-100 text-green-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {getIcon(insight.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <Badge className={getImpactColor(insight.impact)}>
                          {insight.impact} impact
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-600">
                        {insight.category}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{insight.description}</p>
                
                {insight.recommendation && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-900">Recommendation</AlertTitle>
                    <AlertDescription className="text-blue-800">
                      {insight.recommendation}
                    </AlertDescription>
                  </Alert>
                )}

                {insight.actionable && (
                  <div className="flex space-x-2">
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                      Implement This
                    </Button>
                    <Button size="sm" variant="outline">
                      Learn More
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {insights.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Insights Available Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  We need more data to generate personalized insights for your clinic.
                </p>
                <Button onClick={() => router.push('/dashboard/import')}>
                  Import Data
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
