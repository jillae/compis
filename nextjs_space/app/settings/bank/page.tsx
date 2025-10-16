
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Building, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

interface BankConnection {
  id: string
  requisitionId: string
  institutionId: string
  institutionName: string
  status: string
  accountIds: string[]
  lastSyncAt: string | null
  lastSyncStatus: string | null
  createdAt: string
}

interface Institution {
  id: string
  name: string
  logo: string
}

export default function BankIntegrationPage() {
  const { data: session } = useSession() || {}

  const [connections, setConnections] = useState<BankConnection[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [selectedInstitution, setSelectedInstitution] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Check for callback messages
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const params = new URLSearchParams(window.location.search)
    const successParam = params.get('success')
    const errorParam = params.get('error')

    if (successParam === 'connected') {
      setSuccess('Bank successfully connected! Fetching accounts...')
      setTimeout(() => fetchConnections(), 1000)
    }

    if (errorParam) {
      setError(`Connection error: ${errorParam}`)
    }
  }, [])

  // Fetch connections
  useEffect(() => {
    if (session?.user) {
      fetchConnections()
      fetchInstitutions()
    }
  }, [session])

  const fetchConnections = async () => {
    try {
      const res = await fetch('/api/bank/connect')
      if (res.ok) {
        const data = await res.json()
        setConnections(data.connections || [])
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
    }
  }

  const fetchInstitutions = async () => {
    try {
      const res = await fetch('/api/bank/institutions?country=se')
      if (res.ok) {
        const data = await res.json()
        setInstitutions(data.institutions || [])
      }
    } catch (error) {
      console.error('Error fetching institutions:', error)
    }
  }

  const handleConnect = async () => {
    if (!selectedInstitution) {
      setError('Please select a bank')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/bank/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institutionId: selectedInstitution }),
      })

      const data = await res.json()

      if (res.ok && data.authLink) {
        // Redirect to bank authorization
        window.location.href = data.authLink
      } else {
        setError(data.error || 'Failed to connect bank')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to connect bank')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (connectionId: string, accountId: string) => {
    setSyncing(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/bank/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          connectionId, 
          accountId,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(`Synced ${data.syncedCount} transactions`)
        fetchConnections()
      } else {
        setError(data.error || 'Failed to sync transactions')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sync transactions')
    } finally {
      setSyncing(false)
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
            Connect your bank account to get real-time transaction data for better financial insights.
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

        {/* Connect New Bank */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Connect New Bank
            </CardTitle>
            <CardDescription>
              Choose your bank and authorize Flow to read transaction data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="institution">Select Bank</Label>
              <select
                id="institution"
                value={selectedInstitution}
                onChange={(e) => setSelectedInstitution(e.target.value)}
                className="w-full p-2 border rounded-md"
                disabled={loading}
              >
                <option value="">-- Select a bank --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleConnect}
              disabled={loading || !selectedInstitution}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Connect Bank
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              You will be redirected to your bank's website to authorize the connection.
              Flow will only have read-only access to your transaction data.
            </p>
          </CardContent>
        </Card>

        {/* Connected Banks */}
        {connections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Connected Banks</CardTitle>
              <CardDescription>
                Your connected bank accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connections.map((conn) => (
                <div key={conn.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{conn.institutionName}</div>
                        <div className="text-sm text-muted-foreground">
                          {conn.accountIds.length} account(s)
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm px-2 py-1 rounded-full ${
                      conn.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {conn.status}
                    </div>
                  </div>

                  {conn.lastSyncAt && (
                    <div className="text-sm text-muted-foreground">
                      Last synced: {new Date(conn.lastSyncAt).toLocaleString('sv-SE')}
                    </div>
                  )}

                  {conn.accountIds.length > 0 && (
                    <div className="flex gap-2">
                      {conn.accountIds.map((accountId) => (
                        <Button
                          key={accountId}
                          size="sm"
                          variant="outline"
                          onClick={() => handleSync(conn.id, accountId)}
                          disabled={syncing}
                          className="gap-2"
                        >
                          {syncing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          Sync Transactions
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
