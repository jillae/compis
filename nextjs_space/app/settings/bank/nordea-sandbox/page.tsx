
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, ExternalLink, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'

export default function NordeaSandboxTestPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [accessToken, setAccessToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [requisition, setRequisition] = useState<any>(null)
  const [error, setError] = useState('')

  const handleCreateRequisition = async () => {
    if (!accessToken.trim()) {
      setError('Access Token är obligatoriskt')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Step 1: Save access token to clinic settings (if admin)
      const saveTokenRes = await fetch('/api/settings/bank/access-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      })

      if (!saveTokenRes.ok) {
        throw new Error('Kunde inte spara access token')
      }

      // Step 2: Create requisition for Nordea Sandbox
      const requisitionRes = await fetch('/api/bank/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId: 'NDEASES1_SANDBOX',
        }),
      })

      if (!requisitionRes.ok) {
        const errorData = await requisitionRes.json()
        throw new Error(errorData.error || 'Kunde inte skapa requisition')
      }

      const data = await requisitionRes.json()
      setRequisition(data)

      toast.success('Requisition skapad! Omdirigerar till Nordea...')

      // Step 3: Redirect to Nordea authorization
      setTimeout(() => {
        window.location.href = data.authLink
      }, 2000)
    } catch (err: any) {
      console.error('Error creating requisition:', err)
      setError(err.message || 'Ett fel uppstod')
      toast.error('Misslyckades med att skapa requisition')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/settings/bank')}>
          ← Tillbaka till Bank Settings
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                🧪 Nordea Sandbox Test
                <Badge variant="secondary">Testing</Badge>
              </CardTitle>
              <CardDescription>
                Testa GoCardless Bank Account Data API med Nordea sandbox
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instructions */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Hur det fungerar</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <ol className="list-decimal list-inside space-y-1">
                <li>Ange din GoCardless Sandbox Access Token nedan</li>
                <li>Klicka "Skapa Nordea Requisition"</li>
                <li>Du omdirigeras till Nordeas sandbox-inloggning</li>
                <li>Efter inloggning kommer du tillbaka hit med aktiv koppling</li>
                <li>Account ID sparas automatiskt och transaktioner kan hämtas</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Step 1: Enter Access Token */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessToken">
                GoCardless Sandbox Access Token *
              </Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Din sandbox access token från GoCardless"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Hämta din token från{' '}
                <a
                  href="https://bankaccountdata.gocardless.com/user-secrets/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  GoCardless Dashboard
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            <Button
              onClick={handleCreateRequisition}
              disabled={loading || !accessToken.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Skapar requisition...
                </>
              ) : (
                '🚀 Skapa Nordea Sandbox Requisition'
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fel</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success - Requisition Created */}
          {requisition && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Requisition skapad!</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <div>
                  <strong>Requisition ID:</strong>{' '}
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {requisition.bankConnection?.requisitionId}
                  </code>
                </div>
                <div>
                  <strong>Reference:</strong>{' '}
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {requisition.bankConnection?.reference}
                  </code>
                </div>
                <div>
                  <strong>Status:</strong>{' '}
                  <Badge>{requisition.bankConnection?.status}</Badge>
                </div>
                <p className="text-sm pt-2">
                  Du omdirigeras automatiskt till Nordea för att auktorisera
                  åtkomst...
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* API Flow Diagram */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold mb-3">API Flow</h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-16">POST</Badge>
                <code>/api/bank/connect</code>
              </div>
              <div className="pl-20 text-muted-foreground">
                ↓ Skapar requisition med NDEASES1_SANDBOX
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-16">GET</Badge>
                <code>response.authLink</code>
              </div>
              <div className="pl-20 text-muted-foreground">
                ↓ Användare loggar in på Nordea
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-16">GET</Badge>
                <code>/api/bank/callback?ref=...</code>
              </div>
              <div className="pl-20 text-muted-foreground">
                ↓ Hämtar account_id från requisition
              </div>
              <div className="flex items-center gap-2">
                <Badge className="w-16 bg-green-100 text-green-800">
                  Done
                </Badge>
                <code>Bank connection active ✓</code>
              </div>
            </div>
          </div>

          {/* Documentation Links */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Dokumentation</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <a
                  href="https://developer.gocardless.com/bank-account-data/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  GoCardless API Documentation
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://developer.gocardless.com/bank-account-data/sandbox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Sandbox Testing Guide
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
