
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's clinic
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic found' }, { status: 404 });
    }

    // Get all recommendations
    const recommendations = await prisma.pricingRecommendation.findMany({
      where: {
        clinicId: user.clinicId,
      },
      include: {
        service: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const stats = {
      total: recommendations.length,
      pending: recommendations.filter(r => r.status === 'PENDING').length,
      applied: recommendations.filter(r => r.status === 'APPLIED').length,
      dismissed: recommendations.filter(r => r.status === 'DISMISSED').length,
      totalPotentialImpact: recommendations
        .filter(r => r.status === 'PENDING')
        .reduce((sum, r) => sum + Number(r.expectedImpact), 0),
    };

    return NextResponse.json({
      success: true,
      recommendations,
      stats,
    });
  } catch (error) {
    console.error('Error fetching pricing recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
