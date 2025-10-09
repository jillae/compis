

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, ArrowRight, Loader2, Copy, Check } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession() || {}
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    // Check if user has already completed onboarding
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/user/onboarding-status')
        const data = await response.json()
        if (data.completed) {
          router.push('/dashboard')
        } else if (data.step === 2) {
          setStep(2)
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err)
      }
    }
    checkOnboardingStatus()
  }, [router])

  const handleStep1Complete = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 1 }),
      })

      if (response.ok) {
        setStep(2)
      } else {
        setError('Något gick fel. Försök igen.')
      }
    } catch (err) {
      setError('Något gick fel. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const handleStep2Complete = async () => {
    if (!apiKey) {
      setError('Vänligen ange din Bokadirekt API-nyckel')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 2, apiKey }),
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const data = await response.json()
        setError(data.error || 'Ogiltig API-nyckel. Kontrollera och försök igen.')
      }
    } catch (err) {
      setError('Något gick fel. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipForNow = () => {
    // Allow user to skip and explore dashboard
    router.push('/dashboard?onboarding=incomplete')
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText('support@bokadirekt.se')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <CheckCircle className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-3xl">Välkommen till Flow! 🎉</CardTitle>
            <CardDescription className="text-lg">
              Låt oss sätta upp ditt konto i två enkla steg
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">Steg 1: Utforska Flow</h3>
              <p className="text-gray-700">
                Du är nu inloggad! Du kan börja utforska Flow's dashboard och funktioner. 
                För att få tillgång till din riktiga bokningsdata från Bokadirekt behöver du 
                ansluta ditt konto i nästa steg.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Se demo-dashboard med exempel-data</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Testa AI-insikter och simulatorer</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Bekanta dig med alla funktioner</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleStep1Complete}
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Fortsätter...
                </>
              ) : (
                <>
                  Fortsätt till steg 2
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Anslut ditt Bokadirekt-konto</CardTitle>
          <CardDescription className="text-lg">
            Steg 2: Få tillgång till din riktiga bokningsdata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-900">
              <strong>Viktigt:</strong> För att Flow ska kunna hämta din bokningsdata behöver du en API-nyckel från Bokadirekt.
            </AlertDescription>
          </Alert>

          <div className="bg-blue-50 p-6 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Så här får du din API-nyckel:</h3>
            <ol className="space-y-3 list-decimal list-inside text-gray-700">
              <li>
                <strong>Maila Bokadirekt:</strong> Skicka ett mail till{' '}
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                >
                  support@bokadirekt.se
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                {' '}och be dem aktivera API för ditt konto.
              </li>
              <li>
                <strong>Vänta på aktivering:</strong> Bokadirekt aktiverar API-tjänsten för ditt konto (brukar ta 1-2 arbetsdagar).
              </li>
              <li>
                <strong>Hitta din nyckel:</strong> Logga in på Bokadirekt → Gå till <strong>Inställningar</strong> → <strong>Övrigt</strong> → <strong>API-tjänst</strong>
              </li>
              <li>
                <strong>Aktivera tjänsten:</strong> Använd toggle-knappen för att aktivera API-tjänsten.
              </li>
              <li>
                <strong>Kopiera nyckeln:</strong> Din API-nyckel visas nu. Kopiera den och klistra in nedan.
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">Bokadirekt API-nyckel</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Din API-nyckel från Bokadirekt"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Vi lagrar din API-nyckel säkert och använder den endast för att synka bokningsdata.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleSkipForNow}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Hoppa över nu
            </Button>
            <Button
              onClick={handleStep2Complete}
              className="flex-1"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Ansluter...
                </>
              ) : (
                <>
                  Anslut & Kom igång
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Du kan alltid ansluta Bokadirekt senare under Inställningar
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

