
/**
 * Retention Autopilot Service
 * 
 * Handles:
 * - At-risk customer detection
 * - Retention scoring (0-100)
 * - Analytics & metrics
 * - API for Corex integration
 */

import { prisma } from '@/lib/db'

export interface AtRiskCustomer {
  customerId: string
  name: string | null
  email: string | null
  phone: string | null
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  daysSinceLastVisit: number
  totalSpent: number
  avgBookingFrequency: number
  lastVisitDate: Date | null
  recommendations: string[]
}

export interface RetentionMetrics {
  totalAtRisk: number
  highRisk: number
  mediumRisk: number
  lowRisk: number
  averageRiskScore: number
  estimatedRevenueAtRisk: number
  churnRate: number
}

/**
 * Calculate at-risk customers for a clinic
 */
export async function getAtRiskCustomers(
  clinicId: string,
  minDaysSinceVisit: number = 60,
  minRiskScore: number = 50
): Promise<AtRiskCustomer[]> {
  try {
    // Get all customers with bookings
    const customers = await prisma.customer.findMany({
      where: {
        clinicId,
        totalBookings: { gt: 0 },
      },
      include: {
        bookings: {
          where: {
            status: { in: ['completed', 'SCHEDULED', 'CONFIRMED'] },
          },
          orderBy: {
            scheduledTime: 'desc',
          },
          take: 10,
        },
      },
    })

    const now = new Date()
    const atRiskCustomers: AtRiskCustomer[] = []

    for (const customer of customers) {
      // Skip customers with no completed bookings
      if (customer.bookings.length === 0) continue

      const lastBooking = customer.bookings[0]
      const daysSinceLastVisit = Math.floor(
        (now.getTime() - lastBooking.scheduledTime.getTime()) /
          (1000 * 60 * 60 * 24)
      )

      // Skip if recently visited
      if (daysSinceLastVisit < minDaysSinceVisit) continue

      // Calculate risk score
      const riskScore = calculateRiskScore(customer, daysSinceLastVisit)

      // Skip if below minimum risk score
      if (riskScore < minRiskScore) continue

      // Determine risk level
      const riskLevel = getRiskLevel(riskScore)

      // Calculate avg booking frequency
      const avgBookingFrequency = calculateAverageBookingFrequency(
        customer.bookings
      )

      // Generate recommendations
      const recommendations = generateRecommendations(
        customer,
        daysSinceLastVisit,
        riskScore
      )

      atRiskCustomers.push({
        customerId: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        riskScore,
        riskLevel,
        daysSinceLastVisit,
        totalSpent: parseFloat(customer.totalSpent.toString()),
        avgBookingFrequency,
        lastVisitDate: lastBooking.scheduledTime,
        recommendations,
      })
    }

    // Sort by risk score (highest first)
    return atRiskCustomers.sort((a, b) => b.riskScore - a.riskScore)
  } catch (error) {
    console.error('Failed to get at-risk customers:', error)
    throw error
  }
}

/**
 * Calculate retention metrics for a clinic
 */
export async function getRetentionMetrics(
  clinicId: string
): Promise<RetentionMetrics> {
  try {
    const atRiskCustomers = await getAtRiskCustomers(clinicId, 60, 30)

    const totalAtRisk = atRiskCustomers.length
    const highRisk = atRiskCustomers.filter((c) => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL').length
    const mediumRisk = atRiskCustomers.filter((c) => c.riskLevel === 'MEDIUM').length
    const lowRisk = atRiskCustomers.filter((c) => c.riskLevel === 'LOW').length

    const averageRiskScore =
      totalAtRisk > 0
        ? atRiskCustomers.reduce((sum, c) => sum + c.riskScore, 0) /
          totalAtRisk
        : 0

    const estimatedRevenueAtRisk = atRiskCustomers.reduce(
      (sum, c) => sum + c.totalSpent,
      0
    )

    // Calculate churn rate (customers who haven't visited in 90+ days)
    const totalCustomers = await prisma.customer.count({
      where: {
        clinicId,
        totalBookings: { gt: 0 },
      },
    })

    const churnedCustomers = await prisma.customer.count({
      where: {
        clinicId,
        totalBookings: { gt: 0 },
        bookings: {
          some: {
            scheduledTime: {
              lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    })

    const churnRate =
      totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0

    return {
      totalAtRisk,
      highRisk,
      mediumRisk,
      lowRisk,
      averageRiskScore: Math.round(averageRiskScore),
      estimatedRevenueAtRisk: Math.round(estimatedRevenueAtRisk),
      churnRate: parseFloat(churnRate.toFixed(2)),
    }
  } catch (error) {
    console.error('Failed to get retention metrics:', error)
    throw error
  }
}

/**
 * Calculate risk score (0-100) based on multiple factors
 */
function calculateRiskScore(customer: any, daysSinceLastVisit: number): number {
  let score = 0

  // Factor 1: Days since last visit (40 points max)
  if (daysSinceLastVisit >= 180) score += 40
  else if (daysSinceLastVisit >= 120) score += 30
  else if (daysSinceLastVisit >= 90) score += 20
  else if (daysSinceLastVisit >= 60) score += 10

  // Factor 2: Total spending (20 points max - higher spending = higher risk of losing revenue)
  const totalSpent = parseFloat(customer.totalSpent.toString())
  if (totalSpent >= 10000) score += 20
  else if (totalSpent >= 5000) score += 15
  else if (totalSpent >= 2000) score += 10
  else if (totalSpent >= 1000) score += 5

  // Factor 3: Booking frequency decline (20 points)
  const avgFrequency = calculateAverageBookingFrequency(customer.bookings)
  if (avgFrequency > 0 && daysSinceLastVisit > avgFrequency * 2) {
    score += 20
  } else if (avgFrequency > 0 && daysSinceLastVisit > avgFrequency * 1.5) {
    score += 10
  }

  // Factor 4: Total bookings (10 points - loyal customers)
  if (customer.totalBookings >= 20) score += 10
  else if (customer.totalBookings >= 10) score += 7
  else if (customer.totalBookings >= 5) score += 5

  // Factor 5: No-show history (10 points - negative indicator)
  const noShowRate =
    customer.totalBookings > 0
      ? (customer.noShowCount / customer.totalBookings) * 100
      : 0
  if (noShowRate > 20) score -= 10
  else if (noShowRate > 10) score -= 5

  return Math.max(0, Math.min(100, score))
}

/**
 * Get risk level based on score
 */
function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score >= 80) return 'CRITICAL'
  if (score >= 60) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  return 'LOW'
}

/**
 * Calculate average booking frequency (days between bookings)
 */
function calculateAverageBookingFrequency(bookings: any[]): number {
  if (bookings.length < 2) return 0

  const intervals: number[] = []
  for (let i = 0; i < bookings.length - 1; i++) {
    const days = Math.floor(
      (bookings[i].scheduledTime.getTime() -
        bookings[i + 1].scheduledTime.getTime()) /
        (1000 * 60 * 60 * 24)
    )
    intervals.push(days)
  }

  return intervals.length > 0
    ? Math.round(intervals.reduce((sum, d) => sum + d, 0) / intervals.length)
    : 0
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations(
  customer: any,
  daysSinceLastVisit: number,
  riskScore: number
): string[] {
  const recommendations: string[] = []

  if (riskScore >= 80) {
    recommendations.push('🚨 URGENT: High-value customer at risk of churning')
  }

  if (daysSinceLastVisit >= 120) {
    recommendations.push(
      `💬 Send re-engagement message (${daysSinceLastVisit} days since last visit)`
    )
  }

  const totalSpent = parseFloat(customer.totalSpent.toString())
  if (totalSpent >= 5000) {
    recommendations.push(
      `🎁 Offer VIP discount (${totalSpent.toLocaleString('sv-SE')} kr lifetime value)`
    )
  } else if (totalSpent >= 2000) {
    recommendations.push('🎁 Offer loyalty reward (10-15% discount)')
  }

  if (customer.totalBookings >= 10) {
    recommendations.push(
      `⭐ Loyal customer (${customer.totalBookings} previous bookings)`
    )
  }

  recommendations.push('📞 Reach out via Corex omnichannel assistant')

  return recommendations
}

/**
 * Export at-risk customers for Corex integration
 */
export async function exportAtRiskCustomersForCorex(
  clinicId: string,
  minRiskScore: number = 60
): Promise<any[]> {
  const atRiskCustomers = await getAtRiskCustomers(clinicId, 60, minRiskScore)

  return atRiskCustomers.map((customer) => ({
    id: customer.customerId,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    riskScore: customer.riskScore,
    riskLevel: customer.riskLevel,
    daysSinceLastVisit: customer.daysSinceLastVisit,
    totalSpent: customer.totalSpent,
    lastVisitDate: customer.lastVisitDate,
    // Corex can use these for personalized messaging
    suggestedMessage:
      customer.riskScore >= 80
        ? 'VIP_REENGAGEMENT'
        : customer.riskScore >= 60
        ? 'LOYALTY_OFFER'
        : 'GENTLE_REMINDER',
    offerType:
      customer.totalSpent >= 5000
        ? 'VIP_DISCOUNT'
        : customer.totalSpent >= 2000
        ? 'LOYALTY_REWARD'
        : 'STANDARD_REMINDER',
  }))
}
