

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, BarChart3, Users, Calendar, CheckCircle, ArrowRight, Sparkles, Target, Zap } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LandingPage() {
  const session = await getServerSession(authOptions)
  
  // If already logged in, redirect to simulator (main page)
  if (session) {
    redirect('/dashboard/simulator')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Flow
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Logga in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Kom igång
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-block">
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              💪 Din proaktiva affärscoach
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Öka intäkter med{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              sporrad data
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Flow är din affärsdrivna coach som proaktivt analyserar din bokningsdata och ger dig konkreta åtgärder 
            som ökar intäkter direkt. Inte bara grafer – actionable insikter som driver tillväxt. 
            Fullt integrerat med Bokadirekt.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8">
                Starta gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Se funktioner
              </Button>
            </Link>
          </div>

          <div className="pt-8 flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Gratis 14-dagars prova-på</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Inget kreditkort krävs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Enkelt att komma igång</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="border-2 border-blue-100">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">+23%</div>
              <p className="text-gray-600">Genomsnittlig intäktsökning</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-100">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">-65%</div>
              <p className="text-gray-600">Färre no-shows</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-indigo-100">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">8 tim/v</div>
              <p className="text-gray-600">Sparad administrationstid</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Allt du behöver för att växa</h2>
          <p className="text-xl text-gray-600">Proaktiva verktyg som driver affären framåt</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-blue-300 transition-all hover:shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold">Risk-varningar</h3>
              <p className="text-gray-600">
                Identifiera riskbokningar innan de blir no-shows. Få varningar i tid så du kan agera proaktivt.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-purple-300 transition-all hover:shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold">Intäktssimulator</h3>
              <p className="text-gray-600">
                Testa "what-if" scenarios: Se exakt hur +2 bokningar/dag påverkar årsintäkten.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-indigo-300 transition-all hover:shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold">Avancerad analys</h3>
              <p className="text-gray-600">
                Djupdyk i kundbeteende, tjänsteprestanda och personaleffektivitet med visuella dashboards.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-green-300 transition-all hover:shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">Actionable insikter</h3>
              <p className="text-gray-600">
                Få konkreta rekommendationer: "Öka priser 10% på fredagar kl 14-17" = +15k kr/mån.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-orange-300 transition-all hover:shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold">Auto-synk</h3>
              <p className="text-gray-600">
                Anslut Bokadirekt-konto och få automatisk realtidssynk av alla bokningar och kunder.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-pink-300 transition-all hover:shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <div className="bg-pink-100 w-12 h-12 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold">Veckorapporter</h3>
              <p className="text-gray-600">
                Få automatiska sammanfattningar via mail med nyckeltal och trender varje måndag.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-4xl font-bold">Redo att växa din klinik?</h2>
            <p className="text-xl text-blue-50 max-w-2xl mx-auto">
              Börja med Flow idag och se hur AI kan transformera din verksamhet på 14 dagar.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Kom igång gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-blue-100">
              Gratis i 14 dagar • Ingen bindningstid • Avsluta när som helst
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Flow</span>
            </div>
            <p className="text-sm text-gray-600">
              © 2025 Flow. Revenue Intelligence Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

