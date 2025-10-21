
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { executeAllTriggers } from '@/lib/marketing-triggers';

export const dynamic = 'force-dynamic';

// POST /api/marketing-triggers/execute-all - Execute all active triggers for clinic
export async function POST(req: Request) {
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

    const result = await executeAllTriggers(user.clinicId);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error executing all triggers:', error);
    return NextResponse.json(
      { error: 'Failed to execute triggers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
