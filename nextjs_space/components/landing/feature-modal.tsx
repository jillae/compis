
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export interface FeatureDetail {
  id: string
  title: string
  icon: React.ReactNode
  shortDescription: string
  why: {
    title: string
    content: string
  }
  how: {
    title: string
    steps: string[]
  }
  what: {
    title: string
    benefits: { icon: React.ReactNode; text: string }[]
  }
  realExample?: {
    clinic: string
    challenge: string
    result: string
    metric: string
  }
}

interface FeatureModalProps {
  feature: FeatureDetail | null
  isOpen: boolean
  onClose: () => void
}

export function FeatureModal({ feature, isOpen, onClose }: FeatureModalProps) {
  if (!feature) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center">
              {feature.icon}
            </div>
            <div>
              <DialogTitle className="text-3xl font-bold">{feature.title}</DialogTitle>
              <p className="text-gray-600 mt-1">{feature.shortDescription}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8 mt-6">
          {/* Why Section - The Problem/Vision */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">{feature.why.title}</h3>
            <p className="text-lg text-gray-700 leading-relaxed">{feature.why.content}</p>
          </div>

          {/* How Section - The Process */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">{feature.how.title}</h3>
            <div className="space-y-3">
              {feature.how.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What Section - The Benefits */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">{feature.what.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feature.what.benefits.map((benefit, index) => (
                <Card key={index} className="p-4 border-2 border-green-100 hover:border-green-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="text-green-600 flex-shrink-0">{benefit.icon}</div>
                    <p className="text-gray-700">{benefit.text}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Real Example (if available) */}
          {feature.realExample && (
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Verkligt Exempel: {feature.realExample.clinic}</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-gray-800">Utmaning:</span>
                  <p className="text-gray-700 mt-1">{feature.realExample.challenge}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Resultat:</span>
                  <p className="text-gray-700 mt-1">{feature.realExample.result}</p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-2xl">
                    {feature.realExample.metric}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* CTA */}
          <div className="flex items-center justify-center gap-4 pt-6 border-t">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Prova {feature.title}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" onClick={onClose}>
              Stäng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
