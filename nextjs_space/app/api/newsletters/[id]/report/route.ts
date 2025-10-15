
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/newsletters/[id]/report - Get newsletter performance report
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get newsletter
    const newsletter = await prisma.newsletter.findFirst({
      where: {
        id: params.id,
        clinicId: session.user.clinicId,
      },
      include: {
        segment: true,
      },
    });

    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    // Calculate metrics
    const deliveryRate = newsletter.sentCount > 0
      ? (newsletter.deliveredCount / newsletter.sentCount) * 100
      : 0;

    const openRate = newsletter.deliveredCount > 0
      ? (newsletter.openedCount / newsletter.deliveredCount) * 100
      : 0;

    const clickRate = newsletter.openedCount > 0
      ? (newsletter.clickedCount / newsletter.openedCount) * 100
      : 0;

    const unsubscribeRate = newsletter.deliveredCount > 0
      ? (newsletter.unsubscribedCount / newsletter.deliveredCount) * 100
      : 0;

    const roi = newsletter.costSEK && newsletter.revenueSEK
      ? ((newsletter.revenueSEK - newsletter.costSEK) / newsletter.costSEK) * 100
      : null;

    return NextResponse.json({
      newsletter: {
        id: newsletter.id,
        name: newsletter.name,
        status: newsletter.status,
        sentAt: newsletter.sentAt,
        sendChannels: newsletter.sendChannels,
      },
      stats: {
        recipientCount: newsletter.recipientCount,
        sentCount: newsletter.sentCount,
        deliveredCount: newsletter.deliveredCount,
        openedCount: newsletter.openedCount,
        clickedCount: newsletter.clickedCount,
        unsubscribedCount: newsletter.unsubscribedCount,
      },
      metrics: {
        deliveryRate: deliveryRate.toFixed(2) + '%',
        openRate: openRate.toFixed(2) + '%',
        clickRate: clickRate.toFixed(2) + '%',
        unsubscribeRate: unsubscribeRate.toFixed(2) + '%',
      },
      financial: {
        costSEK: newsletter.costSEK,
        revenueSEK: newsletter.revenueSEK,
        roiPercent: roi ? roi.toFixed(2) + '%' : null,
      },
    });
  } catch (error) {
    console.error('[Newsletters API] Report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
