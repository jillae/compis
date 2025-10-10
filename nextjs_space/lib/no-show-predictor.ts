

/**
 * Simple rules-based no-show prediction
 * No ML required - just smart heuristics based on booking patterns
 */

import { Booking, Customer } from '@prisma/client';
import { differenceInDays, differenceInHours } from 'date-fns';

export interface NoShowPrediction {
  bookingId: string;
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  contributingFactors: string[];
  recommendations: string[];
}

interface BookingWithCustomer extends Booking {
  customer: Customer;
}

/**
 * Calculate no-show risk for a booking using simple rules
 */
export function predictNoShowRisk(
  booking: BookingWithCustomer
): NoShowPrediction {
  let riskScore = 0;
  const factors: string[] = [];
  const recommendations: string[] = [];

  const now = new Date();
  const scheduledTime = new Date(booking.scheduledTime);
  const daysUntilAppointment = differenceInDays(scheduledTime, now);
  const hoursUntilAppointment = differenceInHours(scheduledTime, now);

  // Rule 1: First-time customers (30 points)
  if (!booking.customer.firstVisit || booking.customer.totalBookings === 0) {
    riskScore += 30;
    factors.push('Förstagångskund');
    recommendations.push('Skicka välkomstmeddelande med bokningsbekräftelse');
  }

  // Rule 2: Booking lead time (0-25 points)
  if (daysUntilAppointment > 21) {
    riskScore += 25;
    factors.push('Bokad mer än 3 veckor i förväg');
    recommendations.push('Skicka påminnelse 1 vecka innan');
  } else if (daysUntilAppointment > 14) {
    riskScore += 15;
    factors.push('Bokad mer än 2 veckor i förväg');
  } else if (daysUntilAppointment > 7) {
    riskScore += 5;
  }

  // Rule 3: Historical no-show rate (0-30 points)
  if (booking.customer.noShowCount > 0 && booking.customer.totalBookings > 0) {
    const customerNoShowRate =
      booking.customer.noShowCount / booking.customer.totalBookings;
    if (customerNoShowRate > 0.3) {
      riskScore += 30;
      factors.push(`Hög historisk no-show rate (${(customerNoShowRate * 100).toFixed(0)}%)`);
      recommendations.push('Ring kunden för att bekräfta');
    } else if (customerNoShowRate > 0.15) {
      riskScore += 20;
      factors.push(`Måttlig no-show historik (${(customerNoShowRate * 100).toFixed(0)}%)`);
      recommendations.push('Skicka påminnelse 24h innan');
    } else if (customerNoShowRate > 0) {
      riskScore += 10;
      factors.push('Har missat bokning tidigare');
    }
  }

  // Rule 4: Days since first visit (customer tenure - 0-15 points)
  if (booking.customer.firstVisit) {
    const daysSinceFirstVisit = differenceInDays(
      now,
      new Date(booking.customer.firstVisit)
    );
    // New customers (< 30 days since first visit) are higher risk
    if (daysSinceFirstVisit < 30) {
      riskScore += 10;
      factors.push('Ny kund (< 30 dagar)');
    }
  }

  // Rule 5: Low total spent (0-10 points)
  if (Number(booking.customer.totalSpent) < 1000) {
    riskScore += 10;
    factors.push('Låg historisk spenderingsnivå');
  }

  // Rule 6: Booking channel (0-10 points)
  if (booking.bookingChannel === 'PHONE') {
    // Phone bookings have lower no-show rate
    riskScore -= 5;
  } else if (booking.bookingChannel === 'ONLINE') {
    riskScore += 5;
    factors.push('Bokad online');
  }

  // Rule 7: Time of day (0-10 points)
  const hour = scheduledTime.getHours();
  if (hour < 9 || hour > 18) {
    riskScore += 10;
    factors.push('Tidig morgon eller sen kväll');
  }

  // Rule 8: Day of week (0-5 points)
  const dayOfWeek = scheduledTime.getDay();
  if (dayOfWeek === 1) {
    // Monday
    riskScore += 5;
    factors.push('Måndag (högre risk)');
  } else if (dayOfWeek === 5) {
    // Friday
    riskScore += 5;
    factors.push('Fredag (högre risk)');
  }

  // Rule 9: Very soon bookings (<24h) have lower risk
  if (hoursUntilAppointment < 24 && hoursUntilAppointment > 0) {
    riskScore -= 10;
  }

  // Normalize score to 0-100 range
  riskScore = Math.max(0, Math.min(100, riskScore));

  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (riskScore >= 70) {
    riskLevel = 'CRITICAL';
    recommendations.push('KRITISK: Ring kunden för att bekräfta omedelbart');
  } else if (riskScore >= 50) {
    riskLevel = 'HIGH';
    if (!recommendations.includes('Skicka påminnelse 24h innan')) {
      recommendations.push('Skicka påminnelse 24h innan');
    }
  } else if (riskScore >= 30) {
    riskLevel = 'MEDIUM';
    recommendations.push('Standard påminnelse 48h innan');
  } else {
    riskLevel = 'LOW';
    if (recommendations.length === 0) {
      recommendations.push('Standard påminnelse');
    }
  }

  return {
    bookingId: booking.id,
    riskScore: Math.round(riskScore),
    riskLevel,
    contributingFactors: factors.length > 0 ? factors : ['Låg risk baserat på historik'],
    recommendations,
  };
}

/**
 * Batch predict no-show risk for multiple bookings
 */
export function predictNoShowRiskBatch(
  bookings: BookingWithCustomer[]
): NoShowPrediction[] {
  return bookings.map(predictNoShowRisk);
}

/**
 * Calculate expected revenue loss from no-shows
 */
export function calculateExpectedLoss(predictions: NoShowPrediction[], bookings: Booking[]): number {
  let totalExpectedLoss = 0;

  predictions.forEach((prediction) => {
    const booking = bookings.find((b) => b.id === prediction.bookingId);
    if (booking) {
      // Convert risk score (0-100) to probability (0-1)
      const noShowProbability = prediction.riskScore / 100;
      totalExpectedLoss += Number(booking.price) * noShowProbability;
    }
  });

  return totalExpectedLoss;
}
