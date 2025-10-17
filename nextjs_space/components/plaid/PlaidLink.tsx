
'use client'

import { useState, useCallback, useEffect } from 'react'
import { usePlaidLink, PlaidLinkOptions, PlaidLinkOnSuccess } from 'react-plaid-link'
import { Button } from '@/components/ui/button'
import { Loader2, Building2 } from 'lucide-react'

interface PlaidLinkProps {
  onSuccess?: (publicToken: string, metadata: any) => void
  onExit?: () => void
  disabled?: boolean
}

export function PlaidLinkButton({ onSuccess, onExit, disabled }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [shouldOpen, setShouldOpen] = useState(false)

  // Fetch link token when button is clicked
  const fetchLinkToken = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/bank/plaid/link-token', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create link token')
      }

      const data = await response.json()
      
      // Store link token in localStorage for OAuth callback
      if (data.linkToken) {
        localStorage.setItem('plaid_link_token', data.linkToken)
        setLinkToken(data.linkToken)
        setShouldOpen(true)
      }
    } catch (error) {
      console.error('Error fetching link token:', error)
      alert('Failed to initialize bank connection. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOnSuccess: PlaidLinkOnSuccess = useCallback(
    async (publicToken, metadata) => {
      // Exchange public token for access token
      try {
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
          throw new Error('Failed to connect bank account')
        }

        const data = await response.json()
        
        // Clear stored link token after successful connection
        localStorage.removeItem('plaid_link_token')
        
        if (onSuccess) {
          onSuccess(publicToken, metadata)
        } else {
          // Default: reload page to show new connection
          window.location.reload()
        }
      } catch (error) {
        console.error('Error exchanging token:', error)
        alert('Failed to connect bank account. Please try again.')
        localStorage.removeItem('plaid_link_token')
      }
    },
    [onSuccess]
  )

  const handleOnExit = useCallback(
    (error: any, metadata: any) => {
      if (error) {
        console.error('Plaid Link exit error:', error)
      }
      
      // Don't clear token on exit - user might be in OAuth flow
      // Token will be cleared on success or after timeout
      
      if (onExit) {
        onExit()
      }
    },
    [onExit]
  )

  const config: PlaidLinkOptions = {
    token: linkToken,
    onSuccess: handleOnSuccess,
    onExit: handleOnExit,
  }

  const { open, ready } = usePlaidLink(config)

  const handleClick = async () => {
    if (!linkToken) {
      await fetchLinkToken()
    } else if (ready) {
      open()
    }
  }

  // Auto-open when link token is ready and shouldOpen is true
  useEffect(() => {
    if (linkToken && ready && shouldOpen) {
      setShouldOpen(false) // Reset flag
      setTimeout(() => open(), 100)
    }
  }, [linkToken, ready, shouldOpen, open])

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || loading}
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Building2 className="h-4 w-4" />
          Connect Bank Account
        </>
      )}
    </Button>
  )
}

export default PlaidLinkButton
