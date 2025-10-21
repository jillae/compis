
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/analytics/top-customers
 * Get top customers by MRR with health scores
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SuperAdmin can access this
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get all clinics with their subscription tiers
    const clinics = await prisma.clinic.findMany({
      include: {
        subscription: true,
        _count: {
          select: {
            bookings: true,
            customers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculate health scores and MRR for each clinic
    const customersWithMetrics = await Promise.all(
      clinics.map(async (clinic) => {
        const sub = clinic.subscription;
        let mrr = 0;

        if (sub) {
          // monthlyPrice is already the monthly price regardless of billing interval
          mrr = Number(sub.monthlyPrice);
        }

        // Calculate health score (simplified)
        let healthScore = 50; // Base score

        // Active subscription
        if (sub && sub.status === 'ACTIVE') {
          healthScore += 30;
        }

        // Usage metrics
        if (clinic._count.bookings > 0) {
          healthScore += 10;
        }
        if (clinic._count.customers > 0) {
          healthScore += 10;
        }

        // Determine status based on health score
        let status = 'AT_RISK';
        if (healthScore >= 90) status = 'EXCELLENT';
        else if (healthScore >= 70) status = 'HEALTHY';
        else if (healthScore >= 50) status = 'AT_RISK';
        else status = 'CRITICAL';

        return {
          id: clinic.id,
          name: clinic.name,
          tier: sub?.tier || 'FREE',
          mrr,
          healthScore,
          status,
          bookingsCount: clinic._count.bookings,
          customersCount: clinic._count.customers,
        };
      })
    );

    // Sort by MRR and limit
    const topCustomers = customersWithMetrics
      .sort((a, b) => b.mrr - a.mrr)
      .slice(0, limit);

    return NextResponse.json({ customers: topCustomers });
  } catch (error) {
    console.error('[API] Error fetching top customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top customers' },
      { status: 500 }
    );
  }
}
