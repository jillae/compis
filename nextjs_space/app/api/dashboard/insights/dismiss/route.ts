
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clinicId: true }
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic associated' }, { status: 400 });
    }

    const { insightKey, insightDate, notes } = await req.json();

    if (!insightKey || !insightDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create or update dismissal
    const dismissal = await prisma.insightDismissal.upsert({
      where: {
        userId_clinicId_insightKey_insightDate: {
          userId: session.user.id,
          clinicId: user.clinicId,
          insightKey,
          insightDate: new Date(insightDate)
        }
      },
      create: {
        userId: session.user.id,
        clinicId: user.clinicId,
        insightKey,
        insightDate: new Date(insightDate),
        notes
      },
      update: {
        notes,
        dismissedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: dismissal 
    });

  } catch (error: any) {
    console.error('Error dismissing insight:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dismiss insight' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clinicId: true }
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic associated' }, { status: 400 });
    }

    // Get all dismissed insights for this user and clinic
    const dismissals = await prisma.insightDismissal.findMany({
      where: {
        userId: session.user.id,
        clinicId: user.clinicId
      },
      orderBy: {
        dismissedAt: 'desc'
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: dismissals 
    });

  } catch (error: any) {
    console.error('Error fetching dismissed insights:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dismissed insights' },
      { status: 500 }
    );
  }
}
