
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/marketing-triggers - List all triggers for clinic
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

    const triggers = await prisma.marketingTrigger.findMany({
      where: { clinicId: user.clinicId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { executions: true },
        },
      },
    });

    return NextResponse.json({ triggers });
  } catch (error) {
    console.error('Error fetching marketing triggers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketing triggers' },
      { status: 500 }
    );
  }
}

// POST /api/marketing-triggers - Create new trigger
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

    const body = await req.json();
    
    const trigger = await prisma.marketingTrigger.create({
      data: {
        clinicId: user.clinicId,
        name: body.name,
        description: body.description,
        triggerType: body.triggerType,
        conditions: body.conditions,
        channel: body.channel,
        subject: body.subject,
        messageBody: body.messageBody,
        usePersonalization: body.usePersonalization ?? true,
        includeOffer: body.includeOffer ?? false,
        offerDetails: body.offerDetails,
        maxExecutionsPerCustomer: body.maxExecutionsPerCustomer ?? 1,
        cooldownDays: body.cooldownDays ?? 30,
        maxDailyExecutions: body.maxDailyExecutions ?? 100,
        priority: body.priority ?? 5,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({ trigger });
  } catch (error) {
    console.error('Error creating marketing trigger:', error);
    return NextResponse.json(
      { error: 'Failed to create marketing trigger' },
      { status: 500 }
    );
  }
}
