
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateReferralCode } from '@/lib/referral-service';
import { getErrorMessage } from '@/lib/error-messages';
import { prisma } from '@/lib/db';

// GET /api/referrals/code - Get or generate referral code
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user already has a code
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referralCode: true }
    });

    let code = user?.referralCode;

    // Generate if doesn't exist
    if (!code) {
      code = await generateReferralCode(session.user.id);
    }

    return NextResponse.json({ referralCode: code });
  } catch (error) {
    console.error('[API] Error getting referral code:', error);
    return NextResponse.json(
      { error: getErrorMessage(error as Error) },
      { status: 500 }
    );
  }
}
