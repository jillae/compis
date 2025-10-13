

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CheckCircle, ArrowRight, Loader2, Copy, Check, Calendar, TrendingUp } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession() || {}
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  
  // Bokadirekt
  const [bokadirektEnabled, setBokadirektEnabled] = useState(false)
  const [bokadirektApiKey, setBokadirektApiKey] = useState('')
  
  // Meta API
  const [metaEnabled, setMetaEnabled] = useState(false)
  const [metaAccessToken, setMetaAccessToken] = useState('')
  const [metaAdAccountId, setMetaAdAccountId] = useState('')
  const [metaPixelId, setMetaPixelId] = useState('')

  useEffect(() => {
    // Check if user has already completed onboarding
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/user/onboarding-status')
        const data = await response.json()
        if (data.completed) {
          router.push('/dashboard/simulator')
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
    // Validate based on what's enabled
    if (bokadirektEnabled && !bokadirektApiKey) {
      setError('Vänligen ange din Bokadirekt API-nyckel')
      return
    }
    
    if (metaEnabled && (!metaAccessToken || !metaAdAccountId)) {
      setError('Vänligen ange Meta Access Token och Ad Account ID')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          step: 2, 
          bokadirektEnabled,
          bokadirektApiKey: bokadirektEnabled ? bokadirektApiKey : null,
          metaEnabled,
          metaAccessToken: metaEnabled ? metaAccessToken : null,
          metaAdAccountId: metaEnabled ? metaAdAccountId : null,
          metaPixelId: metaEnabled && metaPixelId ? metaPixelId : null,
        }),
      })

      if (response.ok) {
        router.push('/dashboard/simulator')
      } else {
        const data = await response.json()
        setError(data.error || 'Något gick fel. Kontrollera dina uppgifter och försök igen.')
      }
    } catch (err) {
      setError('Något gick fel. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipForNow = () => {
    // Allow user to skip and explore dashboard
    router.push('/dashboard/simulator?onboarding=incomplete')
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
      <Card className="max-w-3xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Anslut dina system</CardTitle>
          <CardDescription className="text-lg">
            Steg 2: Välj vilka integrationer du vill aktivera
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-900">
              <strong>Tips:</strong> Du kan hoppa över detta steg och aktivera integrationer senare under Inställningar.
            </AlertDescription>
          </Alert>

          {/* Bokadirekt Integration */}
          <div className="border rounded-lg p-6 space-y-4 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Bokadirekt Integration</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Synka bokningar, kunder och personal från Bokadirekt
                  </p>
                </div>
              </div>
              <Switch
                checked={bokadirektEnabled}
                onCheckedChange={setBokadirektEnabled}
                disabled={loading}
              />
            </div>

            {bokadirektEnabled && (
              <div className="pl-14 space-y-4 animate-in fade-in-50">
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold text-sm">Så här får du din API-nyckel:</h4>
                  <ol className="space-y-2 list-decimal list-inside text-sm text-gray-700">
                    <li>
                      Maila{' '}
                      <button
                        onClick={copyToClipboard}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        support@bokadirekt.se
                        {copied ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                      {' '}och be om API-aktivering
                    </li>
                    <li>Logga in på Bokadirekt → Inställningar → Övrigt → API-tjänst</li>
                    <li>Aktivera API-tjänsten och kopiera nyckeln</li>
                  </ol>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bokadirektApiKey">API-nyckel</Label>
                  <Input
                    id="bokadirektApiKey"
                    type="password"
                    placeholder="Din API-nyckel från Bokadirekt"
                    value={bokadirektApiKey}
                    onChange={(e) => setBokadirektApiKey(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Meta API Integration */}
          <div className="border rounded-lg p-6 space-y-4 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Meta Marketing API</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Optimera kampanjer baserat på klinikkapacitet och bokningar
                  </p>
                  <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                    PROFESSIONAL & ENTERPRISE
                  </span>
                </div>
              </div>
              <Switch
                checked={metaEnabled}
                onCheckedChange={setMetaEnabled}
                disabled={loading}
              />
            </div>

            {metaEnabled && (
              <div className="pl-14 space-y-4 animate-in fade-in-50">
                <div className="bg-indigo-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold text-sm">Så här får du dina Meta-uppgifter:</h4>
                  <ol className="space-y-2 list-decimal list-inside text-sm text-gray-700">
                    <li>Gå till Meta Business Manager (business.facebook.com)</li>
                    <li>Navigera till Business Settings → System Users</li>
                    <li>Skapa en System User med Marketing API-åtkomst</li>
                    <li>Generera Access Token med ads_read och ads_management scope</li>
                    <li>Hitta ditt Ad Account ID under Ads Manager (format: act_XXXXXXXXX)</li>
                  </ol>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="metaAccessToken">Access Token *</Label>
                    <Input
                      id="metaAccessToken"
                      type="password"
                      placeholder="EAAG..."
                      value={metaAccessToken}
                      onChange={(e) => setMetaAccessToken(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metaAdAccountId">Ad Account ID *</Label>
                    <Input
                      id="metaAdAccountId"
                      placeholder="act_123456789"
                      value={metaAdAccountId}
                      onChange={(e) => setMetaAdAccountId(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metaPixelId">Pixel ID (valfritt)</Label>
                    <Input
                      id="metaPixelId"
                      placeholder="123456789012345"
                      value={metaPixelId}
                      onChange={(e) => setMetaPixelId(e.target.value)}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Krävs för Conversions API och lead-kvalitetsspårning
                    </p>
                  </div>
                </div>
              </div>
            )}
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
              disabled={loading || (!bokadirektEnabled && !metaEnabled)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sparar...
                </>
              ) : (
                <>
                  Fortsätt
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Du kan ändra dessa inställningar när som helst under Inställningar
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

