
// GET usage data for current clinic
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkBookingLimit } from '@/lib/freemium';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clinicId = session.user.clinicId;
    const limitData = await checkBookingLimit(clinicId);

    return NextResponse.json(limitData);
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
}
