
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/analytics/customers
 * Get customer distribution per tier
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clinicIdParam = searchParams.get('clinicId');

    // Determine clinicId
    let clinicId = clinicIdParam;
    if (session.user.role !== 'SUPER_ADMIN') {
      clinicId = session.user.clinicId as string;
    }

    if (!clinicId) {
      return NextResponse.json({ error: 'Clinic ID required' }, { status: 400 });
    }

    // Get all clinics (for Super Admin) or specific clinic
    const where = session.user.role === 'SUPER_ADMIN' && !clinicId
      ? {}
      : { id: clinicId };

    const clinics = await prisma.clinic.findMany({
      where,
      include: {
        subscription: true,
      },
    });

    // Aggregate customer counts per tier
    const tierDistribution: Record<string, { count: number; mrr: number }> = {
      FREE: { count: 0, mrr: 0 },
      BASIC: { count: 0, mrr: 0 },
      PROFESSIONAL: { count: 0, mrr: 0 },
      ENTERPRISE: { count: 0, mrr: 0 },
      INTERNAL: { count: 0, mrr: 0 },
    };

    clinics.forEach((clinic) => {
      const tier = clinic.tier;
      if (tierDistribution[tier]) {
        tierDistribution[tier].count++;
        
        // Calculate MRR based on tier
        const tierPrices: Record<string, number> = {
          FREE: 0,
          BASIC: 499,
          PROFESSIONAL: 1499,
          ENTERPRISE: 2999,
          INTERNAL: 0,
        };

        tierDistribution[tier].mrr += tierPrices[tier] || 0;
      }
    });

    // Calculate totals
    const totalCustomers = Object.values(tierDistribution).reduce((sum, tier) => sum + tier.count, 0);
    const totalMrr = Object.values(tierDistribution).reduce((sum, tier) => sum + tier.mrr, 0);

    return NextResponse.json({
      tierDistribution,
      totalCustomers,
      totalMrr,
      avgRevenuePerCustomer: totalCustomers > 0 ? totalMrr / totalCustomers : 0,
    });
  } catch (error) {
    console.error('[API] Error fetching customer distribution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer distribution' },
      { status: 500 }
    );
  }
}
