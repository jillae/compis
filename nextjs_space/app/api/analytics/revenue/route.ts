
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

/**
 * GET /api/analytics/revenue
 * Get MRR/ARR trends for the last 12 months
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clinicIdParam = searchParams.get('clinicId');
    const months = parseInt(searchParams.get('months') || '12');

    // Determine clinicId
    let clinicId = clinicIdParam;
    if (session.user.role !== 'SUPER_ADMIN') {
      clinicId = session.user.clinicId as string;
    }

    if (!clinicId) {
      return NextResponse.json({ error: 'Clinic ID required' }, { status: 400 });
    }

    // Get last N months of revenue metrics
    const startDate = startOfMonth(subMonths(new Date(), months - 1));

    const metrics = await prisma.revenueMetric.findMany({
      where: {
        clinicId,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('[API] Error fetching revenue metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue metrics' },
      { status: 500 }
    );
  }
}


