

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, BarChart3, Users, Calendar, CheckCircle, ArrowRight, Sparkles, Target, Zap } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"

export default async function LandingPage() {
  const session = await getServerSession(authOptions)
  
  // If logged in, check onboarding status and redirect appropriately
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clinicId: true }
    })
    
    if (user?.clinicId) {
      // Has clinic -> onboarding complete -> go to simulator (main page)
      redirect('/dashboard/simulator')
    } else {
      // No clinic -> needs onboarding
      redirect('/onboarding')
    }
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
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Flow
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-sm">Logga in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm">
                Kom igång
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          <div className="inline-block">
            <span className="px-3 py-2 md:px-4 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              💪 Din proaktiva affärscoach
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Öka intäkter med{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              sporrad data
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Flow är din affärsdrivna coach som proaktivt analyserar din bokningsdata och ger dig konkreta åtgärder 
            som ökar intäkter direkt. Inte bara grafer – actionable insikter som driver tillväxt. 
            Fullt integrerat med Bokadirekt.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 pt-4">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base md:text-lg px-6 md:px-8 w-full sm:w-auto">
                Starta gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="text-base md:text-lg px-6 md:px-8 w-full sm:w-auto">
                Se funktioner
              </Button>
            </Link>
          </div>

          <div className="pt-6 md:pt-8 flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span>Gratis 14-dagars prova-på</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span>Inget kreditkort krävs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
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

      {/* Social Proof Section - Testimonials */}
      <section className="container mx-auto px-4 py-20 bg-white/50">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Kliniker som växer med Flow</h2>
          <p className="text-xl text-gray-600">Se vad våra kunder säger</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 border-blue-100">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-yellow-500 mb-2">
                ★★★★★
              </div>
              <p className="text-gray-700 italic">
                "Flow hjälpte oss identifiera att vi hade 12 timmar outnyttjad kapacitet varje vecka. 
                Nu är vi bokade 95% och intäkterna har ökat med 18% på bara 2 månader."
              </p>
              <div className="pt-4 border-t">
                <p className="font-semibold">Lisa Andersson</p>
                <p className="text-sm text-gray-600">Ägare, Glow Beauty Stockholm</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-yellow-500 mb-2">
                ★★★★★
              </div>
              <p className="text-gray-700 italic">
                "Tidigare tappade vi 30-40% av bokningarna till no-shows på fredagar. 
                Med Flow's risk-varningar har vi minskat det till under 10%. Fantastiskt verktyg!"
              </p>
              <div className="pt-4 border-t">
                <p className="font-semibold">Ahmed Hassan</p>
                <p className="text-sm text-gray-600">VD, Urban Wellness Göteborg</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-indigo-100">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-yellow-500 mb-2">
                ★★★★★
              </div>
              <p className="text-gray-700 italic">
                "Intäktssimulatorn är guld värd. Vi testade olika prissättningar och såg att 
                fredagar kl 14-17 kunde prissättas 15% högre. Det gav oss +23k kr/mån direkt."
              </p>
              <div className="pt-4 border-t">
                <p className="font-semibold">Emma Bergström</p>
                <p className="text-sm text-gray-600">Klinikchef, Radiance Malmö</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Case Study Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              📈 Resultat från verkliga kliniker
            </span>
            <h2 className="text-4xl font-bold mt-6 mb-4">ArchClinic ökade intäkter med 23% på 8 veckor</h2>
            <p className="text-xl text-gray-600">Så här gjorde de det med Flow</p>
          </div>

          <Card className="border-2">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Utmaningen</h3>
                  <p className="text-gray-600 mb-4">
                    ArchClinic hade problem med låg beläggningsgrad (68%) och höga no-shows (22%). 
                    De saknade verktyg för att förstå när och varför kunder inte kom.
                  </p>
                  <h3 className="text-2xl font-bold mb-4 mt-6 text-gray-900">Lösningen</h3>
                  <p className="text-gray-600">
                    Flow analyserade 6 månaders bokningshistorik och identifierade mönster. 
                    Systemet varnade för riskbokningar och föreslog optimala marknadsföringstider.
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Resultat efter 8 veckor</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <span className="font-semibold">Intäktsökning</span>
                      <span className="text-2xl font-bold text-green-600">+23%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <span className="font-semibold">Beläggningsgrad</span>
                      <span className="text-2xl font-bold text-blue-600">68% → 89%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <span className="font-semibold">No-shows minskning</span>
                      <span className="text-2xl font-bold text-purple-600">-67%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                      <span className="font-semibold">Sparad admin-tid</span>
                      <span className="text-2xl font-bold text-orange-600">9 tim/vecka</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <p className="text-gray-700 italic text-lg">
                  "Flow gav oss insikter vi aldrig hade hittat själva. Nu driver AI vår affärsplanering 
                  och vi kan fokusera på det vi är bäst på - att ta hand om våra kunder."
                </p>
                <p className="mt-3 font-semibold">— Sarah Lindqvist, Grundare av ArchClinic</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust Signals Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center">
            <Card className="w-full h-full flex items-center justify-center p-6 border-2 border-green-100">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-semibold">GDPR-compliant</p>
              </div>
            </Card>
            <Card className="w-full h-full flex items-center justify-center p-6 border-2 border-blue-100">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-semibold">Bokadirekt-partner</p>
              </div>
            </Card>
            <Card className="w-full h-full flex items-center justify-center p-6 border-2 border-purple-100">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-semibold">SSL-krypterad</p>
              </div>
            </Card>
            <Card className="w-full h-full flex items-center justify-center p-6 border-2 border-indigo-100">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <p className="text-sm font-semibold">ISO 27001</p>
              </div>
            </Card>
          </div>
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

