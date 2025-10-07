
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get total bookings last 30 days
    const totalBookings = await prisma.booking.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    // Get completed bookings for revenue calculation
    const completedBookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        price: true
      }
    })

    const totalRevenue = completedBookings.reduce((sum: number, booking: any) => {
      return sum + Number(booking.price)
    }, 0)

    // Get no-show count and rate
    const noShowBookings = await prisma.booking.count({
      where: {
        status: 'NO_SHOW',
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    const noShowRate = totalBookings > 0 ? (noShowBookings / totalBookings) * 100 : 0

    // Calculate utilization (simplified - total scheduled hours vs available hours)
    const scheduledBookings = await prisma.booking.findMany({
      where: {
        scheduledTime: {
          gte: thirtyDaysAgo
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      select: {
        duration: true
      }
    })

    const totalScheduledMinutes = scheduledBookings.reduce((sum: number, booking: any) => sum + (booking.duration || 60), 0)
    const availableMinutes = 30 * 10 * 60 // 30 days, 10 hours per day, 60 minutes
    const utilizationRate = availableMinutes > 0 ? (totalScheduledMinutes / availableMinutes) * 100 : 0

    // Get no-show patterns by hour
    const noShowPatterns = await prisma.booking.findMany({
      where: {
        status: 'NO_SHOW',
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        scheduledTime: true
      }
    })

    const hourlyNoShows = Array(24).fill(0)
    noShowPatterns.forEach((booking: any) => {
      const hour = booking.scheduledTime.getHours()
      hourlyNoShows[hour]++
    })

    // Get daily booking trends
    const dailyBookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        createdAt: true,
        status: true
      }
    })

    const dailyTrends = Array(7).fill(0).map(() => ({ bookings: 0, noShows: 0 }))
    dailyBookings.forEach((booking: any) => {
      const dayOfWeek = booking.createdAt.getDay()
      dailyTrends[dayOfWeek].bookings++
      if (booking.status === 'NO_SHOW') {
        dailyTrends[dayOfWeek].noShows++
      }
    })

    return NextResponse.json({
      totalBookings,
      totalRevenue,
      noShowRate: Math.round(noShowRate * 100) / 100,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      hourlyNoShows,
      dailyTrends
    })
  } catch (error) {
    console.error("Dashboard metrics error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
