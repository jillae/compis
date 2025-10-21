
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { subMonths, startOfMonth } from 'date-fns';

/**
 * GET /api/analytics/churn
 * Get churn rate and retention metrics
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

    // Get churn events from CustomerJourney
    const startDate = startOfMonth(subMonths(new Date(), months - 1));

    const churnEvents = await prisma.customerJourney.findMany({
      where: {
        clinicId,
        eventType: 'CHURN',
        eventDate: {
          gte: startDate,
        },
      },
      orderBy: {
        eventDate: 'asc',
      },
    });

    // Get total customers per month from RevenueMetric
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

    // Calculate churn metrics
    const avgChurnRate = metrics.reduce((sum, m) => sum + Number(m.churnRate), 0) / metrics.length;
    const avgRetentionRate = 1 - avgChurnRate;
    const totalChurned = metrics.reduce((sum, m) => sum + m.churnedCustomers, 0);

    // Group churn events by reason
    const churnByReason: Record<string, number> = {};
    churnEvents.forEach((event) => {
      const reason = event.reason || 'Unknown';
      churnByReason[reason] = (churnByReason[reason] || 0) + 1;
    });

    return NextResponse.json({
      avgChurnRate,
      avgRetentionRate,
      totalChurned,
      churnByReason,
      monthlyChurn: metrics.map((m) => ({
        month: `${m.year}-${String(m.month).padStart(2, '0')}`,
        churnRate: Number(m.churnRate),
        churnedCustomers: m.churnedCustomers,
        activeCustomers: m.activeCustomers,
      })),
    });
  } catch (error) {
    console.error('[API] Error fetching churn metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch churn metrics' },
      { status: 500 }
    );
  }
}
