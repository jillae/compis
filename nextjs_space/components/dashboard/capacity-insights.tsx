
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Lightbulb, Info } from 'lucide-react'

interface CapacityInsight {
  type: 'WARNING' | 'OPPORTUNITY' | 'INFO'
  title: string
  description: string
  impact: string
  actionItems: string[]
}

interface Props {
  insights: CapacityInsight[]
}

export function CapacityInsights({ insights }: Props) {
  const getInsightIcon = (type: CapacityInsight['type']) => {
    switch (type) {
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'OPPORTUNITY':
        return <Lightbulb className="h-5 w-5 text-green-600" />
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getInsightColor = (type: CapacityInsight['type']) => {
    switch (type) {
      case 'WARNING':
        return 'border-red-200 bg-red-50'
      case 'OPPORTUNITY':
        return 'border-green-200 bg-green-50'
      case 'INFO':
        return 'border-blue-200 bg-blue-50'
    }
  }

  const getBadgeVariant = (type: CapacityInsight['type']) => {
    switch (type) {
      case 'WARNING':
        return 'destructive'
      case 'OPPORTUNITY':
        return 'default'
      case 'INFO':
        return 'secondary'
    }
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-purple-600" />
          AI-Genererade Insikter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <Alert key={index} className={`${getInsightColor(insight.type)} border-2`}>
            <div className="flex items-start gap-4">
              {getInsightIcon(insight.type)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-lg">{insight.title}</h4>
                  <Badge variant={getBadgeVariant(insight.type)}>
                    {insight.type}
                  </Badge>
                </div>
                <AlertDescription className="text-base mb-3">
                  {insight.description}
                </AlertDescription>
                
                {/* Impact */}
                <div className="bg-white/50 rounded-lg p-3 mb-3">
                  <p className="font-semibold text-sm text-muted-foreground mb-1">
                    💰 Ekonomisk Impact:
                  </p>
                  <p className="font-bold text-lg">{insight.impact}</p>
                </div>

                {/* Action Items */}
                <div>
                  <p className="font-semibold text-sm text-muted-foreground mb-2">
                    🎯 Rekommenderade Åtgärder:
                  </p>
                  <ul className="space-y-1.5">
                    {insight.actionItems.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-start gap-2">
                        <span className="text-purple-600 font-bold mt-0.5">•</span>
                        <span className="text-sm">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
}
