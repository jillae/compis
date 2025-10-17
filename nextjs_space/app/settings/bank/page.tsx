
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlaidLinkButton } from '@/components/plaid/PlaidLink'
import { 
  Building, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  ArrowLeft,
  Trash2,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

interface BankConnection {
  id: string
  itemId: string
  institutionId: string
  institutionName: string
  status: string
  accountIds: string[]
  lastSyncedAt: string | null
  lastSyncStatus: string | null
  createdAt: string
}

interface PlaidAccount {
  accountId: string
  name: string
  type: string
  subtype: string
  mask: string
  balances?: {
    available: number
    current: number
    currency: string
  }
}

export default function BankIntegrationPage() {
  const { data: session } = useSession() || {}

  const [connections, setConnections] = useState<BankConnection[]>([])
  const [accounts, setAccounts] = useState<Record<string, PlaidAccount[]>>({})
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [plaidEnabled, setPlaidEnabled] = useState(false)

  // Fetch connections and Plaid status
  useEffect(() => {
    if (session?.user) {
      fetchPlaidStatus()
      fetchConnections()
      fetchAccounts()
    }
  }, [session])

  const fetchPlaidStatus = async () => {
    try {
      const res = await fetch('/api/settings/plaid')
      if (res.ok) {
        const data = await res.json()
        setPlaidEnabled(data.plaidEnabled)
      }
    } catch (error) {
      console.error('Error fetching Plaid status:', error)
    }
  }

  const fetchConnections = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bank/plaid/accounts')
      if (res.ok) {
        const data = await res.json()
        // Extract connections from response
        const connectionsData = data.connections || []
        const accountsData: Record<string, PlaidAccount[]> = {}
        
        connectionsData.forEach((conn: any) => {
          accountsData[conn.connectionId] = conn.accounts || []
        })
        
        setAccounts(accountsData)
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/bank/plaid/accounts')
      if (res.ok) {
        const data = await res.json()
        const accountsData: Record<string, PlaidAccount[]> = {}
        
        data.connections?.forEach((conn: any) => {
          accountsData[conn.connectionId] = conn.accounts || []
        })
        
        setAccounts(accountsData)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const handlePlaidSuccess = (publicToken: string, metadata: any) => {
    setSuccess(`Successfully connected ${metadata.institution?.name}!`)
    setTimeout(() => {
      fetchConnections()
      fetchAccounts()
    }, 1000)
  }

  const handleSync = async (connectionId: string) => {
    setSyncing(prev => ({ ...prev, [connectionId]: true }))
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/bank/plaid/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(`Synced ${data.added} new transactions`)
        fetchConnections()
      } else {
        setError(data.error || 'Failed to sync transactions')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sync transactions')
    } finally {
      setSyncing(prev => ({ ...prev, [connectionId]: false }))
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bank Integration</h1>
          <p className="text-muted-foreground mt-2">
            Connect your bank account via Plaid to get real-time transaction data for better financial insights.
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

        {/* Plaid Not Enabled Warning */}
        {!plaidEnabled && (
          <Alert className="border-amber-600 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              Plaid integration is not enabled for your clinic. Please contact your administrator to enable it.
            </AlertDescription>
          </Alert>
        )}

        {/* Connect New Bank */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Connect Bank Account
            </CardTitle>
            <CardDescription>
              Securely connect your bank via Plaid to automatically import transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlaidLinkButton
              onSuccess={handlePlaidSuccess}
              disabled={!plaidEnabled || loading}
            />

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="font-semibold text-sm">🔒 Secure & Read-Only</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your credentials are never stored by Flow</li>
                <li>• Flow only has read-only access to transaction data</li>
                <li>• You can revoke access at any time</li>
                <li>• All data is encrypted and secure</li>
              </ul>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 space-y-2">
              <h4 className="font-semibold text-sm text-blue-900">🏦 Supported Banks</h4>
              <p className="text-sm text-blue-800">
                Nordea, SEB, Swedbank, Handelsbanken, ICA Banken, Länsförsäkringar, Danske Bank, Skandiabanken, and more Swedish banks supported.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Connected Banks */}
        {Object.keys(accounts).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Your linked bank accounts and balances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(accounts).map(([connectionId, accountList]) => (
                <div key={connectionId} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{accountList[0]?.type || 'Bank Account'}</div>
                        <div className="text-sm text-muted-foreground">
                          {accountList.length} account(s)
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSync(connectionId)}
                      disabled={syncing[connectionId]}
                      className="gap-2"
                    >
                      {syncing[connectionId] ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3" />
                          Sync Transactions
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Account Details */}
                  <div className="space-y-2">
                    {accountList.map((acc) => (
                      <div key={acc.accountId} className="flex items-center justify-between p-3 bg-muted rounded">
                        <div>
                          <div className="font-medium text-sm">{acc.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {acc.subtype} ••••{acc.mask}
                          </div>
                        </div>
                        {acc.balances && (
                          <div className="text-right">
                            <div className="font-semibold">
                              {acc.balances.current?.toLocaleString('sv-SE')} {acc.balances.currency}
                            </div>
                            {acc.balances.available !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                Available: {acc.balances.available.toLocaleString('sv-SE')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {Object.keys(accounts).length === 0 && !loading && plaidEnabled && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bank Connections</h3>
              <p className="text-muted-foreground mb-4">
                Connect your first bank account to start tracking transactions automatically.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
