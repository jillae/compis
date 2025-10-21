
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/marketing-triggers/:id - Get single trigger
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

    const trigger = await prisma.marketingTrigger.findFirst({
      where: {
        id: params.id,
        clinicId: user.clinicId,
      },
      include: {
        _count: {
          select: { executions: true },
        },
      },
    });

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    return NextResponse.json({ trigger });
  } catch (error) {
    console.error('Error fetching marketing trigger:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketing trigger' },
      { status: 500 }
    );
  }
}

// PATCH /api/marketing-triggers/:id - Update trigger
export async function PATCH(
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

    const body = await req.json();
    
    const trigger = await prisma.marketingTrigger.updateMany({
      where: {
        id: params.id,
        clinicId: user.clinicId,
      },
      data: {
        name: body.name,
        description: body.description,
        triggerType: body.triggerType,
        conditions: body.conditions,
        channel: body.channel,
        subject: body.subject,
        messageBody: body.messageBody,
        usePersonalization: body.usePersonalization,
        includeOffer: body.includeOffer,
        offerDetails: body.offerDetails,
        maxExecutionsPerCustomer: body.maxExecutionsPerCustomer,
        cooldownDays: body.cooldownDays,
        maxDailyExecutions: body.maxDailyExecutions,
        priority: body.priority,
        isActive: body.isActive,
      },
    });

    if (trigger.count === 0) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    const updatedTrigger = await prisma.marketingTrigger.findUnique({
      where: { id: params.id },
    });

    return NextResponse.json({ trigger: updatedTrigger });
  } catch (error) {
    console.error('Error updating marketing trigger:', error);
    return NextResponse.json(
      { error: 'Failed to update marketing trigger' },
      { status: 500 }
    );
  }
}

// DELETE /api/marketing-triggers/:id - Delete trigger
export async function DELETE(
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

    const deleted = await prisma.marketingTrigger.deleteMany({
      where: {
        id: params.id,
        clinicId: user.clinicId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting marketing trigger:', error);
    return NextResponse.json(
      { error: 'Failed to delete marketing trigger' },
      { status: 500 }
    );
  }
}
