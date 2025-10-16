
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
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

    const logs = await prisma.dynamicPricingLog.findMany({
      where: { clinicId: user.clinicId },
      orderBy: { toggledAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching dynamic pricing history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
