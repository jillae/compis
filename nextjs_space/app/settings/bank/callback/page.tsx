
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

function BankCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState<any>(null)

  useEffect(() => {
    const processCallback = async () => {
      const ref = searchParams.get('ref')
      const error = searchParams.get('error')
      const success = searchParams.get('success')

      // Handle errors from redirect
      if (error) {
        setStatus('error')
        setMessage(getErrorMessage(error))
        return
      }

      // Handle success from redirect
      if (success) {
        setStatus('success')
        setMessage('Bankkoppling aktiverad!')
        return
      }

      // Handle new authorization callback
      if (ref) {
        try {
          // Fetch requisition details
          const response = await fetch(`/api/bank/requisition/${ref}`)
          
          if (!response.ok) {
            throw new Error('Kunde inte hämta requisition-detaljer')
          }

          const data = await response.json()
          setDetails(data)
          setStatus('success')
          setMessage('Bankkoppling genomförd!')
        } catch (err: any) {
          console.error('Error processing callback:', err)
          setStatus('error')
          setMessage(err.message || 'Ett fel uppstod vid bearbetning')
        }
      } else {
        setStatus('error')
        setMessage('Ingen requisition-referens hittades')
      }
    }

    processCallback()
  }, [searchParams])

  const getErrorMessage = (errorCode: string): string => {
    const errors: Record<string, string> = {
      missing_ref: 'Ingen requisition-referens hittades',
      connection_not_found: 'Bankkoppling kunde inte hittas',
      no_token: 'GoCardless access token saknas',
      callback_failed: 'Callback misslyckades',
    }
    return errors[errorCode] || 'Ett okänt fel uppstod'
  }

  return (
    <div className="container max-w-2xl mx-auto py-16 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'processing' && (
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
            {status === 'processing' && 'Vänligen vänta medan vi verifierar din bankkoppling...'}
            {status === 'success' && 'Din bank är nu kopplad till Flow'}
            {status === 'error' && 'Kunde inte slutföra bankkopplingen'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Koppling aktiv</AlertTitle>
              <AlertDescription>
                {message}
                {details && (
                  <div className="mt-3 space-y-1 text-sm">
                    <div>
                      <strong>Institution:</strong> {details.institutionName || 'Nordea'}
                    </div>
                    {details.accountIds && (
                      <div>
                        <strong>Konton:</strong> {details.accountIds.length} konto(n) kopplat
                      </div>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fel</AlertTitle>
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
                Visa Revenue Intelligence Pro
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BankCallbackPage() {
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
      <BankCallbackContent />
    </Suspense>
  )
}
