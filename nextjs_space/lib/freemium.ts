
// Freemium Tier Logic
// Handles FREE tier booking limits and upgrade prompts

import { prisma } from '@/lib/db';
import { SubscriptionTier } from '@prisma/client';

export const FREEMIUM_LIMITS = {
  FREE: {
    bookingsPerMonth: 50,
    name: 'Free',
    features: ['50 bokningar/månad', 'Grundläggande funktioner', 'Email support'],
  },
  BASIC: {
    bookingsPerMonth: null, // unlimited
    name: 'Basic',
    features: ['Obegränsat bokningar', 'Alla grundfunktioner', 'Prioriterad support'],
  },
  PROFESSIONAL: {
    bookingsPerMonth: null, // unlimited
    name: 'Professional',
    features: ['Obegränsat bokningar', 'Avancerade analyser', 'Premium support', 'Corex AI'],
  },
  ENTERPRISE: {
    bookingsPerMonth: null, // unlimited
    name: 'Enterprise',
    features: ['Obegränsat bokningar', 'Alla funktioner', 'Dedikerad support', 'Custom integration'],
  },
};

/**
 * Check if clinic has reached booking limit
 */
export async function checkBookingLimit(clinicId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number | null;
  tier: SubscriptionTier;
  message?: string;
}> {
  const subscription = await prisma.subscription.findUnique({
    where: { clinicId },
    select: {
      tier: true,
      bookingsThisMonth: true,
      bookingsLimit: true,
    },
  });

  if (!subscription) {
    throw new Error('No subscription found');
  }

  // If not FREE tier or no limit, allow
  if (subscription.tier !== SubscriptionTier.FREE || !subscription.bookingsLimit) {
    return {
      allowed: true,
      remaining: -1, // unlimited
      limit: null,
      tier: subscription.tier,
    };
  }

  const remaining = subscription.bookingsLimit - subscription.bookingsThisMonth;
  const allowed = remaining > 0;

  return {
    allowed,
    remaining: Math.max(0, remaining),
    limit: subscription.bookingsLimit,
    tier: subscription.tier,
    message: allowed
      ? `${remaining} bokningar kvar denna månad`
      : 'Månadens bokningsgräns nådd. Uppgradera för obegränsade bokningar.',
  };
}

/**
 * Increment booking count for subscription
 */
export async function incrementBookingCount(clinicId: string): Promise<void> {
  await prisma.subscription.update({
    where: { clinicId },
    data: {
      bookingsThisMonth: {
        increment: 1,
      },
    },
  });
}

/**
 * Reset monthly booking count (to be called by cron on 1st of month)
 */
export async function resetMonthlyBookingCounts(): Promise<void> {
  await prisma.subscription.updateMany({
    where: {
      tier: SubscriptionTier.FREE,
    },
    data: {
      bookingsThisMonth: 0,
    },
  });
}

/**
 * Get upgrade recommendation based on current usage
 */
export async function getUpgradeRecommendation(clinicId: string): Promise<{
  shouldUpgrade: boolean;
  recommendedTier: SubscriptionTier | null;
  reason: string;
}> {
  const subscription = await prisma.subscription.findUnique({
    where: { clinicId },
    select: {
      tier: true,
      bookingsThisMonth: true,
      bookingsLimit: true,
    },
  });

  if (!subscription || subscription.tier !== SubscriptionTier.FREE) {
    return { shouldUpgrade: false, recommendedTier: null, reason: '' };
  }

  if (!subscription.bookingsLimit) {
    return { shouldUpgrade: false, recommendedTier: null, reason: '' };
  }

  const usagePercent = (subscription.bookingsThisMonth / subscription.bookingsLimit) * 100;

  // Recommend upgrade if > 80% usage
  if (usagePercent > 80) {
    return {
      shouldUpgrade: true,
      recommendedTier: SubscriptionTier.BASIC,
      reason: `Du har använt ${usagePercent.toFixed(0)}% av dina bokningar. Uppgradera för obegränsade bokningar!`,
    };
  }

  return { shouldUpgrade: false, recommendedTier: null, reason: '' };
}
