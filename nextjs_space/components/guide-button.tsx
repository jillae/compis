
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'
import { ProductTour } from './product-tour'

export function GuideButton() {
  const [isBetaUser, setIsBetaUser] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkBetaStatus()
  }, [])

  const checkBetaStatus = async () => {
    try {
      const response = await fetch('/api/user/tour-status')
      if (response.ok) {
        const data = await response.json()
        setIsBetaUser(data.isBetaUser)
      }
    } catch (error) {
      console.error('Error checking beta status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTourComplete = async () => {
    try {
      await fetch('/api/user/tour-status', {
        method: 'POST'
      })
    } catch (error) {
      console.error('Error updating tour status:', error)
    }
    setShowTour(false)
  }

  if (loading || !isBetaUser) {
    return null
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowTour(true)}
        className="gap-2"
      >
        <HelpCircle className="w-4 h-4" />
        Guide
      </Button>

      {showTour && (
        <ProductTour onComplete={handleTourComplete} />
      )}
    </>
  )
}
