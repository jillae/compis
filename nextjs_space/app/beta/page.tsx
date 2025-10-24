
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Check, Sparkles, Users, Zap, TrendingUp, Heart, ArrowRight, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export default function BetaPage() {
  const [formData, setFormData] = useState({
    clinicName: '',
    contactName: '',
    email: '',
    phone: '',
    currentBookingSystem: '',
    numberOfStaff: '',
    motivation: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/beta/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          numberOfStaff: formData.numberOfStaff ? parseInt(formData.numberOfStaff) : null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Något gick fel')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Tack för din ansökan! 🎉</CardTitle>
            <CardDescription className="text-base">
              Vi har mottagit din ansökan och återkommer inom 24 timmar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Vi granskar alla ansökningar noggrant för att säkerställa att vi kan ge dig bästa möjliga support under beta-fasen.
            </p>
            <Link href="/">
              <Button>Tillbaka till startsidan</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Begränsat antal platser
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Bli en av de första 6 beta-klinikerna
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Hjälp oss bygga framtidens AI-drivna klinikplattform – och få exklusiva förmåner som tack.
          </p>

          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>5 platser kvar</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Beslutas inom 24h</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Vad du får som beta-partner</h2>
            <p className="text-gray-600">Exklusiva förmåner värda över 20,000 kr</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">3 månader helt gratis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Full tillgång till alla funktioner utan kostnad. Ingen bindningstid.
                </p>
                <p className="text-sm text-blue-600 font-medium mt-2">
                  Värde: 9,000 kr
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-purple-50/50">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">15% livstidsrabatt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Efter beta-perioden: 2,550 kr/mån istället för 3,000 kr/mån. För alltid.
                </p>
                <p className="text-sm text-purple-600 font-medium mt-2">
                  Värde: 5,400 kr/år
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Prioriterad support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Direktlinje till produktteamet via Slack. Svar inom 2 timmar.
                </p>
                <p className="text-sm text-green-600 font-medium mt-2">
                  Obetalbara insikter
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-gray-600" />
                </div>
                <CardTitle className="text-lg">Påverka utvecklingen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Din feedback formar plattformen. Dina feature requests prioriteras.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-gray-600" />
                </div>
                <CardTitle className="text-lg">Gratis onboarding</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Personlig genomgång och uppsättning av din klinik.
                </p>
                <p className="text-sm text-gray-600 font-medium mt-2">
                  Värde: 5,000 kr
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-gray-600" />
                </div>
                <CardTitle className="text-lg">Beta Partner Badge</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Exklusiv badge som visar att du är en founding clinic.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* What We Ask */}
          <Card className="bg-gradient-to-br from-gray-50 to-white mb-12">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Vad vi ber om</CardTitle>
              <CardDescription className="text-center">
                Enkla åtaganden som hjälper oss bygga bättre
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Använd systemet regelbundet</p>
                    <p className="text-sm text-gray-600">Minst 2 gånger per vecka i 3 månader</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Ge feedback</p>
                    <p className="text-sm text-gray-600">Kort enkät varje månad + ad-hoc kommentarer</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Delta i användartester</p>
                    <p className="text-sm text-gray-600">2-3 intervjuer via Zoom (30-60 min)</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Rapportera buggar</p>
                    <p className="text-sm text-gray-600">Via Slack eller email när du hittar något</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="container mx-auto px-4 pb-24">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Ansök om beta-plats</CardTitle>
              <CardDescription>
                Fyll i formuläret så hör vi av oss inom 24 timmar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Klinikens namn *</Label>
                    <Input
                      id="clinicName"
                      name="clinicName"
                      value={formData.clinicName}
                      onChange={handleChange}
                      required
                      placeholder="t.ex. Beauty Clinic Stockholm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Ditt namn *</Label>
                    <Input
                      id="contactName"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      required
                      placeholder="t.ex. Anna Andersson"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="anna@beautyclinic.se"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="070-123 45 67"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentBookingSystem">Nuvarande bokningssystem</Label>
                    <Input
                      id="currentBookingSystem"
                      name="currentBookingSystem"
                      value={formData.currentBookingSystem}
                      onChange={handleChange}
                      placeholder="t.ex. Bokadirekt, Timify, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numberOfStaff">Antal anställda</Label>
                    <Input
                      id="numberOfStaff"
                      name="numberOfStaff"
                      type="number"
                      min="1"
                      value={formData.numberOfStaff}
                      onChange={handleChange}
                      placeholder="t.ex. 5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivation">Varför vill du bli betatestare? *</Label>
                  <Textarea
                    id="motivation"
                    name="motivation"
                    value={formData.motivation}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="Berätta kort om din klinik och vad du hoppas få ut av att vara med i beta-programmet..."
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Skickar...
                    </>
                  ) : (
                    <>
                      Skicka ansökan
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Genom att skicka in formuläret godkänner du att vi kontaktar dig om beta-programmet.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Vanliga frågor</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vad händer efter beta-perioden?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Efter 3 månader kan du välja att fortsätta med 15% livstidsrabatt (2,550 kr/mån) eller avsluta utan kostnad. Ingen bindningstid.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Måste jag betala något under beta-perioden?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Nej, de första 3 månaderna är helt gratis. Vi ber inte om kortuppgifter förrän du väljer att fortsätta efter beta-perioden.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hur mycket tid måste jag lägga på feedback?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Cirka 30 minuter per månad för enkät + ad-hoc kommentarer när du använder systemet. Plus 2-3 intervjuer (30-60 min vardera) under beta-perioden.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kan jag avsluta när som helst?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Ja, du kan avsluta när som helst utan kostnad. Vi hoppas dock att du stannar hela beta-perioden för att ge oss värdefull feedback.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
