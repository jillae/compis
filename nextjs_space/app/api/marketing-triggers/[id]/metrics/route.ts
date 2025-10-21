
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTriggerMetrics } from '@/lib/marketing-triggers';

export const dynamic = 'force-dynamic';

// GET /api/marketing-triggers/:id/metrics - Get trigger performance metrics
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clinicId: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic associated' }, { status: 400 });
    }

    // Verify trigger belongs to clinic
    const trigger = await prisma.marketingTrigger.findFirst({
      where: {
        id: params.id,
        clinicId: user.clinicId,
      },
    });

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    const metrics = await getTriggerMetrics(params.id, days);

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching trigger metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trigger metrics' },
      { status: 500 }
    );
  }
}
