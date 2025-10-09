
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/db"
import { Building2, Users, DollarSign, Calendar, TrendingUp, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

async function getSuperAdminData() {
  // Get all clinics with their stats
  const clinics = await prisma.clinic.findMany({
    include: {
      _count: {
        select: {
          users: true,
          customers: true,
          bookings: true,
          services: true,
          staff: true,
        }
      },
      bookings: {
        select: {
          revenue: true,
          status: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Calculate total metrics
  const totalClinics = clinics.length
  const totalUsers = clinics.reduce((sum, c) => sum + c._count.users, 0)
  const totalCustomers = clinics.reduce((sum, c) => sum + c._count.customers, 0)
  const totalBookings = clinics.reduce((sum, c) => sum + c._count.bookings, 0)
  
  const totalRevenue = clinics.reduce((sum, clinic) => {
    const clinicRevenue = clinic.bookings.reduce((s, b) => s + Number(b.revenue), 0)
    return sum + clinicRevenue
  }, 0)

  // Calculate clinic-specific stats
  const clinicStats = clinics.map(clinic => {
    const revenue = clinic.bookings.reduce((s, b) => s + Number(b.revenue), 0)
    const activeBookings = clinic.bookings.filter(b => 
      b.status === 'SCHEDULED' || b.status === 'CONFIRMED'
    ).length

    return {
      id: clinic.id,
      name: clinic.name,
      tier: clinic.tier,
      status: clinic.subscriptionStatus,
      isActive: clinic.isActive,
      users: clinic._count.users,
      customers: clinic._count.customers,
      bookings: clinic._count.bookings,
      activeBookings,
      services: clinic._count.services,
      staff: clinic._count.staff,
      revenue,
      trialEndsAt: clinic.trialEndsAt,
      subscriptionEndsAt: clinic.subscriptionEndsAt,
      createdAt: clinic.createdAt,
    }
  })

  return {
    totalClinics,
    totalUsers,
    totalCustomers,
    totalBookings,
    totalRevenue,
    clinics: clinicStats,
  }
}

export default async function SuperAdminPage() {
  const session = await getServerSession(authOptions)
  
  // Check if user is SuperAdmin
  if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
    redirect('/dashboard')
  }

  const data = await getSuperAdminData()

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SuperAdmin Dashboard</h1>
          <p className="text-muted-foreground">System overview and clinic management</p>
        </div>
        <Link href="/superadmin/clinics/new">
          <Button>
            <Building2 className="mr-2 h-4 w-4" />
            Add New Clinic
          </Button>
        </Link>
      </div>

      {/* System-wide metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clinics</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalClinics}</div>
            <p className="text-xs text-muted-foreground">Registered clinics</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Across all clinics</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Unique customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalBookings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalRevenue.toLocaleString()} kr</div>
            <p className="text-xs text-muted-foreground">Across all clinics</p>
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
