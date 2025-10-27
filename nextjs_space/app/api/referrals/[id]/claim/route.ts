
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { claimReferralReward } from '@/lib/referral-service';
import { getErrorMessage } from '@/lib/error-messages';
import { prisma } from '@/lib/db';

// POST /api/referrals/[id]/claim - Claim referral reward
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const referralId = params.id;

    // Verify user owns this referral
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      select: { referrerId: true, status: true, rewardClaimed: true }
    });

    if (!referral) {
      return NextResponse.json(
        { error: 'Referral not found' },
        { status: 404 }
      );
    }

    if (referral.referrerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const result = await claimReferralReward(referralId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error claiming referral reward:', error);
    return NextResponse.json(
      { error: getErrorMessage(error as Error) },
      { status: 500 }
    );
  }
}
