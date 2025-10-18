
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  CreditCard,
  DollarSign,
  TrendingUp,
} from 'lucide-react'

interface PlaidStatus {
  isConfigured: boolean;
  hasLinkToken: boolean;
  connectedAccounts: number;
  lastSync?: string;
}

export default function BillingPage() {
  const { data: session } = useSession() || {}
  const [plaidStatus, setPlaidStatus] = useState<PlaidStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user) {
      fetchPlaidStatus()
    }
  }, [session])

  const fetchPlaidStatus = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/settings/plaid')
      if (res.ok) {
        const data = await res.json()
        setPlaidStatus(data)
      } else {
        setError('Failed to fetch Plaid status')
      }
    } catch (error) {
      console.error('Error fetching Plaid status:', error)
      setError('Failed to fetch Plaid status')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing & Payments</h1>
          <p className="text-muted-foreground mt-2">
            Manage payment integrations and billing for all clinics
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Plaid Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Plaid Bank Integration
            </CardTitle>
            <CardDescription>
              Bank account data integration for all clinics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {plaidStatus?.isConfigured ? (
              <Alert className="border-green-600 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <div className="space-y-2">
                    <p className="font-semibold">Plaid is configured and active</p>
                    <div className="text-sm">
                      <p>Connected accounts: {plaidStatus.connectedAccounts}</p>
                      {plaidStatus.lastSync && (
                        <p>Last sync: {new Date(plaidStatus.lastSync).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Plaid is not configured. Bank integration is currently unavailable.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button onClick={() => window.location.href = '/superadmin/plaid'}>
                <Building className="mr-2 h-4 w-4" />
                Manage Plaid Settings
              </Button>
              <Button variant="outline" onClick={fetchPlaidStatus}>
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue (All Clinics)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Revenue tracking coming soon
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Subscription tracking coming soon
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Method</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Plaid</div>
              <p className="text-xs text-muted-foreground">
                Bank integration via Plaid
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Future Features */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              Features planned for future releases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Per-clinic billing breakdown</li>
              <li>• Subscription tier management</li>
              <li>• Invoice generation and history</li>
              <li>• Payment method management</li>
              <li>• Automatic billing notifications</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
