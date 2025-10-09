

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    return NextResponse.json({
      totalClinics,
      totalUsers,
      totalCustomers,
      totalBookings,
      totalRevenue,
      clinics: clinicStats,
    })
  } catch (error) {
    console.error('SuperAdmin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

