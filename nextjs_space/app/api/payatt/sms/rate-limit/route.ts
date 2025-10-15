
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SMSRateLimiter } from '@/lib/sms/rate-limiter';

/**
 * Get current SMS rate limit status for clinic
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = await SMSRateLimiter.getStatus(session.user.clinicId);

    return NextResponse.json({
      success: true,
      ...status,
      usage: {
        hourlyPercent: Math.round((status.sentThisHour / status.maxPerHour) * 100),
        dailyPercent: Math.round((status.sentToday / status.maxPerDay) * 100),
        monthlyPercent: Math.round((status.sentThisMonth / status.maxPerMonth) * 100),
      }
    });

  } catch (error) {
    console.error('Rate limit check error:', error);
    return NextResponse.json(
      { error: 'Failed to check rate limit' },
      { status: 500 }
    );
  }
}
