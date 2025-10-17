
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePlaidLink } from 'react-plaid-link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

function PlaidOAuthCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'initializing' | 'processing' | 'success' | 'error'>('initializing')
  const [message, setMessage] = useState('Initierar OAuth-anslutning...')
  const [linkToken, setLinkToken] = useState<string | null>(null)

  // Get link token from localStorage (set before OAuth redirect)
  useEffect(() => {
    const storedToken = localStorage.getItem('plaid_link_token')
    if (storedToken) {
      setLinkToken(storedToken)
      setStatus('processing')
      setMessage('Återansluter till Plaid...')
    } else {
      setStatus('error')
      setMessage('Link token saknas. Vänligen försök ansluta igen.')
    }
  }, [])

  const handleOnSuccess = async (publicToken: string, metadata: any) => {
    try {
      setStatus('processing')
      setMessage('Kopplar ditt bankkonto...')

      // Exchange public token for access token
      const response = await fetch('/api/bank/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicToken,
          institutionId: metadata.institution?.institution_id,
          institutionName: metadata.institution?.name,
          accounts: metadata.accounts,
        }),
      })

      if (!response.ok) {
        throw new Error('Kunde inte koppla bankkonto')
      }

      const data = await response.json()

      // Clear stored link token
      localStorage.removeItem('plaid_link_token')

      setStatus('success')
      setMessage(`Bankkoppling lyckades! ${metadata.institution?.name} är nu kopplat.`)

      // Redirect to bank settings after 2 seconds
      setTimeout(() => {
        router.push('/settings/bank')
      }, 2000)
    } catch (error: any) {
      console.error('Error exchanging token:', error)
      setStatus('error')
      setMessage(error.message || 'Kunde inte slutföra bankkopplingen')
      localStorage.removeItem('plaid_link_token')
    }
  }

  const handleOnExit = (error: any, metadata: any) => {
    if (error) {
      console.error('Plaid Link exit error:', error)
      setStatus('error')
      setMessage(`OAuth-flöde avbröts: ${error.error_message || 'Okänt fel'}`)
    } else {
      setStatus('error')
      setMessage('Bankkoppling avbröts')
    }
    localStorage.removeItem('plaid_link_token')
  }

  // Initialize Plaid Link with receivedRedirectUri
  const config = {
    token: linkToken,
    receivedRedirectUri: typeof window !== 'undefined' ? window.location.href : undefined,
    onSuccess: handleOnSuccess,
    onExit: handleOnExit,
  }

  const { open, ready } = usePlaidLink(config)

  // Auto-open Link when ready
  useEffect(() => {
    if (ready && linkToken && status === 'processing') {
      console.log('Plaid Link ready, opening...')
      open()
    }
  }, [ready, linkToken, open, status])

  return (
    <div className="container max-w-2xl mx-auto py-16 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(status === 'initializing' || status === 'processing') && (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Bearbetar bankkoppling...
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Lyckades!
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Ett fel uppstod
              </>
            )}
          </CardTitle>
          <CardDescription>
            {status === 'initializing' && 'Förbereder OAuth-anslutning...'}
            {status === 'processing' && 'Slutför bankkoppling via Plaid...'}
            {status === 'success' && 'Din bank är nu kopplad till Flow'}
            {status === 'error' && 'Kunde inte slutföra bankkopplingen'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Koppling aktiv</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fel</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {(status === 'initializing' || status === 'processing') && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Bearbetar</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/settings/bank')}
              variant={status === 'success' ? 'default' : 'outline'}
              className="flex-1"
            >
              Tillbaka till Bank Settings
            </Button>
            {status === 'success' && (
              <Button
                onClick={() => router.push('/revenue-pro')}
                className="flex-1"
              >
                Visa Revenue Intelligence
              </Button>
            )}
          </div>

          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-muted rounded text-xs">
              <div className="font-mono">
                <div>Status: {status}</div>
                <div>Ready: {ready ? 'Yes' : 'No'}</div>
                <div>Link Token: {linkToken ? 'Present' : 'Missing'}</div>
                <div>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PlaidOAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-2xl mx-auto py-16 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Laddar...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <PlaidOAuthCallbackContent />
    </Suspense>
  )
}
