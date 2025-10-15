
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PricingOptimizer } from '@/lib/pricing-optimizer';
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

    // Analyze pricing
    const optimizer = new PricingOptimizer(user.clinicId);
    const analyses = await optimizer.analyzePricing();

    // Save recommendations to database
    await optimizer.savePricingRecommendations();

    // Get saved recommendations
    const recommendations = await prisma.pricingRecommendation.findMany({
      where: {
        clinicId: user.clinicId,
        status: 'PENDING',
      },
      include: {
        service: true,
      },
      orderBy: {
        expectedImpact: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      analyses,
      recommendations,
    });
  } catch (error) {
    console.error('Error analyzing pricing:', error);
    return NextResponse.json(
      { error: 'Failed to analyze pricing' },
      { status: 500 }
    );
  }
}
