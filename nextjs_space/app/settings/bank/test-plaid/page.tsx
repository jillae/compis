
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle2, AlertCircle, Building2, TestTube } from 'lucide-react'
import { PlaidLinkButton } from '@/components/plaid/PlaidLink'
import Link from 'next/link'

export default function TestPlaidPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testPlaidConnection = async () => {
    setLoading(true)
    setTestResults(null)

    try {
      // Test 1: Create link token
      const linkTokenResponse = await fetch('/api/bank/plaid/link-token', {
        method: 'POST',
      })
      const linkTokenData = await linkTokenResponse.json()

      setTestResults({
        linkToken: linkTokenResponse.ok ? '✅ Created' : '❌ Failed',
        linkTokenValue: linkTokenData.linkToken?.substring(0, 20) + '...',
        redirectUri: linkTokenData.redirectUri,
        error: linkTokenData.error,
      })
    } catch (error: any) {
      setTestResults({
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TestTube className="h-8 w-8" />
            Test Plaid Integration
          </h1>
          <p className="text-muted-foreground mt-2">
            Testa Plaid-integrationen med sandbox-credentials
          </p>
        </div>

        {/* Sandbox Credentials */}
        <Card className="border-blue-500 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">🏦 Sandbox Test Credentials</CardTitle>
            <CardDescription className="text-blue-800">
              Använd dessa credentials för att testa Plaid Link i sandbox-miljö
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-white p-4 rounded-lg space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">Användarnamn:</span>
                <span className="text-blue-600">user_good</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Lösenord:</span>
                <span className="text-blue-600">pass_good</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">2FA-kod (om nödvändig):</span>
                <span className="text-blue-600">1234</span>
              </div>
            </div>
            <Alert className="border-amber-500 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <strong>För svenska banker (OAuth):</strong> Välj vilken svensk bank som helst i Plaid Link. 
                Sandbox kommer simulera OAuth-flödet automatiskt.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Test Connection */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Test Backend Connection</CardTitle>
            <CardDescription>
              Verifiera att backend kan skapa link tokens med OAuth redirect URI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testPlaidConnection}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4" />
                  Test Backend Connection
                </>
              )}
            </Button>

            {testResults && (
              <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
                <div>Link Token: {testResults.linkToken}</div>
                {testResults.linkTokenValue && (
                  <div>Token Value: {testResults.linkTokenValue}</div>
                )}
                {testResults.redirectUri && (
                  <div>Redirect URI: {testResults.redirectUri}</div>
                )}
                {testResults.error && (
                  <div className="text-red-600">Error: {testResults.error}</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Plaid Link */}
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Test Plaid Link (Full OAuth Flow)</CardTitle>
            <CardDescription>
              Klicka för att öppna Plaid Link och testa anslutning till en svensk bank
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlaidLinkButton
              onSuccess={(publicToken, metadata) => {
                alert(`✅ Success! Connected to ${metadata.institution?.name}`)
              }}
            />

            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Vad kommer hända</AlertTitle>
              <AlertDescription>
                <ol className="list-decimal ml-4 space-y-1 mt-2">
                  <li>Backend skapar en link token med OAuth redirect URI</li>
                  <li>Plaid Link öppnas</li>
                  <li>Du väljer en svensk bank (t.ex. Nordea, SEB, Swedbank)</li>
                  <li>OAuth-flöde startar → omdirigeras till bankens inloggningssida (simulerad i sandbox)</li>
                  <li>Efter autentisering → omdirigeras tillbaka till <code>/settings/bank/plaid-oauth-callback</code></li>
                  <li>Plaid Link öppnas igen automatiskt med <code>receivedRedirectUri</code></li>
                  <li>Token utbyts och bankkonto kopplas</li>
                </ol>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Configuration Check */}
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Plaid Dashboard Configuration</CardTitle>
            <CardDescription>
              Verifiera att din Plaid Dashboard är korrekt konfigurerad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-amber-500 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle>Viktigt!</AlertTitle>
              <AlertDescription className="text-amber-900">
                För att OAuth ska fungera måste du lägga till följande redirect URI i din Plaid Dashboard:
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg">
              <div className="font-semibold mb-2">Redirect URIs att lägga till:</div>
              <div className="font-mono text-sm space-y-1">
                <div>• http://localhost:3000/settings/bank/plaid-oauth-callback</div>
                <div>• https://flow.abacusai.app/settings/bank/plaid-oauth-callback</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="font-semibold">Steg för att lägga till redirect URI:</div>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Gå till <a href="https://dashboard.plaid.com/team/api" target="_blank" rel="noopener" className="text-blue-600 underline">Plaid Dashboard → Team Settings → API</a></li>
                <li>Scrolla ner till <strong>"Allowed redirect URIs"</strong></li>
                <li>Lägg till båda URIs ovan</li>
                <li>Klicka på "Save changes"</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Back to Bank Settings */}
        <div className="flex gap-3">
          <Link href="/settings/bank" className="flex-1">
            <Button variant="outline" className="w-full">
              Tillbaka till Bank Settings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
