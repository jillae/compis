
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Key,
} from 'lucide-react'

export default function GoCardlessConfigPage() {
  const { data: session } = useSession() || {}
  const [accessToken, setAccessToken] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [hasToken, setHasToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user) {
      fetchConfig()
    }
  }, [session])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/settings/gocardless')
      if (res.ok) {
        const data = await res.json()
        setEnabled(data.gocardlessEnabled)
        setHasToken(data.hasAccessToken)
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const body: any = {}

      if (accessToken) {
        body.accessToken = accessToken
      }

      body.enabled = enabled

      const res = await fetch('/api/settings/gocardless', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess('GoCardless configuration saved successfully')
        setHasToken(data.hasAccessToken)
        setAccessToken('') // Clear input after save
      } else {
        setError(data.error || 'Failed to save configuration')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">GoCardless Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Configure GoCardless Bank Account Data API for Arch Clinic
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-600">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              GoCardless API Settings
            </CardTitle>
            <CardDescription>
              Configure access token for bank account data integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">Enable GoCardless Integration</Label>
                <p className="text-sm text-muted-foreground">
                  Allow Arch Clinic to connect bank accounts
                </p>
              </div>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="access-token" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                GoCardless Access Token
              </Label>
              <Input
                id="access-token"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={hasToken ? '••••••••••••••••' : 'Enter access token'}
              />
              <p className="text-xs text-muted-foreground">
                Get your access token from{' '}
                <a 
                  href="https://bankaccountdata.gocardless.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GoCardless Dashboard
                </a>
              </p>
            </div>

            {hasToken && (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Access token is configured. Leave the field empty to keep the existing token.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900 space-y-2">
            <ol className="list-decimal list-inside space-y-2">
              <li>Create an account at <a href="https://bankaccountdata.gocardless.com/" target="_blank" rel="noopener noreferrer" className="underline">GoCardless</a></li>
              <li>Generate a Secret ID and Secret Key</li>
              <li>Exchange them for an access token using the API</li>
              <li>Copy the access token and paste it above</li>
              <li>Enable the integration and save</li>
              <li>Go to Settings → Bank to connect Nordea or other banks</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
