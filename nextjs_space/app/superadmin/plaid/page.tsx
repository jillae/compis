
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Key,
} from 'lucide-react'

export default function PlaidConfigPage() {
  const { data: session } = useSession() || {}
  const [enabled, setEnabled] = useState(false)
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
      const res = await fetch('/api/settings/plaid')
      if (res.ok) {
        const data = await res.json()
        setEnabled(data.plaidEnabled)
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
      const res = await fetch('/api/settings/plaid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess('Plaid configuration saved successfully')
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
          <h1 className="text-3xl font-bold">Plaid Bank Integration</h1>
          <p className="text-muted-foreground mt-2">
            Configure Plaid for real-time bank transaction data
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
              Plaid API Settings
            </CardTitle>
            <CardDescription>
              Enable Plaid bank integration for Arch Clinic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">Enable Plaid Integration</Label>
                <p className="text-sm text-muted-foreground">
                  Allow Arch Clinic to connect bank accounts via Plaid
                </p>
              </div>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Plaid credentials are configured via environment variables (PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV)
              </AlertDescription>
            </Alert>

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

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">How Plaid Works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900 space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Step 1: Enable Integration</h4>
              <p>Toggle the switch above to enable Plaid for your clinic.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Step 2: Connect Bank</h4>
              <p>Go to Settings → Bank and click "Connect Bank Account".</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Step 3: Authenticate</h4>
              <p>Plaid Link will open - select your bank and log in securely.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Step 4: Sync Transactions</h4>
              <p>Transactions will be automatically synced and categorized.</p>
            </div>
            
            <div className="pt-4 border-t border-blue-200">
              <h4 className="font-semibold mb-2">Supported Banks</h4>
              <p>Plaid supports Swedish banks including: Nordea, SEB, Swedbank, Handelsbanken, ICA Banken, Länsförsäkringar, and more.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
