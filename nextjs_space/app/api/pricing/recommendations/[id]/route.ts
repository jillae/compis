
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, dismissReason } = await req.json();
    const recommendationId = params.id;

    // Get recommendation and verify ownership
    const recommendation = await prisma.pricingRecommendation.findUnique({
      where: { id: recommendationId },
      include: { service: true },
    });

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    // Verify user has access to this clinic
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.clinicId !== recommendation.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update recommendation
    const updateData: any = { status };
    
    if (status === 'APPLIED') {
      updateData.appliedAt = new Date();
      // Also update the service price
      await prisma.service.update({
        where: { id: recommendation.serviceId },
        data: { price: recommendation.recommendedPrice },
      });
    } else if (status === 'DISMISSED') {
      updateData.dismissedAt = new Date();
      if (dismissReason) updateData.dismissReason = dismissReason;
    }

    const updatedRecommendation = await prisma.pricingRecommendation.update({
      where: { id: recommendationId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      recommendation: updatedRecommendation,
    });
  } catch (error) {
    console.error('Error updating pricing recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to update recommendation' },
      { status: 500 }
    );
  }
}
