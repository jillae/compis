
'use client'

import { redirect } from "next/navigation"
import { useSession } from "next-auth/react"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, DollarSign, Calendar } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RoleToggle } from "@/components/dashboard/role-toggle"
import { useState, useEffect } from "react"

interface SuperAdminData {
  totalClinics: number
  totalUsers: number
  totalCustomers: number
  totalBookings: number
  totalRevenue: number
  clinics: Array<{
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
  }>
}

export default function SuperAdminPage() {
  const { data: session, status } = useSession() || {}
  const [data, setData] = useState<SuperAdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [simulatedRole, setSimulatedRole] = useState<UserRole>(UserRole.SUPER_ADMIN)
  
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      redirect('/dashboard')
      return
    }

    // Fetch SuperAdmin data
    const fetchData = async () => {
      try {
        const response = await fetch('/api/superadmin/stats')
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Failed to fetch superadmin data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session, status])

  const handleRoleChange = (role: UserRole) => {
    setSimulatedRole(role)
    // Redirect based on role
    if (role === UserRole.ADMIN) {
      window.location.href = '/dashboard'
    } else if (role === UserRole.STAFF) {
      window.location.href = '/dashboard'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div>Fel vid laddning av data</div>
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">⚙️ SuperAdmin Dashboard</h1>
          <p className="text-muted-foreground">Systemöversikt och drifthantering</p>
        </div>
        <div className="flex items-center gap-3">
          <RoleToggle currentRole={simulatedRole} onRoleChange={handleRoleChange} />
          <Link href="/superadmin/clinics/new">
            <Button>
              <Building2 className="mr-2 h-4 w-4" />
              Lägg till klinik
            </Button>
          </Link>
        </div>
      </div>

      {/* System-wide metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt Kliniker</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{data.totalClinics}</div>
            <p className="text-xs text-muted-foreground">Registrerade kliniker</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt Användare</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{data.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Över alla kliniker</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt Kunder</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{data.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Unika kunder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt Bokningar</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{data.totalBookings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Alla tider</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Omsättning</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{data.totalRevenue.toLocaleString()} kr</div>
            <p className="text-xs text-muted-foreground">Över alla kliniker</p>
          </CardContent>
        </Card>
      </div>

      {/* Clinics list */}
      <Card>
        <CardHeader>
          <CardTitle>All Clinics</CardTitle>
          <CardDescription>Manage and monitor all registered clinics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.clinics.map((clinic) => (
              <div
                key={clinic.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{clinic.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      clinic.tier === 'BASIC' ? 'bg-blue-100 text-blue-800' :
                      clinic.tier === 'PROFESSIONAL' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {clinic.tier}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      clinic.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      clinic.status === 'TRIAL' ? 'bg-blue-100 text-blue-800' :
                      clinic.status === 'PAST_DUE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {clinic.status}
                    </span>
                    {!clinic.isActive && (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>{clinic.users} users</span>
                    <span>{clinic.customers.toLocaleString()} customers</span>
                    <span>{clinic.bookings.toLocaleString()} bookings</span>
                    <span>{clinic.staff} staff</span>
                    <span className="font-semibold text-foreground">{clinic.revenue.toLocaleString()} kr revenue</span>
                  </div>
                  {clinic.status === 'TRIAL' && clinic.trialEndsAt && (
                    <p className="text-xs text-amber-600">
                      Trial ends: {new Date(clinic.trialEndsAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/superadmin/clinics/${clinic.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/dashboard?clinicId=${clinic.id}`}>
                    <Button variant="ghost" size="sm">
                      View Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            ))}

            {data.clinics.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No clinics registered yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
