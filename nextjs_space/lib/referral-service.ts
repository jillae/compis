
import { prisma } from './db';
import { Prisma, ReferralStatus } from '@prisma/client';
import crypto from 'crypto';

/**
 * Referral Service
 * Handles referral program logic, tracking, and rewards
 */

// Generate a unique referral code for a user
export async function generateReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, email: true, firstName: true }
  });

  if (user?.referralCode) {
    return user.referralCode;
  }

  // Generate code: FLOW-{random 6 chars}
  let code: string;
  let isUnique = false;

  while (!isUnique) {
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    code = `FLOW-${randomPart}`;

    const existing = await prisma.user.findUnique({
      where: { referralCode: code }
    });

    if (!existing) {
      isUnique = true;
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code }
      });
      return code;
    }
  }

  throw new Error('Failed to generate unique referral code');
}

// Create a referral invite
export async function createReferral(
  referrerId: string,
  referredEmail: string,
  notes?: string
) {
  // Check if referral already exists
  const existingReferral = await prisma.referral.findFirst({
    where: {
      referrerId,
      referredEmail,
      status: { in: ['PENDING', 'COMPLETED'] }
    }
  });

  if (existingReferral) {
    throw new Error('Denna e-postadress har redan bjudits in');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: referredEmail }
  });

  if (existingUser) {
    throw new Error('En användare med denna e-post finns redan');
  }

  // Create referral
  const referral = await prisma.referral.create({
    data: {
      referrerId,
      referredEmail,
      status: 'PENDING',
      notes,
      referrerReward: 1, // 1 free month
      referredReward: 1  // 1 free month
    },
    include: {
      referrer: {
        select: {
          id: true,
          name: true,
          email: true,
          firstName: true,
          referralCode: true
        }
      }
    }
  });

  return referral;
}

// Complete a referral when referred user signs up
export async function completeReferral(
  referralCode: string,
  referredUserId: string
) {
  // Find referrer by code
  const referrer = await prisma.user.findUnique({
    where: { referralCode },
    select: { id: true, clinicId: true }
  });

  if (!referrer) {
    throw new Error('Invalid referral code');
  }

  // Find referred user
  const referredUser = await prisma.user.findUnique({
    where: { id: referredUserId },
    select: { email: true, clinicId: true }
  });

  if (!referredUser?.email) {
    throw new Error('Referred user not found');
  }

  // Find or create referral record
  let referral = await prisma.referral.findFirst({
    where: {
      referrerId: referrer.id,
      referredEmail: referredUser.email
    }
  });

  if (!referral) {
    // Create new referral if invite wasn't sent
    referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredEmail: referredUser.email,
        referredId: referredUserId,
        status: 'COMPLETED',
        rewardClaimed: false
      }
    });
  } else {
    // Update existing referral
    referral = await prisma.referral.update({
      where: { id: referral.id },
      data: {
        referredId: referredUserId,
        status: 'COMPLETED'
      }
    });
  }

  // Update referred user's referredById
  await prisma.user.update({
    where: { id: referredUserId },
    data: { referredById: referrer.id }
  });

  return referral;
}

// Claim referral rewards (grant free months to both parties)
export async function claimReferralReward(referralId: string) {
  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
    include: {
      referrer: {
        select: { id: true, clinicId: true, email: true, name: true }
      },
      referred: {
        select: { id: true, clinicId: true, email: true, name: true }
      }
    }
  });

  if (!referral) {
    throw new Error('Referral not found');
  }

  if (referral.status !== 'COMPLETED') {
    throw new Error('Referral not completed yet');
  }

  if (referral.rewardClaimed) {
    throw new Error('Reward already claimed');
  }

  if (!referral.referred) {
    throw new Error('Referred user not found');
  }

  // Grant free months to referrer
  if (referral.referrer.clinicId) {
    const referrerSubscription = await prisma.subscription.findUnique({
      where: { clinicId: referral.referrer.clinicId }
    });

    if (referrerSubscription) {
      await prisma.subscription.update({
        where: { clinicId: referral.referrer.clinicId },
        data: {
          freeMonthsRemaining: {
            increment: referral.referrerReward
          }
        }
      });
    }
  }

  // Grant free months to referred
  if (referral.referred.clinicId) {
    const referredSubscription = await prisma.subscription.findUnique({
      where: { clinicId: referral.referred.clinicId }
    });

    if (referredSubscription) {
      await prisma.subscription.update({
        where: { clinicId: referral.referred.clinicId },
        data: {
          freeMonthsRemaining: {
            increment: referral.referredReward
          }
        }
      });
    }
  }

  // Mark reward as claimed
  await prisma.referral.update({
    where: { id: referralId },
    data: {
      rewardClaimed: true,
      rewardGrantedAt: new Date()
    }
  });

  return {
    success: true,
    referrerMonths: referral.referrerReward,
    referredMonths: referral.referredReward
  };
}

// Get user's referral statistics
export async function getReferralStats(userId: string) {
  const [
    totalReferrals,
    pendingReferrals,
    completedReferrals,
    totalRewardsEarned
  ] = await Promise.all([
    prisma.referral.count({
      where: { referrerId: userId }
    }),
    prisma.referral.count({
      where: { referrerId: userId, status: 'PENDING' }
    }),
    prisma.referral.count({
      where: { referrerId: userId, status: 'COMPLETED' }
    }),
    prisma.referral.aggregate({
      where: {
        referrerId: userId,
        status: 'COMPLETED',
        rewardClaimed: true
      },
      _sum: {
        referrerReward: true
      }
    })
  ]);

  return {
    totalReferrals,
    pendingReferrals,
    completedReferrals,
    totalRewardsEarned: totalRewardsEarned._sum.referrerReward || 0
  };
}

// Get user's referral list
export async function getUserReferrals(
  userId: string,
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit;

  const [referrals, totalCount] = await Promise.all([
    prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.referral.count({
      where: { referrerId: userId }
    })
  ]);

  return {
    referrals,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit)
  };
}

// Expire old pending referrals (run as cron job)
export async function expireOldReferrals(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.referral.updateMany({
    where: {
      status: 'PENDING',
      createdAt: {
        lt: cutoffDate
      }
    },
    data: {
      status: 'EXPIRED'
    }
  });

  return result.count;
}
