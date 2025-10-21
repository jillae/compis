
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { executeTrigger } from '@/lib/marketing-triggers';

export const dynamic = 'force-dynamic';

// POST /api/marketing-triggers/:id/execute - Manually execute a trigger
export async function POST(
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

    // Execute the trigger
    const result = await executeTrigger(params.id);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error executing marketing trigger:', error);
    return NextResponse.json(
      { error: 'Failed to execute marketing trigger', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
