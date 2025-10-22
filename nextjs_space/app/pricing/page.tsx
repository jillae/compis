
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, Crown, Zap, Rocket, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Enkla och transparenta priser</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            För skönhetskliniker med Bokadirekt. Alla planer inkluderar AI-driven revenue intelligence.
          </p>
          <p className="text-sm text-gray-500 mt-2">14 dagars gratis testperiod • Ingen bindningstid • 20% rabatt vid årsfaktura</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* FREE Plan */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-gray-500" />
                <CardTitle className="text-xl">Free</CardTitle>
              </div>
              <CardDescription>Testa plattformen</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">0 kr</span>
                <span className="text-gray-600 text-sm">/månad</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>50 bokningar/månad</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Grundläggande dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>No-show påminnelser</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Community support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/auth/signup" className="w-full">
                <Button variant="outline" className="w-full">Kom igång</Button>
              </Link>
            </CardFooter>
          </Card>

          {/* BASIC Plan */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-xl">Basic</CardTitle>
              </div>
              <CardDescription>För mindre kliniker</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">999 kr</span>
                <span className="text-gray-600 text-sm">/månad</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>300 bokningar/månad</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Grundläggande analys</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>No-show förutsägelse</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Kapacitetsoptimering</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Bokadirekt-integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Standard support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/auth/signup" className="w-full">
                <Button className="w-full">Kom igång</Button>
              </Link>
            </CardFooter>
          </Card>

          {/* PROFESSIONAL Plan */}
          <Card className="border-2 border-blue-500 relative shadow-lg scale-105">
            <div className="absolute -top-4 left-0 right-0 flex justify-center">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Populärast
              </span>
            </div>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-xl">Professional</CardTitle>
              </div>
              <CardDescription>Maximera tillväxten</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">2 499 kr</span>
                <span className="text-gray-600 text-sm">/månad</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="font-semibold">Obegränsat bokningar</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>AI-rekommendationer</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Revenue Intelligence</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Customer Health Scoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Meta Marketing ROI</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Dynamisk prissättning</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Retention Autopilot</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Prioriterad support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/auth/signup" className="w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Kom igång</Button>
              </Link>
            </CardFooter>
          </Card>

          {/* ENTERPRISE Plan */}
          <Card className="border-2 border-purple-300">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-xl">Enterprise</CardTitle>
              </div>
              <CardDescription>För kedjor & partners</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">4 999 kr</span>
                <span className="text-gray-600 text-sm">/månad</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="font-semibold">Allt i Professional</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Multi-klinik hantering</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>White-label möjlighet</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Dedikerad CSM</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>SLA-garanti (99.9%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Anpassad onboarding</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>24/7 support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/auth/signup" className="w-full">
                <Button variant="outline" className="w-full border-purple-300 hover:bg-purple-50">Kontakta oss</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Link href="/auth/login">
            <Button variant="outline">Har du redan ett konto? Logga in</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
