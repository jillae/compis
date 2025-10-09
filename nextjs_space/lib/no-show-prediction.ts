
/**
 * No-Show Risk Prediction Engine
 * 
 * Calculates risk score for each booking based on multiple factors
 * Score ranges from 0-100 (higher = more likely to no-show)
 * 
 * Risk levels:
 * - LOW: 0-33
 * - MEDIUM: 34-66
 * - HIGH: 67-100
 */

import { prisma } from './db'

export interface NoShowRiskFactors {
  // Booking attributes
  daysUntilAppointment: number
  isOnlineBooking: boolean
  timeOfDay: number // 0-23
  dayOfWeek: number // 0-6 (0=Sunday)
  
  // Customer history
  isFirstVisit: boolean
  historicalNoShowRate: number // 0-1
  daysSinceLastVisit: number | null
  totalBookings: number
  
  // Treatment attributes
  treatmentDuration: number // minutes
  treatmentPrice: number
  
  // Temporal factors
  isWeekend: boolean
  isEarlyMorning: boolean // before 9am
  isLateEvening: boolean // after 6pm
}

export interface NoShowPrediction {
  bookingId: string
  riskScore: number // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  contributingFactors: string[]
  recommendations: string[]
  estimatedLoss: number // potential revenue loss if no-show
}

/**
 * Calculate no-show risk score for a booking
 */
export function calculateRiskScore(factors: NoShowRiskFactors): number {
  let score = 0
  
  // 1. Days until appointment (max 25 points)
  // Bookings far in the future are more likely to be forgotten
  if (factors.daysUntilAppointment > 30) {
    score += 25
  } else if (factors.daysUntilAppointment > 14) {
    score += 20
  } else if (factors.daysUntilAppointment > 7) {
    score += 15
  } else if (factors.daysUntilAppointment > 3) {
    score += 10
  } else {
    score += 5
  }
  
  // 2. Booking channel (max 15 points)
  // Online bookings have higher no-show rate than phone
  if (factors.isOnlineBooking) {
    score += 15
  } else {
    score += 5
  }
  
  // 3. Customer history (max 30 points) - MOST IMPORTANT
  if (factors.isFirstVisit) {
    score += 20 // New customers are higher risk
  } else {
    score += factors.historicalNoShowRate * 30 // Use actual history
  }
  
  if (factors.totalBookings > 10) {
    score -= 10 // Loyal customers are lower risk
  } else if (factors.totalBookings > 5) {
    score -= 5
  }
  
  // 4. Days since last visit (max 15 points)
  if (factors.daysSinceLastVisit !== null) {
    if (factors.daysSinceLastVisit > 90) {
      score += 15 // Long absence = higher risk
    } else if (factors.daysSinceLastVisit > 60) {
      score += 10
    } else if (factors.daysSinceLastVisit > 30) {
      score += 5
    }
  }
  
  // 5. Time of day (max 10 points)
  if (factors.isEarlyMorning) {
    score += 10 // Early morning appointments = higher no-show
  } else if (factors.isLateEvening) {
    score += 8
  } else if (factors.timeOfDay >= 12 && factors.timeOfDay <= 15) {
    score += 3 // Lunch time = moderate risk
  }
  
  // 6. Day of week (max 10 points)
  if (factors.isWeekend) {
    score += 5 // Weekend = moderate risk
  }
  if (factors.dayOfWeek === 1) { // Monday
    score += 10 // Mondays have highest no-show rate
  } else if (factors.dayOfWeek === 5) { // Friday
    score += 8
  }
  
  // 7. Treatment attributes (max 10 points)
  if (factors.treatmentPrice < 500) {
    score += 10 // Cheap treatments = lower commitment
  } else if (factors.treatmentPrice < 1000) {
    score += 5
  } else {
    score -= 5 // Expensive treatments = higher commitment
  }
  
  if (factors.treatmentDuration < 30) {
    score += 5 // Short treatments = less commitment
  } else if (factors.treatmentDuration > 120) {
    score -= 5 // Long treatments = more commitment
  }
  
  // Normalize to 0-100
  score = Math.max(0, Math.min(100, score))
  
  return Math.round(score)
}

/**
 * Get risk level from score
 */
export function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score < 34) return 'LOW'
  if (score < 67) return 'MEDIUM'
  return 'HIGH'
}

/**
 * Generate contributing factors explanation
 */
export function getContributingFactors(factors: NoShowRiskFactors, score: number): string[] {
  const contributions: string[] = []
  
  if (factors.isFirstVisit) {
    contributions.push('First-time customer (higher risk)')
  }
  
  if (factors.historicalNoShowRate > 0.3) {
    contributions.push(`Customer has ${(factors.historicalNoShowRate * 100).toFixed(0)}% no-show rate`)
  }
  
  if (factors.daysUntilAppointment > 14) {
    contributions.push(`Booked ${factors.daysUntilAppointment} days in advance`)
  }
  
  if (factors.isOnlineBooking) {
    contributions.push('Online booking (less personal commitment)')
  }
  
  if (factors.daysSinceLastVisit && factors.daysSinceLastVisit > 90) {
    contributions.push(`Hasn't visited in ${Math.round(factors.daysSinceLastVisit / 30)} months`)
  }
  
  if (factors.isEarlyMorning) {
    contributions.push('Early morning appointment (6-9 AM)')
  } else if (factors.isLateEvening) {
    contributions.push('Late evening appointment (after 6 PM)')
  }
  
  if (factors.dayOfWeek === 1) {
    contributions.push('Monday appointment (highest no-show day)')
  } else if (factors.dayOfWeek === 5) {
    contributions.push('Friday appointment (high no-show day)')
  }
  
  if (factors.treatmentPrice < 500) {
    contributions.push(`Low price point (${factors.treatmentPrice} kr)`)
  }
  
  if (factors.totalBookings < 2) {
    contributions.push('New customer with limited history')
  }
  
  return contributions
}

/**
 * Generate actionable recommendations
 */
export function getRecommendations(score: number, factors: NoShowRiskFactors): string[] {
  const recommendations: string[] = []
  
  if (score >= 67) {
    // HIGH RISK
    recommendations.push('🚨 Send SMS reminder 48 hours before')
    recommendations.push('📞 Call customer 24 hours before to confirm')
    
    if (factors.isFirstVisit) {
      recommendations.push('💬 Send welcome message with booking details')
    }
    
    recommendations.push('📧 Send email reminder with calendar invite')
    
    if (factors.daysUntilAppointment > 14) {
      recommendations.push('🔔 Schedule multiple reminders leading up to appointment')
    }
    
  } else if (score >= 34) {
    // MEDIUM RISK
    recommendations.push('📱 Send SMS reminder 24 hours before')
    recommendations.push('📧 Send email reminder 48 hours before')
    
    if (factors.isFirstVisit) {
      recommendations.push('🎉 Send welcome message to build engagement')
    }
    
  } else {
    // LOW RISK
    recommendations.push('✅ Standard reminder 24 hours before is sufficient')
    
    if (factors.totalBookings > 10) {
      recommendations.push('⭐ Loyal customer - consider VIP treatment')
    }
  }
  
  return recommendations
}

/**
 * Predict no-show risk for a specific booking
 */
export async function predictNoShowRisk(bookingId: string): Promise<NoShowPrediction | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      service: true
    }
  })
  
  if (!booking) return null
  
  // Calculate customer's historical no-show rate
  const customerBookings = await prisma.booking.findMany({
    where: {
      customerId: booking.customerId,
      id: { not: bookingId }, // Exclude current booking
      scheduledTime: { lt: new Date() } // Only past bookings
    }
  })
  
  const noShowCount = customerBookings.filter(b => b.status === 'NO_SHOW').length
  const historicalNoShowRate = customerBookings.length > 0 
    ? noShowCount / customerBookings.length 
    : 0
  
  // Find last visit date
  const lastVisit = customerBookings
    .filter(b => b.status === 'COMPLETED')
    .sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime())[0]
  
  const daysSinceLastVisit = lastVisit 
    ? Math.floor((new Date().getTime() - lastVisit.scheduledTime.getTime()) / (1000 * 60 * 60 * 24))
    : null
  
  // Extract factors
  const scheduledDate = new Date(booking.scheduledTime)
  const now = new Date()
  const daysUntilAppointment = Math.floor((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const timeOfDay = scheduledDate.getHours()
  const dayOfWeek = scheduledDate.getDay()
  
  const factors: NoShowRiskFactors = {
    daysUntilAppointment: Math.max(0, daysUntilAppointment),
    isOnlineBooking: booking.isOnlineBooking || booking.source?.includes('online') || false,
    timeOfDay,
    dayOfWeek,
    isFirstVisit: booking.customer.totalBookings <= 1,
    historicalNoShowRate,
    daysSinceLastVisit,
    totalBookings: booking.customer.totalBookings,
    treatmentDuration: booking.duration || booking.service?.duration || 60,
    treatmentPrice: Number(booking.price),
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    isEarlyMorning: timeOfDay < 9,
    isLateEvening: timeOfDay >= 18
  }
  
  const riskScore = calculateRiskScore(factors)
  const riskLevel = getRiskLevel(riskScore)
  const contributingFactors = getContributingFactors(factors, riskScore)
  const recommendations = getRecommendations(riskScore, factors)
  
  return {
    bookingId: booking.id,
    riskScore,
    riskLevel,
    contributingFactors,
    recommendations,
    estimatedLoss: Number(booking.price)
  }
}

/**
 * Get all high-risk bookings for upcoming period
 */
export async function getHighRiskBookings(days: number = 14): Promise<NoShowPrediction[]> {
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + days)
  
  const bookings = await prisma.booking.findMany({
    where: {
      scheduledTime: {
        gte: startDate,
        lte: endDate
      },
      status: {
        in: ['SCHEDULED', 'CONFIRMED']
      }
    },
    orderBy: {
      scheduledTime: 'asc'
    }
  })
  
  const predictions = await Promise.all(
    bookings.map(booking => predictNoShowRisk(booking.id))
  )
  
  return predictions
    .filter((p): p is NoShowPrediction => p !== null && p.riskLevel === 'HIGH')
    .sort((a, b) => b.riskScore - a.riskScore)
}

/**
 * Calculate potential revenue at risk
 */
export async function calculateRevenueAtRisk(days: number = 14): Promise<{
  totalBookings: number
  highRiskBookings: number
  mediumRiskBookings: number
  lowRiskBookings: number
  potentialLoss: number
}> {
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + days)
  
  const bookings = await prisma.booking.findMany({
    where: {
      scheduledTime: {
        gte: startDate,
        lte: endDate
      },
      status: {
        in: ['SCHEDULED', 'CONFIRMED']
      }
    }
  })
  
  const predictions = await Promise.all(
    bookings.map(booking => predictNoShowRisk(booking.id))
  )
  
  const validPredictions = predictions.filter((p): p is NoShowPrediction => p !== null)
  
  const highRisk = validPredictions.filter(p => p.riskLevel === 'HIGH')
  const mediumRisk = validPredictions.filter(p => p.riskLevel === 'MEDIUM')
  const lowRisk = validPredictions.filter(p => p.riskLevel === 'LOW')
  
  // Estimate potential loss based on risk levels
  // HIGH: 70% chance of no-show
  // MEDIUM: 35% chance of no-show
  // LOW: 10% chance of no-show
  const potentialLoss = 
    highRisk.reduce((sum, p) => sum + (p.estimatedLoss * 0.7), 0) +
    mediumRisk.reduce((sum, p) => sum + (p.estimatedLoss * 0.35), 0) +
    lowRisk.reduce((sum, p) => sum + (p.estimatedLoss * 0.1), 0)
  
  return {
    totalBookings: bookings.length,
    highRiskBookings: highRisk.length,
    mediumRiskBookings: mediumRisk.length,
    lowRiskBookings: lowRisk.length,
    potentialLoss: Math.round(potentialLoss)
  }
}
