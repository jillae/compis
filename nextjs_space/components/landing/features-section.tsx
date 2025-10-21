
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, BarChart3, Users, Target, Sparkles, Zap } from "lucide-react"
import { FeatureModal, FeatureDetail } from "./feature-modal"
import { featureDetails } from "@/lib/feature-details"
import { useState } from "react"

export function FeaturesSection() {
  const [selectedFeature, setSelectedFeature] = useState<FeatureDetail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleFeatureClick = (featureId: string) => {
    const feature = featureDetails.find(f => f.id === featureId)
    if (feature) {
      setSelectedFeature(feature)
      setIsModalOpen(true)
    }
  }

  const features = [
    {
      id: "revenue-intelligence",
      icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
      bgColor: "bg-blue-100",
      hoverBorder: "hover:border-blue-300",
      title: "Revenue Intelligence",
      description: "Få konkreta intäktsförslag baserat på din bokhistorik. Se exakt vilka åtgärder som ger mest avkastning."
    },
    {
      id: "customer-health-scoring",
      icon: <Users className="h-6 w-6 text-purple-600" />,
      bgColor: "bg-purple-100",
      hoverBorder: "hover:border-purple-300",
      title: "Customer Health Scoring",
      description: "Se vilka kunder som riskerar att försvinna och agera i tid. Få konkreta tips för att öka lojalitet."
    },
    {
      id: "dynamic-pricing",
      icon: <Target className="h-6 w-6 text-indigo-600" />,
      bgColor: "bg-indigo-100",
      hoverBorder: "hover:border-indigo-300",
      title: "Dynamic Pricing",
      description: "Optimera dina priser baserat på efterfrågan. \"Öka priser 10% på fredagar kl 14-17\" = +15k kr/mån."
    },
    {
      id: "meta-marketing-roi",
      icon: <BarChart3 className="h-6 w-6 text-green-600" />,
      bgColor: "bg-green-100",
      hoverBorder: "hover:border-green-300",
      title: "Meta Marketing ROI",
      description: "Se exakt vilka annonser som ger bokningar, inte bara klick. Optimera din marknadsföring för maximal avkastning."
    },
    {
      id: "no-show-prevention",
      icon: <Sparkles className="h-6 w-6 text-orange-600" />,
      bgColor: "bg-orange-100",
      hoverBorder: "hover:border-orange-300",
      title: "Risk-varningar för no-shows",
      description: "Identifiera riskbokningar innan de blir no-shows. Få varningar i tid så du kan agera proaktivt och rädda bokningar."
    },
    {
      id: "automatic-integration",
      icon: <Zap className="h-6 w-6 text-pink-600" />,
      bgColor: "bg-pink-100",
      hoverBorder: "hover:border-pink-300",
      title: "Automatisk integration",
      description: "Anslut ditt bokningssystem och få automatisk realtidssynk av alla bokningar och kunder. Ingen manuell administration."
    }
  ]

  return (
    <>
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Allt du behöver för att växa</h2>
          <p className="text-xl text-gray-600">Proaktiva verktyg som driver affären framåt</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature) => (
            <Card 
              key={feature.id}
              className={`border-2 ${feature.hoverBorder} transition-all hover:shadow-lg cursor-pointer transform hover:scale-105`}
              onClick={() => handleFeatureClick(feature.id)}
            >
              <CardContent className="pt-6 space-y-4">
                <div className={`${feature.bgColor} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
                <p className="text-sm text-blue-600 font-semibold pt-2">
                  Klicka för att läsa mer →
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <FeatureModal 
        feature={selectedFeature}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
