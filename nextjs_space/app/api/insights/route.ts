
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

interface Insight {
  id: string
  type: 'warning' | 'optimization' | 'success' | 'info'
  category: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  actionable: boolean
  recommendation?: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const insights: Insight[] = []

    // 1. No-Show Rate Analysis
    const totalBookings = await prisma.booking.count({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      }
    })

    const noShowBookings = await prisma.booking.count({
      where: {
        status: 'NO_SHOW',
        createdAt: { gte: thirtyDaysAgo }
      }
    })

    const noShowRate = totalBookings > 0 ? (noShowBookings / totalBookings) * 100 : 0

    if (noShowRate > 15) {
      insights.push({
        id: 'high-no-show',
        type: 'warning',
        category: 'Revenue Loss',
        title: 'High No-Show Rate Detected',
        description: `Your no-show rate is ${noShowRate.toFixed(1)}%, which is above the industry average of 15%. This could be costing you significant revenue.`,
        impact: 'high',
        actionable: true,
        recommendation: 'Consider implementing automated SMS reminders 24 hours before appointments and require a deposit for new customers.'
      })
    } else if (noShowRate < 5) {
      insights.push({
        id: 'low-no-show',
        type: 'success',
        category: 'Performance',
        title: 'Excellent No-Show Management',
        description: `Your no-show rate is ${noShowRate.toFixed(1)}%, well below industry average. Great job!`,
        impact: 'low',
        actionable: false
      })
    }

    // 2. Peak Hours Analysis
    const bookingsByHour = await prisma.booking.findMany({
      where: {
        scheduledTime: { gte: thirtyDaysAgo },
        status: { in: ['COMPLETED', 'SCHEDULED', 'CONFIRMED'] }
      },
      select: {
        scheduledTime: true,
        duration: true
      }
    })

    const hourlyBookings = Array(24).fill(0)
    bookingsByHour.forEach(booking => {
      const hour = booking.scheduledTime.getHours()
      hourlyBookings[hour]++
    })

    const peakHour = hourlyBookings.indexOf(Math.max(...hourlyBookings))
    const lowHours = hourlyBookings
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count < hourlyBookings[peakHour] * 0.3)
      .slice(0, 3)

    if (lowHours.length > 0) {
      insights.push({
        id: 'low-utilization',
        type: 'optimization',
        category: 'Capacity Optimization',
        title: 'Low Utilization During Off-Peak Hours',
        description: `You have significantly lower bookings between ${lowHours[0].hour}:00-${lowHours[0].hour + 1}:00. Your peak hour is ${peakHour}:00.`,
        impact: 'medium',
        actionable: true,
        recommendation: 'Offer promotional pricing or happy hour discounts during low-traffic hours to increase bookings and revenue.'
      })
    }

    // 3. Customer Retention Analysis
    const repeatCustomers = await prisma.customer.findMany({
      where: {
        totalBookings: { gte: 3 }
      }
    })

    const totalCustomers = await prisma.customer.count()
    const retentionRate = totalCustomers > 0 ? (repeatCustomers.length / totalCustomers) * 100 : 0

    if (retentionRate < 30) {
      insights.push({
        id: 'low-retention',
        type: 'warning',
        category: 'Customer Retention',
        title: 'Low Customer Retention Rate',
        description: `Only ${retentionRate.toFixed(1)}% of your customers return for 3+ visits. High retention is key to profitability.`,
        impact: 'high',
        actionable: true,
        recommendation: 'Implement a loyalty program offering every 5th treatment at 50% off, and send personalized follow-up emails after each visit.'
      })
    } else if (retentionRate > 60) {
      insights.push({
        id: 'high-retention',
        type: 'success',
        category: 'Customer Retention',
        title: 'Strong Customer Loyalty',
        description: `${retentionRate.toFixed(1)}% of your customers are repeat clients with 3+ visits. This indicates excellent service quality.`,
        impact: 'medium',
        actionable: false
      })
    }

    // 4. Revenue Per Booking Analysis
    const completedBookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        price: true
      }
    })

    const avgRevenue = completedBookings.length > 0 
      ? completedBookings.reduce((sum, b) => sum + Number(b.price), 0) / completedBookings.length
      : 0

    if (avgRevenue < 100) {
      insights.push({
        id: 'low-avg-revenue',
        type: 'optimization',
        category: 'Revenue Growth',
        title: 'Opportunity to Increase Average Booking Value',
        description: `Your average booking value is $${avgRevenue.toFixed(2)}. There's potential to increase revenue per customer.`,
        impact: 'medium',
        actionable: true,
        recommendation: 'Train staff on upselling complementary services (e.g., suggest a facial with a massage) and introduce package deals.'
      })
    }

    // 5. Booking Lead Time Analysis
    const recentBookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        bookedAt: true,
        scheduledTime: true
      }
    })

    const leadTimes = recentBookings.map(b => 
      (b.scheduledTime.getTime() - b.bookedAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    const avgLeadTime = leadTimes.length > 0 
      ? leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length
      : 0

    if (avgLeadTime < 2) {
      insights.push({
        id: 'short-lead-time',
        type: 'info',
        category: 'Booking Patterns',
        title: 'Many Last-Minute Bookings',
        description: `Average booking lead time is ${avgLeadTime.toFixed(1)} days. Most customers book within 48 hours.`,
        impact: 'low',
        actionable: true,
        recommendation: 'Keep some staff availability flexible for last-minute bookings, and consider a small premium for same-day appointments.'
      })
    } else if (avgLeadTime > 7) {
      insights.push({
        id: 'long-lead-time',
        type: 'success',
        category: 'Booking Patterns',
        title: 'Strong Advanced Booking Rate',
        description: `Average booking lead time is ${avgLeadTime.toFixed(1)} days. Customers plan ahead well.`,
        impact: 'low',
        actionable: false
      })
    }

    // 6. Staff Utilization
    const staffBookings = await prisma.booking.groupBy({
      by: ['staffId'],
      where: {
        scheduledTime: { gte: thirtyDaysAgo },
        staffId: { not: null }
      },
      _count: true
    })

    const avgBookingsPerStaff = staffBookings.length > 0
      ? staffBookings.reduce((sum, s) => sum + s._count, 0) / staffBookings.length
      : 0

    const underutilizedStaff = staffBookings.filter(s => s._count < avgBookingsPerStaff * 0.5)

    if (underutilizedStaff.length > 0) {
      insights.push({
        id: 'staff-underutilization',
        type: 'optimization',
        category: 'Resource Optimization',
        title: 'Some Staff Members Are Underbooked',
        description: `${underutilizedStaff.length} staff member(s) have significantly fewer bookings than average.`,
        impact: 'medium',
        actionable: true,
        recommendation: 'Review staff schedules and specializations. Consider cross-training or adjusting shifts to match demand patterns.'
      })
    }

    // 7. Weekend vs Weekday Performance
    const weekendBookings = await prisma.booking.count({
      where: {
        scheduledTime: { gte: thirtyDaysAgo }
      }
    })

    const bookingsWithDays = await prisma.booking.findMany({
      where: {
        scheduledTime: { gte: thirtyDaysAgo }
      },
      select: {
        scheduledTime: true
      }
    })

    const weekendCount = bookingsWithDays.filter(b => {
      const day = b.scheduledTime.getDay()
      return day === 0 || day === 6
    }).length

    const weekdayCount = weekendBookings - weekendCount
    const weekendRate = weekendBookings > 0 ? (weekendCount / weekendBookings) * 100 : 0

    if (weekendRate > 60) {
      insights.push({
        id: 'weekend-heavy',
        type: 'info',
        category: 'Capacity Planning',
        title: 'Weekend-Heavy Booking Pattern',
        description: `${weekendRate.toFixed(1)}% of bookings occur on weekends. Weekdays are less utilized.`,
        impact: 'medium',
        actionable: true,
        recommendation: 'Offer weekday-exclusive promotions or introduce "Business Lunch" treatment packages to attract weekday customers.'
      })
    }

    // Sort insights by impact
    const impactOrder = { high: 0, medium: 1, low: 2 }
    insights.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact])

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("Insights API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
