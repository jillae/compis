

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, X } from 'lucide-react'

export function OnboardingBanner() {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const response = await fetch('/api/user/onboarding-status')
        const data = await response.json()
        
        if (!data.completed && !dismissed) {
          setShow(true)
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err)
      }
    }

    checkOnboarding()
  }, [dismissed])

  if (!show) return null

  return (
    <Alert className="bg-amber-50 border-amber-200 mb-6 animate-pulse">
      <AlertCircle className="h-5 w-5 text-amber-600" />
      <div className="flex items-center justify-between flex-1">
        <AlertDescription className="text-amber-900 font-medium">
          Slutför din onboarding för att ansluta ditt Bokadirekt-konto och få tillgång till din riktiga data!
        </AlertDescription>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push('/onboarding')}
            variant="default"
            size="sm"
            className="bg-amber-600 hover:bg-amber-700"
          >
            Slutför nu
          </Button>
          <Button
            onClick={() => {
              setShow(false)
              setDismissed(true)
            }}
            variant="ghost"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  )
}

