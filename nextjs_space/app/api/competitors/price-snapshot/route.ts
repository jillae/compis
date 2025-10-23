
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      competitorId, 
      serviceName, 
      price, 
      ourPrice,
      serviceCategory,
      duration,
      isPromotion,
      promotionDetails,
    } = body;

    if (!competitorId || !serviceName || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: competitorId, serviceName, price' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clinicId: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic associated' }, { status: 400 });
    }

    // Verify competitor belongs to clinic
    const competitor = await prisma.competitorProfile.findFirst({
      where: { 
        id: competitorId,
        clinicId: user.clinicId,
      },
    });

    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
    }

    // Calculate price difference if ourPrice provided
    let priceDiff = null;
    let priceDiffPct = null;
    if (ourPrice) {
      priceDiff = ourPrice - price;
      priceDiffPct = (priceDiff / price) * 100;
    }

    // Create price snapshot
    const snapshot = await prisma.competitorPriceSnapshot.create({
      data: {
        competitorId,
        serviceName,
        serviceCategory,
        price,
        duration,
        ourPrice,
        priceDiff,
        priceDiffPct,
        isPromotion: isPromotion || false,
        promotionDetails,
      },
    });

    // Update competitor's lastCheckedAt
    await prisma.competitorProfile.update({
      where: { id: competitorId },
      data: { lastCheckedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Price snapshot added successfully',
      snapshot,
    });
  } catch (error) {
    console.error('Error creating price snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to create price snapshot' },
      { status: 500 }
    );
  }
}
