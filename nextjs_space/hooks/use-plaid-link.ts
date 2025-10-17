
'use client'

import { useState } from 'react'

export function usePlaidLink() {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createLinkToken = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/bank/plaid/link-token', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create link token')
      }

      const data = await response.json()
      setLinkToken(data.linkToken)
      return data.linkToken
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const exchangePublicToken = async (
    publicToken: string, 
    metadata: {
      institutionId?: string
      institutionName?: string
      accounts?: any[]
    }
  ) => {
    try {
      const response = await fetch('/api/bank/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicToken,
          institutionId: metadata.institutionId,
          institutionName: metadata.institutionName,
          accounts: metadata.accounts,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to exchange token')
      }

      return await response.json()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return {
    linkToken,
    loading,
    error,
    createLinkToken,
    exchangePublicToken,
  }
}

export default usePlaidLink
