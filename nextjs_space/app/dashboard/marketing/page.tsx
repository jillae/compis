
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MetaDashboardCard } from '@/components/meta-dashboard-card'
import { Badge } from '@/components/ui/badge'
import { Lock, TrendingUp } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'

export default function MarketingPage() {
  const router = useRouter()
  const { data: session, status } = useSession() || {}
  const [clinicTier, setClinicTier] = useState<string | null>(null)
  const [metaEnabled, setMetaEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchClinicInfo = async () => {
      try {
        const response = await fetch('/api/clinic/info')
        if (response.ok) {
          const data = await response.json()
          setClinicTier(data.tier)
          setMetaEnabled(data.metaEnabled || false)
        }
      } catch (error) {
        console.error('Failed to fetch clinic info:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchClinicInfo()
  }, [])

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Check if user has access to Meta features
  const hasMetaAccess = clinicTier === 'PROFESSIONAL' || clinicTier === 'ENTERPRISE'

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton href="/dashboard" />
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-indigo-600" />
              Marketing Intelligence
            </h1>
            <p className="text-muted-foreground mt-1">
              Meta kampanjoptimering och kapacitetsstyrning
            </p>
          </div>
        </div>
        {hasMetaAccess && (
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            {clinicTier}
          </Badge>
        )}
      </div>

      {!hasMetaAccess ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Uppgradera för att låsa upp Marketing Intelligence
            </CardTitle>
            <CardDescription>
              Meta API-integration är tillgänglig i Professional och Enterprise-planer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                <p className="font-semibold mb-2">Med Marketing Intelligence får du:</p>
                <ul className="space-y-2 ml-4 list-disc">
                  <li>Automatisk kampanjoptimering baserat på klinikkapacitet</li>
                  <li>Real-time ROAS och CPL-tracking</li>
                  <li>Lead-kvalitetsbedömning med Conversions API</li>
                  <li>Smart budget-allokering (75-90% kapacitetszon)</li>
                  <li>Datadrivna rekommendationer för kampanjjusteringar</li>
                </ul>
                <p className="mt-4 text-sm">
                  Kontakta support för att uppgradera till Professional (1499 kr/mån) eller Enterprise (2999+ kr/mån)
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : !metaEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle>Aktivera Meta API-integration</CardTitle>
            <CardDescription>
              Anslut ditt Meta Business Manager-konto för att börja optimera kampanjer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                <p className="mb-2">För att aktivera Meta API-integration:</p>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li>Gå till Inställningar</li>
                  <li>Välj "Integrationer"</li>
                  <li>Aktivera Meta Marketing API</li>
                  <li>Ange dina Meta Business Manager-uppgifter</li>
                </ol>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <MetaDashboardCard />
      )}
    </div>
  )
}
