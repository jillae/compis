
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getReferralStats } from '@/lib/referral-service';
import { getErrorMessage } from '@/lib/error-messages';

// GET /api/referrals/stats - Get referral statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = await getReferralStats(session.user.id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[API] Error fetching referral stats:', error);
    return NextResponse.json(
      { error: getErrorMessage(error as Error) },
      { status: 500 }
    );
  }
}
