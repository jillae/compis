
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Enkla och transparenta priser</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Välj den plan som passar din klinik bäst. Alla planer inkluderar AI-driven revenue intelligence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Basic Plan */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Basic</CardTitle>
              <CardDescription>För mindre kliniker som vill komma igång</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">1 995 kr</span>
                <span className="text-gray-600">/månad</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Risk-varningar för no-shows</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Intäktssimulator</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Kapacitetsoptimering</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Upp till 500 bokningar/månad</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/auth/signup" className="w-full">
                <Button className="w-full">Kom igång</Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className="border-2 border-blue-500 relative">
            <div className="absolute -top-4 left-0 right-0 flex justify-center">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Populärast
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Professional</CardTitle>
              <CardDescription>För kliniker som vill maximera sin tillväxt</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">3 995 kr</span>
                <span className="text-gray-600">/månad</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Allt i Basic +</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Marketing automation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Customer health scoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Obegränsat antal bokningar</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Prioriterad support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/auth/signup" className="w-full">
                <Button className="w-full">Kom igång</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Alla planer inkluderar 14 dagars gratis testperiod</p>
          <Link href="/auth/login">
            <Button variant="outline">Har du redan ett konto? Logga in</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
