
import { prisma } from '@/lib/db';
import { HealthStatus } from '@prisma/client';
import { differenceInDays } from 'date-fns';

export interface HealthScoreFactors {
  recency: number; // 0-100: How recently they visited
  frequency: number; // 0-100: How often they visit
  monetary: number; // 0-100: How much they spend
  engagement: number; // 0-100: Overall engagement
}

export async function calculateCustomerHealthScore(customerId: string): Promise<{
  healthScore: number;
  healthStatus: HealthStatus;
  factors: HealthScoreFactors;
  riskFactors: string[];
}> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      bookings: {
        orderBy: { scheduledTime: 'desc' },
        take: 10,
      },
    },
  });

  if (!customer) {
    throw new Error('Customer not found');
  }

  const riskFactors: string[] = [];
  
  // Calculate Recency Score (0-100)
  let recencyScore = 0;
  if (customer.lastVisitAt) {
    const daysSinceLastVisit = differenceInDays(new Date(), customer.lastVisitAt);
    if (daysSinceLastVisit <= 30) recencyScore = 100;
    else if (daysSinceLastVisit <= 60) recencyScore = 75;
    else if (daysSinceLastVisit <= 90) recencyScore = 50;
    else if (daysSinceLastVisit <= 180) recencyScore = 25;
    else {
      recencyScore = 0;
      riskFactors.push('No visit in 6+ months');
    }
  } else {
    riskFactors.push('Never visited');
  }

  // Calculate Frequency Score (0-100)
  const totalVisits = customer.totalVisits || 0;
  let frequencyScore = 0;
  if (totalVisits >= 12) frequencyScore = 100; // 1+ per month
  else if (totalVisits >= 6) frequencyScore = 75;
  else if (totalVisits >= 3) frequencyScore = 50;
  else if (totalVisits >= 1) frequencyScore = 25;
  else {
    frequencyScore = 0;
    riskFactors.push('Low visit frequency');
  }

  // Calculate Monetary Score (0-100)
  const ltv = customer.lifetimeValue?.toNumber() || 0;
  let monetaryScore = 0;
  if (ltv >= 10000) monetaryScore = 100;
  else if (ltv >= 5000) monetaryScore = 75;
  else if (ltv >= 2500) monetaryScore = 50;
  else if (ltv >= 1000) monetaryScore = 25;
  else {
    monetaryScore = 0;
    if (totalVisits > 3) {
      riskFactors.push('Low lifetime value');
    }
  }

  // Calculate Engagement Score (0-100)
  const completedBookings = customer.bookings?.filter(b => 
    b.status === 'COMPLETED' || b.status === 'completed' as any
  ).length || 0;
  
  const noShows = customer.noShowCount || 0;
  const engagementRate = completedBookings > 0 
    ? ((completedBookings - noShows) / completedBookings) 
    : 0;
  
  const engagementScore = Math.max(0, Math.min(100, engagementRate * 100));

  if (noShows > 2) {
    riskFactors.push(`${noShows} no-shows`);
  }

  // Calculate overall health score (weighted average)
  const healthScore = Math.round(
    (recencyScore * 0.35) + // Recency is most important
    (frequencyScore * 0.25) +
    (monetaryScore * 0.25) +
    (engagementScore * 0.15)
  );

  // Determine health status
  let healthStatus: HealthStatus;
  if (healthScore >= 76) healthStatus = HealthStatus.EXCELLENT;
  else if (healthScore >= 51) healthStatus = HealthStatus.HEALTHY;
  else if (healthScore >= 26) healthStatus = HealthStatus.AT_RISK;
  else healthStatus = HealthStatus.CRITICAL;

  return {
    healthScore,
    healthStatus,
    factors: {
      recency: recencyScore,
      frequency: frequencyScore,
      monetary: monetaryScore,
      engagement: engagementScore,
    },
    riskFactors,
  };
}

export async function updateCustomerHealthScores(clinicId: string) {
  const customers = await prisma.customer.findMany({
    where: { clinicId, isActive: true },
  });

  const results = [];
  for (const customer of customers) {
    try {
      const health = await calculateCustomerHealthScore(customer.id);
      
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          healthScore: health.healthScore,
          healthStatus: health.healthStatus,
          engagementScore: health.factors.engagement,
          monetaryScore: health.factors.monetary,
          frequencyScore: health.factors.frequency,
          riskFactors: health.riskFactors,
          lastHealthCalculation: new Date(),
        },
      });

      results.push({
        customerId: customer.id,
        customerName: customer.name,
        healthScore: health.healthScore,
        healthStatus: health.healthStatus,
      });
    } catch (error) {
      console.error(`Error calculating health for customer ${customer.id}:`, error);
    }
  }

  return results;
}
