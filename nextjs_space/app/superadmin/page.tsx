'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Building2, Users, Activity, Plus, Download, ScrollText, ExternalLink, Settings, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

// --- Types (NO @prisma/client import) ---
interface ClinicRow {
  id: string
  name: string
  tier: string
  status: string
  isActive: boolean
  users: number
  customers: number
  bookings: number
  activeBookings: number
  services: number
  staff: number
  revenue: number
  trialEndsAt: Date | null
  subscriptionEndsAt: Date | null
  createdAt: Date
}

interface SuperAdminData {
  totalClinics: number
  totalUsers: number
  totalCustomers: number
  totalBookings: number
  totalRevenue: number
  clinics: ClinicRow[]
}

// --- Health score ---
function getHealthScore(clinic: ClinicRow): { score: number; label: string; color: string } {
  let checks = 0
  if (clinic.users > 0) checks++
  if (clinic.customers > 0) checks++
  if (clinic.bookings > 0) checks++
  if (clinic.isActive && clinic.status === 'ACTIVE') checks++

  if (checks >= 3) return { score: checks, label: "Bra", color: "bg-green-500" }
  if (checks === 2) return { score: checks, label: "OK", color: "bg-amber-400" }
  return { score: checks, label: "Låg", color: "bg-red-500" }
}

// --- Tier badge ---
function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, { label: string; className: string }> = {
    BASIC:        { label: "Basic",        className: "bg-blue-100 text-blue-800 border-blue-200" },
    PROFESSIONAL: { label: "Professional", className: "bg-purple-100 text-purple-800 border-purple-200" },
    ENTERPRISE:   { label: "Enterprise",   className: "bg-amber-100 text-amber-800 border-amber-200" },
    INTERNAL:     { label: "Internal",     className: "bg-slate-100 text-slate-700 border-slate-200" },
    FREE:         { label: "Free",         className: "bg-gray-100 text-gray-700 border-gray-200" },
  }
  const cfg = map[tier] ?? { label: tier, className: "bg-gray-100 text-gray-700 border-gray-200" }
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border", cfg.className)}>
      {cfg.label}
    </span>
  )
}

// --- Status badge ---
function StatusBadge({ status, isActive }: { status: string; isActive: boolean }) {
  if (!isActive) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border bg-gray-100 text-gray-600 border-gray-200">Inaktiv</span>
  }
  const map: Record<string, { label: string; className: string }> = {
    ACTIVE:   { label: "Aktiv",      className: "bg-green-100 text-green-800 border-green-200" },
    TRIAL:    { label: "Testperiod", className: "bg-amber-100 text-amber-800 border-amber-200" },
    PAST_DUE: { label: "Försenad",   className: "bg-red-100 text-red-800 border-red-200" },
    INACTIVE: { label: "Inaktiv",    className: "bg-gray-100 text-gray-600 border-gray-200" },
  }
  const cfg = map[status] ?? { label: status, className: "bg-gray-100 text-gray-600 border-gray-200" }
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border", cfg.className)}>
      {cfg.label}
    </span>
  )
}

// --- Metric card skeleton ---
function MetricSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  )
}

// --- Main page ---
export default function SuperAdminPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [data, setData] = useState<SuperAdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard')
      return
    }

    const fetchData = async () => {
      try {
        const response = await fetch('/api/superadmin/stats')
        if (!response.ok) throw new Error('Kunde inte hämta data')
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError('Fel vid laddning av systemdata')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session, status, router])

  // --- Loading state ---
  if (loading || status === 'loading') {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Error state ---
  if (error || !data || !Array.isArray(data.clinics)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
        <p className="text-muted-foreground">{error ?? 'Ingen data tillgänglig'}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Försök igen
        </Button>
      </div>
    )
  }

  // --- Active subscription count ---
  const activeSubscriptions = data.clinics.filter(
    (c) => c.isActive && c.status === 'ACTIVE'
  ).length

  // --- Systemhälsa: % of clinics with health score >= 2 ---
  const healthyCount = data.clinics.filter((c) => getHealthScore(c).score >= 2).length
  const systemHealth =
    data.clinics.length > 0
      ? Math.round((healthyCount / data.clinics.length) * 100)
      : 100

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Systemöversikt och drifthantering</p>
      </div>

      {/* Metrics row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Kliniker</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalClinics}</div>
            <p className="text-xs text-muted-foreground mt-1">Registrerade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Användare</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Över alla kliniker</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktiva Prenumerationer</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">Status: ACTIVE</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Systemhälsa</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-3xl font-bold",
                systemHealth >= 75 ? "text-green-600" :
                systemHealth >= 50 ? "text-amber-600" : "text-red-600"
              )}
            >
              {systemHealth}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {healthyCount} av {data.clinics.length} kliniker OK
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions bar */}
      <div className="flex flex-wrap gap-2">
        <Link href="/superadmin/clinics/new">
          <Button size="sm" className="min-h-[44px] gap-2">
            <Plus className="h-4 w-4" />
            Lägg till klinik
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="min-h-[44px] gap-2"
          disabled={syncing}
          onClick={async () => {
            setSyncing(true)
            setSyncResult(null)
            try {
              const res = await fetch('/api/integrations/bokadirekt/sync', { method: 'POST' })
              const json = await res.json()
              if (json.success || res.status === 207) {
                const e = json.entities ?? {}
                const total = (e.services?.created ?? 0) + (e.staff?.created ?? 0) +
                  (e.customers?.created ?? 0) + (e.bookings?.created ?? 0) + (e.sales?.created ?? 0)
                const updated = (e.services?.updated ?? 0) + (e.staff?.updated ?? 0) +
                  (e.customers?.updated ?? 0) + (e.bookings?.updated ?? 0) + (e.sales?.updated ?? 0)
                setSyncResult(`Synk klar: ${total} nya, ${updated} uppdaterade (${json.durationMs}ms)`)
                // Refresh page data
                window.location.reload()
              } else {
                setSyncResult(`Fel: ${json.error ?? 'Okänt fel'}`)
              }
            } catch {
              setSyncResult('Nätverksfel vid synk')
            } finally {
              setSyncing(false)
            }
          }}
        >
          <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
          {syncing ? 'Synkar...' : 'Synka Bokadirekt'}
        </Button>
        {syncResult && (
          <span className="self-center text-xs text-muted-foreground px-2">{syncResult}</span>
        )}
        <Button variant="outline" size="sm" className="min-h-[44px] gap-2">
          <Download className="h-4 w-4" />
          Exportera data
        </Button>
        <Link href="/superadmin/logs">
          <Button variant="outline" size="sm" className="min-h-[44px] gap-2">
            <ScrollText className="h-4 w-4" />
            Systemlogg
          </Button>
        </Link>
      </div>

      {/* Clinic health table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Klinikstatus</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.clinics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground opacity-30 mb-3" />
              <p className="text-sm text-muted-foreground">Inga kliniker registrerade ännu</p>
              <Link href="/superadmin/clinics/new" className="mt-4">
                <Button size="sm">Lägg till första kliniken</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Klinik</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Användare</TableHead>
                    <TableHead className="text-right">Kunder</TableHead>
                    <TableHead>Hälsopoäng</TableHead>
                    <TableHead className="pr-6 text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.clinics.map((clinic) => {
                    const health = getHealthScore(clinic)
                    return (
                      <TableRow key={clinic.id}>
                        <TableCell className="pl-6 font-medium">
                          <div>
                            <span className="text-sm">{clinic.name}</span>
                            {clinic.status === 'TRIAL' && clinic.trialEndsAt && (
                              <p className="text-[11px] text-amber-600 mt-0.5">
                                Testperiod slutar:{" "}
                                {new Date(clinic.trialEndsAt).toLocaleDateString("sv-SE")}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <TierBadge tier={clinic.tier} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={clinic.status} isActive={clinic.isActive} />
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {clinic.users}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {clinic.customers.toLocaleString("sv-SE")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-block w-2.5 h-2.5 rounded-full shrink-0",
                                health.color
                              )}
                            />
                            <span className="text-xs text-muted-foreground">
                              {health.label} ({health.score}/4)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/superadmin/clinics/${clinic.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 text-xs gap-1"
                              >
                                <Settings className="h-3 w-3" />
                                Hantera
                              </Button>
                            </Link>
                            <Link href={`/dashboard?clinicId=${clinic.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-3 text-xs gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Visa som klinik
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
